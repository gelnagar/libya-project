// Probe other archives for Gaddafi-era material. Polite: sequential, 2 s gaps; reads robots.txt of third-party sites.
import fs from 'node:fs';
const UA = 'TripoliOpenSource-research/1.0 (historical research; contact gsea2020@mymail.pomona.edu)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(u) { try { const r = await fetch(u, { headers: { 'user-agent': UA } }); return { status: r.status, t: await r.text() }; } catch (e) { return { status: 0, t: String(e) }; } }
const out = { at: new Date().toISOString(), ia: {}, robots: {}, items: {} };
const Q = {
  israel_state_archives: '(creator:"Israel State Archives" OR uploader:"Archive Portal" OR title:"Israeli Foreign Ministry") AND (Libya OR Gaddafi OR Qaddafi OR Kadhafi OR Tripoli)',
  gaddafi_files: 'title:(Gaddafi OR Qaddafi OR Kadhafi OR Qadhafi OR Libya) AND (collection:(israel OR idf OR haganah) OR creator:israel*)',
  nsa_libya: '(creator:"National Security Archive" OR collection:nsarchive) AND (Libya OR Qaddafi OR Gaddafi)',
  uk_ukna: 'title:(Libya OR Gaddafi) AND (creator:"National Archives" OR collection:ukgov)',
  stasi_libya: '(Stasi OR "Staatssicherheit" OR "East German") AND (Libya OR Libyen OR Gaddafi)',
  hebrew: 'Libya AND (Hebrew OR "ISA-mfa")',
  trials_docs: '(Lockerbie OR UTA OR "La Belle" OR Berlin) AND (Libya) AND (court OR indictment OR judgment OR "trial")',
};
for (const [k, q] of Object.entries(Q)) {
  const r = await get(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&fl[]=title&fl[]=date&fl[]=creator&fl[]=collection&rows=30&output=json`);
  let j = null; try { j = JSON.parse(r.t); } catch {}
  out.ia[k] = { status: r.status, found: j?.response?.numFound, sample: (j?.response?.docs || []).slice(0, 20).map((d) => [d.identifier, String(d.title).slice(0, 110), d.date?.slice(0, 10), [].concat(d.creator || []).join(';').slice(0, 40)]) };
  await sleep(1500);
}
// the known item: files + sizes
const m = await get('https://archive.org/metadata/gaddafi-in-the-files-of-the-israeli-foreign-ministry');
try { const j = JSON.parse(m.t); out.items.gaddafi_isa = { files: (j.files || []).map((f) => [f.name, f.format, f.size]), meta: j.metadata }; } catch { out.items.gaddafi_isa = { status: m.status }; }
// robots.txt of candidate sites (read-only check)
for (const h of ['digitalarchive.wilsoncenter.org', 'nsarchive.gwu.edu', 'nsarchive2.gwu.edu', 'discovery.nationalarchives.gov.uk', 'www.nationalarchives.gov.uk', 'catalog.archives.gov', 'archives.mod.gov.il', 'www.archives.gov.il', 'www.bundesarchiv.de', 'www.bstu.de', 'www.stasi-unterlagen-archiv.de', 'www.margaretthatcher.org', 'www.cvce.eu', 'www.fordlibrarymuseum.gov', 'www.jimmycarterlibrary.gov', 'history.state.gov', 'www.cia.gov']) {
  const r = await get(`https://${h}/robots.txt`);
  const star = (r.t.match(/User-agent:\s*\*[\s\S]*?(?=\nUser-agent:|$)/i) || [''])[0].split('\n').filter((l) => /^(Disallow|Allow|Crawl-delay)/i.test(l)).slice(0, 14);
  out.robots[h] = { status: r.status, star };
  await sleep(1000);
}
fs.mkdirSync('archive/research', { recursive: true });
fs.writeFileSync('archive/research/archives-probe.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out).slice(0, 3000));
