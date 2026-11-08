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
