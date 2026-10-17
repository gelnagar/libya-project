/*
  Family AI relay for the Tripoli atlas (Cloudflare Worker).
  Keeps the Anthropic API key secret: the map never sees it.

  Secrets / variables to set in Cloudflare (see SETUP-AI.md):
    ANTHROPIC_API_KEY  (secret)  your Anthropic API key
    FAMILY_CODE        (secret)  the password family members type once on their phone
    OWNER_CODE         (secret)  your own password for the requests page
    ALLOWED_ORIGINS    (text)    https://gelnagar.github.io
    MODEL              (text)    optional, defaults to claude-sonnet-5-5
    OWNER_NAME         (text)    optional, defaults to Gordon

  Needs a KV namespace bound as ATLAS_KV for requests and the low-credit warning:
    CREDIT_LOADED      (text)    total dollars you have ever added, e.g. 20
    LOW_CREDIT_WARNING (text)    warn below this many dollars, default 10
    PRICE_IN, PRICE_OUT (text)   dollars per million tokens, default 2 and 10
*/

const PLACE_SYSTEM = `You explain places on a historical map of Tripoli, Libya, focused on 1969–1989 under Muammar Gaddafi.
Readers are older family members reading on phones. Write plainly in short paragraphs, under 170 words, with no jargon and no headings.
Cover what the place is, why it matters for 1969–1989, and what is uncertain.
Use only well-established facts. If you do not know something, say so plainly instead of guessing.
For present-day map features, explain what the feature is and any history of the surrounding area, and note that the map data is modern.
For a spot the reader picked on the map, use the neighbourhood, address and nearby mapped places you are given.
Never give home addresses or current whereabouts of private individuals.
If the reader writes in Arabic, answer in Arabic.`;

function agentSystem(owner, catalog) {
  return `You are the guide built into a family history map of Tripoli, Libya, focused on 1969–1989 under Muammar Gaddafi.
Readers are older family members, often on phones. Answer plainly and briefly (under 150 words), no headings, no lists unless asked.

The map contains these places (id | name | category | when | summary):
${catalog}

Tools:
- When your answer concerns a mapped place, call show_place with its id so the map moves there. At most two per answer.
- When the reader wants to see a whole category, call show_layer.
- When the reader asks about something that is not on the map, asks for something to be added, or you are not confident of the facts, say so honestly and call suggest_request with a short title and a description of what should be researched or added. The reader can then send it to ${owner}, who maintains the map.

Always write your answer as text before calling any tool.
Use only well-established facts. Never invent places, coordinates, names or numbers.
Never give home addresses or current whereabouts of private individuals.
If the reader writes in Arabic, answer in Arabic.`;
}

const TOOLS = [
  { name: 'show_place', description: 'Move the map to a mapped place and highlight it.', input_schema: { type: 'object', properties: { id: { type: 'string', description: 'Place id from the list' } }, required: ['id'] } },
  { name: 'show_layer', description: 'Turn on a category of places on the map.', input_schema: { type: 'object', properties: { layer: { type: 'string', enum: ['detention', 'security', 'military', 'airstrike', 'massacre', 'power', 'landmark'] } }, required: ['layer'] } },
  { name: 'suggest_request', description: 'Offer the reader a button to ask the map maintainer to research or add something.', input_schema: { type: 'object', properties: { title: { type: 'string' }, details: { type: 'string' } }, required: ['title', 'details'] } }
];

const MAX_PER_MINUTE = 10;
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

async function callClaude(env, payload) {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: env.MODEL || 'claude-sonnet-5-5', ...payload })
  });
}

const clip = (v, n) => String(v || '').slice(0, n);

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGINS || 'https://gelnagar.github.io').split(',').map((s) => s.trim());
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Family-Code, X-Owner-Code',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'Not found' }, 404, cors);
    if (!allowed.includes(origin)) return json({ error: 'Not allowed' }, 403, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400, cors); }
    const norm = (v) => String(v || '').trim().toLowerCase();

    /* ----- owner: read and clear requests ----- */
    if (body.owner) {
      if (!env.OWNER_CODE || norm(request.headers.get('X-Owner-Code')) !== norm(env.OWNER_CODE)) return json({ error: 'Wrong owner password' }, 401, cors);
      if (!env.ATLAS_KV) return json({ error: 'Storage is not set up' }, 503, cors);
      if (body.done) { await env.ATLAS_KV.delete(String(body.done)); return json({ ok: true }, 200, cors); }
      const list = await env.ATLAS_KV.list({ prefix: 'req:', limit: 200 });
      const items = [];
      for (const k of list.keys) {
        const v = await env.ATLAS_KV.get(k.name);
        if (v) { try { items.push({ key: k.name, ...JSON.parse(v) }); } catch {} }
      }
      items.sort((a, b) => (b.at || 0) - (a.at || 0));
      return json({ items, credit: await creditInfo(env) }, 200, cors);
    }

    /* ----- everything else needs the family password ----- */
    if (!env.FAMILY_CODE || norm(request.headers.get('X-Family-Code')) !== norm(env.FAMILY_CODE)) return json({ error: 'Wrong family code' }, 401, cors);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
    if (recent.length >= MAX_PER_MINUTE) return json({ error: 'Too many requests' }, 429, cors);
    recent.push(now);
    hits.set(ip, recent);

    if (body.status) return json({ credit: await creditInfo(env) }, 200, cors);

    /* ----- save a research request for the owner ----- */
    if (body.request) {
      if (!env.ATLAS_KV) return json({ error: 'Storage is not set up' }, 503, cors);
      const r = body.request;
      const item = { at: now, title: clip(r.title, 200), details: clip(r.details, 2000), name: clip(r.name, 80), context: clip(r.context, 1000) };
      if (!item.title && !item.details) return json({ error: 'Empty request' }, 400, cors);
      await env.ATLAS_KV.put('req:' + now + '-' + Math.random().toString(36).slice(2, 8), JSON.stringify(item));
      return json({ ok: true }, 200, cors);
    }

    /* ----- chat guide ----- */
    if (body.agent) {
      const owner = env.OWNER_NAME || 'Gordon';
      const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-12)
        .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content)
        .map((m) => ({ role: m.role, content: clip(m.content, 2000) }));
      while (msgs.length && msgs[0].role !== 'user') msgs.shift();
      if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return json({ error: 'Bad request' }, 400, cors);
      const r = await callClaude(env, { max_tokens: 700, system: agentSystem(owner, clip(body.catalog, 9000)), tools: TOOLS, messages: msgs });
      if (!r.ok) {
        const err = await r.text();
        if (/credit balance/i.test(err)) return json({ error: 'Out of credit', credit: { tracked: true, remaining: 0, low: true, out: true } }, 402, cors);
        return json({ error: 'AI service error ' + r.status }, 502, cors);
      }
      const data = await r.json();
      await recordSpend(env, data.usage);
      const content = data.content || [];
      const text = content.filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
      const actions = content.filter((c) => c.type === 'tool_use').map((c) => ({ type: c.name, input: c.input || {} }));
      return json({ text, actions, credit: await creditInfo(env) }, 200, cors);
    }

    /* ----- single question about a place ----- */
    const question = clip(body.question || 'Why does this place matter?', 500);
    const place = JSON.stringify(body.place || {}).slice(0, 4000);
    const r = await callClaude(env, { max_tokens: 600, system: PLACE_SYSTEM, messages: [{ role: 'user', content: `Place on the map:\n${place}\n\nQuestion: ${question}` }] });
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
