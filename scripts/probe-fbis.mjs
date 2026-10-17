// One-off: how many FBIS/JPRS reports are on the Internet Archive, by year and series.
import { writeFile, mkdir } from 'node:fs/promises';
const UA = 'TripoliOpenSourceArchive/1.0 (github.com/gelnagar/libya-project; research)';
const out = [];
async function q(query, rows = 10000) {
  const u = 'https://archive.org/advancedsearch.php?' + new URLSearchParams({ q: query, 'fl[]': 'identifier', rows: String(rows), output: 'json' }).toString() + '&fl[]=date&fl[]=title';
  const r = await fetch(u, { headers: { 'User-Agent': UA } }); const j = await r.json(); return j.response;
}
for (const query of ['identifier:fbis-report*', 'identifier:fbis-reports*', 'identifier:jprs*', 'collection:fbis-reports', 'collection:fbis', 'title:(FBIS Daily Report Middle East Africa)', 'libya AND identifier:fbis*', 'qadhafi AND identifier:fbis*']) {
  try {
    const r = await q(query);
    const by = {};
    for (const d of r.docs || []) { const id = d.identifier; const series = (id.match(/fbis-([a-z]+)-/) || id.match(/^(jprs[-_][a-z]+)/i) || [, 'other'])[1]; const yr = (d.date || '').slice(0, 4) || (id.match(/-(\d\d)-\d{3}/) || [, '??'])[1]; const k = series + ' ' + yr; by[k] = (by[k] || 0) + 1; }
    out.push({ query, numFound: r.numFound, sample: (r.docs || []).slice(0, 5), by });
  } catch (e) { out.push({ query, error: e.message }); }
}
await mkdir('archive', { recursive: true });
await writeFile('archive/probe-fbis.json', JSON.stringify(out, null, 1));
