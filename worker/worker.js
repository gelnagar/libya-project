/*
  Family AI relay for the Tripoli atlas (Cloudflare Worker).
  Keeps the Anthropic API key secret: the map never sees it.

  Secrets / variables to set in Cloudflare (see SETUP-AI.md):
    ANTHROPIC_API_KEY  (secret)  your Anthropic API key
    FAMILY_CODE        (secret)  the code family members type once on their phone
    ALLOWED_ORIGINS    (text)    https://gelnagar.github.io
    MODEL              (text)    optional, defaults to claude-sonnet-5-5

  Optional low-credit warning (needs a KV namespace bound as ATLAS_KV):
    CREDIT_LOADED      (text)    total dollars you have ever added, e.g. 20
    LOW_CREDIT_WARNING (text)    warn below this many dollars, default 10
    PRICE_IN, PRICE_OUT (text)   dollars per million tokens, default 2 and 10
*/

const SYSTEM = `You explain places on a historical map of Tripoli, Libya, focused on 1969–1989 under Muammar Gaddafi.
Readers are older family members reading on phones. Write plainly in short paragraphs, under 170 words, with no jargon and no headings.
Cover what the place is, why it matters for 1969–1989, and what is uncertain.
Use only well-established facts. If you do not know something, say so plainly instead of guessing.
For present-day map features, explain what the feature is and any history of the surrounding area, and note that the map data is modern.
Never give home addresses or current whereabouts of private individuals.
If the reader writes in Arabic, answer in Arabic.`;

const MAX_PER_MINUTE = 8;
const hits = new Map();

async function creditInfo(env) {
  const loaded = parseFloat(env.CREDIT_LOADED);
  if (!env.ATLAS_KV || !(loaded > 0)) return { tracked: false };
  const spent = parseFloat(await env.ATLAS_KV.get('spent_usd')) || 0;
  const remaining = Math.max(0, loaded - spent);
  const warnBelow = parseFloat(env.LOW_CREDIT_WARNING) || 10;
  return { tracked: true, remaining: Math.round(remaining * 100) / 100, low: remaining < warnBelow, out: remaining <= 0.05 };
}

async function recordSpend(env, usage) {
  if (!env.ATLAS_KV || !usage) return;
  const pin = parseFloat(env.PRICE_IN) || 2, pout = parseFloat(env.PRICE_OUT) || 10;
  const cost = ((usage.input_tokens || 0) * pin + (usage.output_tokens || 0) * pout) / 1e6;
  const spent = parseFloat(await env.ATLAS_KV.get('spent_usd')) || 0;
  await env.ATLAS_KV.put('spent_usd', String(spent + cost));
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGINS || 'https://gelnagar.github.io').split(',').map((s) => s.trim());
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Family-Code',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'Not found' }, 404, cors);
    if (!allowed.includes(origin)) return json({ error: 'Not allowed' }, 403, cors);
    const norm = (v) => String(v || '').trim().toLowerCase();
    if (!env.FAMILY_CODE || norm(request.headers.get('X-Family-Code')) !== norm(env.FAMILY_CODE)) return json({ error: 'Wrong family code' }, 401, cors);

    // Light per-visitor limit (resets when Cloudflare recycles the worker).
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
    if (recent.length >= MAX_PER_MINUTE) return json({ error: 'Too many requests' }, 429, cors);
    recent.push(now);
    hits.set(ip, recent);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400, cors); }
    if (body.status) return json({ credit: await creditInfo(env) }, 200, cors);
    const question = String(body.question || 'Why does this place matter?').slice(0, 500);
    const place = JSON.stringify(body.place || {}).slice(0, 4000);

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: env.MODEL || 'claude-sonnet-5-5',
        max_tokens: 600,
        system: SYSTEM,
        messages: [{ role: 'user', content: `Place on the map:\n${place}\n\nQuestion: ${question}` }]
      })
    });

    if (!r.ok) {
      const err = await r.text();
      if (/credit balance/i.test(err)) return json({ error: 'Out of credit', credit: { tracked: true, remaining: 0, low: true, out: true } }, 402, cors);
      return json({ error: 'AI service error ' + r.status }, 502, cors);
    }
    const data = await r.json();
    await recordSpend(env, data.usage);
    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
    return json({ text, credit: await creditInfo(env) }, 200, cors);
  }
};
