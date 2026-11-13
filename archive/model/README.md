# The claim model

Three record types. Everything shown on the map is the sum of its claims.

| Record | What it is | Key fields |
|---|---|---|
| subject | a place, an area, an event, an item with no location, or a connection | `uid`, `class`, `region`, `name`, `lat`, `lon`, `r` (uncertainty, km), `y0`, `y1`, `level` |
| source | one cited work | `id`, `url`, `title`, `origin`, `fetched`, `sha256`, `archived`, `rights` |
| claim | "this source supports this about this subject" | `subject`, `source`, `field`, `statement`, `date`, `level`, `passage`, `reliability` (A-F), `credibility` (1-6), `reviewer`, `reviewed` |

- Build: `node scripts/build-claims.mjs --check` (regenerates the files here and proves public/data can be rebuilt from them).
- Verify quotations: `node scripts/check-model.mjs` (every stored passage must be in its stored source text).
- `model.sql` loads the same tables into SQLite or Cloudflare D1.
- `uid` is `site:<id>`, `area:<id>` or a generated key, because one pin and one area share the short id `hadba`.
- A claim with `passage_status: "not recorded"` cites a source without the supporting words. Evidence rule 1 asks for the words.
