// F9: the weekly funnel and cost report (PRD s10 and s12). No network, no AI, no database write.
//   node scripts/weekly-report.mjs [--decisions review-report.json] [--week 2026-W47]
// Reads   archive/review/funnel.json           documents collected, read, candidates, reading cost (build-review.mjs)
//         archive/crest/cost-ledger.json        every paid reading run
//         the owner's decisions: the file the review page's Report > "Download JSON" saves (optional; without it the
//         report says the decisions are not included rather than guessing them)
// Writes  archive/review/weekly.md              the report, readable
//         archive/review/weekly-history.json    one snapshot per ISO week, so the next report can show what changed
// Idempotent: running it twice in one week replaces that week's snapshot.
import fs from 'node:fs';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const weekOf = (t) => { const d = new Date(t); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); const y = d.getUTCFullYear(), n = Math.ceil(((d - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7); return y + '-W' + String(n).padStart(2, '0'); };
const n = (v) => Number(v).toLocaleString('en-US');
const dur = (ms) => { if (ms == null) return 'not measured'; const s = Math.round(ms / 1000); return s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s'; };
const delta = (now, then, f = n) => (then == null ? '' : now === then ? ' (no change)' : ' (' + (now > then ? '+' : '-') + f(Math.abs(+(now - then).toFixed(2))) + ' since last week)');
const cell = (s) => String(s || '').split('|').join('/');

const funnel = JSON.parse(fs.readFileSync('archive/review/funnel.json', 'utf8'));
const ledger = JSON.parse(fs.readFileSync('archive/crest/cost-ledger.json', 'utf8'));
const dFile = arg('--decisions'), D = dFile ? JSON.parse(fs.readFileSync(dFile, 'utf8')) : null;
const week = arg('--week') || weekOf(Date.now());
const HIST = 'archive/review/weekly-history.json', hist = fs.existsSync(HIST) ? JSON.parse(fs.readFileSync(HIST, 'utf8')) : {};
const prevKey = Object.keys(hist).filter((k) => k < week).sort().pop(), prev = prevKey ? hist[prevKey] : null;

const ledgerUsd = ledger.reduce((s, r) => s + r.usd, 0), ledgerDocs = ledger.reduce((s, r) => s + r.documents, 0);
const snap = { week, at: new Date().toISOString(), collected: funnel.collected, read: funnel.read, candidates: funnel.candidates, costUsd: +funnel.costUsd.toFixed(2), decided: D ? D.decided : null, rejected: D ? D.rejected.length : null };
const L = [];
L.push(`# Weekly report, ${week}`, '', `Generated ${snap.at.slice(0, 10)} from \`archive/review/funnel.json\` (built ${String(funnel.at).slice(0, 10)}), \`archive/crest/cost-ledger.json\`` + (D ? ` and \`${dFile}\`.` : '. Decisions are not included: save the file from the review page (Report, Download JSON) and pass it with --decisions.'), '');
L.push('## Funnel', '', '| Stage | Count |', '|---|---|',
  `| Collected | ${n(funnel.collected)}${delta(funnel.collected, prev && prev.collected)} (${n(funnel.listedNotFetched)} more listed, not downloaded) |`,
  `| Read | ${n(funnel.read)}${delta(funnel.read, prev && prev.read)} |`,
  `| Candidates | ${n(funnel.candidates)}${delta(funnel.candidates, prev && prev.candidates)}; ${n(funnel.twoOrMore)} backed by 2+ documents |`,
  D ? `| Decided | ${n(D.decided)}${delta(D.decided, prev && prev.decided)} |` : '| Decided | not included |', '');
L.push('## Cost', '', `Reading cost to date: $${funnel.costUsd.toFixed(2)}${delta(funnel.costUsd, prev && prev.costUsd, (v) => '$' + v)}, by the reading script's own count (not a bill). The ledger has ${ledger.length} runs over ${n(ledgerDocs)} documents.`, '', '| Date | Run | Documents | USD |', '|---|---|---|---|', ...ledger.map((r) => `| ${r.date} | ${cell(r.what)} | ${n(r.documents)} | ${r.usd.toFixed(2)} |`), '');
if (Math.abs(ledgerUsd - funnel.costUsd) > 0.01) L.push(`Note: the ledger sums to $${ledgerUsd.toFixed(2)} and the funnel says $${funnel.costUsd.toFixed(2)}; rebuild the funnel (\`node scripts/build-review.mjs\`).`, '');
if (D) {
  const approved = D.weeks.reduce((s, w) => s + w.approve + w.unplaced, 0);
  L.push('## Decisions by week', '', '| Week | Decided | Approved: place | Approved: no location | Rejected | Put off |', '|---|---|---|---|---|---|', ...D.weeks.map((w) => `| ${w.week} | ${w.decided} | ${w.approve} | ${w.unplaced} | ${w.reject} | ${w.defer} |`), '');
  L.push(approved ? `Reading cost per approved entry: $${(funnel.costUsd / approved).toFixed(2)} (${approved} approved).` : 'No entry approved yet, so there is no cost per approved entry.', '');
  const t = D.time;
  L.push('## Review time per candidate', '', t.measured ? `Median ${dur(t.medianMs)}, mean ${dur(t.meanMs)}, total ${dur(t.totalMs)} over ${t.measured} candidates (page visible only; ${dur(t.capMs)} cap each). ${t.unmeasured} decisions have no time recorded.` : `No time recorded yet (${t.unmeasured} decisions predate the measurement).`, '');
  L.push('## Rejected candidates and the reason', '');
  if (D.rejected.length) L.push('| Reason | Count |', '|---|---|', ...D.reasons.map((r) => `| ${cell(r.reason)} | ${r.n} |`), '', '| Kind | Date | Candidate | Region | Reason | Note |', '|---|---|---|---|---|---|', ...D.rejected.map((x) => `| ${x.kind || ''} | ${x.date || ''} | ${cell(x.name)} | ${x.region || ''} | ${cell(x.reason)} | ${cell(x.note)} |`), '');
  else L.push('Nothing rejected yet.', '');
}
fs.writeFileSync('archive/review/weekly.md', L.join('\n'));
hist[week] = snap; fs.writeFileSync(HIST, JSON.stringify(hist, null, 1));
console.log(`weekly report for ${week}: archive/review/weekly.md` + (prev ? ` (compared with ${prevKey})` : ' (first snapshot, nothing to compare)') + (D ? '' : '; decisions not included'));
