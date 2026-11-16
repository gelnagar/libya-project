/* Offline copy (PRD s10). A service worker that does NOTHING until the visitor presses "Save offline" on the map.
   Then it keeps a copy of the site's public files (the page, scripts, styles, fonts, the map's data) in this browser, and serves
   them only when the network fails. Online, every request goes to the network as before.
   It never touches: /api, /login, /logout, the owner pages (stats, requests, review), the corrections page, anything that is
   not a GET, and anything on another site. Nothing a family member typed or signed in with is ever stored here.
   Not saved: the base-map pictures and the satellite film (they come from other servers or are too large), and the archive
   documents. Offline, the map shows its places and records on a plain background. "Remove offline copy" deletes it all. */
var CACHE = 'atlas-offline-v1';
var PRIVATE = /^\/(api|login|logout|stats|requests|review|corrections)([\/.?]|$)/;

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

function allowed(u) { return u.origin === self.location.origin && !PRIVATE.test(u.pathname); }

self.addEventListener('message', function (e) {
  var d = e.data || {}, port = e.ports && e.ports[0];
  var say = function (m) { if (port) port.postMessage(m); };
  if (d.type === 'save') e.waitUntil(save(d.urls || [], say));
  else if (d.type === 'forget') e.waitUntil(caches.delete(CACHE).then(function () { say({ done: true, removed: true }); }));
  else if (d.type === 'status') e.waitUntil(caches.open(CACHE).then(function (c) { return c.keys(); }).then(function (k) { say({ count: k.length }); }));
});

async function save(urls, say) {
  var cache = await caches.open(CACHE), ok = 0, failed = [], bytes = 0, i = 0;
  for (var raw of urls) {
    i++;
    var u; try { u = new URL(raw, self.location.href); } catch (err) { failed.push(raw); continue; }
    if (!allowed(u)) { failed.push(raw); continue; }
    try {
      var r = await fetch(u.href, { cache: 'reload', credentials: 'omit' });
      if (!r.ok) { failed.push(raw); continue; }
      var copy = r.clone(); bytes += (await r.arrayBuffer()).byteLength; await cache.put(u.href, copy); ok++;
    } catch (err) { failed.push(raw); }
    if (i % 5 === 0) say({ progress: i, total: urls.length });
  }
  say({ done: true, ok: ok, failed: failed, bytes: bytes, total: urls.length });
}

self.addEventListener('fetch', function (e) {
  var req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || !allowed(u) || req.headers.has('range')) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { return c.match(req.url).then(function (had) { if (had) c.put(req.url, copy); }); }); } // keep a saved file fresh
    return res;
  }).catch(async function () {
    var c = await caches.open(CACHE), hit = await c.match(req.url);
    if (!hit && req.mode === 'navigate') hit = await c.match(new URL('index.html', self.location.href).href) || await c.match(new URL('./', self.location.href).href);
    return hit || Response.error();
  }));
});
