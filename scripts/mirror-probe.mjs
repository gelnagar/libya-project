// Probe permissible mirrors of CREST/JPRS/FBIS. Different hosts, polite (2 s gaps per host).
import fs from 'node:fs';
const UA = 'TripoliOpenSource-research/1.0 (historical research; contact gsea2020@mymail.pomona.edu)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(u, h = {}) {
  try { const r = await fetch(u, { headers: { 'user-agent': UA, ...h } }); const t = await r.text(); return { status: r.status, t }; }
  catch (e) { return { status: 0, t: String(e) }; }
}
const out = {};
// archive.org: several queries, count + sample identifiers/titles
const IA = {
  crest_libya: '(collection:ciareadingroom OR subject:CREST OR title:CIA-RDP) AND (Libya OR Tripoli OR Qadhafi)',
  cia_rdp_libya: 'CIA-RDP AND (Libya OR Libyan OR Tripoli)',
  jprs_nena: '"Near East/North Africa Report" OR "Near East and North Africa Report" OR (JPRS AND Libya)',
  fbis_mea: '("FBIS" OR "Daily Report") AND ("Middle East" OR "Near East") AND Libya',
  black_vault_libya: 'theblackvault AND Libya',
};
out.archive = {};
for (const [k, q] of Object.entries(IA)) {
  const u = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&fl[]=title&fl[]=date&fl[]=collection&fl[]=mediatype&rows=25&output=json`;
  const r = await get(u); let j = null; try { j = JSON.parse(r.t); } catch {}
  out.archive[k] = { status: r.status, found: j?.response?.numFound, sample: (j?.response?.docs || []).map((d) => [d.identifier, String(d.title).slice(0, 120), d.date, [].concat(d.collection || []).slice(0, 3).join(',')]) };
  await sleep(2000);
}
// NARA catalog API v2 (may need key)
for (const q of ['Libya Tripoli CIA', 'CREST Libya']) {
  const r = await get(`https://catalog.archives.gov/api/v2/records/search?q=${encodeURIComponent(q)}&limit=5`);
  out['nara:' + q] = { status: r.status, head: r.t.slice(0, 600) };
  await sleep(2000);
}
// DTIC public search
{ const r = await get('https://discover.dtic.mil/results/?q=Libya%20Tripoli%20JPRS');
  out.dtic = { status: r.status, len: r.t.length, pdfs: [...r.t.matchAll(/apps\.dtic\.mil\/sti\/[^"' ]+/g)].slice(0, 10).map((m) => m[0]) }; }
// DTIC robots
{ const r = await get('https://apps.dtic.mil/robots.txt'); out.dtic_robots = { status: r.status, t: r.t.slice(0, 800) }; }
{ const r = await get('https://archive.org/robots.txt'); out.ia_robots = { status: r.status, t: r.t.slice(0, 600) }; }
fs.mkdirSync('archive/crest', { recursive: true });
fs.writeFileSync('archive/crest/mirror-probe.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
