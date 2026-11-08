-- Visitor statistics for the owner dashboard (public/stats.html), kept in the D1 database bound as STATS.
-- The Worker also creates these tables itself on first use; this file is for reference and manual setup:
--   npx wrangler d1 execute tripoli-atlas-stats --remote --file worker/stats-schema.sql
-- No raw IP addresses are stored: vid is a keyed one-way hash of the address and browser.

CREATE TABLE IF NOT EXISTS events (
  ts INTEGER NOT NULL,      -- milliseconds since 1970 (UTC)
  day TEXT NOT NULL,        -- YYYY-MM-DD (UTC)
  vid TEXT,                 -- pseudonymous visitor id
  kind TEXT NOT NULL,       -- visit | open | story | search
  item TEXT,                -- what was opened: site:abusalim, area:ben-ashour, record:…, person:…
  name TEXT,                -- its readable name at the time
  country TEXT, region TEXT, city TEXT, org TEXT, -- from Cloudflare's IP lookup
  device TEXT,              -- phone | tablet | computer
  ref TEXT,                 -- referring site (host only), on visits
  lang TEXT,
  family INTEGER DEFAULT 0  -- 1 when signed in with the family password
);
CREATE INDEX IF NOT EXISTS events_day ON events(day, kind);
CREATE INDEX IF NOT EXISTS events_item ON events(kind, item);

CREATE TABLE IF NOT EXISTS ai (
  ts INTEGER NOT NULL, day TEXT NOT NULL, kind TEXT,
  cost REAL, input INTEGER, output INTEGER, searches INTEGER
);
CREATE INDEX IF NOT EXISTS ai_day ON ai(day);

-- every request that reaches the Worker (map files are served for free without it)
CREATE TABLE IF NOT EXISTS reqs (day TEXT NOT NULL, kind TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, kind));

CREATE TABLE IF NOT EXISTS emails (ts INTEGER NOT NULL, day TEXT NOT NULL, ok INTEGER, info TEXT);
