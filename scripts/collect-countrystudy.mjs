// Downloads "Libya: A Country Study" (Library of Congress, Federal Research Division, 1987/1989).
// A U.S. government work: public domain. Saved as plain text per section in archive/countrystudy/.
import { writeFile, mkdir } from 'node:fs/promises';
const UA = 'TripoliOpenSourceArchive/1.0 (github.com/gelnagar/libya-project; research)';
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>|<\/p>|<\/h\d>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
await mkdir('archive/countrystudy', { recursive: true });
const sections = [];
for (let i = 1; i <= 120; i++) {
  const url = `http://countrystudies.us/libya/${i}.htm`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) { if (i > 5) break; continue; }
    const html = await r.text();
    const title = strip((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1]);
    const body = strip(html).replace(/^.*?Country Listing/s, '').replace(/Source: U\.S\. Library of Congress[\s\S]*$/, '').trim();
    await writeFile(`archive/countrystudy/${String(i).padStart(3, '0')}.txt`, title + '\n' + url + '\n\n' + body);
    sections.push({ i, title, url, chars: body.length });
  } catch (e) { console.warn(url, e.message); }
  await new Promise((r) => setTimeout(r, 300));
}
await writeFile('archive/countrystudy/index.json', JSON.stringify({ source: 'Helen Chapin Metz, ed. Libya: A Country Study. Washington: GPO for the Library of Congress, 1987.', rights: 'public domain (U.S. government work)', sections }, null, 1));
console.log('sections', sections.length);
