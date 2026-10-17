# Turning on "Ask AI"

The map works without this. These steps add an **Ask AI** button to every place, paid for by one Anthropic API key that stays secret.

How it works: the map sends questions to a small relay on Cloudflare. The relay adds the API key and asks Claude. The key lives only in Cloudflare, never in this repository or on anyone's phone. Family members type a family code once, so strangers who find the map cannot use the key.

## 1. Set a spending limit first

In the Anthropic Console (console.anthropic.com), open **Settings → Limits** and set a low monthly spend limit, for example $10. That caps the cost even if something goes wrong.

## 2. Create the relay (free Cloudflare account)

1. Sign up at dash.cloudflare.com.
2. Go to **Workers & Pages → Create → Create Worker**. Name it `tripoli-atlas-ai` and click **Deploy**.
3. Click **Edit code**, delete the sample, paste the contents of `worker/worker.js` from this repository, and click **Deploy**.
4. Go to the worker's **Settings → Variables and Secrets** and add:

| Name | Type | Value |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Secret | your Anthropic API key |
| `FAMILY_CODE` | Secret | a code you choose, such as a short phrase |
| `ALLOWED_ORIGINS` | Text | `https://gelnagar.github.io` |

5. Copy the worker's address. It looks like `https://tripoli-atlas-ai.YOURNAME.workers.dev`.

## 3. Connect the map

Open `data/config.js` and paste the worker address:

```js
window.ATLAS_CONFIG = {
  aiEndpoint: 'https://tripoli-atlas-ai.YOURNAME.workers.dev'
};
```

Commit the change. The worker address is safe to publish; the API key is not in it.

## 4. Give family the code

Tell family members the family code. The first time they tap **Ask AI**, the map asks for it and saves it on their phone.

To cut off access, change `FAMILY_CODE` in Cloudflare. To stop all AI use, delete the worker or the API key.
