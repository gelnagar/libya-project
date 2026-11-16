// Tests public/sw.js (the offline copy) with a simulated worker: what it saves, what it refuses to touch, what it serves offline.
//   node scripts/test-sw.mjs
// A real browser could not be used for this check (the embedded browser used for other checks cannot register service workers),
// so the worker runs against a small stand-in for caches, fetch and events. What this does NOT prove: that a real browser
// registers it, and that the saved copy renders the map offline. Check both by hand once (see LIBYA-PROGRESS.md, F7).
import fs from 'node:fs'; import vm from 'node:vm';
const ORIGIN = 'https://site.test'; const handlers = {}; const store = new Map(); let online = true; const fetched = [];
const body = (u) => new Response('body of ' + u, { status: 200 });
const caches = { open: async () => ({ put: async (k, r) => { store.set(String(k), r.clone()); }, match: async (k) => { const r = store.get(typeof k === 'string' ? k : k.url); return r ? r.clone() : undefined; }, keys: async () => [...store.keys()].map((url) => ({ url })) }), delete: async () => { const had = store.size > 0; store.clear(); return had; } };
const self_ = { location: { href: ORIGIN + '/sw.js', origin: ORIGIN }, addEventListener: (t, f) => { handlers[t] = f; }, skipWaiting() {}, clients: { claim: async () => {} } };
const fetchStub = async (u) => { const url = typeof u === 'string' ? u : u.url; fetched.push(url); if (!online) throw new TypeError('offline'); return url.includes('missing') ? new Response('no', { status: 404 }) : body(url); };
vm.runInNewContext(fs.readFileSync('public/sw.js', 'utf8'), { self: self_, caches, fetch: fetchStub, Response, URL, console });
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const message = (data) => new Promise((res) => { const msgs = []; let p; handlers.message({ data, ports: [{ postMessage: (m) => { msgs.push(m); if (m.done || m.count != null) res(m); } }], waitUntil: (x) => { p = x; } }); });
const request = (url, o = {}) => { let responded = null; const e = { request: { url, method: o.method || 'GET', mode: o.mode || 'cors', headers: new Headers(o.headers || {}) }, respondWith: (p) => { responded = p; } }; handlers.fetch(e); return responded; };

const r = await message({ type: 'save', urls: [ORIGIN + '/', ORIGIN + '/app.js', ORIGIN + '/index.html', ORIGIN + '/data/sites.js', ORIGIN + '/api/x', ORIGIN + '/review.html', ORIGIN + '/stats.html', ORIGIN + '/login', ORIGIN + '/corrections.html', 'https://other.test/x.js', ORIGIN + '/missing.js'] });
ok('saves the public files', r.ok === 4 && [ORIGIN + '/', ORIGIN + '/app.js', ORIGIN + '/data/sites.js'].every((u) => store.has(u)));
ok('never fetches /api, /login, owner pages or the corrections page', !fetched.some((u) => /\/(api|login|review|stats|corrections)/.test(u)));
ok('never fetches another site', !fetched.some((u) => u.startsWith('https://other.test')));
ok('a missing file is reported, not saved', r.failed.some((u) => u.includes('missing')) && !store.has(ORIGIN + '/missing.js'));
fetched.length = 0;
let p = request(ORIGIN + '/app.js'); ok('online: goes to the network', p && (await p).ok && fetched.length === 1 && (await (await p).text()).includes('app.js'));
ok('leaves /api alone', request(ORIGIN + '/api/chat', { method: 'GET' }) === null);
ok('leaves a POST alone', request(ORIGIN + '/app.js', { method: 'POST' }) === null);
ok('leaves another site alone', request('https://other.test/a.js') === null);
ok('leaves owner pages alone', request(ORIGIN + '/review.html') === null && request(ORIGIN + '/stats.html') === null);
ok('leaves a range request alone', request(ORIGIN + '/app.js', { headers: { Range: 'bytes=0-9' } }) === null);
online = false;
ok('offline: serves the saved file', (await (await request(ORIGIN + '/data/sites.js')).text()).includes('data/sites.js'));
ok('offline: a page opened with an address not saved gets the saved front page', (await (await request(ORIGIN + '/somewhere', { mode: 'navigate' })).text()).includes('/'));
let miss; try { miss = await request(ORIGIN + '/never-saved.js'); } catch (e) { miss = null; }
ok('offline: an unsaved file fails (nothing invented)', !miss || miss.type === 'error' || !miss.ok);
const st = await message({ type: 'status' }); ok('status counts the saved files', st.count === 4);
const fg = await message({ type: 'forget' }); ok('forget deletes everything', fg.removed && store.size === 0);
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
