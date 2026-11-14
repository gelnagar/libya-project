// Stored document texts (CIA reading room, JPRS, Wikipedia copies, cables) by document id, read once.
import fs from 'node:fs'; import zlib from 'node:zlib';
let docs = null;
export function storedDocs() {
  if (docs) return docs; docs = new Map();
  for (const p of ['archive/crest/docs.jsonl.gz', 'archive/crest/docs-other.jsonl.gz', 'archive/cables/docs.jsonl.gz']) { if (!fs.existsSync(p)) continue;
    for (const l of zlib.gunzipSync(fs.readFileSync(p)).toString().split('\n')) { if (!l) continue; try { const d = JSON.parse(l); if (!docs.has(d.id)) docs.set(d.id, d); } catch { /* a broken line is skipped */ } } }
  return docs;
}
/** Text folded for comparison: lower case, plain quotes, one space. */
export const flat = (t) => String(t || '').toLowerCase().replace(/[‘’`]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
