// Assemble the existing archive sources (Wikipedia en/ar, FBIS, FRUS full texts, Reagan/Bush/JPRS, country study)
// into archive/crest/docs-other.jsonl.gz so the same Haiku extraction can read them.
import fs from 'node:fs'; import zlib from 'node:zlib'; import path from 'node:path';
const A = 'archive', out = [];
const rd = (p) => fs.readFileSync(p, 'utf8');
for (const lang of ['en', 'ar']) for (const f of fs.readdirSync(`${A}/wikipedia/${lang}`)) {
  const w = JSON.parse(rd(`${A}/wikipedia/${lang}/${f}`)); if (!w.text || w.text.length < 300) continue;
  out.push({ id: `wiki-${lang}-${f.replace(/\.json$/, '')}`, src: 'wikipedia', title: w.title + (lang === 'ar' ? ' (Arabic Wikipedia)' : ' (Wikipedia)'), date: '', url: w.url, text: w.text });
}
for (const f of fs.readdirSync(`${A}/fbis`)) {
  const t = rd(`${A}/fbis/${f}`); const m = f.match(/^(\d{4}-\d{2}-\d{2})/);
  out.push({ id: `fbis-${f.replace(/\.txt$/, '')}`, src: 'fbis', title: t.split('\n')[0].slice(0, 140), date: m ? m[1] : '', url: (t.split('\n')[1] || '').trim(), text: t });
}
for (const f of fs.readdirSync(`${A}/fulltext`)) {
  const t = rd(`${A}/fulltext/${f}`); const id = f.replace(/\.txt$/, '');
  out.push({ id: `frus-${id}`, src: 'frus', title: t.split('\n').filter((l) => l.trim()).slice(0, 3).join(' | ').slice(0, 160), date: (t.match(/\b(\d{4})\b/) || [])[1] || '', url: '', text: t });
}
const cat = JSON.parse(rd(`${A}/gov/catalog.json`));
for (const g of cat) { if (!g.file) continue; const t = rd(`${A}/gov/${g.file}`);
  out.push({ id: `gov-${g.id}`, src: g.id.startsWith('jprs-') ? 'jprs-old' : 'gov', title: g.title || g.id, date: g.date || '', url: g.url || g.page || '', text: t }); }
for (const f of fs.readdirSync(`${A}/countrystudy`)) { const t = rd(`${A}/countrystudy/${f}`);
  out.push({ id: `cs-${f.replace(/\.txt$/, '')}`, src: 'countrystudy', title: t.split('\n').filter((l) => l.trim())[0].slice(0, 140), date: '1987', url: (t.split('\n')[1] || '').trim(), text: t }); }
const lines = out.map((d) => JSON.stringify(d)).join('\n') + '\n';
fs.writeFileSync('archive/crest/docs-other.jsonl.gz', zlib.gzipSync(lines));
const by = {}; out.forEach((d) => (by[d.src] = (by[d.src] || 0) + 1));
console.log(out.length, by, Math.round(lines.length / 1e6) + ' MB raw');
