// Pulls the LIBYA section out of every FBIS Daily Report (Middle East & Africa), 1978–1987, on the Internet Archive.
// FBIS translated Libyan radio, the JANA news agency and the Libyan press for the U.S. government: public domain.
// Output: archive/fbis/<yyyy-mm-dd>.txt (Libya section only) and archive/fbis/catalog.json
import { writeFile, mkdir, readFile, access } from 'node:fs/promises';
const UA = 'TripoliOpenSourceArchive/1.0 (github.com/gelnagar/libya-project; research; contact via GitHub)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(u, type = 'json') {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': UA } });
      if (r.status === 429 || r.status >= 500) { await sleep(5000 * (i + 1)); continue; }
      if (!r.ok) return null;
      return type === 'json' ? await r.json() : await r.text();
    } catch { await sleep(3000); }
  }
  return null;
}
const COUNTRIES = ['AFGHANISTAN', 'ALGERIA', 'BAHRAIN', 'CHAD', 'EGYPT', 'IRAN', 'IRAQ', 'ISRAEL', 'JORDAN', 'KUWAIT', 'LEBANON', 'MAURITANIA', 'MOROCCO', 'OMAN', 'QATAR', 'SAUDI ARABIA', 'SUDAN', 'SYRIA', 'TUNISIA', 'TURKEY', 'UNITED ARAB EMIRATES', 'YEMEN', 'YEMEN ARAB REPUBLIC', "PEOPLE'S DEMOCRATIC REPUBLIC OF YEMEN", 'PDRY', 'YAR', 'WESTERN SAHARA', 'PALESTINIAN AFFAIRS', 'ARAB AFFAIRS', 'INTERNATIONAL AFFAIRS', 'SOUTH ASIA', 'SUB-SAHARAN AFRICA', 'INDIA', 'PAKISTAN', 'BANGLADESH', 'SRI LANKA', 'NEPAL', 'CYPRUS', 'ETHIOPIA', 'SOMALIA', 'DJIBOUTI', 'NIGERIA', 'GHANA', 'KENYA', 'ZAIRE', 'ZAMBIA', 'ZIMBABWE', 'ANGOLA', 'MOZAMBIQUE', 'SOUTH AFRICA', 'TANZANIA', 'UGANDA', 'SENEGAL', 'NIGER', 'MALI', 'MAURITIUS', 'MADAGASCAR', 'BENIN', 'TOGO', 'CAMEROON', 'GABON', 'CONGO', 'BURUNDI', 'RWANDA', 'GUINEA', 'LIBERIA', 'SIERRA LEONE', 'UPPER VOLTA', 'BURKINA FASO', 'CENTRAL AFRICAN REPUBLIC', 'ISRAELI-OCCUPIED TERRITORIES', 'GULF STATES', 'NORTH AFRICA', 'MIDDLE EAST', 'NEAR EAST'];
const isHeading = (l) => { const t = l.trim().replace(/\s+/g, ' ').replace(/[^A-Z' -]/g, ''); return t.length >= 3 && t.length <= 40 && l.trim() === l.trim().toUpperCase() && COUNTRIES.includes(t); };
function libyaSection(text) {
  const lines = text.split('\n');
  let best = '';
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*L\s?I\s?B\s?Y\s?A\s*$/.test(lines[i])) continue;
    let j = i + 1;
    while (j < lines.length && !isHeading(lines[j])) j++;
    const sec = lines.slice(i + 1, j).join('\n').trim();
    if (sec.length > best.length) best = sec;
  }
  return best;
}
function headlines(sec) {
  const lines = sec.split('\n').map((l) => l.trim());
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.length < 12 || l.length > 140) continue;
    const letters = l.replace(/[^A-Za-z]/g, '');
    if (letters.length < 8 || letters.replace(/[^A-Z]/g, '').length / letters.length < 0.85) continue;
    const near = lines.slice(i + 1, i + 5).join(' ');
    if (/\[[^\]]{8,}\]/.test(near) || /^\[/.test(lines[i + 1] || '')) out.push(l.replace(/\s+/g, ' '));
  }
  return [...new Set(out)];
}
await mkdir('archive/fbis', { recursive: true });
let catalog = [];
try { catalog = JSON.parse(await readFile('archive/fbis/catalog.json', 'utf8')); } catch {}
const have = new Set(catalog.map((c) => c.identifier));
const FQ = ['title:(FBIS Daily Report Middle East Africa)', 'title:(FBIS Daily Report Near East South Asia)', 'title:(FBIS Daily Report Middle East South Asia)', 'title:(FBIS Daily Report Sub-Saharan Africa)', 'title:(FBIS Daily Report Africa)', 'title:(FBIS-NES)', 'title:(FBIS-MEA)', 'title:(FBIS-AFR)', 'title:("Daily Report" AND (Libya OR Arab OR "Near East"))'];
const dmap = new Map();
for (const q of FQ) {
  for (let page = 1; page <= 3; page++) {
    const r = await get('https://archive.org/advancedsearch.php?' + new URLSearchParams({ q, rows: '5000', page: String(page), output: 'json' }).toString() + '&fl[]=identifier&fl[]=date&fl[]=title');
    const dd = r?.response?.docs || []; console.log('query', q, 'page', page, dd.length);
    for (const d of dd) if (/FBIS|Daily Report/i.test(d.title || '')) dmap.set(d.identifier, d);
    if (dd.length < 5000) break; await sleep(1000);
  }
}
const docs = [...dmap.values()].filter((d) => !have.has(d.identifier)).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
console.log('issues to read', docs.length);
const LIMIT = +(process.env.FBIS_LIMIT || 6000);
let n = 0, started = Date.now();
async function one(d) {
  const txt = await get(`https://archive.org/download/${d.identifier}/${d.identifier}_djvu.txt`, 'text');
  const date = (d.date || '').slice(0, 10);
  const entry = { identifier: d.identifier, date, title: d.title, url: `https://archive.org/details/${d.identifier}` };
  if (!txt) { entry.error = 'no text'; catalog.push(entry); return; }
  const sec = libyaSection(txt);
  entry.chars = sec.length;
  if (sec.length > 200) {
    entry.headlines = headlines(sec).slice(0, 40);
    entry.file = date + '-' + d.identifier.split('_').pop() + '.txt';
    await writeFile('archive/fbis/' + entry.file, `${d.title}\n${entry.url}\nForeign Broadcast Information Service, Daily Report. U.S. government work, public domain. OCR text: errors are likely.\n\nLIBYA\n\n${sec}`);
  }
  catalog.push(entry);
}
const queue = docs.slice(0, LIMIT);
const workers = Array.from({ length: 3 }, async () => {
  while (queue.length) {
    if (Date.now() - started > 320 * 60 * 1000) return; // stop in time to save
    const d = queue.shift(); await one(d); n++;
    if (n % 50 === 0) { console.log(n, 'done'); await writeFile('archive/fbis/catalog.json', JSON.stringify(catalog)); }
    await sleep(400);
  }
});
await Promise.all(workers);
catalog.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
await writeFile('archive/fbis/catalog.json', JSON.stringify(catalog, null, 0));
console.log('read', n, 'with Libya sections', catalog.filter((c) => c.file).length);
