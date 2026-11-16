// F10: an OCR-quality score for every stored document text (PRD s8 stage 1). No AI, no network, free.
//   node scripts/ocr-score.mjs            score every stored document, write archive/review/ocr-quality.json
//   node scripts/ocr-score.mjs --self-test
// Why: a passage read out of a badly scanned page can be wrong in ways the extraction model cannot see. The score lets the review
// page warn "this passage comes from a poor scan" and lets a person check those first.
// The score is 0 to 100, from three measures of the text itself (no dictionary is imported, so nothing is invented):
//   known   share of word-like tokens found in at least 15 different documents of the collection (garbled tokens are mostly confined to one scan)
//   letters share of non-space characters that are letters or ordinary punctuation (scan noise is symbols and stray digits)
//   shape   share of tokens that look like words: 2+ letters with a vowel, not a run of one repeated letter, not a letter-digit jumble
// Each document is cut into windows of about 300 words and scored per window: score = 100 * (0.5 known + 0.3 letters + 0.2 shape) averaged
// over the windows, then pulled towards its worst fifth (final = half the mean + half the 20th-percentile window), so one clean page does
// not hide a garbled one. Bands: good 80 and over, fair 70 to 79, poor under 70 (set by looking at the lowest-scoring documents: the
// reversed, upside-down JPRS tables and the faintest cable scans fall under 70; the cut is a judgement, not a calibration).
// Arabic-script texts (Arabic Wikipedia) are not scans, and the measures are tuned to Latin script, so they are listed as "not scored".
// These weights are a judgement, not a calibration against human ratings: the report says so, and the review page shows the number
// and the band, never "verified".
import fs from 'node:fs'; import zlib from 'node:zlib';

const WORD = /[\p{L}][\p{L}'’-]*/gu;
const tokens = (t) => String(t || '').toLowerCase().match(WORD) || [];
const DF = 15;
export function measures(text, freq) {
  const toks = tokens(text), chars = String(text || '').replace(/\s+/g, ''), n = toks.length;
  if (n < 20 || chars.length < 100) return null; // too short to judge
  const known = toks.filter((w) => (freq.get(w) || 0) >= DF).length / n;
  const good = (chars.match(/[\p{L}.,;:'"()\-?!]/gu) || []).length / chars.length;
  const shape = toks.filter((w) => w.length >= 2 && /[aeiouy؀-ۿ]/.test(w) && !/^(.)\1{2,}$/.test(w)).length / n;
  return { known, letters: good, shape };
}
const one = (m) => 100 * (0.5 * m.known + 0.3 * m.letters + 0.2 * m.shape);
export function score(text, freq) {
  const words = String(text || '').split(/\s+/).filter(Boolean), W = 300, parts = [];
  for (let i = 0; i < words.length; i += W) { const m = measures(words.slice(i, i + W).join(' '), freq); if (m) parts.push(one(m)); }
  if (!parts.length) return null;
  const s = parts.slice().sort((a, b) => a - b), mean = parts.reduce((x, y) => x + y, 0) / parts.length, low = s[Math.floor((s.length - 1) * 0.2)];
  return Math.round(0.5 * mean + 0.5 * low);
}
const isArabic = (t) => { const s = String(t || ''), a = (s.match(/[؀-ۿ]/g) || []).length, l = (s.match(/\p{L}/gu) || []).length; return l > 0 && a / l > 0.3; };
export const band = (s) => (s == null ? 'too short to score' : s >= 80 ? 'good' : s >= 70 ? 'fair' : 'poor');

const clean = 'The prison was built inside the military police compound and political prisoners were held there for years without trial. '.repeat(8);
const garbled = 'Tbe pr1s0n w@s bu1lt ins1de tbe m1l1tary p0l1ce c0mp0und ~ ,, ;; llll iiii tbe pr!s0n wss bnilt 1nsde tlie mllltary pol1ce '.repeat(8);

if (process.argv.includes('--self-test')) {
  let f = 0; const eq = (name, c) => { if (!c) { f++; console.log('FAIL', name); } };
  const freq = new Map(); for (const w of new Set(tokens(clean))) freq.set(w, 99);
  const sc = score(clean, freq), sg = score(garbled, freq), mixed = score(clean + ' ' + garbled, freq);
  eq('a garbled page is not hidden by a clean one', mixed < sc - 5);
  eq('clean text scores good', band(sc) === 'good'); eq('garbled text scores poor', band(sg) === 'poor'); eq('clean beats garbled by a wide margin', sc - sg >= 30);
  eq('a short text is not scored', score('too short', freq) === null);
  console.log(f ? f + ' failed' : `self-test passed (clean ${sc}, garbled ${sg})`); process.exit(f ? 1 : 0);
}

const SOURCES = [['crest', 'archive/crest/docs.jsonl.gz'], ['crest-other', 'archive/crest/docs-other.jsonl.gz'], ['cables', 'archive/cables/docs.jsonl.gz']];
const docs = [];
for (const [set, p] of SOURCES) if (fs.existsSync(p)) for (const l of zlib.gunzipSync(fs.readFileSync(p)).toString().split('\n')) { if (!l) continue; const d = JSON.parse(l); docs.push({ set, id: d.id, title: d.title || '', text: d.text || '' }); }
const freq = new Map(); for (const d of docs) for (const w of new Set(tokens(d.text))) freq.set(w, (freq.get(w) || 0) + 1); // document frequency

const rows = [], bands = { good: 0, fair: 0, poor: 0, 'too short to score': 0, 'not scored (Arabic script)': 0 }, bySet = {};
for (const d of docs) {
  const ar = isArabic(d.text), s = ar ? null : score(d.text, freq), b = ar ? 'not scored (Arabic script)' : band(s); bands[b]++;
  (bySet[d.set] || (bySet[d.set] = { documents: 0, scored: 0, sum: 0, poor: 0 })).documents++;
  if (s != null) { const g = bySet[d.set]; g.scored++; g.sum += s; if (s < 70) g.poor++; }
  rows.push({ id: d.id, set: d.set, chars: d.text.length, score: s, band: b });
}
for (const g of Object.values(bySet)) { g.mean = g.scored ? Math.round(g.sum / g.scored) : null; delete g.sum; }
const worst = rows.filter((r) => r.score != null).sort((a, b) => a.score - b.score).slice(0, 50).map((r) => ({ ...r, title: (docs.find((d) => d.id === r.id) || {}).title }));
fs.mkdirSync('archive/review', { recursive: true });
fs.writeFileSync('archive/review/ocr-quality.json', JSON.stringify({ at: new Date().toISOString(), method: 'score = 100 * (0.5 known-word share + 0.3 letter share + 0.2 word-shape share); weights are a judgement, not calibrated against human ratings', documents: rows.length, bands, bySet, worst, scores: Object.fromEntries(rows.filter((r) => r.score != null).map((r) => [r.id, r.score])) }));
console.log(`${rows.length} documents scored: ${JSON.stringify(bands)}`); console.log('by set', JSON.stringify(bySet));
console.log('lowest five:'); for (const w of worst.slice(0, 5)) console.log('  ' + String(w.score).padStart(3), w.set, w.id.slice(0, 50), '|', String(w.title).slice(0, 50));
