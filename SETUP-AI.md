# The family password: AI and adding to the map

The map is open read-only to anyone with the link. The family password turns on "Ask AI", the chat guide and adding notes, photos and voice to the map. Visitors without it cannot use any AI, so they cost no AI credit. The Anthropic key lives only in Cloudflare.

How it works: Cloudflare serves the files in `public/` directly (`run_worker_first` is `false` in `wrangler.jsonc`), so map visits do not run the Worker or count against its daily request limit. `worker/worker.js` handles `/login`, `/logout` and `/api`. On `/api`, callers without the family password may only read family reports and their photos and voice notes, never the "home" reports (family and friends' places); every AI call and every write is refused with 403. A correct password at `/login` sets a signed cookie for 180 days, plus a readable `atlas_family` cookie that only tells the map to show the family buttons. After 8 wrong guesses from one address, that address is locked out for 15 minutes. Changing `FAMILY_CODE` logs everyone out. Files in `public/` are the only ones served; `archive/`, `worker/` and `scripts/` are never reachable.

## 1. Set a spending limit first

In the Anthropic Console (console.anthropic.com) open **Settings → Limits** and set a low monthly limit, for example $10.

## 2. Deploy this repository as a Worker

1. Sign in at dash.cloudflare.com.
2. **Workers & Pages → Create → Import a repository**, pick `gelnagar/libya-project`, and keep the defaults. The repo's `wrangler.jsonc` already tells Cloudflare to serve `public/` as static assets and run `worker/worker.js` in front of it.
3. Open the new Worker's **Settings → Variables and Secrets** and add:

| Name | Type | Value |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Secret | your Anthropic API key |
| `FAMILY_CODE` | Secret | `Nubie` (capitals and spaces are ignored) |
| `OWNER_CODE` | Secret | your own password for the requests page (different from the family one) |
| `SESSION_SECRET` | Secret | optional: any long random text |

4. Optional low-credit warning: **Storage & Databases → KV → Create** (the repo already names the binding `ATLAS_KV`; if Cloudflare asks, bind your namespace to that name). Then add text variables `CREDIT_LOADED` (dollars you added in Anthropic's console) and `LOW_CREDIT_WARNING` (for example `10`).
5. Open the Worker's address (`https://….workers.dev`) in a private window. The map should open with no chat and no **Add to map** button. Go to Settings → **Family sign-in**, enter the family password, and the AI guide and Add button appear.

Every push to `main` redeploys automatically. Secrets stay as they are.

## 3. Close the old public copy

The previous GitHub Pages copy (`gelnagar.github.io/libya-project`) has no password. Turn it off: repository **Settings → Pages → Unpublish site**. Better still, make the repository **private** (Settings → General → Danger zone → Change visibility). Cloudflare can still deploy a private repository. This also keeps the raw research files (`archive/`) out of public view.

## 4. Give family the code

Share the link with anyone; share the family password only with family. Phones remember a sign-in for about six months. To cut off family access, change `FAMILY_CODE`. To stop AI use, remove the API key.

## Requests from the family

The chat can offer a **Send to Gordon** button when something is not on the map. Requests are saved in KV. Read them at `/requests.html` on your Worker address with `OWNER_CODE`, and tap **Mark done** to clear one. The family password cannot open that page.

## Visitors and costs dashboard

Open `/stats.html` on your Worker address with `OWNER_CODE`. It shows visits per day, different and returning visitors, the most opened places, records, people and stories, countries, cities, networks, devices, family versus public, where visitors came from, time of day, and what the site costs you this month (AI, Cloudflare, email) with how much of each free allowance is used.

- Data lives in the D1 database `tripoli-atlas-stats` (bound as `STATS` in `wrangler.jsonc`; tables in `worker/stats-schema.sql`, also created automatically).
- The map sends one small batch about 4 seconds after it opens, then at most one a minute while someone browses, and one when they leave. These are the only Worker requests an ordinary visit makes.
- Visitors are counted by a keyed one-way hash of IP address and browser. IP addresses are never stored. Location (country, region, city, network) comes from Cloudflare's IP lookup and is approximate.
- Optional: `STATS_SALT` (secret) for the hash key, otherwise `FAMILY_CODE` is used. `CF_PLAN` set to `paid` if you move to Workers Paid, so the cost estimate includes the $5 a month.

## Email when someone adds to the map

Every new family report (testimony, memory, place) sends you an email with what was added and a link to review or remove it. Your Cloudflare account has no domain of its own, so mail goes through Resend (free: 3,000 a month, 100 a day):

1. Sign up at resend.com **with the address you want the alerts at** (the free test sender can only mail that address).
2. In Resend, create an API key with "Sending access".
3. Set the two secrets (the email address stays out of the public repository):

   ```
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put ALERT_EMAIL
   ```

4. Add a test report on the map; the email arrives within a minute (check spam the first time). The dashboard shows the last alert's status.

If you later add a domain to Cloudflare or Resend, set `ALERT_FROM` (for example `Tripoli atlas <alerts@yourdomain>`) to send from it.
