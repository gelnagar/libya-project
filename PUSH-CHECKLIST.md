# Before pushing branch `libya` to `main`

Every push to `main` is built and deployed by Cloudflare Workers Builds (`npx wrangler deploy`, branch `main` only, no preview builds for other branches). So a push is a release. Nothing on `libya` has been live yet. This is the order to do it in. Steps 1 to 3 are the owner's; the rest can be run by anyone.

Commands are for PowerShell on Windows: `npx` is blocked there by the execution policy, so they use `npx.cmd`.

## 1. Change the family password (owner, before anything else)

The reason is in `AUDIT.md` (kept out of the repository on purpose). It takes a minute and does not need a deploy.

```
npx.cmd wrangler secret put FAMILY_CODE --name tripoli-atlas-ai
```

Type the new password when asked. Capitals and spaces are ignored, so use three or more unrelated words, not one word. Everyone is signed out and must be given the new one. `.secret-words` (git-ignored, one word per line) already holds the old password, so `check-secrets` refuses it in any tracked file. Add the new one too, and never write either in a document.

After this, record the live version, because it is the only safe rollback point (see step 9):

```
npx.cmd wrangler deployments list --name tripoli-atlas-ai
```

## 2. Settings on the live Worker (owner, dashboard: Workers & Pages, tripoli-atlas-ai, Settings, Variables and Secrets)

| Setting | Now | Do |
|---|---|---|
| `CF_PLAN` | not set live; `wrangler.jsonc` sets `paid` | nothing: it goes live with the push |
| `CREDIT_LOADED` | placeholder text | set it to the number of dollars you have added in the Anthropic console, e.g. `20`; or delete it to switch the low-credit warning off |
| `LOW_CREDIT_WARNING` | `10` | keep, or change |
| `ALLOWED_ORIGINS` | `https://gelnagar.github.io` | clear it once the old GitHub Pages copy is unpublished (repository Settings, Pages, Unpublish) |
| `RESEND_API_KEY`, `ALERT_EMAIL` | not set | see step 3 |
| `USGS_TOKEN`, `USGS_USERNAME` | removed from the Worker on 15 Nov 2026 (copies stay in GitHub Actions) | nothing |

## 3. Email alerts when a family member adds to the map (owner, optional)

1. Sign up at resend.com with the address where you want the alerts. The free test sender can only send to that same address.
2. In Resend create an API key with "Sending access".
3. In PowerShell:
   ```
   npx.cmd wrangler secret put RESEND_API_KEY --name tripoli-atlas-ai
   npx.cmd wrangler secret put ALERT_EMAIL --name tripoli-atlas-ai
   ```
4. After the push, sign in as family and add a test note. The email should arrive within a minute (check spam the first time). `stats.html` then shows email as configured.

Without these two, nothing breaks: reports still arrive, held for approval on `requests.html`; no email is sent.

## 4. Decisions the push makes for the owner (each is listed under "Waiting for the owner" in `LIBYA-PROGRESS.md`)

- New family reports are held until approved, and visitors no longer see who added a report. Existing reports stay visible.
- A $3 a day AI spending ceiling (`DAILY_AI_LIMIT_USD`; `0` turns it off).
- A strict script policy in `public/_headers`. Every page was loaded locally with it and none broke; it has not been seen on Cloudflare.
- A public correction and removal page, linked from every place panel. It promises an answer to each request that leaves a way to reply, but states no time.
- Country view and the region machinery; the Speeches button appears only once a speech is approved.

## 5. Bring the branch up to date

```
git fetch origin
git pull --rebase origin main
```

`main` receives one automatic commit a day (the satellite-frames list). At the last check there were two, touching one file the branch does not touch.

## 6. Run the preflight

```
node scripts/preflight.mjs
```

About a minute. It checks syntax of every script, the Worker tests, the panel and claim-model checks, that no secret is in a tracked file, the file count against the plan, the headers, and that the README, CLAUDE.md and progress file agree with the data. It must end with `0 FAIL`. Read every `WARN`.

## 7. Reload the review queue, then push

The review table gained a region column. The Worker now adds the column to the old table by itself, but the rows have no region until the queue is reloaded. Load first: the old Worker ignores the extra column, so loading before the push is safe.

```
node scripts/build-review.mjs --sql out.sql
npx.cmd wrangler d1 execute tripoli-atlas-stats --remote --file out.sql -y
git push origin libya:main
```

Reloading keeps owner decisions (they are in their own table; there are none yet). `out.sql` is a build file: do not commit it.

A `pre-push` hook runs `check-secrets` and stops the push if it finds a secret. It lives in `.git/hooks/pre-push`, which Git does not share; on another machine create it with this one line and make it executable: `node scripts/check-secrets.mjs || exit 1`.

## 8. Check the live site (5 minutes)

- The map loads; open Abu Salim; the correction link at the end of its panel opens the form with the entry filled in.
- Send a test correction; it appears on `requests.html` with the entry id (not a dash). Mark it answered.
- Sign in with the new password; the AI guide and Add button appear. Add a test note; it is held; approve it; it shows to a visitor in a private window, with no contributor name.
- `stats.html` shows the plan as paid, and email as configured if step 3 was done.
- Browser console on every page: no script-policy errors. Report any to the person who wrote the push.
- Review page: the region filter works and the candidates count matches the funnel strip.
- Workers Builds shows `success`; the file count is near 15,900.

## 9. If something is wrong

```
npx.cmd wrangler deployments list --name tripoli-atlas-ai
npx.cmd wrangler rollback <version id> --name tripoli-atlas-ai
```

Secrets and variables are part of a version, so a rollback restores the passwords that version held. Only roll back to a version created after step 1. Never roll back to one from before the password change. Rolling back the Worker does not roll back the database: tables created by the new Worker (`corrections`, `fails`) and the `region` column stay, and the old Worker ignores them.

## What was not tested

- The Worker, the headers and the new pages on Cloudflare itself (everything was run locally against stand-ins for KV and D1).
- A request to the live Worker that writes (a correction, a report, a tracking batch): a test would write to the live database.
- The owner pages with the real owner password.
- Sending an email through Resend.
- Why the live visit table has no rows: not found; it may only mean nobody but the owner has visited.
