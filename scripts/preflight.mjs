// One command to run before any push to main: do the code, the data, the documents and the Cloudflare settings agree?
//   node scripts/preflight.mjs            (about two minutes; no network except `git fetch`; writes nothing but the
//                                          model files `build-claims.mjs --check` always rewrites)
// Prints PASS, WARN or FAIL per check; exit code 1 on any FAIL. WARN means "read this before you push", not "stop".
import fs from 'node:fs'; import vm from 'node:vm'; import { execFileSync, execSync } from 'node:child_process';

let fails = 0, warns = 0;
const say = (lvl, what, extra = '') => { if (lvl === 'FAIL') fails++; if (lvl === 'WARN') warns++; console.log(lvl.padEnd(5) + what + (extra ? '  ' + extra : '')); };
const run = (args, o = {}) => { try { return { ok: true, out: execFileSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'], ...o }) }; } catch (e) { return { ok: false, out: String(e.stdout || '') + String(e.stderr || '') }; } };
const sh = (c) => { try { return execSync(c, { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] }).trim(); } catch { return ''; } };
const load = (f) => { const w = {}; vm.runInNewContext(fs.readFileSync(f, 'utf8'), { window: w }); return w; };

// 1. git state
const branch = sh('git branch --show-current'); sh('git fetch origin');
const [behind, ahead] = (sh('git rev-list --left-right --count origin/main...HEAD') || '0 0').split(/\s+/).map(Number);
const dirty = sh('git status --porcelain').split('\n').filter(Boolean);
say(dirty.length ? 'WARN' : 'PASS', `working tree: ${dirty.length ? dirty.length + ' uncommitted file(s)' : 'clean'}`, `branch ${branch}`);
say('PASS', `branch ${branch} is ${ahead} commit(s) ahead of origin/main and ${behind} behind`);
if (behind) {
  const theirs = sh('git diff --name-only HEAD...origin/main').split('\n').filter(Boolean), mine = new Set(sh('git diff --name-only origin/main...HEAD').split('\n').filter(Boolean));
  const clash = theirs.filter((f) => mine.has(f));
  say(clash.length ? 'FAIL' : 'WARN', `origin/main has ${behind} commit(s) this branch lacks (${theirs.length} file(s)); merge or rebase first (git pull --rebase)`, clash.length ? 'both changed: ' + clash.join(', ') : 'no file changed on both sides');
}

// 2. syntax of everything the site and the Worker run
const js = ['worker/worker.js', ...fs.readdirSync('public').filter((f) => f.endsWith('.js')).map((f) => 'public/' + f), ...fs.readdirSync('public/data').filter((f) => f.endsWith('.js')).map((f) => 'public/data/' + f),
  ...fs.readdirSync('scripts').filter((f) => f.endsWith('.mjs')).map((f) => 'scripts/' + f)];
const bad = js.filter((f) => !run(['--check', f]).ok);
say(bad.length ? 'FAIL' : 'PASS', `syntax: ${js.length} JavaScript files`, bad.join(', '));

// 3. Cloudflare config
let cfg = null; try { cfg = JSON.parse(fs.readFileSync('wrangler.jsonc', 'utf8').replace(/^\s*\/\/.*$/gm, '')); } catch (e) { say('FAIL', 'wrangler.jsonc does not parse', e.message); }
if (cfg) {
  say(cfg.assets && cfg.assets.directory === './public' && cfg.assets.run_worker_first === false ? 'PASS' : 'FAIL', 'wrangler.jsonc: static files served first, from public/');
  say(cfg.vars && cfg.vars.CF_PLAN === 'paid' ? 'PASS' : 'WARN', 'wrangler.jsonc: CF_PLAN is paid, so the cost estimate includes the $5 a month', cfg.vars ? JSON.stringify(cfg.vars) : 'no vars');
  say(cfg.keep_vars ? 'PASS' : 'WARN', 'wrangler.jsonc: keep_vars on, so dashboard settings survive a deploy');
  const text = JSON.stringify(cfg); say(/FAMILY_CODE|OWNER_CODE|API_KEY/i.test(text) ? 'FAIL' : 'PASS', 'wrangler.jsonc holds no secret names or values');
}

// 4. Worker tests, and the number the documents quote
const t = run(['scripts/test-worker.mjs']), m = t.out.match(/(\d+) passed, (\d+) failed/);
say(m && m[2] === '0' && t.ok ? 'PASS' : 'FAIL', `Worker tests: ${m ? m[1] + ' passed, ' + m[2] + ' failed' : 'did not run'}`, m && m[2] !== '0' ? t.out.split('\n').filter((l) => l.startsWith('FAIL')).join('; ') : '');
const claude = fs.readFileSync('CLAUDE.md', 'utf8'), quoted = (claude.match(/test-worker\.mjs`\s*\((\d+) checks/) || [])[1];
if (m && quoted) say(+quoted === +m[1] ? 'PASS' : 'FAIL', `CLAUDE.md quotes ${quoted} Worker checks; there are ${m[1]}`);

const tt = run(['scripts/test-timeline.mjs']), tm = tt.out.match(/(\d+) passed, (\d+) failed/);
say(tm && tm[2] === '0' && tt.ok ? 'PASS' : 'FAIL', `timeline: ${tm ? tm[1] + ' passed, ' + tm[2] + ' failed' : 'did not run'} (dates read from text; no record dropped)`, tm && tm[2] !== '0' ? tt.out.split('\n').filter((l) => l.startsWith('FAIL')).join('; ') : '');

const ts = run(['scripts/test-search.mjs']), tsm = ts.out.match(/(\d+) passed, (\d+) failed/);
say(tsm && tsm[2] === '0' && ts.ok ? 'PASS' : 'FAIL', `search spelling variants: ${tsm ? tsm[1] + ' passed, ' + tsm[2] + ' failed' : 'did not run'}`);

const tw = run(['scripts/test-sw.mjs']), twm = tw.out.match(/(\d+) passed, (\d+) failed/);
say(twm && twm[2] === '0' && tw.ok ? 'PASS' : 'FAIL', `offline worker: ${twm ? twm[1] + ' passed, ' + twm[2] + ' failed' : 'did not run'} (simulated; a real browser still needs a hand check)`);

const oc = run(['scripts/ocr-score.mjs', '--self-test']);
say(oc.ok && /self-test passed/.test(oc.out) ? 'PASS' : 'FAIL', 'scan-quality score: a clean text scores good, a garbled one poor, a short one is not scored', oc.ok ? '' : oc.out.slice(0, 120));

const ev = run(['scripts/check-evidence.mjs']), em = ev.out.match(/(\d+) documented killing entries; (\d+) have two or more publishers; (\d+) rest on one/);
say(!em ? 'FAIL' : +em[3] ? 'WARN' : 'PASS', em ? `evidence rule 8: ${em[1]} documented killing entries, ${em[3]} rest on one publisher (list: node scripts/check-evidence.mjs)` : 'evidence rule 8: check did not run');

// 5. data and model
const p = run(['scripts/check-panels.mjs']); say(p.ok ? 'PASS' : 'FAIL', 'panels: footnotes are in each pin\'s source list, timelines in date order', p.ok ? '' : p.out.split('\n').slice(0, 3).join(' | '));
const bc = run(['scripts/build-claims.mjs', '--check']), diff = (bc.out.match(/(\d+) differ/) || [])[1];
say(bc.ok && diff === '0' ? 'PASS' : 'FAIL', `claim model: public/data rebuilt from the model with ${diff == null ? '?' : diff} difference(s)`);
const r9 = bc.out.match(/rule 9\): (\d+) of (\d+)/);
say(!r9 ? 'FAIL' : +r9[1] < +r9[2] ? 'WARN' : 'PASS', r9 ? `evidence rule 9: ${r9[1]} of ${r9[2]} claims record who reviewed them and when` : 'evidence rule 9: not reported');
const cm = run(['scripts/check-model.mjs']), nf = (cm.out.match(/passage NOT in the stored source (\d+)/) || [])[1];
say(cm.ok && nf === '0' ? 'PASS' : 'FAIL', `stored quotations: ${nf == null ? '?' : nf} not found word for word in their stored source`);

// 6. secrets
const sc = run(['scripts/check-secrets.mjs']); say(sc.ok ? 'PASS' : 'FAIL', 'no secret in a tracked file', sc.ok ? '' : sc.out.split('\n').filter((l) => l.startsWith('FOUND')).join('; '));

// 7. size and headers
const files = +sh('git ls-files public | wc -l') || fs.readdirSync('public', { recursive: true }).length;
say(files > 100000 ? 'FAIL' : files > 20000 ? 'WARN' : 'PASS', `public/ holds ${files} files (Workers Paid allows 100,000; Free allowed 20,000)`);
const hdr = fs.existsSync('public/_headers') ? fs.readFileSync('public/_headers', 'utf8') : '';
say(/script-src 'self'/.test(hdr) && !/script-src[^;\n]*unsafe-inline/.test(hdr) ? 'PASS' : 'FAIL', "public/_headers: scripts only from the site itself");

// 7b. no page asks Google for fonts (PRD s9: visitors' addresses stay with us)
{ const hit = fs.readdirSync('public').filter((f) => /\.(html|css|js)$/.test(f)).filter((f) => /fonts\.(googleapis|gstatic)\.com/.test(fs.readFileSync('public/' + f, 'utf8'))); say(hit.length || /googleapis|gstatic/.test(hdr) ? 'FAIL' : 'PASS', 'fonts are served from the site itself, not Google', hit.join(', ')); }

// 8a. every layer has an icon
try { const lay = load('public/data/sites.js').ATLAS_LAYERS, ic = (() => { const w = {}; vm.runInNewContext(fs.readFileSync('public/layer-icons.js', 'utf8'), { window: w }); return w.ATLAS_ICONS; })(); const miss = Object.keys(lay).filter((k) => !ic[k]); say(miss.length ? 'FAIL' : 'PASS', `layer icons: ${Object.keys(lay).length} layers, ${miss.length} without an icon`, miss.join(', ')); } catch (e) { say('FAIL', 'could not check layer icons', e.message); }

// 8. documents against the data
try {
  const sites = load('public/data/sites.js'), areas = load('public/data/areas.js'), links = load('public/data/links.js');
  const want = { 'Site \\(curated event or place\\)[^|]*\\|[^|]*\\|\\s*(\\d+)': sites.ATLAS_SITES.length, 'Area \\(profile[^|]*\\|[^|]*\\|\\s*(\\d+)': areas.ATLAS_AREAS.length, 'Connection \\(evidence-based[^|]*\\|[^|]*\\|\\s*(\\d+)': links.ATLAS_CONNECTIONS.length };
  const readme = fs.readFileSync('README.md', 'utf8');
  for (const [re, n] of Object.entries(want)) { const g = (readme.match(new RegExp(re)) || [])[1]; say(g && +g === n ? 'PASS' : 'FAIL', `README count ${re.split('[')[0].replace(/\\\(/g, '(').replace(/\\\)/g, ')')}: says ${g || '?'}, data has ${n}`); }
} catch (e) { say('FAIL', 'could not compare README counts to the data', e.message); }
const prog = fs.readFileSync('LIBYA-PROGRESS.md', 'utf8');
say(/free-plan limit|about 16,300 files.*cap|caps the site at about 16,300/i.test(prog + claude) ? 'FAIL' : 'PASS', 'documents no longer present the old free-plan file cap as a limit');

console.log(`\npreflight: ${fails} FAIL, ${warns} WARN`);
process.exit(fails ? 1 : 0);
