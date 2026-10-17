// Downloads Wikipedia articles (English and Arabic) about Tripoli and Libya, 1969–1989, as plain text.
// Wikipedia text is CC BY-SA 4.0: keep the title and link with anything derived from it.
// Input: archive/wikipedia/sources.txt — lines "en|Title", "ar|Title", "en|search:query", "en|category:Name".
// Output: archive/wikipedia/<lang>/<title>.json  { title, lang, url, coords, text, revid, fetched }
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';

const UA = 'TripoliOpenSourceArchive/1.0 (github.com/gelnagar/libya-project; research)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(lang, params) {
  const url = `https://${lang}.wikipedia.org/w/api.php?` + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429 || r.status >= 500) { await sleep(3000 * (i + 1)); continue; }
      return await r.json();
    } catch (e) { await sleep(2000); }
  }
  return {};
}
const safe = (t) => t.replace(/[\/\\:*?"<>|]/g, '_').slice(0, 150);
const lines = (await readFile('archive/wikipedia/sources.txt', 'utf8')).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const want = new Map();
for (const l of lines) {
  const [lang, rest] = [l.slice(0, 2), l.slice(3)];
  if (rest.startsWith('search:')) {
    const j = await api(lang, { action: 'query', list: 'search', srsearch: rest.slice(7), srlimit: '15' });
    for (const s of j.query?.search || []) want.set(lang + '|' + s.title, 1);
  } else if (rest.startsWith('category:')) {
    const j = await api(lang, { action: 'query', list: 'categorymembers', cmtitle: 'Category:' + rest.slice(9), cmlimit: '200', cmtype: 'page' });
    for (const s of j.query?.categorymembers || []) want.set(lang + '|' + s.title, 1);
  } else want.set(lang + '|' + rest, 1);
  await sleep(150);
}
console.log('articles wanted:', want.size);
let saved = 0;
for (const key of want.keys()) {
  const [lang, title] = [key.slice(0, 2), key.slice(3)];
  const file = `archive/wikipedia/${lang}/${safe(title)}.json`;
  try { await access(file); continue; } catch {}
  const j = await api(lang, { action: 'query', prop: 'extracts|coordinates|info|langlinks', explaintext: '1', redirects: '1', titles: title, inprop: 'url', lllang: lang === 'en' ? 'ar' : 'en' });
  const p = j.query?.pages?.[0];
  if (!p || p.missing || !p.extract) continue;
  await mkdir(`archive/wikipedia/${lang}`, { recursive: true });
  await writeFile(`archive/wikipedia/${lang}/${safe(p.title)}.json`, JSON.stringify({
    title: p.title, lang, url: p.fullurl, revid: p.lastrevid, coords: p.coordinates?.[0] ? [p.coordinates[0].lat, p.coordinates[0].lon] : null,
    other_language: p.langlinks?.[0]?.title || null, license: 'CC BY-SA 4.0', fetched: new Date().toISOString().slice(0, 10), text: p.extract
  }, null, 1));
  saved++;
  await sleep(120);
}
console.log('saved', saved);
