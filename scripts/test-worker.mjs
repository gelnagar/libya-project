// Security and access tests for worker/worker.js. No network, no Cloudflare: the Worker runs here against an
// in-memory SQLite standing in for D1, a Map standing in for KV, and a fake AI service.
//   node scripts/test-worker.mjs        (Node 22.5 or later, for node:sqlite)
// Exit code 1 if any test fails. Run it before every push that touches the Worker.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { pathToFileURL } from 'node:url'; import { DatabaseSync } from 'node:sqlite';

const copy = path.join(os.tmpdir(), 'atlas-worker-under-test.mjs'); fs.copyFileSync('worker/worker.js', copy);
const W = (await import(pathToFileURL(copy).href + '?t=' + Date.now())).default;

const sql = new DatabaseSync(':memory:');
class Stmt { constructor(q, a = []) { this.q = q; this.a = a; } bind(...a) { return new Stmt(this.q, a); }
  exec() { const st = sql.prepare(this.q); return /^\s*(SELECT|WITH)/i.test(this.q) ? { results: st.all(...this.a) } : (st.run(...this.a), { results: [] }); }
  async run() { return this.exec(); } async all() { return this.exec(); } async first() { return this.exec().results[0] || null; } }
const D1 = { prepare: (q) => new Stmt(q), async batch(list) { return list.map((s) => s.exec()); } };
const store = new Map(); let kvWrites = 0;
const KV = { async get(k) { return store.has(k) ? store.get(k).v : null; }, async getWithMetadata(k) { const v = store.get(k); return v ? { value: v.v, metadata: v.m || null } : { value: null, metadata: null }; },
  async put(k, v, o = {}) { kvWrites++; store.set(k, { v, m: o.metadata }); }, async delete(k) { store.delete(k); }, async list() { return { keys: [...store.keys()].map((name) => ({ name })) }; } };

let aiCalls = 0; const realFetch = globalThis.fetch;
globalThis.fetch = async (u, o) => {
  if (String(u).includes('api.anthropic.com')) { aiCalls++; return new Response(JSON.stringify({ content: [{ type: 'text', text: 'A test answer.' }], stop_reason: 'end_turn', usage: { input_tokens: 400000, output_tokens: 1000 } }), { status: 200, headers: { 'content-type': 'application/json' } }); }
  if (String(u).includes('api.resend.com')) return new Response('{"id":"x"}', { status: 200 });
  return realFetch(u, o);
};

const FAMILY = 'Fam-Test-Word', OWNER = 'Own-Test-Word', U = 'https://atlas.test';
const env = { ATLAS_KV: KV, STATS: D1, FAMILY_CODE: FAMILY, OWNER_CODE: OWNER, ANTHROPIC_API_KEY: 'test-key-not-real', DAILY_AI_LIMIT_USD: '1', ASSETS: { fetch: async () => new Response('ok') } };
const pending = [], ctx = { waitUntil: (p) => pending.push(p) };
let pass = 0, fail = 0; const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra && !cond ? '   ' + extra : '')); };
async function api(body, headers = {}, ip = '10.1.1.1', raw) {
  const r = await W.fetch(new Request(U + '/api', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: U, 'CF-Connecting-IP': ip, ...headers }, body: raw || JSON.stringify(body) }), env, ctx);
  const j = await r.json().catch(() => ({})); while (pending.length) await pending.shift(); return { s: r.status, j };
}
const fam = { 'X-Family-Code': FAMILY }, own = { 'X-Owner-Code': OWNER };

/* visitors: read only, no AI, no writes */
ok('visitor cannot ask the AI', (await api({ question: 'hi' })).s === 403 && aiCalls === 0);
ok('visitor cannot run the chat guide', (await api({ agent: true, messages: [{ role: 'user', content: 'hi' }] })).s === 403);
ok('visitor cannot add a report', (await api({ report: { title: 'x', text: 'y', lat: 32.85, lon: 13.12 } })).s === 403);
ok('visitor cannot upload media', (await api({ mediaPut: { type: 'image/png', data: 'aaaa' } })).s === 403);
ok('visitor cannot file a research request', (await api({ request: { title: 'x' } })).s === 403);
ok('visitor can read reports', (await api({ reports: true })).s === 200);
ok('request from another website is refused', (await api({ reports: true }, { Origin: 'https://evil.example' })).s === 403);
ok('oversized request is refused', (await api(null, fam, '10.1.1.2', '{"question":"' + 'a'.repeat(4600000) + '"}')).s === 413);

/* passwords */
ok('family password works whatever the letter case', (await api({ status: true }, { 'X-Family-Code': FAMILY.toUpperCase() })).s === 200);
ok('wrong family password is refused', (await api({ status: true }, { 'X-Family-Code': 'nope' }, '10.2.0.1')).s === 401);
let last; for (let i = 0; i < 9; i++) last = await api({ owner: true }, { 'X-Owner-Code': 'guess' + i }, '10.3.0.1');
ok('ninth wrong owner password in 15 minutes is locked out', last.s === 429, String(last.s));
ok('the lock-out also stops the right password from that address', (await api({ owner: true }, own, '10.3.0.1')).s === 429);
ok('another address is not locked out', (await api({ owner: true }, own, '10.3.0.2')).s === 200);
ok('wrong passwords use no KV writes', ![...store.keys()].some((k) => k.startsWith('fail:')));
const fr = sql.prepare('SELECT who FROM fails').all();
ok('failed attempts are stored by hash, never by address', fr.length >= 9 && fr.every((r) => /^[0-9a-f]{24}$/.test(r.who) && !r.who.includes('10.3')));
const login = async (code, ip) => W.fetch(new Request(U + '/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'CF-Connecting-IP': ip }, body: 'code=' + encodeURIComponent(code) + '&next=%2F' }), env, ctx);
const lg = await login(FAMILY, '10.4.0.1'), cookies = lg.headers.getSetCookie ? lg.headers.getSetCookie() : [];
ok('sign-in sets an HttpOnly, Secure session cookie', lg.status === 303 && cookies.some((c) => /^tos_session=v1\./.test(c) && /HttpOnly/.test(c) && /Secure/.test(c) && /SameSite=Lax/.test(c)));
ok('wrong sign-in is refused', (await login('wrong', '10.4.0.2')).status === 401);
const sess = (cookies.find((c) => c.startsWith('tos_session=')) || '').split(';')[0];
ok('the session cookie alone unlocks family access', (await api({ status: true }, { Cookie: sess, Origin: '' })).s === 200);
ok('a forged session cookie is refused', (await api({ status: true }, { Cookie: 'tos_session=v1.9999999999999.' + '0'.repeat(64), Origin: '' })).s === 403);

/* family reports: held until the owner approves; visitors never learn who wrote one */
const rep = await api({ report: { title: 'Checkpoint on the airport road', text: 'Seen in 1988.', cat: 'checkpoint', lat: 32.8, lon: 13.15, by: 'Amal', how: 'saw', src: 'my aunt Salma' } }, fam);
ok('family report is saved and held', rep.s === 200 && rep.j.report && rep.j.report.held === true);
const id = rep.j.report.id;
ok('visitors do not see a held report', !(await api({ reports: true })).j.reports.some((r) => r.id === id));
ok('family see it at once', (await api({ reports: true }, fam)).j.reports.some((r) => r.id === id && r.by === 'Amal'));
ok('only the owner can approve', (await api({ owner: true, approveReport: id }, { 'X-Owner-Code': 'no' }, '10.5.0.1')).s === 401);
ok('owner approves', (await api({ owner: true, approveReport: id }, own, '10.5.0.2')).j.held === false);
const pub = (await api({ reports: true })).j.reports.find((r) => r.id === id);
ok('after approval visitors see the report', !!pub);
ok('visitors never see who added it or who told them', pub && !('by' in pub) && !('src' in pub) && !('tk' in pub), JSON.stringify(pub));
ok('owner can hold it back again', (await api({ owner: true, approveReport: id, hold: true }, own, '10.5.0.2')).j.held === true && !(await api({ reports: true })).j.reports.some((r) => r.id === id));
const home = await api({ report: { title: 'Our house', text: 'Family home.', cat: 'home', lat: 32.8, lon: 13.15 } }, fam);
await api({ owner: true, approveReport: home.j.report.id }, own, '10.5.0.2');
ok('a home is never shown to visitors, approved or not', !(await api({ reports: true })).j.reports.some((r) => r.cat === 'home'));

/* AI spending ceiling */
const before = aiCalls, a1 = await api({ question: 'What happened here?', place: { name: 'Test' }, search: false }, fam, '10.6.0.1');
ok('family can ask the AI', a1.s === 200 && aiCalls === before + 1, JSON.stringify(a1.j).slice(0, 120));
const spent = sql.prepare('SELECT COALESCE(SUM(cost),0) c FROM ai').get().c;
ok('the call is costed and logged', spent > 0.5, String(spent));
const a2 = await api({ question: 'And then?', place: { name: 'Test' }, search: false }, fam, '10.6.0.1');
ok('second call still allowed below the ceiling or stopped at it', a2.s === 200 || a2.s === 429);
let stopped = a2.s === 429 ? a2 : null; for (let i = 0; i < 3 && !stopped; i++) { const r = await api({ question: 'More?', place: {}, search: false }, fam, '10.6.0.1'); if (r.s === 429) stopped = r; }
const callsAtStop = aiCalls;
ok('AI is refused once the day reaches the ceiling', !!stopped && stopped.j.limit === true, stopped ? '' : 'never stopped');
ok('a refused request does not reach the AI service', (await api({ agent: true, messages: [{ role: 'user', content: 'hi' }] }, fam, '10.6.0.1')).s === 429 && aiCalls === callsAtStop);
ok('reading and reporting still work at the ceiling', (await api({ reports: true }, fam)).s === 200);
env.DAILY_AI_LIMIT_USD = '0';
ok('ceiling can be switched off', (await api({ question: 'Again?', place: {}, search: false }, fam, '10.6.0.1')).s === 200);
env.DAILY_AI_LIMIT_USD = '1';

/* owner pages */
ok('review queue needs the owner password', (await api({ owner: true, review: {} }, { 'X-Owner-Code': 'x' }, '10.7.0.1')).s === 401 && (await api({ review: {} })).s === 403);
ok('statistics need the owner password', (await api({ owner: true, stats: true }, { 'X-Owner-Code': 'x' }, '10.7.0.2')).s === 401);
ok('owner statistics load', (await api({ owner: true, stats: true }, own, '10.7.0.3')).s === 200);
ok('no raw address anywhere in the database', !JSON.stringify(['events', 'fails', 'ai', 'reqs', 'corrections'].map((t) => sql.prepare('SELECT * FROM ' + t).all())).includes('10.'));

/* correction and removal requests */
const c1 = await api({ correction: { kind: 'removal', item: 'abu-salim', name: 'Abu Salim prison', text: 'My uncle is named in a source here; please remove his name.', contact: 'reply@example.test' } }, {}, '10.8.0.1');
ok('a visitor can send a correction or removal request', c1.s === 200 && /^c[0-9a-z]+$/.test(c1.j.id || ''), JSON.stringify(c1));
ok('an empty request is refused', (await api({ correction: { text: 'x' } }, {}, '10.8.0.1')).s === 400);
let c6; for (let i = 0; i < 5; i++) c6 = await api({ correction: { text: 'Another point about the same place.' } }, {}, '10.8.0.1');
ok('the sixth request in a day from one address is refused', c6.s === 429, String(c6.s));
ok('another address can still send one', (await api({ correction: { text: 'A date on this page is wrong.' } }, {}, '10.8.0.2')).s === 200);
ok('requests are stored by keyed hash, never by address', sql.prepare('SELECT who FROM corrections').all().every((r) => /^[0-9a-f]{24}$/.test(r.who)));
ok('visitors cannot read requests', !JSON.stringify((await api({ reports: true })).j).includes('My uncle') && (await api({ owner: true }, { 'X-Owner-Code': 'x' }, '10.8.0.3')).s === 401);
const ol = await api({ owner: true }, own, '10.8.0.4'), mine = (ol.j.corrections || []).find((x) => x.id === c1.j.id);
ok('the owner sees each request with its contact, but not the hash', !!mine && mine.kind === 'removal' && mine.contact === 'reply@example.test' && !('who' in mine));
ok('the owner can mark a request answered', (await api({ owner: true, correctionDone: c1.j.id }, own, '10.8.0.4')).s === 200 && sql.prepare('SELECT done FROM corrections WHERE id = ?').get(c1.j.id).done === 1);

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
