/*
  Family AI relay for the Tripoli atlas (Cloudflare Worker).
  Keeps the Anthropic API key secret: the map never sees it.

  Secrets / variables to set in Cloudflare (see SETUP-AI.md):
    ANTHROPIC_API_KEY  (secret)  your Anthropic API key
    FAMILY_CODE        (secret)  the code family members type once on their phone
    ALLOWED_ORIGINS    (text)    https://gelnagar.github.io
    MODEL              (text)    optional, defaults to claude-sonnet-5-5
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

    if (!r.ok) return json({ error: 'AI service error ' + r.status }, 502, cors);
    const data = await r.json();
    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
    return json({ text }, 200, cors);
  }
};
