// Checks that a pin's panel shows its whole text.
//   node scripts/test-text.mjs
// Why: on 19 Nov 2026 the sentence splitter in app.js (sentencesOf, used for texts of 420 characters or more) was found to drop the
// words before any full stop inside a sentence ("1.5 km", "Haiku 5.5"); 15 of 84 long pin texts were shown with words missing,
// among them Abu Salim. This takes the function from app.js itself and checks every pin and record text against it.
import fs from 'node:fs'; import vm from 'node:vm';
let pass = 0, fail = 0;
const ok = (c, msg, detail) => { if (c) { pass++; console.log('PASS ' + msg); } else { fail++; console.log('FAIL ' + msg + (detail ? ': ' + detail : '')); } };

const app = fs.readFileSync('public/app.js', 'utf8');
const m = /function sentencesOf\(t\) \{[\s\S]*?\n  \}/.exec(app);
ok(!!m, 'app.js has sentencesOf');
if (m) {
  const sentencesOf = vm.runInNewContext('(' + m[0] + ')');
  const W = {}; W.window = W;
  for (const f of ['public/data/sites.js', ...fs.readdirSync('public/data/regions').filter((x) => x.endsWith('.js') && !x.startsWith('_')).map((x) => 'public/data/regions/' + x)]) vm.runInNewContext(fs.readFileSync(f, 'utf8'), W);
  const texts = [...(W.ATLAS_SITES || []).map((s) => [s.id, s.text]), ...(W.ATLAS_UNPLACED || []).map((u, i) => ['unplaced ' + i, u.text])].filter(([, t]) => t && t.length >= 420);
  const squash = (t) => String(t).replace(/\s+/g, '');
  const lost = texts.filter(([, t]) => squash(sentencesOf(t).join(' ')) !== squash(t));
  ok(!lost.length, `${texts.length} long texts are shown whole (no words dropped by the sentence splitter)`, lost.slice(0, 8).map(([id]) => id).join(', '));
  const sample = 'Mapped at X, 2 km margin. Found by a reading (Claude Haiku 5.5) and approved by U.S. staff. Radius 1.5 km. Is it? Yes!';
  ok(squash(sentencesOf(sample).join(' ')) === squash(sample) && sentencesOf(sample).length === 5, 'self-test: decimals and abbreviations do not split or drop a sentence');
}
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
