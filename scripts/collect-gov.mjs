// Collects (1) Libya sections of JPRS "Near East/North Africa Report" volumes on the Internet Archive,
// (2) Reagan Library NSC "Terrorism and Libya" PDFs, (3) the digitised Bush 41 Library Libya/Pan Am 103 PDFs.
// All are U.S. government works. Output: archive/gov/*.txt and archive/gov/catalog.json
import { writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const UA = 'Mozilla/5.0 (research archive; github.com/gelnagar/libya-project)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const started = Date.now();
async function get(u, type = 'json') {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(120000) });
      if (r.status === 429 || r.status >= 500) { await sleep(4000 * (i + 1)); continue; }
      if (!r.ok) return null;
      return type === 'json' ? await r.json() : type === 'buf' ? Buffer.from(await r.arrayBuffer()) : await r.text();
    } catch { await sleep(3000); }
  }
  return null;
}
await mkdir('archive/gov', { recursive: true });
await mkdir('/tmp/govpdf', { recursive: true });
const catalog = [];
const save = () => writeFile('archive/gov/catalog.json', JSON.stringify(catalog));

/* ---- PDFs (Reagan, Bush) ---- */
async function pdf(id, url, meta) {
  const buf = await get(url, 'buf');
  if (!buf || buf.length < 2000 || buf.slice(0, 4).toString() !== '%PDF') return false;
  const f = '/tmp/govpdf/' + id + '.pdf';
  await writeFile(f, buf);
  let txt = '';
  try { txt = execFileSync('pdftotext', ['-layout', f, '-'], { maxBuffer: 80e6 }).toString(); } catch {}
  const clean = txt.replace(/\f/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  let pages = 0; try { pages = (txt.match(/\f/g) || []).length; } catch {}
  const entry = { id, url, ...meta, bytes: buf.length, chars: clean.length, pages };
  if (clean.length > 300) { entry.file = id + '.txt'; await writeFile('archive/gov/' + entry.file, clean.slice(0, 400000)); }
  catalog.push(entry); console.log('pdf', id, buf.length, clean.length);
  return true;
}
const REAGAN = 'https://www.reaganlibrary.gov/public/digitallibrary/smof/nsc-politicalandmilitaryaffairs/fortierd/R8/terrorismandlibya';
for (let i = 1; i <= 20; i++) await pdf('reagan-fortier-terrorism-libya-' + i, REAGAN + i + '.pdf', { collection: 'Reagan Library, NSC Political and Military Affairs: Fortier, Donald, Series: Terrorism and Libya', title: 'Terrorism and Libya, part ' + i, source: 'Ronald Reagan Presidential Library', date: '1986', page: 'https://www.reaganlibrary.gov/libya-bombing' });
const BUSH = ['H-Files/NSC-DC_Mtgs_312294079/41-bpr-nsc-hfiles-dc_mtgs-11-90009-011', 'H-Files/NSC-DC_Mtgs_312294079/41-bpr-nsc-hfiles-dc_mtgs-70-90012-001', 'H-Files/NSC-DC_Mtgs_312294079/41-bpr-nsc-hfiles-dc_mtgs-290-90020-009', 'H-Files/NSC-DC_Mtgs_312294079/41-bpr-nsc-hfiles-dc_mtgs-323-90021-011', 'H-Files/NSRs_313189297/41-bpr-nsc-hfiles-nsr-9-90006-012'];
for (const b of BUSH) await pdf('bush41-' + b.split('/').pop(), 'https://catalog.archives.gov/medialz/presidential-libraries/bush/gb-nsc/' + b + '.pdf', { collection: 'George H.W. Bush Library, NSC H-Files, FOIA 2005-0575-F, U.S.-Libya relations', title: 'NSC meeting or study record on Libya (' + b.split('/').pop().replace('41-bpr-nsc-hfiles-', '') + ')', source: 'George H. W. Bush Presidential Library', date: '1989-1991', page: 'https://www.bush41library.gov/digital-research-room/finding-aid/foia/records-us-libya-relations' });
await save();

/* ---- JPRS Near East/North Africa Report on the Internet Archive ---- */
const isHeading = (l) => { const t = l.trim(); return t.length >= 3 && t.length <= 40 && t === t.toUpperCase() && /^[A-Z][A-Z '’&-]+$/.test(t) && !/^(LIBYA|CONTENTS|PAGE)$/.test(t) && !/^\d/.test(t) && t.split(' ').length <= 5 && t.length > 4; };
function libyaSection(text) {
  const lines = text.split('\n'); let best = '';
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*L\s?I\s?B\s?Y\s?A\s*$/.test(lines[i])) continue;
    let j = i + 1;
    while (j < lines.length && !(isHeading(lines[j]) && lines[j - 1].trim() === '' )) j++;
    const sec = lines.slice(i + 1, j).join('\n').trim();
    if (sec.length > best.length) best = sec;
  }
  return best;
}
const queries = ['title:(JPRS Near East North Africa)', 'title:("Near East/North Africa Report")', 'title:(JPRS Near East) AND date:[1979-01-01 TO 1996-12-31]', 'title:(JPRS Near East South Asia)', 'title:(JPRS Terrorism)', 'title:(JPRS Sub-Saharan Africa)', 'title:(JPRS Arms Control)', 'title:(JPRS Worldwide Report)', 'title:(JPRS Africa)'];
const seen = new Map();
for (const q of queries) {
  const r = await get('https://archive.org/advancedsearch.php?' + new URLSearchParams({ q, rows: '5000', output: 'json' }).toString() + '&fl[]=identifier&fl[]=date&fl[]=title');
  const docs = r?.response?.docs || []; console.log('query', q, docs.length);
  for (const d of docs) seen.set(d.identifier, d);
}
const docs = [...seen.values()].filter((d) => /JPRS|Near East|Joint Publications/i.test(d.title || '')).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
console.log('JPRS candidates', docs.length, docs.slice(0, 5).map((d) => d.title));
let n = 0;
const queue = docs.slice();
await Promise.all(Array.from({ length: 3 }, async () => {
  while (queue.length) {
    if (Date.now() - started > 135 * 60 * 1000) return;
    const d = queue.shift();
    const txt = await get(`https://archive.org/download/${d.identifier}/${d.identifier}_djvu.txt`, 'text');
    const entry = { id: 'jprs-' + d.identifier, source: 'JPRS (Joint Publications Research Service)', collection: 'JPRS Near East/North Africa Report (Internet Archive scan)', title: d.title, date: (d.date || '').slice(0, 10), url: 'https://archive.org/details/' + d.identifier };
    if (txt) {
      let sec = libyaSection(txt); if (sec.length < 400) { const g2 = /Liby|Tripoli|Qadh|Qaddafi|Gadhafi|Gaddafi|Abu Salim|Jamahiriy/gi; const win = []; let m; while ((m = g2.exec(txt))) { const a = Math.max(0, m.index - 1500), b = Math.min(txt.length, m.index + 1500); if (win.length && a <= win[win.length - 1][1]) win[win.length - 1][1] = b; else win.push([a, b]); } if (win.length >= 2) sec = win.map(([a, b]) => txt.slice(a, b)).join('\n[…]\n').slice(0, 120000); }
      entry.chars = sec.length;
      if (sec.length > 400) { entry.file = 'jprs-' + d.identifier + '.txt'; await writeFile('archive/gov/' + entry.file, `${d.title}\n${entry.url}\nJPRS translation. U.S. government work, public domain. OCR text: errors are likely.\n\nLIBYA\n\n${sec.slice(0, 300000)}`); }
    } else entry.error = 'no text';
    catalog.push(entry); n++;
    if (n % 25 === 0) { console.log(n, 'JPRS read'); await save(); }
    await sleep(300);
  }
}));
await save();
console.log('catalog', catalog.length, 'with text', catalog.filter((c) => c.file).length);
