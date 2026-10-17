/*
  Tripoli: Open Source — the whole site, behind the family password (Cloudflare Worker).

  - Every page, data file and the AI need the family password. Without it, visitors only
    ever see the login page. The password check happens here, on Cloudflare; nothing in
    the browser can skip it.
  - After a correct password the browser gets a signed cookie for 180 days. Changing
    FAMILY_CODE logs everyone out.
  - Wrong guesses are limited to 8 per 15 minutes per connection.
  - The map files are served from public/ (see wrangler.jsonc); nothing else in the
    repository is ever served.
  - Keeps the Anthropic API key secret: the map never sees it.

  Secrets / variables to set in Cloudflare (see SETUP-AI.md):
    ANTHROPIC_API_KEY  (secret)  your Anthropic API key
    FAMILY_CODE        (secret)  the password family members type once on their phone
    OWNER_CODE         (secret)  your own password for the requests page
    ALLOWED_ORIGINS    (text)    optional, other sites allowed to call the AI (old GitHub Pages copy)
    SESSION_SECRET     (secret)  optional; if missing, one is derived from the other secrets
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

const PLACE_SYSTEM = `You are the research assistant inside "Tripoli: Open Source", a map of Tripoli, Libya, about the Gaddafi era (1969–2011), the history that shaped it and what those places are today. Readers are family members, many of them older, reading on phones.

How to answer:
- Answer the question that was asked, directly, in your first sentence. Never open with caveats about the map data or about what you cannot know.
- Use the archive notes you are given and everything you know about Libya and Tripoli. Be specific: names, units, dates, numbers, streets, buildings. When you give a figure, say roughly when it applies and, if you are confident, who estimated it.
- If the question is general (the army, the Revolutionary Committees, the 1986 raid, life under Gaddafi), answer it properly in general first, then connect it to this place if you can.
- If you need facts that are not in the notes or that may have changed (for example who controls a site today), use web search. Prefer reliable sources: UN, Amnesty, Human Rights Watch, major news agencies, academic work, Libyan official sources.
- Only when a specific detail is genuinely unknown, say so in one short sentence near the end, and give what is known about the surrounding area or the closest comparable case instead.
- Present-day map labels show how a place is named today. Mention that only if it changes the answer.
- Plain words, short paragraphs, about 120–220 words. No headings. Use a short list only when listing several things.
- Never give home addresses or current whereabouts of private individuals, and do not speculate about named private people.
- If the reader writes in Arabic, answer in Arabic.

After your answer, write a line "FOLLOW-UPS:" and then three short follow-up questions the reader might want to ask next, one per line starting with "- ". Make them specific to this place and to what you just said, and different from questions already asked.`;

function agentSystem(owner, catalog) {
  return `You are the guide inside "Tripoli: Open Source", a family history map of Tripoli, Libya, about the Gaddafi era (1969–2011), the history that shaped it and the city today. You can see and control the map, search the document archive and look things up on the web with your tools.

Readers are older family members, often on phones. Your final answer must be plain language, about 80–200 words, with no headings. Answer the question directly first; do not open with caveats.

How to work:
- When the reader asks to see, hide, change or find something, do it with the tools straight away. Tool results tell you what actually changed; check them before answering.
- To show only certain categories, use set_layers with "only". To remove a category, use "hide".
- Use get_map_state if you need to know what is currently shown, and search_places or get_place before giving details about a place.
- For history questions, search the archive (search_archive, get_record) and the area profiles (get_area). Cite documents by title and date. Use web_search for anything not covered, especially present-day facts.
- Use your own knowledge of Libya too; be specific with names, dates and numbers. Only say something is unknown when it genuinely is, and then give the closest known facts.
- When places are relevant to an answer, move the map to them with fly_to.
- If something is not on the map, or you are not confident of the facts, say so and call suggest_request so the reader can ask ${owner}, who maintains the map, to investigate or add it.
- Do not explain your tools or their limits to the reader. Do the task, then tell them briefly what they are now looking at.
- Only say you changed the map if a tool result in this conversation confirms it.

Places on the map (id | name | category | when | summary):
${catalog}

Never invent places, coordinates, documents, names or numbers. Never give home addresses or current whereabouts of private individuals. If the reader writes in Arabic, answer in Arabic.`;
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
  { name: 'search_archive', description: 'Search the document archive (State Department FRUS documents, CIA estimates reprinted in FRUS, UN and NGO reports, reference articles, a chronology of events). Returns ids, titles, dates, sources and short summaries.', input_schema: { type: 'object', properties: { query: { type: 'string' }, place_id: { type: 'string' }, year_from: { type: 'integer' }, year_to: { type: 'integer' }, type: { type: 'string' }, limit: { type: 'integer' } } } },
  { name: 'get_record', description: 'Read one archive record in full: metadata, summary and (when the rights allow) the full text.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'get_area', description: 'Profile of a Tripoli neighbourhood, district, military site or landmark: what it is, its history, the Gaddafi era, today, and sources. Give a name (English or Arabic) or a lat/lon.', input_schema: { type: 'object', properties: { name: { type: 'string' }, lat: { type: 'number' }, lon: { type: 'number' } } } },
  { name: 'open_record', description: 'Open an archive document in the details panel for the reader.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'suggest_request', description: 'Show the reader a form to ask the map maintainer to research or add something.', input_schema: { type: 'object', properties: { title: { type: 'string' }, details: { type: 'string' } }, required: ['title', 'details'] } }
];
TOOLS[TOOLS.length - 1].cache_control = { type: 'ephemeral' };
const WEB_SEARCH = { type: 'web_search_20250305', name: 'web_search', max_uses: 3 };

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
  const cost = (u.searches || 0) * 0.01 + ((u.input_tokens || 0) * pin + (u.cache_creation_input_tokens || 0) * pin * 1.25 + (u.cache_read_input_tokens || 0) * pin * 0.1 + (u.output_tokens || 0) * pout) / 1e6;
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

// Calls Claude with web search available; continues paused turns and falls back without search if it is not enabled.
async function askClaude(env, payload, search) {
  const usage = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, searches: 0 };
  const tools = (payload.tools || []).concat(search ? [WEB_SEARCH] : []);
  let messages = payload.messages.slice(), content = [], data = null;
  for (let round = 0; round < 4; round++) {
    let r = await callClaude(env, { ...payload, messages, tools: tools.length ? tools : undefined });
    if (!r.ok) {
      const err = await r.text();
      if (search && /web_search|web search|not enabled|not available/i.test(err)) return askClaude(env, payload, false);
      return { error: err, status: r.status };
    }
    data = await r.json();
    for (const k of Object.keys(usage)) usage[k] += (data.usage && data.usage[k]) || 0;
    usage.searches += (data.usage && data.usage.server_tool_use && data.usage.server_tool_use.web_search_requests) || 0;
    content = content.concat(data.content || []);
    if (data.stop_reason !== 'pause_turn') break;
    messages = payload.messages.concat([{ role: 'assistant', content }]);
  }
  const sources = [], seen = new Set();
  for (const b of content) for (const c of (b.type === 'text' && b.citations) || []) {
    if (c.url && !seen.has(c.url)) { seen.add(c.url); sources.push({ title: clip(c.title || c.url, 160), url: c.url }); }
  }
  return { content, stop_reason: data && data.stop_reason, usage, sources: sources.slice(0, 8) };
}

function splitFollowups(text) {
  const m = text.split(/\n\s*\**FOLLOW-UPS:?\**\s*\n/i);
  if (m.length < 2) return { text: text.trim(), followups: [] };
  const followups = m[1].split('\n').map((l) => l.replace(/^\s*[-*•\d.)]+\s*/, '').trim()).filter((l) => l.length > 4).slice(0, 3);
  return { text: m[0].trim(), followups };
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

/* ---------- the password gate ---------- */
const COOKIE = 'tos_session';
const SESSION_DAYS = 180;
const MAX_FAILS = 8, FAIL_WINDOW = 900; // 8 wrong passwords per 15 minutes per connection
const failMem = new Map();
const norm = (v) => String(v || '').trim().toLowerCase();
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function sessionKey(env) {
  const material = env.SESSION_SECRET || ('derived:' + (env.ANTHROPIC_API_KEY || '') + ':' + (env.OWNER_CODE || ''));
  return crypto.subtle.importKey('raw', enc.encode(material), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
async function signSession(env, exp) {
  // The family password is part of what is signed, so changing it logs everyone out.
  return hex(await crypto.subtle.sign('HMAC', await sessionKey(env), enc.encode('v1.' + exp + '.' + norm(env.FAMILY_CODE))));
}
function sameText(a, b) {
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
async function sessionOk(request, env) {
  if (!env.FAMILY_CODE) return false;
  const m = (request.headers.get('Cookie') || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=v1\\.(\\d+)\\.([0-9a-f]{64})'));
  if (!m || Number(m[1]) < Date.now()) return false;
  return sameText(m[2], await signSession(env, m[1]));
}
async function failCount(env, ip) {
  if (env.ATLAS_KV) return parseInt(await env.ATLAS_KV.get('fail:' + ip)) || 0;
  const f = failMem.get(ip); return f && Date.now() - f.at < FAIL_WINDOW * 1000 ? f.n : 0;
}
async function noteFail(env, ip) {
  const n = (await failCount(env, ip)) + 1;
  if (env.ATLAS_KV) await env.ATLAS_KV.put('fail:' + ip, String(n), { expirationTtl: FAIL_WINDOW });
  else failMem.set(ip, { n, at: Date.now() });
}
const SECURITY = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff'
};
function safeNext(v) { v = String(v || '/'); return v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/login') ? v : '/'; }
const escHtml = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function loginPage(env, msg, next, status) {
  const owner = escHtml(env.OWNER_NAME || 'Gordon');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#1c2127">
<title>Tripoli: Open Source</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Newsreader:opsz,wght@6..72,600&display=swap">
<style>
:root { color-scheme: dark; }
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body { min-height: 100vh; display: grid; place-items: center; padding: 20px; color: #f6f7f9; font: 18px/1.5 "Atkinson Hyperlegible", system-ui, sans-serif;
  background: radial-gradient(1200px 700px at 30% 20%, #1d2c40 0%, transparent 60%), radial-gradient(900px 600px at 80% 90%, #2a1d33 0%, transparent 60%), #111418; }
.grid { position: fixed; inset: 0; background-image: linear-gradient(rgba(76,144,240,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(76,144,240,.07) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; }
form { position: relative; width: 100%; max-width: 400px; padding: 28px 24px; border-radius: 24px; background: rgba(26,32,40,.55);
  -webkit-backdrop-filter: blur(26px) saturate(1.8); backdrop-filter: blur(26px) saturate(1.8); border: 1px solid rgba(255,255,255,.22);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 18px 50px rgba(0,0,0,.5); display: flex; flex-direction: column; gap: 14px; }
h1 { margin: 0; font: 600 1.8em/1.1 Newsreader, Georgia, serif; }
p { margin: 0; color: #abb3bf; }
label { font-weight: 700; }
input { width: 100%; min-height: 52px; padding: 0 14px; font: inherit; color: inherit; background: rgba(0,0,0,.3); border: 1px solid rgba(255,255,255,.26); border-radius: 14px; }
input:focus-visible, button:focus-visible { outline: 3px solid #fbb360; outline-offset: 2px; }
button { min-height: 52px; font: 700 1em inherit; font-family: inherit; color: #fff; background: rgba(76,144,240,.9); border: 1px solid rgba(190,215,255,.6); border-radius: 14px; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,.5); }
.msg { color: #ffb4b0; font-weight: 700; }
small { color: #abb3bf; }
</style></head>
<body><div class="grid" aria-hidden="true"></div>
<form method="post" action="/login">
  <h1>Tripoli: Open Source</h1>
  <p>Leveraging AI to Map Gaddafi’s Capital of Terror</p>
  ${msg ? `<p class="msg" role="alert">${escHtml(msg)}</p>` : ''}
  <label for="code">Family password</label>
  <input id="code" name="code" type="password" autocomplete="current-password" autocapitalize="none" spellcheck="false" required autofocus>
  <input type="hidden" name="next" value="${escHtml(safeNext(next))}">
  <button type="submit">Open the map</button>
  <small>You only need to do this once on each device. Ask ${owner} if you don’t have the password.</small>
</form></body></html>`;
  return new Response(html, { status: status || 200, headers: { ...SECURITY, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function handleLogin(request, env) {
  const url = new URL(request.url);
  if (request.method !== 'POST') return loginPage(env, '', url.searchParams.get('next'));
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if ((await failCount(env, ip)) >= MAX_FAILS) return loginPage(env, 'Too many wrong tries. Wait 15 minutes, then try again.', '/', 429);
  let form; try { form = await request.formData(); } catch { form = new FormData(); }
  const next = safeNext(form.get('next'));
  if (!env.FAMILY_CODE || norm(form.get('code')) !== norm(env.FAMILY_CODE)) {
    await noteFail(env, ip);
    return loginPage(env, 'That password isn’t right. Try again.', next, 401);
  }
  const exp = Date.now() + SESSION_DAYS * 86400000;
  const cookie = `${COOKIE}=v1.${exp}.${await signSession(env, exp)}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`;
  return new Response(null, { status: 303, headers: { ...SECURITY, Location: next, 'Set-Cookie': cookie, 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/robots.txt') return new Response('User-agent: *\nDisallow: /\n', { headers: { ...SECURITY, 'Content-Type': 'text/plain' } });
    if (path === '/login') return handleLogin(request, env);
    if (path === '/logout') return new Response(null, { status: 303, headers: { ...SECURITY, Location: '/login', 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } });
    if (path === '/api' || request.method === 'POST' || request.method === 'OPTIONS') return api(request, env, url);

    if (!(await sessionOk(request, env))) {
      const wantsPage = request.method === 'GET' && /text\/html/.test(request.headers.get('Accept') || '');
      if (wantsPage) return new Response(null, { status: 303, headers: { ...SECURITY, Location: '/login?next=' + encodeURIComponent(path + url.search), 'Cache-Control': 'no-store' } });
      return new Response('Password required', { status: 401, headers: { ...SECURITY, 'Cache-Control': 'no-store' } });
    }
    if (!env.ASSETS) return new Response('Site files are not connected', { status: 500 });
    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(SECURITY)) out.headers.set(k, v);
    out.headers.set('Cache-Control', /\/(vendor|data\/osm)\//.test(path) ? 'private, max-age=86400' : 'private, no-cache');
    return out;
  }
};

/* ---------- the AI and requests API ---------- */
async function api(request, env, url) {
  const allowed = [url.origin].concat((env.ALLOWED_ORIGINS || 'https://gelnagar.github.io').split(',').map((s) => s.trim()).filter(Boolean));
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
  if (origin && !allowed.includes(origin)) return json({ error: 'Not allowed' }, 403, cors);
  const viaSession = await sessionOk(request, env);
  if (!origin && !viaSession) return json({ error: 'Not allowed' }, 403, cors);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400, cors); }

  /* ----- owner: read and clear requests ----- */
  if (body.owner) {
    const ipo = request.headers.get('CF-Connecting-IP') || 'unknown';
    if ((await failCount(env, ipo)) >= MAX_FAILS) return json({ error: 'Too many wrong passwords. Wait 15 minutes.' }, 429, cors);
    if (!env.OWNER_CODE || norm(request.headers.get('X-Owner-Code')) !== norm(env.OWNER_CODE)) { await noteFail(env, ipo); return json({ error: 'Wrong owner password' }, 401, cors); }
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
  if (!viaSession) {
    const ip0 = request.headers.get('CF-Connecting-IP') || 'unknown';
    if ((await failCount(env, ip0)) >= MAX_FAILS) return json({ error: 'Too many wrong passwords. Wait 15 minutes.' }, 429, cors);
    if (!env.FAMILY_CODE || norm(request.headers.get('X-Family-Code')) !== norm(env.FAMILY_CODE)) { await noteFail(env, ip0); return json({ error: 'Wrong family code' }, 401, cors); }
  }

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
      { type: 'text', text: agentSystem(owner, clip(body.catalog, 14000)), cache_control: { type: 'ephemeral' } },
      { type: 'text', text: 'Map state when this step started: ' + clip(body.state, 3000) }
    ];
    const r = await askClaude(env, { max_tokens: 1400, system, tools: TOOLS, messages: msgs }, true);
    if (r.error) {
      if (/credit balance/i.test(r.error)) return json({ error: 'Out of credit', credit: { tracked: true, remaining: 0, low: true, out: true } }, 402, cors);
      return json({ error: 'AI service error ' + r.status }, 502, cors);
    }
    await recordSpend(env, r.usage);
    const content = [];
    for (const b of r.content) {
      if (b.type === 'text') { const last = content[content.length - 1]; if (last && last.type === 'text') last.text += b.text; else content.push({ type: 'text', text: b.text }); }
      else if (b.type === 'tool_use') content.push(b);
    }
    return json({ content, stop_reason: r.stop_reason, sources: r.sources, credit: await creditInfo(env) }, 200, cors);
  }

  /* ----- a question (and follow-ups) about a place, spot, area or document ----- */
  const question = clip(body.question || 'Why does this place matter?', 600);
  const place = clip(JSON.stringify(body.place || {}), 5000);
  const context = clip(body.context || '', 16000);
  const opening = `Place on the map:\n${place}\n\nArchive notes for this place (from the map's own archive; cite by title when you use them):\n${context || '(none)'}`;
  const hist = Array.isArray(body.history) ? body.history.slice(-5) : [];
  const messages = [];
  hist.forEach((t, i) => {
    const q = clip(t && t.q, 600), a = clip(t && t.a, 3000);
    if (!q || !a) return;
    messages.push({ role: 'user', content: (messages.length ? '' : opening + '\n\nQuestion: ') + q });
    messages.push({ role: 'assistant', content: a });
  });
  messages.push({ role: 'user', content: (messages.length ? '' : opening + '\n\nQuestion: ') + question });
  const r = await askClaude(env, { max_tokens: 1400, system: [{ type: 'text', text: PLACE_SYSTEM, cache_control: { type: 'ephemeral' } }], messages }, body.search !== false);
  if (r.error) {
    if (/credit balance/i.test(r.error)) return json({ error: 'Out of credit', credit: { tracked: true, remaining: 0, low: true, out: true } }, 402, cors);
    return json({ error: 'AI service error ' + r.status }, 502, cors);
  }
  await recordSpend(env, r.usage);
  const raw = r.content.filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
  const parts = splitFollowups(raw);
  return json({ text: parts.text, followups: parts.followups, sources: r.sources, credit: await creditInfo(env) }, 200, cors);
}
