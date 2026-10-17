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

  The chat guide is an agent: Claude calls map tools, the map runs them and sends back
  the results, and the loop continues until Claude gives its final answer. The tools and
  instructions live here, in the worker; the map only supplies data and tool results.
*/

const clip = (v, n) => String(v == null ? '' : v).slice(0, n);

const PLACE_SYSTEM = `You explain places on a historical map of Tripoli, Libya, focused on 1969–1989 under Muammar Gaddafi.
Readers are older family members reading on phones. Write plainly in short paragraphs, under 170 words, with no jargon and no headings.
Cover what the place is, why it matters for 1969–1989, and what is uncertain.
Use only well-established facts. If you do not know something, say so plainly instead of guessing.
For present-day map features, explain what the feature is and any history of the surrounding area, and note that the map data is modern.
For a spot the reader picked on the map, use the neighbourhood, address and nearby mapped places you are given.
Never give home addresses or current whereabouts of private individuals.
If the reader writes in Arabic, answer in Arabic.`;

function agentSystem(owner, catalog) {
  return `You are the guide inside a family history map of Tripoli, Libya, focused on 1969–1989 under Muammar Gaddafi. You can see and control the map with your tools.

Readers are older family members, often on phones. Your final answer must be plain language, under 150 words, with no headings.

How to work:
- When the reader asks to see, hide, change or find something, do it with the tools straight away. Tool results tell you what actually changed; check them before answering.
- To show only certain categories, use set_layers with "only". To remove a category, use "hide".
- Use get_map_state if you need to know what is currently shown, and search_places or get_place before giving details about a place.
- When places are relevant to an answer, move the map to them with fly_to.
- If something is not on the map, or you are not confident of the facts, say so and call suggest_request so the reader can ask ${owner}, who maintains the map, to investigate or add it.
- Do not explain your tools or their limits to the reader. Do the task, then tell them briefly what they are now looking at.
- Only say you changed the map if a tool result in this conversation confirms it.

Places on the map (id | name | category | when | summary):
${catalog}

Use only well-established facts. Never invent places, coordinates, names or numbers. Never give home addresses or current whereabouts of private individuals. If the reader writes in Arabic, answer in Arabic.`;
}

const HIST = ['detention', 'security', 'military', 'airstrike', 'massacre', 'power', 'landmark'];
const TODAY = ['landuse', 'buildings', 'military', 'water', 'oil'];
const arr = (items) => ({ type: 'array', items });

const TOOLS = [
  { name: 'get_map_state', description: 'See what the map is showing now: map style, time periods, which layers are on, display options, zoom, centre and the selected place.', input_schema: { type: 'object', properties: {} } },
  { name: 'search_places', description: 'Find mapped places by words in their name or description, by category, or by year range. Returns ids, names, categories, years and whether each is currently visible.', input_schema: { type: 'object', properties: { query: { type: 'string' }, layer: { type: 'string', enum: HIST }, year_from: { type: 'integer' }, year_to: { type: 'integer' } } } },
  { name: 'get_place', description: 'Full details of one mapped place: description, evidence level, accuracy, linked places and sources.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'describe_spot', description: 'Look up any point: address, neighbourhood, nearest district and mapped places nearby.', input_schema: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' } }, required: ['lat', 'lon'] } },
  { name: 'set_layers', description: 'Change the historical layers. "only" shows exactly these and hides all others. "show" turns layers on; "hide" turns them off.', input_schema: { type: 'object', properties: { only: arr({ type: 'string', enum: HIST }), show: arr({ type: 'string', enum: HIST }), hide: arr({ type: 'string', enum: HIST }) } } },
  { name: 'set_today_layers', description: 'Turn present-day OpenStreetMap layers on or off: land-use zones, buildings, military areas today, water infrastructure, oil and gas.', input_schema: { type: 'object', properties: { show: arr({ type: 'string', enum: TODAY }), hide: arr({ type: 'string', enum: TODAY }) } } },
  { name: 'set_basemap', description: 'Change the map style.', input_schema: { type: 'object', properties: { style: { type: 'string', enum: ['dark', 'satellite', 'street', 'terrain'] } }, required: ['style'] } },
  { name: 'set_periods', description: 'Choose which time periods are shown. Omitted periods stay as they are.', input_schema: { type: 'object', properties: { before_1969: { type: 'boolean' }, from_1969_to_1989: { type: 'boolean' }, after_1989: { type: 'boolean' } } } },
  { name: 'set_display', description: 'Turn display options on or off. Omitted options stay as they are.', input_schema: { type: 'object', properties: { district_names: { type: 'boolean' }, uncertainty_rings: { type: 'boolean' }, place_names: { type: 'boolean' }, grid: { type: 'boolean' }, timeline: { type: 'boolean' } } } },
  { name: 'fly_to', description: 'Move the map. Give place_ids to frame one or more places, a district name, a lat/lon with optional zoom (10–18), or whole_city true.', input_schema: { type: 'object', properties: { place_ids: arr({ type: 'string' }), district: { type: 'string' }, lat: { type: 'number' }, lon: { type: 'number' }, zoom: { type: 'integer' }, whole_city: { type: 'boolean' } } } },
  { name: 'open_place', description: 'Open the details panel for a place (on phones this adds a button the reader can tap).', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'suggest_request', description: 'Show the reader a form to ask the map maintainer to research or add something.', input_schema: { type: 'object', properties: { title: { type: 'string' }, details: { type: 'string' } }, required: ['title', 'details'] } }
];
TOOLS[TOOLS.length - 1].cache_control = { type: 'ephemeral' };

const MAX_PER_MINUTE = 40;
const hits = new Map();

async function creditInfo(env) {
  const loaded = parseFloat(env.CREDIT_LOADED);
  if (!env.ATLAS_KV || !(loaded > 0)) return { tracked: false };
  const spent = parseFloat(await env.ATLAS_KV.get('spent_usd')) || 0;
  const remaining = Math.max(0, loaded - spent);
  const warnBelow = parseFloat(env.LOW_CREDIT_WARNING) || 10;
  return { tracked: true, remaining: Math.round(remaining * 100) / 100, low: remaining < warnBelow, out: remaining <= 0.05 };
}

async function recordSpend(env, u) {
  if (!env.ATLAS_KV || !u) return;
  const pin = parseFloat(env.PRICE_IN) || 2, pout = parseFloat(env.PRICE_OUT) || 10;
  const cost = ((u.input_tokens || 0) * pin + (u.cache_creation_input_tokens || 0) * pin * 1.25 + (u.cache_read_input_tokens || 0) * pin * 0.1 + (u.output_tokens || 0) * pout) / 1e6;
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

// Accept only plain conversation turns, tool calls and tool results, within size limits.
function cleanMessages(list) {
  if (!Array.isArray(list)) return [];
  let out = [];
  for (const m of list.slice(-40)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    if (typeof m.content === 'string') { if (m.content.trim()) out.push({ role: m.role, content: clip(m.content, 4000) }); continue; }
    if (!Array.isArray(m.content)) continue;
    const blocks = [];
    for (const b of m.content.slice(0, 24)) {
      if (!b) continue;
      if (b.type === 'text' && String(b.text || '').trim()) blocks.push({ type: 'text', text: clip(b.text, 4000) });
      else if (b.type === 'tool_use' && m.role === 'assistant') blocks.push({ type: 'tool_use', id: clip(b.id, 100), name: clip(b.name, 64), input: b.input && typeof b.input === 'object' ? b.input : {} });
      else if (b.type === 'tool_result' && m.role === 'user') blocks.push({ type: 'tool_result', tool_use_id: clip(b.tool_use_id, 100), content: clip(typeof b.content === 'string' ? b.content : JSON.stringify(b.content), 6000), is_error: !!b.is_error });
    }
    if (blocks.length) out.push({ role: m.role, content: blocks });
  }
  const startsClean = (m) => m.role === 'user' && (typeof m.content === 'string' || !m.content.some((b) => b.type === 'tool_result'));
  while (out.length && !startsClean(out[0])) out.shift();
  while (JSON.stringify(out).length > 90000 && out.length > 1) {
    out.shift();
    while (out.length && !startsClean(out[0])) out.shift();
  }
  return out;
}

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

    /* ----- chat guide: one step of the agent loop ----- */
    if (body.agent) {
      const owner = env.OWNER_NAME || 'Gordon';
      const msgs = cleanMessages(body.messages);
      if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return json({ error: 'Bad request' }, 400, cors);
      const system = [
        { type: 'text', text: agentSystem(owner, clip(body.catalog, 9000)), cache_control: { type: 'ephemeral' } },
        { type: 'text', text: 'Map state when this step started: ' + clip(body.state, 3000) }
      ];
      const r = await callClaude(env, { max_tokens: 1024, system, tools: TOOLS, messages: msgs });
      if (!r.ok) {
        const err = await r.text();
        if (/credit balance/i.test(err)) return json({ error: 'Out of credit', credit: { tracked: true, remaining: 0, low: true, out: true } }, 402, cors);
        return json({ error: 'AI service error ' + r.status }, 502, cors);
      }
      const data = await r.json();
      await recordSpend(env, data.usage);
      return json({ content: data.content || [], stop_reason: data.stop_reason, credit: await creditInfo(env) }, 200, cors);
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
