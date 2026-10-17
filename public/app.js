(function () {
  'use strict';

  var CFG = window.ATLAS_CONFIG || {};
  var LAYERS = window.ATLAS_LAYERS, LEVELS = window.ATLAS_LEVELS, SITES = window.ATLAS_SITES;
  var QS = window.ATLAS_QUESTIONS || {}, SPOTQ = window.ATLAS_SPOT_QUESTIONS || [], FEATQ = window.ATLAS_FEATURE_QUESTIONS || {};
  var LINKS = window.ATLAS_LINKS || [], UNPLACED = window.ATLAS_UNPLACED || [], DISTRICTS = window.ATLAS_DISTRICTS;
  var OWNER = CFG.ownerName || 'the person who shared this map';
  var HOME = L.latLngBounds([32.79, 13.08], [32.91, 13.30]);
  var DESKTOP = window.matchMedia('(min-width: 900px)');
  var BY_ID = {};
  SITES.forEach(function (s, i) { BY_ID[s.id] = s; s.ref = 'TRP-' + LAYERS[s.layer].code + '-' + String(i + 1).padStart(3, '0'); });

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null) continue;
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function add(parent, child) { if (child) parent.appendChild(child); }
  /* On Cloudflare the whole site sits behind the family password, so the AI is reached on the same
     address and the login cookie does the checking. The old GitHub Pages copy still uses the relay. */
  var GATED = location.protocol !== 'file:' && !/github\.io$/.test(location.hostname);
  if (GATED) CFG.aiEndpoint = '/api';
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('atlas.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('atlas.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var session = {
    get: function (k) { try { return sessionStorage.getItem('atlas.' + k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem('atlas.' + k, v); } catch (e) {} }
  };
  var statusTimer;
  function status(msg, ms) {
    var s = $('status');
    clearTimeout(statusTimer);
    if (!msg) { s.hidden = true; return; }
    s.textContent = msg; s.hidden = false;
    if (ms) statusTimer = setTimeout(function () { s.hidden = true; }, ms);
  }
  function glyph(layerKey, size) {
    var lay = LAYERS[layerKey];
    var g = h('span', { class: 'glyph ' + lay.shape, style: 'background:' + lay.color + (size ? ';width:' + size + 'px;height:' + size + 'px' : '') }, [h('span', { text: lay.code })]);
    return g;
  }
  function km(m) { return m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1) + ' km'; }

  /* ---------- map ---------- */
  var map = L.map('map', { zoomControl: false, preferCanvas: true, maxZoom: 19, minZoom: 9 });
  L.control.zoom({ position: 'topright' }).addTo(map);
  L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);
  map.fitBounds(HOME);

  var OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  var ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
  var BASEMAPS = {
    dark: { name: 'Dark', note: 'Night view', layers: [
      L.tileLayer(ESRI + 'Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, maxZoom: 19, attribution: 'Basemap &copy; Esri, HERE, Garmin, ' + OSM_ATTR }),
      L.tileLayer(ESRI + 'Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, maxZoom: 19 })
    ] },
    satellite: { name: 'Satellite', note: 'Photos from above', layers: [
      L.tileLayer(ESRI + 'World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 18, maxZoom: 19, attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics' }),
      L.tileLayer(ESRI + 'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 18, maxZoom: 19 })
    ] },
    street: { name: 'Streets', note: 'Roads & buildings', layers: [L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: OSM_ATTR })] },
    terrain: { name: 'Terrain', note: 'Hills, wadis, coast', layers: [L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { subdomains: 'abc', maxNativeZoom: 17, maxZoom: 19, attribution: OSM_ATTR + ', SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a>' })] }
  };
  var currentBase = null;
  function setBase(key) {
    if (!BASEMAPS[key]) key = 'dark';
    if (currentBase) BASEMAPS[currentBase].layers.forEach(function (l) { map.removeLayer(l); });
    BASEMAPS[key].layers.forEach(function (l) { l.addTo(map); });
    currentBase = key; store.set('base', key);
    document.querySelectorAll('#basemaps button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.key === key ? 'true' : 'false'); });
  }
  Object.keys(BASEMAPS).forEach(function (k) {
    var tz = 12, tx = Math.floor((13.19 + 180) / 360 * Math.pow(2, tz)), la = 32.885 * Math.PI / 180,
        ty = Math.floor((1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2 * Math.pow(2, tz));
    var tile = { dark: ESRI + 'Canvas/World_Dark_Gray_Base/MapServer/tile/' + tz + '/' + ty + '/' + tx,
      satellite: ESRI + 'World_Imagery/MapServer/tile/' + tz + '/' + ty + '/' + tx,
      street: 'https://tile.openstreetmap.org/' + tz + '/' + tx + '/' + ty + '.png',
      terrain: 'https://a.tile.opentopomap.org/' + tz + '/' + tx + '/' + ty + '.png' }[k];
    $('basemaps').appendChild(h('button', { 'data-key': k, 'aria-pressed': 'false', onclick: function () { setBase(k); } },
      [h('span', { class: 'thumb', style: 'background-image:url(' + tile + ')' }), h('span', { class: 'nm', text: BASEMAPS[k].name }), h('small', { text: BASEMAPS[k].note })]));
  });

  /* ---------- state ---------- */
  var DEFAULT_ON = { detention: true, security: true, military: true, airstrike: true, massacre: true, power: true, landmark: true, districts: true, rings: true, labels: true, grid: true, timeline: true };
  var active = Object.assign({}, DEFAULT_ON, store.get('layers3', {}));
  var PERIODS = { pre: 'Before 1969', main: '1969–1989', post: 'After 1989' };
  var periods = Object.assign({ pre: true, main: true, post: true }, store.get('periods', {}));
  function save() { store.set('layers3', active); store.set('periods', periods); }

  function span(s) {
    var a = s.y0 == null ? 1969 : s.y0, b = s.y1 == null ? (s.y0 == null ? 1989 : s.y0) : s.y1;
    return [a, b];
  }
  function inPeriod(s) {
    var r = span(s);
    return (periods.pre && r[0] < 1969) || (periods.main && r[0] <= 1989 && r[1] >= 1969) || (periods.post && r[1] > 1989);
  }
  function visible(s) { return !!active[s.layer] && inPeriod(s); }

  /* ---------- historical markers ---------- */
  var siteLayer = L.layerGroup().addTo(map), ringLayer = L.layerGroup().addTo(map), linkLayer = L.layerGroup().addTo(map);
  var markers = {}, rings = {};

  // Spread markers that share a spot so each stays tappable (screen offset only; position unchanged).
  var spots = {};
  SITES.forEach(function (s) { var k = s.lat.toFixed(3) + ',' + s.lon.toFixed(3); (spots[k] = spots[k] || []).push(s); });
  Object.keys(spots).forEach(function (k) {
    var g = spots[k];
    g.forEach(function (s, i) {
      if (g.length < 2) { s.dx = 0; s.dy = 0; return; }
      var a = -Math.PI / 2 + i * 2 * Math.PI / g.length;
      s.dx = Math.round(Math.cos(a) * 20); s.dy = Math.round(Math.sin(a) * 20);
    });
  });

  SITES.forEach(function (s) {
    var lay = LAYERS[s.layer];
    var icon = L.divIcon({ className: '', iconSize: [32, 32], iconAnchor: [16 - s.dx, 16 - s.dy],
      html: '<div class="mk ' + lay.shape + ' v-' + s.level + '" style="--c:' + lay.color + '"><b>' + lay.code + '</b></div>' });
    markers[s.id] = L.marker([s.lat, s.lon], { icon: icon, title: s.name, keyboard: true, riseOnHover: true })
      .bindTooltip(s.name, { permanent: true, direction: 'right', offset: [18 + s.dx, s.dy], className: 'site-label', interactive: false })
      .on('click', function () { openSite(s); });
    rings[s.id] = L.circle([s.lat, s.lon], { radius: s.r * 1000, color: lay.color, weight: 1.2, dashArray: '5 5', fillColor: lay.color, fillOpacity: 0.03, interactive: false });
  });

  var districtLayer = L.layerGroup();
  DISTRICTS.forEach(function (d) {
    L.marker([d[2], d[3]], { keyboard: false, title: 'About ' + d[0],
      icon: L.divIcon({ className: '', iconSize: [160, 34], iconAnchor: [80, 17], html: '<div class="district">' + d[0] + '<span>' + d[1] + '</span></div>' }) })
      .on('click', function () { var a = areaByName(d[0]) || areaByName(d[1]); if (a) openArea(a); else openSpot(L.latLng(d[2], d[3])); }).addTo(districtLayer);
  });

  var gridLayer = L.layerGroup();
  (function () {
    var st = { color: '#4c90f0', weight: 1, opacity: 0.16, interactive: false };
    for (var lat = 32.55; lat <= 33.0001; lat += 0.05) L.polyline([[lat, 12.8], [lat, 13.6]], st).addTo(gridLayer);
    for (var lon = 12.8; lon <= 13.6001; lon += 0.05) L.polyline([[32.5, lon], [33.05, lon]], st).addTo(gridLayer);
  })();

  function refresh() {
    SITES.forEach(function (s) {
      var on = visible(s);
      if (on) { if (!siteLayer.hasLayer(markers[s.id])) siteLayer.addLayer(markers[s.id]); }
      else siteLayer.removeLayer(markers[s.id]);
      if (on && active.rings) { if (!ringLayer.hasLayer(rings[s.id])) ringLayer.addLayer(rings[s.id]); }
      else ringLayer.removeLayer(rings[s.id]);
    });
    if (active.districts) districtLayer.addTo(map); else map.removeLayer(districtLayer);
    if (active.grid) gridLayer.addTo(map); else map.removeLayer(gridLayer);
    $('timeline').hidden = !active.timeline;
    document.body.classList.toggle('no-timeline', !active.timeline);
    zoomClasses();
    drawTimeline();
    if (selected) markSelected(selected);
    save();
  }
  function zoomClasses() {
    var z = map.getZoom(), el = map.getContainer();
    el.classList.toggle('hide-labels', !active.labels || z < 14);
    el.classList.toggle('hide-districts', z < 12);
    el.classList.toggle('hide-osm-icons', z < 13);
  }
  map.on('zoomend', zoomClasses);

  /* ---------- layer panel ---------- */
  var inputs = {};
  function toggleRow(key, label, note, checked, onchange, lead, count) {
    var input = h('input', { type: 'checkbox', id: 'tg-' + key });
    input.checked = !!checked;
    input.addEventListener('change', function () { onchange(input.checked); });
    inputs[key] = input;
    return h('label', { class: 'toggle', for: 'tg-' + key }, [input, lead || null, h('span', { class: 't' }, [label, note ? h('small', { text: note }) : null]), count != null ? h('span', { class: 'n', text: String(count) }) : null]);
  }
  var NOTES = {
    detention: 'Prisons and interrogation sites', security: 'Security service and police buildings',
    military: 'Bases and training sites', airstrike: 'The April 1986 US raid', massacre: 'Mass killings in Tripoli’s history',
    power: 'Bab al-Aziziya and the old royal palace', landmark: 'Squares, campuses and events'
  };
  Object.keys(LAYERS).forEach(function (k) {
    var n = SITES.filter(function (s) { return s.layer === k; }).length;
    $('hist-toggles').appendChild(toggleRow(k, LAYERS[k].label, NOTES[k], active[k], function (v) { active[k] = v; refresh(); }, glyph(k), n));
  });
  [['districts', 'District names', 'English and Arabic, approximate'],
   ['rings', 'Uncertainty rings', 'How far off each marker could be'],
   ['labels', 'Place names on markers', 'Shown when zoomed in'],
   ['grid', 'Coordinate grid', 'Lines every 0.05°'],
   ['timeline', 'Timeline bar', 'Computer screens only']].forEach(function (d) {
    $('display-toggles').appendChild(toggleRow(d[0], d[1], d[2], active[d[0]], function (v) { active[d[0]] = v; refresh(); }));
  });
  /* historical map overlays (see archive/maps/overlays.json) */
  var OVERLAYS = window.ATLAS_OVERLAYS || [], overlayLayers = {}, overlayOn = store.get('omaps', {}), overlayOpacity = store.get('omapsOp', {});
  function syncYearBadge() {
    var on = OVERLAYS.filter(function (o) { return overlayOn[o.id]; });
    $('yearbadge').hidden = !on.length;
    $('yearbadge').textContent = on.map(function (o) { return o.year + ' map'; }).join(' · ');
  }
  function markHistButton() { var b = document.querySelector('#basemaps [data-key="historical"]'); if (b) b.setAttribute('aria-pressed', OVERLAYS.some(function (o) { return overlayOn[o.id]; }) ? 'true' : 'false'); }
  function setOverlay(id, on) {
    var o = OVERLAYS.filter(function (x) { return x.id === id; })[0]; if (!o) return false;
    overlayOn[id] = !!on; store.set('omaps', overlayOn);
    if (!overlayLayers[id]) overlayLayers[id] = L.tileLayer(o.tiles, { bounds: L.latLngBounds(o.bounds), minZoom: 9, maxNativeZoom: o.maxZoom, maxZoom: 19, opacity: overlayOpacity[id] != null ? overlayOpacity[id] : 0.85, attribution: o.attribution, zIndex: 50 });
    if (on) overlayLayers[id].addTo(map); else map.removeLayer(overlayLayers[id]);
    if (inputs['om-' + id]) inputs['om-' + id].checked = !!on;
    syncYearBadge(); markHistButton();
    if (typeof setSwipe === 'function' && swipeOn) setSwipe(true);
    return true;
  }
  /* swipe: drag a handle across the map to compare an old map with today */
  var swipeOn = false, swipeX = 0.5, swipeEl = null;
  function clipOverlays() {
    Object.keys(overlayLayers).forEach(function (id) {
      var c = overlayLayers[id].getContainer && overlayLayers[id].getContainer(); if (!c) return;
      if (!swipeOn || !overlayOn[id]) { c.style.clip = ''; return; }
      var nw = map.containerPointToLayerPoint([0, 0]), se = map.containerPointToLayerPoint(map.getSize());
      var x = nw.x + map.getSize().x * swipeX;
      c.style.clip = 'rect(' + [nw.y, x, se.y, nw.x].join('px,') + 'px)';
    });
    if (swipeEl) swipeEl.style.left = (swipeX * 100) + '%';
  }
  function setSwipe(on) {
    swipeOn = on && OVERLAYS.some(function (o) { return overlayOn[o.id]; });
    if (swipeOn && !swipeEl) {
      swipeEl = h('div', { class: 'swipe', role: 'slider', 'aria-label': 'Compare old map with today', 'aria-valuemin': '0', 'aria-valuemax': '100', tabindex: '0' }, [h('span', { class: 'swipe-l', text: 'Then' }), h('span', { class: 'swipe-r', text: 'Now' })]);
      map.getContainer().appendChild(swipeEl);
      L.DomEvent.disableClickPropagation(swipeEl);
      var drag = function (e) { var r = map.getContainer().getBoundingClientRect(), cx = (e.touches ? e.touches[0].clientX : e.clientX); swipeX = Math.max(0.02, Math.min(0.98, (cx - r.left) / r.width)); swipeEl.setAttribute('aria-valuenow', Math.round(swipeX * 100)); clipOverlays(); };
      var stop = function () { document.removeEventListener('pointermove', drag); document.removeEventListener('pointerup', stop); map.dragging.enable(); };
      swipeEl.addEventListener('pointerdown', function (e) { e.preventDefault(); map.dragging.disable(); document.addEventListener('pointermove', drag); document.addEventListener('pointerup', stop); });
      swipeEl.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { swipeX = Math.max(0.02, Math.min(0.98, swipeX + (e.key === 'ArrowLeft' ? -0.05 : 0.05))); clipOverlays(); e.preventDefault(); } });
    }
    if (swipeEl) swipeEl.hidden = !swipeOn;
    if (inputs['swipe']) inputs['swipe'].checked = swipeOn;
    clipOverlays();
  }
  map.on('move zoom resize viewreset zoomend moveend', clipOverlays);
  if (OVERLAYS.length) {
    var hb = h('button', { 'data-key': 'historical', style: 'grid-column:1 / -1', 'aria-pressed': 'false', 'aria-haspopup': 'dialog', onclick: function () { $('hist-modal').hidden = false; $('hist-close').focus(); } },
      [h('span', { class: 'thumb', style: 'background:#14171c url(img/federation-1971.jpg) 60% 40% / cover no-repeat;height:170px' }), h('span', { class: 'nm', text: 'Historical' }), h('small', { text: 'Old maps and satellite, 1943–1990' })]);
    $('basemaps').appendChild(hb);
    var closeHist = function () { $('hist-modal').hidden = true; };
    $('hist-close').onclick = closeHist;
    (function () {
      var box = $('hist-modal').querySelector('.modal-box'), head = box.querySelector('.panel-head'), dx = 0, dy = 0, sx, sy, ox, oy;
      var move = function (e) { dx = ox + e.clientX - sx; dy = oy + e.clientY - sy; box.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; };
      var up = function () { head.classList.remove('dragging'); document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); };
      head.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; e.preventDefault(); sx = e.clientX; sy = e.clientY; ox = dx; oy = dy; head.classList.add('dragging'); document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); });
    })();
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('hist-modal').hidden) closeHist(); });
    OVERLAYS.forEach(function (o) {
      var cb = h('input', { type: 'checkbox', id: 'om-' + o.id }); inputs['om-' + o.id] = cb;
      var rng = h('input', { type: 'range', min: '0.2', max: '1', step: '0.05', value: String(overlayOpacity[o.id] != null ? overlayOpacity[o.id] : 0.85), 'aria-label': 'See-through amount for the ' + o.year + ' map' });
      cb.addEventListener('change', function () { setOverlay(o.id, cb.checked); if (cb.checked && !map.getBounds().intersects(o.bounds)) map.flyToBounds(o.bounds, { duration: 0.8 }); });
      rng.addEventListener('input', function () { overlayOpacity[o.id] = +rng.value; store.set('omapsOp', overlayOpacity); if (overlayLayers[o.id]) overlayLayers[o.id].setOpacity(+rng.value); });
      $('old-maps').appendChild(h('div', { class: 'omap' }, [
        h('label', { class: 'row', for: 'om-' + o.id }, [cb, h('span', { class: 't' }, [o.title, h('small', { text: o.note || o.source })]), h('span', { class: 'yr', text: String(o.year) })]),
        h('div', { class: 'op' }, [h('span', { text: 'See-through' }), rng])
      ]));
      if (overlayOn[o.id]) setOverlay(o.id, true);
    });
    $('old-maps').appendChild(toggleRow('swipe', 'Compare with today', 'Drag the handle across the map: old map on the left, today on the right', false, function (v) { setSwipe(v); }));
  }
  Object.keys(PERIODS).forEach(function (k) {
    var b = h('button', { 'aria-pressed': periods[k] ? 'true' : 'false', 'data-k': k, text: PERIODS[k] });
    b.addEventListener('click', function () { periods[k] = !periods[k]; b.setAttribute('aria-pressed', periods[k] ? 'true' : 'false'); refresh(); });
    $('periods').appendChild(b);
  });
  function ensureVisible(s) {
    var changed = false;
    if (!active[s.layer]) { active[s.layer] = true; inputs[s.layer].checked = true; changed = true; }
    if (!inPeriod(s)) {
      var r = span(s), k = r[0] < 1969 ? 'pre' : r[0] > 1989 ? 'post' : 'main';
      periods[k] = true; document.querySelector('#periods [data-k="' + k + '"]').setAttribute('aria-pressed', 'true'); changed = true;
    }
    if (changed) refresh();
  }

  SITES.slice().sort(function (a, b) { return (a.y0 == null ? 9999 : a.y0) - (b.y0 == null ? 9999 : b.y0); }).forEach(function (s) {
    $('places').appendChild(h('button', { onclick: function () { focusSite(s); } }, [h('span', { class: 'yr', text: s.y0 == null ? '—' : String(s.y0) }), glyph(s.layer), h('span', { text: s.name })]));
  });
  UNPLACED.forEach(function (u) {
    $('unplaced').appendChild(h('div', {}, [h('b', { text: u.name }), h('span', { text: u.when + '. ' }), u.text, u.src ? h('span', {}, [' ', h('a', { href: u.src.u, target: '_blank', rel: 'noopener', text: 'Source' })]) : null]));
  });

  function focusSite(s) {
    ensureVisible(s);
    map.flyTo([s.lat, s.lon], Math.max(map.getZoom(), 14), { duration: 0.8 });
    openSite(s);
  }

  /* ---------- timeline (desktop) ---------- */
  function tx(y) {
    if (y < 1969) return 0.14 * Math.max(0, y - 1905) / 64;
    if (y <= 1989) return 0.14 + 0.72 * (y - 1969) / 20;
    return 0.86 + 0.14 * (Math.min(y, 2012) - 1989) / 23;
  }
  function pos(f) { return 'calc(14px + ' + f.toFixed(4) + ' * (100% - 28px))'; }
  function drawTimeline() {
    var tl = $('timeline');
    tl.querySelectorAll('.tl-axis,.tl-band,.tl-tick,.tl-dot,.tl-bar,.tl-hint').forEach(function (e) { e.remove(); });
    var W = Math.max(200, tl.clientWidth - 28);
    var yearX = function (y) { return tx(y) * W; };
    /* documents per year, drawn as bars behind the events; tap a bar to search that year */
    if (RECORDS) {
      var counts = {}, max = 1;
      RECORDS.forEach(function (r) { var y = +(r.d || '0').slice(0, 4); if (y >= 1905 && y <= 2011 && r.y !== 'event') { counts[y] = (counts[y] || 0) + 1; if (counts[y] > max) max = counts[y]; } });
      Object.keys(counts).forEach(function (k) {
        var y = +k, left = yearX(y), w = Math.max(3, yearX(y + 1) - left - 2);
        tl.appendChild(h('button', { class: 'tl-bar', title: y + ': ' + counts[y] + ' document' + (counts[y] === 1 ? '' : 's') + '. Tap to search.', 'aria-label': y + ', ' + counts[y] + ' documents',
          style: 'left:' + (14 + left).toFixed(1) + 'px;width:' + w.toFixed(1) + 'px;height:' + Math.max(3, Math.round(46 * Math.sqrt(counts[y] / max))) + 'px', onclick: function () { openTerm(String(y)); } }));
      });
    }
    tl.appendChild(h('div', { class: 'tl-axis' }));
    tl.appendChild(h('div', { class: 'tl-band', style: 'left:' + pos(tx(1969)) + ';width:calc(' + (tx(1989) - tx(1969)).toFixed(4) + ' * (100% - 28px))' }));
    [1911, 1945, 1969, 1974, 1979, 1984, 1989, 1996, 2011].forEach(function (y) { tl.appendChild(h('div', { class: 'tl-tick', style: 'left:' + pos(tx(y)), text: String(y) })); });
    var stack = {};
    SITES.filter(function (s) { return s.y0 != null && visible(s); }).sort(function (a, b) { return a.y0 - b.y0; }).forEach(function (s) {
      var lay = LAYERS[s.layer], n = stack[s.y0] = (stack[s.y0] || 0) + 1;
      tl.appendChild(h('button', { class: 'tl-dot ' + lay.shape + (selected === s.id ? ' sel' : ''), title: s.y0 + ' · ' + s.name, 'aria-label': s.y0 + ', ' + s.name,
        style: 'left:calc(' + pos(tx(s.y0)).slice(5, -1) + ' + ' + (Math.floor((n - 1) / 4) * 14) + 'px);bottom:' + (30 + ((n - 1) % 4) * 13) + 'px;background:' + lay.color, onclick: function () { focusSite(s); } }));
    });
    tl.appendChild(h('div', { class: 'tl-hint', text: 'Dots: places on the map. Bars: documents per year (tap one to search it).' }));
  }
  window.addEventListener('resize', function () { clearTimeout(drawTimeline.t); drawTimeline.t = setTimeout(drawTimeline, 150); });

  /* ---------- HUD ---------- */
  function hud(ll) {
    $('hud').innerHTML = 'LAT <b>' + ll.lat.toFixed(5) + '°N</b> · LON <b>' + ll.lng.toFixed(5) + '°E</b> · ZOOM <b>' + map.getZoom() + '</b>';
  }
  map.on('mousemove', function (e) { hud(e.latlng); });
  map.on('moveend', function () { hud(map.getCenter()); });

  /* ---------- present-day OpenStreetMap layers ----------
     Zones, military, water and oil come from files saved monthly in data/osm (fast).
     Buildings, and any layer whose file is missing, are fetched live from Overpass,
     racing several public servers and using whichever answers first. */
  var OSM = {
    landuse: { label: 'Residential, commercial & industrial zones', minZoom: 11, note: 'Grey homes, blue shops, orange industry', saved: true,
      q: function (b) { return '(way["landuse"~"^(residential|commercial|retail|industrial)$"](' + b + ');relation["landuse"~"^(residential|commercial|retail|industrial)$"](' + b + '););out geom 4000;'; },
      style: function (t) { var c = { residential: '#8f99a8', commercial: '#68c1ee', retail: '#68c1ee', industrial: '#ec9a3c' }[t.landuse] || '#8f99a8'; return { color: c, weight: 1, fillColor: c, fillOpacity: 0.18 }; }, swatch: '#8f99a8' },
    buildings: { label: 'Buildings', minZoom: 16, note: 'Zoom in close; appears area by area', saved: false,
      q: function (b) { return 'way["building"](' + b + ');out geom 2500;'; },
      style: function () { return { color: '#c5cbd3', weight: 0.6, fillColor: '#8f99a8', fillOpacity: 0.35 }; }, swatch: '#c5cbd3' },
    military: { label: 'Military areas (today)', minZoom: 9, note: 'Areas tagged military now', saved: true,
      q: function (b) { return '(way["landuse"="military"](' + b + ');relation["landuse"="military"](' + b + ');way["military"](' + b + ');node["military"](' + b + '););out geom 1500;'; },
      style: function () { return { color: '#ec9a3c', weight: 2, dashArray: '6 4', fillColor: '#ec9a3c', fillOpacity: 0.08 }; }, point: '#ec9a3c' },
    water: { label: 'Water wells, towers & reservoirs', minZoom: 9, note: 'Water infrastructure', saved: true,
      q: function (b) { return '(node["man_made"~"^(water_well|water_tower|water_works|reservoir_covered)$"](' + b + ');way["man_made"~"^(water_tower|water_works|reservoir_covered)$"](' + b + ');way["landuse"="reservoir"](' + b + '););out geom 1500;'; },
      style: function () { return { color: '#4c90f0', weight: 1.5, fillColor: '#4c90f0', fillOpacity: 0.3 }; }, point: '#4c90f0' },
    oil: { label: 'Oil & gas wells, depots, refineries', minZoom: 9, note: 'Few in Tripoli itself', saved: true,
      q: function (b) { return '(node["man_made"="petroleum_well"](' + b + ');way["man_made"="petroleum_well"](' + b + ');way["industrial"~"^(oil|refinery|fuel)$"](' + b + ');node["industrial"~"^(oil|refinery)$"](' + b + ');way["man_made"="storage_tank"]["content"~"oil|fuel|petrol|gas"](' + b + '););out geom 1500;'; },
      style: function () { return { color: '#d0b090', weight: 1.5, fillColor: '#d0b090', fillOpacity: 0.3 }; }, point: '#d0b090' }
  };
  var OSM_ICONS = {
    military: '<path d="M12 2 4 5v6c0 5.2 3.4 9.4 8 11 4.6-1.6 8-5.8 8-11V5z"/>',
    water: '<path d="M12 2s-7 8-7 12.5a7 7 0 0 0 14 0C19 10 12 2 12 2z"/>',
    oil: '<path fill-rule="evenodd" d="M12 2 5 22h3l1.5-5h5l1.5 5h3zm-1.8 12.5L12 8.5l1.8 6z"/>'
  };
  function osmIconHtml(k) { return '<div class="osm-ic" style="--c:' + OSM[k].point + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + OSM_ICONS[k] + '</svg></div>'; }
  function osmIcon(k) { return L.divIcon({ className: '', iconSize: [26, 26], iconAnchor: [13, 13], html: osmIconHtml(k) }); }
  var ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
  var osmActive = store.get('osm', {});
  var osmGroups = {}, osmCache = {}, osmAbort = {}, savedData = {}, savedState = {};
  var canvas = L.canvas({ padding: 0.4 });
  Object.keys(OSM).forEach(function (k) {
    osmGroups[k] = L.layerGroup();
    var o = OSM[k];
    var sw = OSM_ICONS[k] ? h('span', { class: 'glyph', html: osmIconHtml(k) }) : h('span', { class: 'glyph square', style: 'background:' + (o.point || o.swatch) });
    $('osm-toggles').appendChild(toggleRow('osm-' + k, o.label, o.note, osmActive[k], function (v) {
      osmActive[k] = v; store.set('osm', osmActive);
      if (!v) { map.removeLayer(osmGroups[k]); if (osmAbort[k]) osmAbort[k].abort(); if (k !== 'buildings' && (!o.saved || savedState[k] === 'missing')) osmGroups[k].clearLayers(); }
      refreshOSM(true);
    }, sw));
  });
  function bboxKey() {
    var b = map.getBounds().pad(0.1);
    function r(n) { return Math.round(n * 200) / 200; }
    return [r(b.getSouth()), r(b.getWest()), r(b.getNorth()), r(b.getEast())].join(',');
  }
  function overpass(query, signal) {
    var ctrls = ENDPOINTS.map(function () { return new AbortController(); });
    function stopAll(except) { ctrls.forEach(function (c, i) { if (i !== except) c.abort(); }); }
    if (signal) signal.addEventListener('abort', function () { stopAll(-1); });
    var timer = setTimeout(function () { stopAll(-1); }, 30000);
    var tries = ENDPOINTS.map(function (url, i) {
      return fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent('[out:json][timeout:25];' + query), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctrls[i].signal })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) { stopAll(i); return j; });
    });
    return Promise.any(tries)
      .then(function (j) { clearTimeout(timer); return j; })
      .catch(function () { clearTimeout(timer); var e = new Error('All map servers failed'); if (signal && signal.aborted) e.name = 'AbortError'; throw e; });
  }
  // Expand the compact saved format into the same shape Overpass returns.
  function expand(f) {
    var id = f.i, tags = f.t || {};
    if (f.k === 'n') return { type: 'node', id: id, tags: tags, lat: f.p[0], lon: f.p[1] };
    var minlat = 90, maxlat = -90, minlon = 180, maxlon = -180;
    f.g.forEach(function (ring) { ring.forEach(function (p) { if (p[0] < minlat) minlat = p[0]; if (p[0] > maxlat) maxlat = p[0]; if (p[1] < minlon) minlon = p[1]; if (p[1] > maxlon) maxlon = p[1]; }); });
    var bounds = { minlat: minlat, maxlat: maxlat, minlon: minlon, maxlon: maxlon };
    var geo = function (ring) { return ring.map(function (p) { return { lat: p[0], lon: p[1] }; }); };
    if (f.k === 'w') return { type: 'way', id: id, tags: tags, geometry: geo(f.g[0]), bounds: bounds };
    return { type: 'relation', id: id, tags: tags, bounds: bounds, members: f.g.map(function (ring) { return { role: 'outer', geometry: geo(ring) }; }) };
  }
  function loadSaved(k) {
    if (savedState[k]) return savedState[k] === 'loading' ? null : savedData[k];
    savedState[k] = 'loading';
    status('Loading ' + OSM[k].label.toLowerCase() + '…');
    fetch('data/osm/' + k + '.json', { cache: 'force-cache' })
      .then(function (r) { if (!r.ok) throw new Error('missing'); return r.json(); })
      .then(function (j) {
        savedData[k] = { elements: (j.features || []).map(expand), generated: j.generated };
        savedState[k] = 'ready';
        drawOSM(k, savedData[k]);
        status(savedData[k].elements.length ? null : 'No ' + OSM[k].label.toLowerCase() + ' mapped around Tripoli.', 3000);
        refreshOSM(true);
      })
      .catch(function () { savedState[k] = 'missing'; refreshOSM(true); });
    return null;
  }
  function drawOSM(k, data) {
    var o = OSM[k], g = osmGroups[k];
    g.clearLayers();
    (data.elements || []).forEach(function (el) {
      var t = el.tags || {}, shape = null;
      var center = null;
      if (el.type === 'node') {
        shape = OSM_ICONS[k] ? L.marker([el.lat, el.lon], { icon: osmIcon(k), keyboard: false, title: KIND[k](t) })
          : L.circleMarker([el.lat, el.lon], { renderer: canvas, radius: 7, color: '#111418', weight: 2, fillColor: o.point || '#fff', fillOpacity: 1 });
      } else if (el.type === 'way' && el.geometry) {
        var pts = el.geometry.map(function (p) { return [p.lat, p.lon]; });
        var closed = pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
        shape = closed ? L.polygon(pts, Object.assign({ renderer: canvas }, o.style(t))) : L.polyline(pts, Object.assign({ renderer: canvas }, o.style(t), { fill: false }));
      } else if (el.type === 'relation' && el.members) {
        var rs = el.members.filter(function (m) { return m.geometry && m.role !== 'inner'; }).map(function (m) { return m.geometry.map(function (p) { return [p.lat, p.lon]; }); });
        if (rs.length) shape = L.polygon(rs, Object.assign({ renderer: canvas }, o.style(t)));
      }
      if (shape) {
        var open = function (ev) { L.DomEvent.stop(ev); if (picking) { openSpot(ev.latlng); return; } openFeature(k, el); };
        shape.on('click', open); shape.addTo(g);
        if (OSM_ICONS[k] && el.type !== 'node') {
          var pts2 = el.type === 'way' ? el.geometry : [].concat.apply([], el.members.filter(function (m) { return m.geometry; }).map(function (m) { return m.geometry; }));
          if (pts2.length) {
            center = L.latLngBounds(pts2.map(function (p) { return [p.lat, p.lon]; })).getCenter();
            L.marker(center, { icon: osmIcon(k), keyboard: false, title: KIND[k](t), zIndexOffset: -500 }).on('click', open).addTo(g);
          }
        }
      }
    });
  }
  var osmTimer;
  function refreshOSM(now) {
    clearTimeout(osmTimer);
    osmTimer = setTimeout(function () {
      var z = map.getZoom(), key = bboxKey(), loading = false, tooFar = [];
      Object.keys(OSM).forEach(function (k) {
        var o = OSM[k], g = osmGroups[k];
        if (k === 'buildings') { if (refreshBuildings()) loading = true; else if (osmActive[k] && z < o.minZoom) tooFar.push('buildings'); return; }
        if (!osmActive[k]) { map.removeLayer(g); return; }
        if (z < o.minZoom) { map.removeLayer(g); tooFar.push(o.label.split(',')[0].split(' (')[0].toLowerCase()); return; }
        if (!map.hasLayer(g)) g.addTo(map);
        if (o.saved && savedState[k] !== 'missing') { var d = loadSaved(k); if (!d) loading = true; else if (!g.getLayers().length) drawOSM(k, d); return; }
        var ck = k + '|' + key;
        if (osmCache[ck]) { drawOSM(k, osmCache[ck]); return; }
        if (osmAbort[k]) osmAbort[k].abort();
        var ac = new AbortController(); osmAbort[k] = ac;
        loading = true;
        status('Loading ' + o.label.toLowerCase() + '… this can take up to 20 seconds.');
        overpass(o.q(key), ac.signal).then(function (data) {
          osmCache[ck] = data;
          if (osmActive[k]) drawOSM(k, data);
          status((data.elements || []).length ? null : 'No ' + o.label.toLowerCase() + ' mapped in this area.', 3000);
        }).catch(function (e) {
          if (e.name === 'AbortError') return;
          status('The OpenStreetMap servers are busy, so ' + o.label.toLowerCase() + ' could not load. Move the map a little to try again.', 6000);
        });
      });
      if (!loading && tooFar.length) status('Zoom in to see ' + tooFar.join(', ') + '.', 3500);
    }, now === true ? 0 : 500);
  }
  map.on('moveend', function () { refreshOSM(); });
  /* ---------- buildings: loaded in ~1 km squares, drawn as each arrives ---------- */
  var TILE = 0.01, bTiles = {}, bQueue = [], bRunning = 0, bTotal = 0, bDone = 0, bCacheName = 'atlas-buildings-v1';
  function tileKey(i, j) { return i + '_' + j; }
  function tileBox(i, j) { var s = i * TILE, w = j * TILE; return [s.toFixed(3), w.toFixed(3), (s + TILE).toFixed(3), (w + TILE).toFixed(3)].join(','); }
  function cacheGet(key) {
    if (!window.caches) return Promise.resolve(null);
    return caches.open(bCacheName).then(function (c) { return c.match('https://atlas.local/b/' + key); }).then(function (r) { return r ? r.json() : null; }).catch(function () { return null; });
  }
  function cachePut(key, data) {
    if (!window.caches) return;
    try { caches.open(bCacheName).then(function (c) { return c.put('https://atlas.local/b/' + key, new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })); }).catch(function () {}); } catch (e) {}
  }
  function slimBuildings(data) {
    return { elements: (data.elements || []).filter(function (e) { return e.type === 'way' && e.geometry; }).map(function (e) {
      var t = {}; ['building', 'name', 'name:en', 'name:ar', 'building:levels', 'amenity'].forEach(function (k) { if (e.tags && e.tags[k]) t[k] = e.tags[k]; });
      return { type: 'way', id: e.id, tags: t, bounds: e.bounds, geometry: e.geometry.map(function (p) { return { lat: Math.round(p.lat * 1e5) / 1e5, lon: Math.round(p.lon * 1e5) / 1e5 }; }) };
    }) };
  }
  function drawTile(key) {
    var t = bTiles[key];
    if (!t || !t.data || t.layer) return;
    var o = OSM.buildings, g = L.layerGroup();
    t.data.elements.forEach(function (el) {
      var pts = el.geometry.map(function (p) { return [p.lat, p.lon]; });
      if (pts.length < 3) return;
      L.polygon(pts, Object.assign({ renderer: canvas }, o.style(el.tags || {}))).on('click', function (ev) { L.DomEvent.stop(ev); if (picking) { openSpot(ev.latlng); return; } openFeature('buildings', el); }).addTo(g);
    });
    t.layer = g;
  }
  function fetchTile(key, i, j, race) {
    return cacheGet(key).then(function (hit) {
      if (hit) return hit;
      var q = 'way["building"](' + tileBox(i, j) + ');out geom;';
      var p = race ? overpass(q) : fetch(ENDPOINTS[0], { method: 'POST', body: 'data=' + encodeURIComponent('[out:json][timeout:25];' + q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
      return p.then(function (d) { var s = slimBuildings(d); cachePut(key, s); return s; });
    });
  }
  function pumpBuildings() {
    while (bRunning < 3 && bQueue.length) {
      (function (job) {
        var t = bTiles[job.key];
        if (t.state !== 'queued') return;
        t.state = 'loading'; bRunning++;
        fetchTile(job.key, job.i, job.j, true).then(function (d) {
          t.data = d; t.state = 'ready'; drawTile(job.key);
          if (osmActive.buildings && map.getZoom() >= OSM.buildings.minZoom && t.wanted) osmGroups.buildings.addLayer(t.layer);
        }).catch(function () { t.state = 'failed'; }).then(function () {
          bRunning--; bDone++;
          if (bQueue.length || bRunning) status('Loading buildings… ' + bDone + ' of ' + bTotal + ' areas');
          else {
            var failed = Object.keys(bTiles).filter(function (k) { return bTiles[k].wanted && bTiles[k].state === 'failed'; }).length;
            status(failed ? 'Some areas could not load because the map servers are busy. Move the map a little to try again.' : null, failed ? 6000 : 0);
          }
          pumpBuildings();
        });
      })(bQueue.shift());
    }
  }
  function refreshBuildings() {
    var g = osmGroups.buildings;
    if (!osmActive.buildings || map.getZoom() < OSM.buildings.minZoom) { map.removeLayer(g); return false; }
    if (!map.hasLayer(g)) g.addTo(map);
    var b = map.getBounds().pad(0.15), c = map.getCenter();
    var i0 = Math.floor(b.getSouth() / TILE), i1 = Math.floor(b.getNorth() / TILE), j0 = Math.floor(b.getWest() / TILE), j1 = Math.floor(b.getEast() / TILE);
    var want = {}, jobs = [];
    for (var i = i0; i <= i1; i++) for (var j = j0; j <= j1; j++) {
      var key = tileKey(i, j); want[key] = 1;
      var t = bTiles[key] || (bTiles[key] = { state: 'new' });
      t.wanted = true;
      if (t.state === 'ready') { drawTile(key); if (!g.hasLayer(t.layer)) g.addLayer(t.layer); }
      else if (t.state === 'new' || t.state === 'failed') { t.state = 'queued'; jobs.push({ key: key, i: i, j: j, d: Math.pow((i + 0.5) * TILE - c.lat, 2) + Math.pow((j + 0.5) * TILE - c.lng, 2) }); }
    }
    Object.keys(bTiles).forEach(function (k) { if (!want[k]) { bTiles[k].wanted = false; if (bTiles[k].layer) g.removeLayer(bTiles[k].layer); if (bTiles[k].state === 'queued') bTiles[k].state = 'new'; } });
    bQueue = bQueue.filter(function (q) { return want[q.key] && bTiles[q.key].state === 'queued'; });
    jobs.sort(function (a, b2) { return a.d - b2.d; }).forEach(function (q) { bQueue.push(q); });
    if (bQueue.length) { bTotal = bQueue.length + bRunning; bDone = 0; status('Loading buildings… 0 of ' + bTotal + ' areas'); pumpBuildings(); return true; }
    return bRunning > 0;
  }
  // Quietly fetch central Tripoli's buildings and the saved layers after the page settles.
  function preload() {
    var conn = navigator.connection || {};
    if (conn.saveData || /2g/.test(conn.effectiveType || '')) return;
    ['landuse', 'military', 'water', 'oil'].forEach(function (k) {
      if (savedState[k]) return;
      fetch('data/osm/' + k + '.json', { cache: 'force-cache' }).then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function (j) { if (!savedState[k]) { savedData[k] = { elements: (j.features || []).map(expand), generated: j.generated }; savedState[k] = 'ready'; } }).catch(function () {});
    });
    var c = L.latLng(32.888, 13.185), ci = Math.floor(c.lat / TILE), cj = Math.floor(c.lng / TILE), list = [];
    for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) list.push([ci + di, cj + dj]);
    (function next() {
      var x = list.shift(); if (!x) return;
      var key = tileKey(x[0], x[1]), t = bTiles[key] || (bTiles[key] = { state: 'new' });
      if (t.state !== 'new') { next(); return; }
      t.state = 'preloading';
      fetchTile(key, x[0], x[1], false).then(function (d) { t.data = d; t.state = 'ready'; if (t.wanted) refreshBuildings(); })
        .catch(function () { t.state = 'new'; }).then(function () { setTimeout(next, 1500); });
    })();
  }
  setTimeout(function () { (window.requestIdleCallback || function (f) { f(); })(preload); }, 4000);

  /* ---------- panels ---------- */
  var selected = null;
  function syncBody() {
    document.body.classList.toggle('drawer-open', $('drawer').classList.contains('open'));
    document.body.classList.toggle('sheet-open', $('sheet').classList.contains('open'));
  }
  function openPanel(id) {
    $(id).classList.add('open');
    if (id === 'sheet') { $('sheet-body').scrollTop = 0; requestAnimationFrame(function () { $('sheet-body').scrollTop = 0; }); }
    if (id === 'drawer') $('btn-layers').setAttribute('aria-expanded', 'true');
    if (!DESKTOP.matches) { if (id === 'sheet') closePanel('drawer'); if (id === 'drawer') closePanel('sheet'); if (!$('chat-panel').hidden) closeChat(); }
    syncBody();
  }
  function closePanel(id) {
    $(id).classList.remove('open');
    if (id === 'drawer') $('btn-layers').setAttribute('aria-expanded', 'false');
    if (id === 'sheet') { $('sheet').classList.remove('tall'); document.body.classList.remove('sheet-tall'); markSelected(null); linkLayer.clearLayers(); if (spotMarker) { map.removeLayer(spotMarker); spotMarker = null; } }
    syncBody();
  }
  function markSelected(id) {
    document.querySelectorAll('.mk.sel').forEach(function (e) { e.classList.remove('sel'); });
    document.querySelectorAll('.tl-dot.sel').forEach(function (e) { e.classList.remove('sel'); });
    selected = id;
    if (!id) return;
    var el = markers[id] && markers[id].getElement();
    if (el) el.querySelector('.mk').classList.add('sel');
  }
  function newSheet(kind) {
    if (spotMarker && kind !== 'Selected spot') { map.removeLayer(spotMarker); spotMarker = null; }
    linkLayer.clearLayers();
    $('sheet-kind').textContent = kind;
    var body = $('sheet-body'); body.innerHTML = ''; body.scrollTop = 0; $('sheet').classList.remove('tall'); document.body.classList.remove('sheet-tall');
    return body;
  }

  /* ---------- site details ---------- */
  function linksFor(id) {
    return LINKS.filter(function (l) { return l[0] === id || l[1] === id; }).map(function (l) { return { other: BY_ID[l[0] === id ? l[1] : l[0]], why: l[2] }; }).filter(function (x) { return x.other; });
  }
  function openSite(s) {
    var lay = LAYERS[s.layer];
    var body = newSheet(lay.label);
    markSelected(s.id);
    var outside = span(s)[1] < 1969 || span(s)[0] > 1989;
    body.appendChild(h('div', { class: 'idrow' }, [h('span', { text: s.ref }), h('span', { text: s.lat.toFixed(4) + ', ' + s.lon.toFixed(4) })]));
    body.appendChild(h('div', { class: 'tags' }, [
      h('span', { class: 'tag', style: '--c:' + lay.color, text: lay.label }),
      h('span', { class: 'tag', style: '--c:#abb3bf', text: LEVELS[s.level] }),
      outside ? h('span', { class: 'tag', style: '--c:#f2b33d', text: 'Outside 1969–1989' }) : null
    ]));
    body.appendChild(h('div', {}, [h('h1', { class: 'd-title', text: s.name }), s.ar ? h('div', { class: 'd-ar', lang: 'ar', dir: 'rtl', text: s.ar }) : null]));
    body.appendChild(h('dl', { class: 'meta' }, [
      h('dt', { text: 'When' }), h('dd', { text: s.period }),
      h('dt', { text: 'Accuracy' }), h('dd', { text: 'within about ' + s.r + ' km' })
    ]));
    body.appendChild(h('p', { class: 'brief', text: s.relevance }));
    body.appendChild(h('p', { class: 'd-text', text: s.text }));

    var ls = linksFor(s.id);
    if (ls.length) {
      var box = h('div', { class: 'links' });
      ls.forEach(function (x) {
        if (visible(x.other)) L.polyline([[s.lat, s.lon], [x.other.lat, x.other.lon]], { color: '#4c90f0', weight: 2, opacity: 0.85, dashArray: '6 6', interactive: false }).addTo(linkLayer);
        box.appendChild(h('button', { onclick: function () { focusSite(x.other); } }, [glyph(x.other.layer), h('span', {}, [x.other.name, h('small', { text: x.why })])]));
      });
      body.appendChild(h('div', { class: 'sec' }, [h('h3', { text: 'Linked places' }), box]));
    }
    add(body, aiBox({ kind: 'historical site', name: s.name, arabic: s.ar, category: lay.label, evidence: LEVELS[s.level], period: s.period, summary: s.relevance + ' ' + s.text, lat: s.lat, lon: s.lon }, QS[s.id] || [],
      function () { return contextFor({ lat: s.lat, lon: s.lon, places: [s.id], words: [s.name].concat(s.ar ? [s.ar] : []).concat(s.aliases || []) }); }));
    docsSection(body, { places: [s.id], words: [s.name].concat(s.aliases || []) }, 'In the archive', s.name);
    body.appendChild(h('div', { class: 'sec' }, [h('h3', { text: 'Sources' }), h('ol', { class: 'srcs' }, s.sources.map(function (x) { return h('li', {}, [h('a', { href: x.u, target: '_blank', rel: 'noopener', text: x.t })]); }))]));
    body.appendChild(h('div', { class: 'row-btns' }, [h('button', { class: 'btn', text: 'Zoom to this place', onclick: function () { map.flyTo([s.lat, s.lon], 16, { duration: 0.8 }); } })]));
    openPanel('sheet');
    drawTimeline();
  }

  /* ---------- present-day feature details ---------- */
  var KIND = {
    landuse: function (t) { return ({ residential: 'Residential zone', commercial: 'Commercial zone', retail: 'Shopping / retail zone', industrial: 'Industrial zone' })[t.landuse] || 'Land use zone'; },
    buildings: function (t) { return t.building && t.building !== 'yes' ? 'Building (' + t.building.replace(/_/g, ' ') + ')' : 'Building'; },
    military: function (t) { return t.military ? 'Military: ' + t.military.replace(/_/g, ' ') : 'Military area'; },
    water: function (t) { return ({ water_well: 'Water well', water_tower: 'Water tower', water_works: 'Water works', reservoir_covered: 'Covered reservoir' })[t.man_made] || (t.landuse === 'reservoir' ? 'Reservoir' : 'Water facility'); },
    oil: function (t) { return t.man_made === 'petroleum_well' ? 'Oil or gas well' : t.man_made === 'storage_tank' ? 'Fuel storage tank' : t.industrial === 'refinery' ? 'Refinery' : 'Oil & gas facility'; }
  };
  var EXPLAIN = {
    landuse: 'This is how the area is used today. Land use in 1969–1989 may have been different, since Tripoli grew a great deal after the 1980s.',
    buildings: 'A building as it stands today. It may not have existed in 1969–1989.',
    military: 'An area marked as military in today’s map data. Present-day military sites do not always match those of the Gaddafi era.',
    water: 'Part of the water supply as mapped today. Before the Great Man-Made River reached the city, Tripoli depended heavily on local groundwater wells.',
    oil: 'An oil or gas facility mapped today. Tripoli has no major oil fields; Libya’s main fields lie far to the south and east.'
  };
  function openFeature(k, el) {
    var t = el.tags || {};
    var body = newSheet('Present-day map data');
    markSelected(null);
    var name = t['name:en'] || t.name || KIND[k](t);
    var lat = el.lat || (el.bounds ? (el.bounds.minlat + el.bounds.maxlat) / 2 : null);
    var lon = el.lon || (el.bounds ? (el.bounds.minlon + el.bounds.maxlon) / 2 : null);
    body.appendChild(h('div', { class: 'idrow' }, [h('span', { text: 'OSM ' + el.type.toUpperCase() + ' ' + el.id }), lat ? h('span', { text: lat.toFixed(4) + ', ' + lon.toFixed(4) }) : null]));
    body.appendChild(h('div', { class: 'tags' }, [h('span', { class: 'tag', style: '--c:#4c90f0', text: 'OpenStreetMap, today' })]));
    body.appendChild(h('div', {}, [h('h1', { class: 'd-title', text: name }), t.name && t.name !== name ? h('div', { class: 'd-ar', text: t.name }) : null]));
    var kb = (t['name:en'] && areaByName(t['name:en'])) || (t.name && areaByName(t.name)) || (t['name:ar'] && areaByName(t['name:ar']));
    if (kb && (k === 'military' || k === 'water' || k === 'oil' || kb.kind === 'military' || kb.kind === 'landmark' || kb.kind === 'prison' || kb.kind === 'government')) {
      body.appendChild(h('p', { class: 'brief', text: kb.summary }));
      [['History', kb.history], ['Under Gaddafi, 1969–2011', kb.era], ['Today', kb.today], ['Still unclear', kb.uncertain]].forEach(function (x) { if (x[1]) body.appendChild(h('div', { class: 'sec' }, [h('h3', { text: x[0] }), h('p', { class: 'd-text', text: x[1] })])); });
      if ((kb.sources || []).length) body.appendChild(sourcesList(kb.sources));
    } else {
      body.appendChild(h('p', { class: 'brief', text: KIND[k](t) + '. ' + EXPLAIN[k] }));
      var inA = lat ? areaAt(L.latLng(lat, lon)) : null;
      if (inA) body.appendChild(h('div', { class: 'links' }, [h('button', { onclick: function () { openArea(inA.a); } }, [h('span', { class: 'dtag', text: KIND_LABEL[inA.a.kind] }), h('span', {}, ['In ' + inA.a.name, h('small', { text: inA.a.summary ? inA.a.summary.slice(0, 120) + '…' : '' })])])]));
    }
    var rows = Object.keys(t).filter(function (x) { return !/^(source|note|fixme|wikidata|created_by)/.test(x); }).slice(0, 12);
    if (rows.length) body.appendChild(h('div', { class: 'sec' }, [h('h3', { text: 'Map details' }), h('table', { class: 'kv' }, [h('tbody', {}, rows.map(function (x) { return h('tr', {}, [h('td', { text: x.replace(/_/g, ' ') }), h('td', { text: t[x] })]); }))])]));
    add(body, aiBox({ kind: 'present-day map feature (OpenStreetMap)', type: KIND[k](t), name: name, tags: t, lat: lat, lon: lon }, kb ? areaQuestions(kb) : (FEATQ[k] || []).map(function (x) { return x.replace(/\{x\}/g, name); }),
      function () { return contextFor({ areas: kb ? [kb] : [], lat: lat, lon: lon, places: kb ? [kb.id] : [], words: [name, t.name, t['name:en']].filter(Boolean) }); }));
    if (kb) docsSection(body, { places: [kb.id], words: areaNames(kb).filter(function (x) { return x && x.length > 3; }) }, 'In the archive', kb.name);
    body.appendChild(h('p', { class: 'd-text', style: 'font-size:.8em', html: '<a href="https://www.openstreetmap.org/' + el.type + '/' + el.id + '" target="_blank" rel="noopener">View on OpenStreetMap</a>' }));
    openPanel('sheet');
  }

  /* ---------- ask about any spot ---------- */
  var spotMarker = null, lastSpot = 0, picking = false;
  function nearestDistrict(ll) {
    var best = null;
    DISTRICTS.forEach(function (d) { var m = map.distance(ll, [d[2], d[3]]); if (!best || m < best.m) best = { name: d[0], ar: d[1], m: m }; });
    return best;
  }
  function openSpot(ll) {
    var now = Date.now(); if (now - lastSpot < 800) return; lastSpot = now;
    setPicking(false);
    var body = newSheet('Selected spot');
    markSelected(null);
    if (spotMarker) spotMarker.setLatLng(ll);
    else spotMarker = L.marker(ll, { interactive: false, keyboard: false, zIndexOffset: 1000, icon: L.divIcon({ className: '', iconSize: [22, 22], iconAnchor: [11, 11], html: '<div class="spot"><div class="ping"></div></div>' }) }).addTo(map);
    var dist = nearestDistrict(ll);
    var near = SITES.map(function (s) { return { s: s, m: map.distance(ll, [s.lat, s.lon]) }; }).filter(function (x) { return x.m < 3000; }).sort(function (a, b) { return a.m - b.m; }).slice(0, 5);
    var place = { kind: 'spot on the map', lat: +ll.lat.toFixed(5), lon: +ll.lng.toFixed(5), nearestDistrict: dist.name + ' (' + km(dist.m) + ' away)', nearbySites: near.map(function (x) { return x.s.name + ' (' + km(x.m) + ')'; }), address: null };

    body.appendChild(h('div', { class: 'idrow' }, [h('span', { text: 'SPOT' }), h('span', { text: ll.lat.toFixed(5) + ', ' + ll.lng.toFixed(5) })]));
    var title = h('h1', { class: 'd-title', text: (areaAt(ll) || {}).a ? areaAt(ll).a.name : dist.m < 2500 ? dist.name : 'Selected spot' });
    var addr = h('div', { class: 'd-ar', text: 'Looking up the address…' });
    body.appendChild(h('div', {}, [title, addr]));
    body.appendChild(h('dl', { class: 'meta' }, [
      h('dt', { text: 'District' }), h('dd', { text: dist.name + ' · ' + dist.ar + ' · ' + km(dist.m) }),
      h('dt', { text: 'Nearby' }), h('dd', { text: near.length ? near.length + ' mapped place' + (near.length > 1 ? 's' : '') + ' within 3 km' : 'No mapped places within 3 km' })
    ]));
    if (near.length) {
      var box = h('div', { class: 'links' });
      near.forEach(function (x) { box.appendChild(h('button', { onclick: function () { focusSite(x.s); } }, [glyph(x.s.layer), h('span', {}, [x.s.name, h('small', { text: km(x.m) + ' away' })])])); });
      body.appendChild(h('div', { class: 'sec' }, [h('h3', { text: 'Mapped places nearby' }), box]));
    }
    var inArea = areaAt(ll);
    if (inArea) {
      var A = inArea.a;
      body.appendChild(h('div', { class: 'sec' }, [h('h3', { text: 'About ' + A.name }), h('p', { class: 'd-text', text: A.summary || '' }), A.era ? h('p', { class: 'd-text', text: A.era.length > 420 ? A.era.slice(0, 420).replace(/\s\S*$/, '') + '…' : A.era }) : null,
        h('button', { class: 'btn', text: 'Read the full profile of ' + A.name, onclick: function () { openArea(A); } })]));
    }
    var nearMil = areasNear(ll, ['military', 'prison', 'government', 'landmark'], 2000, 4);
    if (nearMil.length) {
      var mb = h('div', { class: 'links' });
      nearMil.forEach(function (x) { mb.appendChild(h('button', { onclick: function () { openArea(x.a); } }, [h('span', { class: 'dtag', text: KIND_LABEL[x.a.kind] }), h('span', {}, [x.a.name, h('small', { text: km(x.m) + ' away' })])])); });
      body.appendChild(h('div', { class: 'sec' }, [h('h3', { text: 'Known sites nearby' }), mb]));
    }
    var nearName = near.length ? near[0].s.name : null;
    var spotQs = SPOTQ.filter(function (x) { return nearName || x.indexOf('{n}') < 0; }).map(function (x) { return x.replace(/\{d\}/g, inArea ? inArea.a.name : dist.name).replace(/\{n\}/g, nearName); });
    if (inArea) place.area = inArea.a.name;
    add(body, aiBox(place, spotQs, function () { return contextFor({ lat: ll.lat, lon: ll.lng, words: place.address ? [place.address.split(',')[0]] : [] }); }));
    body.appendChild(h('div', { class: 'row-btns' }, [h('button', { class: 'btn', text: 'Ask about another spot', onclick: function () { setPicking(true); } })]));
    openPanel('sheet');

    var ac = new AbortController(); setTimeout(function () { ac.abort(); }, 8000);
    fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&accept-language=en&lat=' + ll.lat + '&lon=' + ll.lng, { signal: ac.signal })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (j) {
        var a = j.address || {};
        var area = a.neighbourhood || a.suburb || a.quarter || a.city_district || a.village || a.town;
        if (area && !inArea) title.textContent = area;
        addr.textContent = j.display_name || 'No address found for this spot.';
        place.address = j.display_name || null;
      })
      .catch(function () { addr.textContent = 'Address lookup is unavailable right now.'; });
  }
  function setPicking(on) {
    picking = on;
    document.body.classList.toggle('picking', on);
    if (pickBtn) pickBtn.classList.toggle('on', on);
    if (on) { status('Tap anywhere on the map to ask about that spot.'); if (!DESKTOP.matches) closePanel('sheet'); }
    else if ($('status').textContent.indexOf('Tap anywhere') === 0) status(null);
  }
  var pickBtn = null;
  var PickControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function () {
      var wrap = L.DomUtil.create('div', 'leaflet-bar');
      pickBtn = L.DomUtil.create('a', '', wrap);
      pickBtn.href = '#'; pickBtn.innerHTML = '◎'; pickBtn.title = 'Ask about a spot'; pickBtn.setAttribute('role', 'button'); pickBtn.setAttribute('aria-label', 'Ask about a spot on the map');
      L.DomEvent.on(pickBtn, 'click', function (e) { L.DomEvent.stop(e); setPicking(!picking); });
      L.DomEvent.disableClickPropagation(wrap);
      return wrap;
    }
  });
  new PickControl().addTo(map);
  map.on('click', function (e) { if (picking) openSpot(e.latlng); });
  map.on('contextmenu', function (e) { openSpot(e.latlng); });
  (function longPress() {
    var el = map.getContainer(), timer = null, start = null;
    el.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { clearTimeout(timer); return; }
      var t = e.touches[0]; start = [t.clientX, t.clientY];
      clearTimeout(timer);
      timer = setTimeout(function () {
        var r = el.getBoundingClientRect();
        openSpot(map.containerPointToLatLng([start[0] - r.left, start[1] - r.top]));
        if (navigator.vibrate) try { navigator.vibrate(15); } catch (x) {}
      }, 650);
    }, { passive: true });
    el.addEventListener('touchmove', function (e) { if (!start) return; var t = e.touches[0]; if (Math.abs(t.clientX - start[0]) + Math.abs(t.clientY - start[1]) > 12) clearTimeout(timer); }, { passive: true });
    ['touchend', 'touchcancel'].forEach(function (n) { el.addEventListener(n, function () { clearTimeout(timer); }, { passive: true }); });
  })();

  /* ---------- AI answers through the family relay ---------- */
  var creditHidden = false;
  function fitBanner() {
    var b = $('credit');
    document.documentElement.style.setProperty('--banner-h', b.hidden ? '0px' : b.offsetHeight + 'px');
    map.invalidateSize();
  }
  function showCredit(c) {
    var b = $('credit');
    if (!c || !c.tracked || !c.low || creditHidden) { b.hidden = true; fitBanner(); return; }
    b.classList.toggle('out', !!c.out);
    $('credit-msg').textContent = c.out
      ? 'AI answers are paused: the AI credit has run out. Let ' + OWNER + ' know.'
      : 'AI credit is running low: about $' + Number(c.remaining).toFixed(2) + ' left. Let ' + OWNER + ' know.';
    b.hidden = false; fitBanner();
  }
  window.addEventListener('resize', fitBanner);
  $('credit-x').onclick = function () { creditHidden = true; $('credit').hidden = true; fitBanner(); };
  function relay(code, payload) {
    var hd = { 'Content-Type': 'application/json' }; if (!GATED) hd['X-Family-Code'] = code;
    return fetch(CFG.aiEndpoint, { method: 'POST', credentials: 'same-origin', headers: hd, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (j && j.credit) showCredit(j.credit); if (!r.ok) { if (GATED && r.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname); } var e = new Error(j.error || ('Error ' + r.status)); e.code = r.status; throw e; } return j; }); });
  }
  /* ---------- knowledge: area profiles and the document archive ---------- */
  var AREAS = window.ATLAS_AREAS || [];
  var AREA_BY_ID = {};
  AREAS.forEach(function (a) { AREA_BY_ID[a.id] = a; });
  var RECORDS = null, recordsWaiting = null, REC_BY_ID = {};
  function loadRecords() {
    if (RECORDS) return Promise.resolve(RECORDS);
    if (recordsWaiting) return recordsWaiting;
    recordsWaiting = new Promise(function (ok) {
      var sc = document.createElement('script');
      sc.src = 'data/records.js';
      sc.onload = function () { RECORDS = window.ATLAS_RECORDS || []; RECORDS.forEach(function (r) { REC_BY_ID[r.i] = r; }); ok(RECORDS); try { drawTimeline(); } catch (e) {} };
      sc.onerror = function () { RECORDS = []; ok(RECORDS); };
      document.head.appendChild(sc);
    });
    return recordsWaiting;
  }
  setTimeout(loadRecords, 2500);
  var fold = function (t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ً-ٟـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[’'`ʿʾ\-_.,()]/g, ' ').replace(/\s+/g, ' ').trim(); };
  var squash = function (t) { return fold(t).replace(/^(al|el|ar|as|az|ad|an|at|ash) /, '').replace(/ /g, ''); };
  function areaNames(a) { return [a.name, a.ar].concat(a.aliases || []); }
  function areaByName(name) {
    var n = squash(name); if (!n) return null;
    var exact = AREAS.filter(function (a) { return areaNames(a).some(function (x) { return squash(x) === n; }); });
    if (exact.length) return exact[0];
    if (n.length < 5) return null;
    return AREAS.filter(function (a) { return areaNames(a).some(function (x) { var y = squash(x); return y.length >= 5 && (y.indexOf(n) >= 0 || n.indexOf(y) >= 0); }); })[0] || null;
  }
  // The area a point falls in: the smallest profile whose circle contains it, else the nearest town or neighbourhood.
  function areaAt(ll, kinds) {
    var best = null, near = null;
    AREAS.forEach(function (a) {
      if (kinds && kinds.indexOf(a.kind) < 0) return;
      if (!kinds && ['neighbourhood', 'district', 'town'].indexOf(a.kind) < 0) return;
      var m = map.distance(ll, [a.lat, a.lon]);
      if (m <= (a.r || 1) * 1000 && (!best || (a.r || 1) < (best.a.r || 1))) best = { a: a, m: m };
      if (!near || m < near.m) near = { a: a, m: m };
    });
    return best || (near && near.m < 6000 ? near : null);
  }
  function areasNear(ll, kinds, maxM, n) {
    return AREAS.filter(function (a) { return kinds.indexOf(a.kind) >= 0; }).map(function (a) { return { a: a, m: map.distance(ll, [a.lat, a.lon]) }; })
      .filter(function (x) { return x.m <= maxM; }).sort(function (x, y) { return x.m - y.m; }).slice(0, n || 5);
  }
  var KIND_LABEL = { neighbourhood: 'Neighbourhood', district: 'District', town: 'Town', military: 'Military site', landmark: 'Landmark', prison: 'Prison', government: 'Government site' };
  var TYPE_LABEL = { 'diplomatic cable': 'Cable', 'intelligence assessment': 'Intelligence', 'record of conversation': 'Conversation', 'government document': 'Document', letter: 'Letter', 'editorial note': 'Note', 'policy directive': 'Directive', reference: 'Reference', report: 'Report', event: 'Event', law: 'Law', news: 'News', book: 'Book', testimony: 'Testimony', map: 'Map' };
  function recWords(r) { return r._w || (r._w = fold(r.t + ' ' + (r.m || '') + ' ' + (r.s || '') + ' ' + (r.k || []).join(' '))); }
  function scoreRecords(opts) {
    var words = (opts.words || []).map(fold).filter(function (w) { return w.length > 2; });
    var ids = opts.places || [];
    return (RECORDS || []).map(function (r) {
      var sc = 0, hay = null;
      (r.p || []).forEach(function (p) { if (ids.indexOf(p) >= 0) sc += 6; });
      if (words.length) { hay = recWords(r); words.forEach(function (w) { if (hay.indexOf(w) >= 0) sc += w.indexOf(' ') > 0 ? 4 : 2; }); }
      if (opts.year_from && (r.d || '').slice(0, 4) < String(opts.year_from)) return null;
      if (opts.year_to && (r.d || '').slice(0, 4) > String(opts.year_to)) return null;
      if (opts.type && r.y !== opts.type) return null;
      if (sc && (r.p || []).indexOf('tripoli') >= 0) sc += 0.5;
      return sc ? { r: r, sc: sc } : null;
    }).filter(Boolean).sort(function (a, b) { return b.sc - a.sc || (a.r.d < b.r.d ? -1 : 1); }).map(function (x) { return x.r; });
  }
  function recordsFor(opts, n) { return scoreRecords(opts).slice(0, n || 8); }
  function recLine(r) { return '[' + r.i + '] ' + (r.d || 'undated') + ' — ' + r.t + ' (' + (r.s || '') + '): ' + String(r.m || '').slice(0, 420); }
  function areaText(a, full) {
    return [a.name + (a.ar ? ' (' + a.ar + ')' : '') + ' — ' + (KIND_LABEL[a.kind] || a.kind) + '.', a.summary, full && a.history ? 'History: ' + a.history : '', a.era ? 'Gaddafi era: ' + a.era : '', a.today ? 'Today: ' + a.today : '',
      a.uncertain ? 'Uncertain: ' + a.uncertain : '', (a.sources || []).length ? 'Sources: ' + a.sources.map(function (x) { return x.t; }).join('; ') : ''].filter(Boolean).join('\n');
  }
  // Everything the map knows that bears on a place, for the AI.
  function contextFor(o) {
    var parts = [], ll = o.lat != null ? L.latLng(o.lat, o.lon) : null, used = {};
    (o.areas || []).forEach(function (a) { if (a && !used[a.id]) { used[a.id] = 1; parts.push('AREA PROFILE\n' + areaText(a, true)); } });
    if (ll) {
      var at = areaAt(ll); if (at && !used[at.a.id]) { used[at.a.id] = 1; parts.push('THE AREA THIS POINT IS IN (' + km(at.m) + ' from its centre)\n' + areaText(at.a, true)); }
      areasNear(ll, ['military', 'landmark', 'prison', 'government'], 2500, 4).forEach(function (x) { if (!used[x.a.id]) { used[x.a.id] = 1; parts.push('NEARBY (' + km(x.m) + ')\n' + areaText(x.a, false)); } });
      var sites = SITES.map(function (s) { return { s: s, m: map.distance(ll, [s.lat, s.lon]) }; }).filter(function (x) { return x.m < 4000; }).sort(function (a, b) { return a.m - b.m; }).slice(0, 4);
      if (sites.length) parts.push('MAPPED HISTORICAL PLACES NEARBY\n' + sites.map(function (x) { return x.s.name + ' (' + km(x.m) + ', ' + LAYERS[x.s.layer].label + ', ' + x.s.period + '): ' + x.s.relevance; }).join('\n'));
    }
    var recs = recordsFor({ places: Object.keys(used).concat(o.places || []), words: o.words || [] }, 10);
    if (recs.length) parts.push('ARCHIVE DOCUMENTS\n' + recs.map(recLine).join('\n'));
    return parts.join('\n\n').slice(0, 15000);
  }

  /* ---------- the question box: answers, follow-ups, sources ---------- */
  function aiBox(place, qs, ctx) {
    if (!CFG.aiEndpoint) return null;
    var list = (qs || []).slice(), idx = list.length ? Math.floor(Math.random() * list.length) : 0, history = [];
    var q = h('textarea', { 'aria-label': 'Your question', placeholder: 'Or type your own question' });
    var pw = h('input', { type: 'password', autocomplete: 'off', autocapitalize: 'none', 'aria-label': 'Family password' });
    var pwWrap = h('div', { class: 'field' }, [h('label', { text: 'Family password' }), pw, h('small', { text: 'Only needed once on this device.' })]);
    pwWrap.hidden = !!store.get('code', '');
    var log = h('div', { class: 'ai-log', 'aria-live': 'polite' });
    var btn = h('button', { class: 'btn primary', text: 'Ask' });
    var sugg = h('div', { class: 'sugg' });
    function renderSugg(items, follow) {
      sugg.innerHTML = '';
      if (follow) sugg.appendChild(h('div', { class: 'sugg-h', text: 'Ask next' }));
      items.forEach(function (t) { sugg.appendChild(h('button', { class: 'qchip', text: t, onclick: function () { q.value = t; ask(); } })); });
      if (!follow && list.length > 3) sugg.appendChild(h('button', { class: 'qmore', text: 'More questions ↻', onclick: function () { idx = (idx + 3) % list.length; renderStart(); } }));
    }
    function renderStart() { var a = []; for (var i = 0; i < Math.min(3, list.length); i++) a.push(list[(idx + i) % list.length]); renderSugg(a, false); }
    renderStart();
    function ask() {
      var question = q.value.trim() || list[idx % Math.max(1, list.length)] || 'Tell me about this place.';
      var code = store.get('code', '') || (pw.value || '').trim();
      if (!code) { pwWrap.hidden = false; pw.focus(); return; }
      store.set('code', code); pwWrap.hidden = true;
      btn.disabled = true; btn.textContent = 'Researching…';
      $('sheet').classList.add('tall'); document.body.classList.add('sheet-tall');
      var turn = h('div', { class: 'ai-turn' }, [h('p', { class: 'ai-asked', text: question })]);
      var out = h('div', { class: 'ai-out' }, [h('p', { class: 'ai-wait', text: 'Reading the archive and checking sources…' })]);
      turn.appendChild(out); log.appendChild(turn); q.value = ''; sugg.innerHTML = '';
      turn.scrollIntoView({ block: 'start', behavior: 'smooth' });
      loadRecords().then(function () { return relay(code, { place: place, question: question.slice(0, 600), history: history.slice(-5), context: ctx ? ctx() : '' }); })
        .then(function (j) {
          out.innerHTML = '';
          String(j.text || 'No answer came back. Try again.').split(/\n{2,}/).forEach(function (para) { out.appendChild(h('p', { text: para.trim() })); });
          if (j.sources && j.sources.length) out.appendChild(h('details', { class: 'ai-src' }, [h('summary', { text: 'Web sources (' + j.sources.length + ')' }), h('ol', {}, j.sources.map(function (x) { return h('li', {}, [h('a', { href: x.url, target: '_blank', rel: 'noopener', text: x.title })]); }))]));
          history.push({ q: question, a: j.text || '' });
          renderSugg((j.followups || []).length ? j.followups : (function () { idx = (idx + 3) % Math.max(1, list.length); var a = []; for (var i = 0; i < Math.min(3, list.length); i++) a.push(list[(idx + i) % list.length]); return a; })(), true);
          q.placeholder = 'Ask a follow-up question';
        })
        .catch(function (e) {
          out.innerHTML = ''; out.classList.add('err');
          if (e.code === 401 && !GATED) { store.set('code', ''); pw.value = ''; pwWrap.hidden = false; }
          out.appendChild(h('p', { text: e.code === 401 ? 'That password was not accepted. Please type it again.'
            : e.code === 402 ? 'AI answers are paused because the AI credit has run out.'
            : e.code === 429 ? 'Too many questions just now. Wait a minute and try again.'
            : 'Could not reach the AI right now. Check your connection and try again.' }));
          renderStart();
        })
        .then(function () { btn.disabled = false; btn.textContent = 'Ask'; turn.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
    }
    btn.addEventListener('click', ask);
    q.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } });
    return h('div', { class: 'ai' }, [h('h3', { class: 'ai-h', text: 'Ask about this' }), log, sugg, q, pwWrap, btn]);
  }

  /* ---------- sheets for areas and documents ---------- */
  function sourcesList(srcs) {
    return h('div', { class: 'sec' }, [h('h3', { text: 'Sources' }), h('ol', { class: 'srcs' }, srcs.map(function (x) { return h('li', {}, [x.u ? h('a', { href: x.u, target: '_blank', rel: 'noopener', text: x.t }) : x.t]); }))]);
  }
  function docList(recs, more) {
    var box = h('div', { class: 'links docs' });
    recs.forEach(function (r) {
      box.appendChild(h('button', { onclick: function () { openRecord(r); } }, [h('span', { class: 'dtag', text: TYPE_LABEL[r.y] || r.y }), h('span', {}, [r.t, h('small', { text: (r.d || 'undated') + ' · ' + (r.s || '') })])]));
    });
    if (more) box.appendChild(h('button', { class: 'more', onclick: function () { openTerm(more); } }, [h('span', { text: 'Search the archive for “' + more + '”' })]));
    return box;
  }
  function docsSection(sec, opts, label, more) {
    var holder = h('div', { class: 'sec' }, [h('h3', { text: label || 'In the archive' }), h('p', { class: 'd-text muted', text: 'Loading documents…' })]);
    loadRecords().then(function () {
      var recs = recordsFor(opts, 8);
      holder.innerHTML = '';
      holder.appendChild(h('h3', { text: (label || 'In the archive') + (recs.length ? ' (' + recs.length + (recs.length === 8 ? '+' : '') + ')' : '') }));
      holder.appendChild(recs.length ? docList(recs, more) : h('p', { class: 'd-text muted', text: 'No documents in the archive mention this yet.' }));
    });
    sec.appendChild(holder);
  }
  function areaQuestions(a) {
    var n = a.name;
    if (a.questions && a.questions.length) return a.questions;
    if (a.kind === 'military') return ['What was ' + n + ' used for under Gaddafi?', 'Which units were based at ' + n + '?', 'What happened at ' + n + ' in 2011?', 'Who controls ' + n + ' today?', 'Were people detained at ' + n + '?', 'How did ' + n + ' get its name?'];
    return ['What was ' + n + ' like in the 1970s and 1980s?', 'What happened in ' + n + ' during the 1986 US air raid?', 'Were there security offices or prisons in ' + n + '?', 'What is ' + n + ' known for today?', 'Who lived in ' + n + ' under Gaddafi?', 'How did ' + n + ' change after 2011?'];
  }
  function openArea(a) {
    var body = newSheet(KIND_LABEL[a.kind] || 'Area');
    markSelected(null);
    body.appendChild(h('div', { class: 'idrow' }, [h('span', { text: (KIND_LABEL[a.kind] || a.kind).toUpperCase() }), h('span', { text: a.lat.toFixed(4) + ', ' + a.lon.toFixed(4) })]));
    body.appendChild(h('div', {}, [h('h1', { class: 'd-title', text: a.name }), a.ar ? h('div', { class: 'd-ar', lang: 'ar', dir: 'rtl', text: a.ar }) : null]));
    if (a.summary) body.appendChild(h('p', { class: 'brief', text: a.summary }));
    [['History', a.history], ['Under Gaddafi, 1969–2011', a.era], ['Today', a.today], ['Still unclear', a.uncertain]].forEach(function (x) {
      if (x[1]) body.appendChild(h('div', { class: 'sec' }, [h('h3', { text: x[0] }), h('p', { class: 'd-text', text: x[1] })]));
    });
    var ll = L.latLng(a.lat, a.lon);
    var near = SITES.map(function (s) { return { s: s, m: map.distance(ll, [s.lat, s.lon]) }; }).filter(function (x) { return x.m < 3000; }).sort(function (x, y) { return x.m - y.m; }).slice(0, 5);
    if (near.length) {
      var box = h('div', { class: 'links' });
      near.forEach(function (x) { box.appendChild(h('button', { onclick: function () { focusSite(x.s); } }, [glyph(x.s.layer), h('span', {}, [x.s.name, h('small', { text: km(x.m) + ' away' })])])); });
      body.appendChild(h('div', { class: 'sec' }, [h('h3', { text: 'Mapped places nearby' }), box]));
    }
    add(body, aiBox({ kind: KIND_LABEL[a.kind] || a.kind, name: a.name, arabic: a.ar, lat: a.lat, lon: a.lon }, areaQuestions(a), function () { return contextFor({ areas: [a], lat: a.lat, lon: a.lon, places: [a.id], words: areaNames(a) }); }));
    docsSection(body, { places: [a.id], words: areaNames(a).filter(function (x) { return x && x.length > 3; }) }, 'In the archive', a.name);
    if ((a.sources || []).length) body.appendChild(sourcesList(a.sources));
    body.appendChild(h('div', { class: 'row-btns' }, [h('button', { class: 'btn', text: 'Zoom to ' + a.name, onclick: function () { map.flyTo(ll, a.kind === 'town' ? 14 : 15, { duration: 0.8 }); } })]));
    openPanel('sheet');
  }
  function openRecord(r) {
    var body = newSheet('Archive document');
    markSelected(null);
    body.appendChild(h('div', { class: 'idrow' }, [h('span', { text: r.i }), h('span', { text: r.d || 'undated' })]));
    body.appendChild(h('div', { class: 'tags' }, [h('span', { class: 'tag', style: '--c:#4c90f0', text: TYPE_LABEL[r.y] || r.y }), h('span', { class: 'tag', style: '--c:#abb3bf', text: r.rt || r.r })]));
    body.appendChild(h('h1', { class: 'd-title', text: r.t }));
    body.appendChild(h('dl', { class: 'meta' }, [h('dt', { text: 'Date' }), h('dd', { text: r.d || 'undated' }), h('dt', { text: 'Source' }), h('dd', { text: r.c || r.s || '' })].concat(r.a ? [h('dt', { text: 'Held at' }), h('dd', { text: r.a })] : [])));
    if (r.m) body.appendChild(h('p', { class: 'brief', text: r.m }));
    var pl = (r.p || []).map(function (id) { return BY_ID[id] ? { s: BY_ID[id] } : AREA_BY_ID[id] ? { a: AREA_BY_ID[id] } : null; }).filter(Boolean);
    if (pl.length) {
      var box = h('div', { class: 'links' });
      pl.slice(0, 8).forEach(function (x) { box.appendChild(x.s ? h('button', { onclick: function () { focusSite(x.s); } }, [glyph(x.s.layer), h('span', { text: x.s.name })]) : h('button', { onclick: function () { openArea(x.a); map.flyTo([x.a.lat, x.a.lon], 14, { duration: 0.8 }); } }, [h('span', { class: 'dtag', text: KIND_LABEL[x.a.kind] || '' }), h('span', { text: x.a.name })])); });
      body.appendChild(h('div', { class: 'sec' }, [h('h3', { text: 'Places mentioned' }), box]));
    }
    var full = h('div', { class: 'sec' });
    if (r.f) {
      var bt = h('button', { class: 'btn', text: 'Read the full text' });
      bt.onclick = function () {
        bt.disabled = true; bt.textContent = 'Loading…';
        fetch('data/docs/' + encodeURIComponent(r.i) + '.txt').then(function (x) { if (!x.ok) throw new Error(); return x.text(); })
          .then(function (t) { bt.remove(); full.appendChild(h('div', { class: 'fulltext', text: t })); })
          .catch(function () { bt.disabled = false; bt.textContent = 'Could not load. Try again'; });
      };
      full.appendChild(h('h3', { text: 'Full text' })); full.appendChild(bt);
    }
    body.appendChild(full);
    add(body, aiBox({ kind: 'archive document', id: r.i, title: r.t, date: r.d, source: r.c || r.s, type: r.y }, ['What does this document tell us, in plain words?', 'Why does this matter for people in Tripoli?', 'What happened next?', 'Who are the people named in it?', 'How reliable is this source?', 'What was going on in Libya at the time?'],
      function () { return 'THIS DOCUMENT\n' + recLine(r) + '\n\n' + (r._full || '') + '\n\nRELATED\n' + recordsFor({ places: r.p || [], words: [] }, 6).filter(function (x) { return x.i !== r.i; }).map(recLine).join('\n'); }));
    if (r.f && !r._full) fetch('data/docs/' + encodeURIComponent(r.i) + '.txt').then(function (x) { return x.ok ? x.text() : ''; }).then(function (t) { r._full = String(t).slice(0, 9000); }).catch(function () {});
    if (r.u) body.appendChild(h('p', { class: 'd-text' }, [h('a', { href: r.u, target: '_blank', rel: 'noopener', text: 'Open the original' })]));
    body.appendChild(h('p', { class: 'd-text muted small', text: r.rn || '' }));
    openPanel('sheet');
  }

  /* ---------- search terminal ---------- */
  var TERM_KINDS = [['all', 'All'], ['place', 'Places'], ['area', 'Areas'], ['doc', 'Documents'], ['event', 'Events']];
  var termKind = 'all';
  function openTerm(q) {
    $('term').hidden = false;
    if (q != null) $('term-q').value = q;
    loadRecords().then(runTerm);
    setTimeout(function () { $('term-q').focus(); $('term-q').select(); }, 30);
  }
  function closeTerm() { $('term').hidden = true; }
  function termResults(q) {
    var years = (q.match(/\b(1[89]\d\d|20[0-2]\d)\b(?:\s*[-–]\s*\b(1[89]\d\d|20[0-2]\d)\b)?/) || []);
    var yf = years[1] ? +years[1] : null, yt = years[2] ? +years[2] : yf;
    var words = fold(q.replace(years[0] || '', '')).split(' ').filter(function (w) { return w.length > 1; });
    var match = function (text) { var t = fold(text); return words.every(function (w) { return t.indexOf(w) >= 0; }); };
    var rel = function (title, rest) { var t = fold(title), r = fold(rest), sc = 0; words.forEach(function (w) { if (t.indexOf(w) >= 0) sc += 3; else if (r.indexOf(w) >= 0) sc += 1; }); if (words.length && t.indexOf(words.join(' ')) >= 0) sc += 4; return sc; };
    var out = [];
    if (termKind === 'all' || termKind === 'place') SITES.forEach(function (s) {
      var r = span(s); if (yf && (r[1] < yf || r[0] > yt)) return;
      if (words.length && !match(s.name + ' ' + (s.ar || '') + ' ' + s.relevance + ' ' + s.text + ' ' + LAYERS[s.layer].label)) return;
      out.push({ k: 'place', sort: 0, sc: rel(s.name + ' ' + (s.ar || ''), s.relevance + ' ' + s.text), d: s.period, t: s.name, sub: LAYERS[s.layer].label + ' · ' + s.relevance, go: function () { closeTerm(); focusSite(s); }, s: s });
    });
    if ((termKind === 'all' || termKind === 'area') && !yf) AREAS.forEach(function (a) {
      if (words.length && !match(areaNames(a).join(' ') + ' ' + (a.summary || '') + ' ' + (a.era || ''))) return;
      out.push({ k: 'area', sort: 1, sc: rel(areaNames(a).join(' '), (a.summary || '') + ' ' + (a.era || '')), d: KIND_LABEL[a.kind], t: a.name + (a.ar ? ' · ' + a.ar : ''), sub: a.summary || '', go: function () { closeTerm(); openArea(a); map.flyTo([a.lat, a.lon], a.kind === 'town' ? 13 : 15, { duration: 0.8 }); } });
    });
    if (termKind !== 'place' && termKind !== 'area') (RECORDS || []).forEach(function (r) {
      if (termKind === 'event' && r.y !== 'event') return;
      if (termKind === 'doc' && r.y === 'event') return;
      var y = +(r.d || '0').slice(0, 4); if (yf && (y < yf || y > yt)) return;
      if (words.length && !match(r.t + ' ' + (r.m || '') + ' ' + (r.s || '') + ' ' + (r.k || []).join(' '))) return;
      out.push({ k: r.y === 'event' ? 'event' : 'doc', sort: r.y === 'event' ? 1.5 : 2, sc: rel(r.t, (r.m || '') + ' ' + (r.s || '')), d: r.d, t: r.t, sub: (TYPE_LABEL[r.y] || r.y) + ' · ' + (r.s || '') + ' · ' + String(r.m || '').slice(0, 160), go: function () { closeTerm(); openRecord(r); } });
    });
    if (!words.length && !yf) out = out.filter(function (x) { return x.k !== 'doc'; });
    out.sort(function (a, b) { return words.length ? (b.sc - a.sc || a.sort - b.sort || String(a.d || '').localeCompare(String(b.d || ''))) : (a.sort - b.sort || String(a.d || '').localeCompare(String(b.d || ''))); });
    return out;
  }
  function runTerm() {
    var q = $('term-q').value.trim(), list = $('term-list');
    var res = termResults(q);
    list.innerHTML = '';
    $('term-meta').textContent = (RECORDS ? '' : 'Loading the archive… ') + res.length + ' result' + (res.length === 1 ? '' : 's') + (q ? ' for “' + q + '”' : '') + (RECORDS ? ' · ' + RECORDS.length + ' documents, ' + AREAS.length + ' area profiles, ' + SITES.length + ' mapped places' : '');
    res.slice(0, 200).forEach(function (x) {
      list.appendChild(h('button', { class: 'trow k-' + x.k, onclick: x.go }, [h('span', { class: 'tk', text: { place: 'PLACE', area: 'AREA', doc: 'DOC', event: 'EVENT' }[x.k] }), h('span', { class: 'td', text: x.d || '' }), h('span', { class: 'tt' }, [h('b', { text: x.t }), h('small', { text: x.sub })])]));
    });
    if (res.length > 200) list.appendChild(h('p', { class: 'd-text muted', text: 'Showing the first 200. Add words or a year to narrow it down.' }));
  }
  TERM_KINDS.forEach(function (k) {
    $('term-kinds').appendChild(h('button', { 'aria-pressed': k[0] === termKind ? 'true' : 'false', 'data-k': k[0], text: k[1], onclick: function () {
      termKind = k[0]; document.querySelectorAll('#term-kinds button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === termKind ? 'true' : 'false'); }); runTerm(); } }));
  });
  var termTimer;
  $('term-q').addEventListener('input', function () { clearTimeout(termTimer); termTimer = setTimeout(runTerm, 120); });
  $('term-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') { var f = $('term-list').querySelector('button'); if (f) f.click(); } });
  $('term-close').onclick = closeTerm;
  $('term').addEventListener('click', function (e) { if (e.target.id === 'term') closeTerm(); });
  $('btn-search').onclick = function () { openTerm(); };
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openTerm(); }
  });


  /* ---------- chat guide (agent loop) ---------- */
  var convo = [];
  var CATALOG = SITES.map(function (s) { return [s.id, s.name, LAYERS[s.layer].label, s.period, s.relevance].join(' | '); }).join('\n') +
    '\nKnown but with no map location: ' + UNPLACED.map(function (u) { return u.name + ' (' + u.when + ')'; }).join('; ') +
    '\nArea profiles available through get_area: ' + (window.ATLAS_AREAS || []).map(function (a) { return a.name; }).join(', ');
  var STARTERS = ['Where were political prisoners held?', 'What do US documents say about the 1986 raid?', 'Show me only the massacres', 'What was Bab al-Aziziya?', 'Take me to Ben Ashour on satellite'];
  var PERIOD_KEYS = { before_1969: 'pre', from_1969_to_1989: 'main', after_1989: 'post' };
  var DISPLAY_KEYS = { district_names: 'districts', uncertainty_rings: 'rings', place_names: 'labels', grid: 'grid', timeline: 'timeline' };
  function scrollChat() { var l = $('chat-log'); l.scrollTop = l.scrollHeight; }
  function bubble(role, text) {
    var m = h('div', { class: 'msg ' + (role === 'user' ? 'me' : 'bot') }, [h('p', { text: text })]);
    $('chat-log').appendChild(m); scrollChat();
    return m;
  }
  function openChat() {
    if ($('chat-panel').hidden) {
      $('chat-panel').hidden = false; document.body.classList.add('chat-open');
      if (!DESKTOP.matches) { closePanel('drawer'); closePanel('sheet'); }
      if (!$('chat-log').children.length) greet();
    }
    scrollChat();
  }
  function closeChat() { $('chat-panel').hidden = true; document.body.classList.remove('chat-open'); $('chat-input').blur(); }
  function greet() {
    var m = bubble('bot', 'Ask me anything about Tripoli under Gaddafi, before and since, or tell me what to show. I can search the archive of documents and the web. I can change the map for you, and if something isn’t here yet I can help you ask ' + OWNER + ' to look into it.');
    var box = h('div', { class: 'acts' });
    STARTERS.forEach(function (t) { box.appendChild(h('button', { class: 'act', text: t, onclick: function () { send(t); } })); });
    m.appendChild(box);
  }
  function codeCard(after) {
    var input = h('input', { type: 'password', autocomplete: 'off', autocapitalize: 'none', 'aria-label': 'Family password' });
    var card = h('div', { class: 'msg bot' }, [h('p', { text: 'Type the family password first. You only need to do this once.' }), h('div', { class: 'field' }, [input]),
      h('button', { class: 'btn primary', text: 'Continue', onclick: function () { var c = input.value.trim(); if (!c) { input.focus(); return; } store.set('code', c); card.remove(); after(); } })]);
    $('chat-log').appendChild(card); scrollChat(); input.focus();
  }
  function requestCard(title, details) {
    var t = h('input', { type: 'text', value: title || '', placeholder: 'What should be looked into?', 'aria-label': 'Request title' });
    var d = h('textarea', { placeholder: 'Details: names, places, years, anything you remember', 'aria-label': 'Request details' });
    d.value = details || '';
    var n = h('input', { type: 'text', value: store.get('name', ''), placeholder: 'Your name (optional)', 'aria-label': 'Your name' });
    var msg = h('small', { 'aria-live': 'polite' });
    var go = h('button', { class: 'btn primary', text: 'Send to ' + OWNER });
    var card = h('div', { class: 'msg bot req' }, [h('b', { text: 'Ask ' + OWNER + ' to investigate or add this' }), h('div', { class: 'field' }, [t]), h('div', { class: 'field' }, [d]), h('div', { class: 'field' }, [n]), go, msg]);
    go.addEventListener('click', function () {
      var code = store.get('code', '');
      if (!code) { codeCard(function () { go.click(); }); return; }
      if (!t.value.trim() && !d.value.trim()) { msg.textContent = 'Write a few words about what to look into.'; return; }
      store.set('name', n.value.trim());
      go.disabled = true; msg.textContent = 'Sending…';
      var lastQ = convo.filter(function (x) { return x.role === 'user' && typeof x.content === 'string'; }).slice(-1)[0];
      relay(code, { request: { title: t.value.trim(), details: d.value.trim(), name: n.value.trim(), context: lastQ ? lastQ.content : '' } })
        .then(function () { card.innerHTML = ''; card.appendChild(h('p', { text: 'Sent. ' + OWNER + ' will see your request: “' + (t.value.trim() || d.value.trim().slice(0, 60)) + '”' })); scrollChat(); })
        .catch(function (e) { go.disabled = false; msg.textContent = e.code === 503 ? 'Requests are not switched on yet. Please tell ' + OWNER + ' directly.' : e.code === 401 ? 'The family password was not accepted.' : 'Could not send right now. Try again in a moment.'; });
    });
    $('chat-log').appendChild(card); scrollChat();
    return card;
  }

  /* map state and tools the agent can use */
  function onOff(obj, keys) { return keys.filter(function (k) { return obj[k]; }); }
  function mapState() {
    var c = map.getCenter();
    return JSON.stringify({
      map_style: currentBase,
      periods: { before_1969: periods.pre, from_1969_to_1989: periods.main, after_1989: periods.post },
      historical_layers_on: onOff(active, Object.keys(LAYERS)),
      historical_layers_off: Object.keys(LAYERS).filter(function (k) { return !active[k]; }),
      today_layers_on: onOff(osmActive, Object.keys(OSM)),
      historical_maps_available: OVERLAYS.map(function (o) { return o.id + ' (' + o.year + ')'; }), historical_maps_on: OVERLAYS.filter(function (o) { return overlayOn[o.id]; }).map(function (o) { return o.id; }),
      display: { district_names: !!active.districts, uncertainty_rings: !!active.rings, place_names: !!active.labels, grid: !!active.grid, timeline: !!active.timeline },
      zoom: map.getZoom(), center: [+c.lat.toFixed(4), +c.lng.toFixed(4)],
      selected_place: selected || null,
      visible_places: SITES.filter(visible).length + ' of ' + SITES.length
    });
  }
  function syncInputs() {
    Object.keys(LAYERS).concat(['districts', 'rings', 'labels', 'grid', 'timeline']).forEach(function (k) { if (inputs[k]) inputs[k].checked = !!active[k]; });
    Object.keys(OSM).forEach(function (k) { if (inputs['osm-' + k]) inputs['osm-' + k].checked = !!osmActive[k]; });
    Object.keys(PERIODS).forEach(function (k) { var b = document.querySelector('#periods [data-k="' + k + '"]'); if (b) b.setAttribute('aria-pressed', periods[k] ? 'true' : 'false'); });
  }
  function visibleNames() { var v = SITES.filter(visible); return v.length ? v.map(function (s) { return s.name; }).join('; ') : 'none'; }
  function brief(s) { return { id: s.id, name: s.name, category: LAYERS[s.layer].label, when: s.period, visible: visible(s) }; }
  var ui = null; // per-turn collector: { log: [], chips: [], mapChanged: bool }
  var TOOLS = {
    get_map_state: function () { return mapState(); },
    search_places: function (a) {
      var q = String(a.query || '').toLowerCase().split(/\s+/).filter(Boolean);
      var res = SITES.filter(function (s) {
        if (a.layer && s.layer !== a.layer) return false;
        var r = span(s);
        if (a.year_from != null && r[1] < a.year_from) return false;
        if (a.year_to != null && r[0] > a.year_to) return false;
        if (!q.length) return true;
        var hay = (s.name + ' ' + (s.ar || '') + ' ' + s.relevance + ' ' + s.text + ' ' + LAYERS[s.layer].label).toLowerCase();
        return q.every(function (w) { return hay.indexOf(w) >= 0; });
      });
      return JSON.stringify({ count: res.length, places: res.map(brief) });
    },
    get_place: function (a) {
      var s = BY_ID[a.id];
      if (!s) return { error: 'No place with id ' + a.id };
      return JSON.stringify(Object.assign(brief(s), { arabic: s.ar || null, evidence: LEVELS[s.level], accuracy_km: s.r, lat: s.lat, lon: s.lon, why_it_matters: s.relevance, details: s.text,
        linked: linksFor(s.id).map(function (x) { return x.other.id + ': ' + x.why; }), sources: s.sources.map(function (x) { return x.t; }) }));
    },
    describe_spot: function (a) {
      var ll = L.latLng(+a.lat, +a.lon);
      if (isNaN(ll.lat) || isNaN(ll.lng)) return { error: 'Invalid coordinates' };
      var d = nearestDistrict(ll);
      var near = SITES.map(function (s) { return { s: s, m: map.distance(ll, [s.lat, s.lon]) }; }).filter(function (x) { return x.m < 3000; }).sort(function (x, y) { return x.m - y.m; }).slice(0, 5)
        .map(function (x) { return x.s.id + ' (' + km(x.m) + ')'; });
      var base = { nearest_district: d.name + ' (' + km(d.m) + ')', nearby_places: near };
      var ac = new AbortController(); setTimeout(function () { ac.abort(); }, 8000);
      return fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&accept-language=en&lat=' + ll.lat + '&lon=' + ll.lng, { signal: ac.signal })
        .then(function (r) { return r.json(); })
        .then(function (j) { base.address = j.display_name || null; return JSON.stringify(base); })
        .catch(function () { base.address = 'lookup unavailable'; return JSON.stringify(base); });
    },
    set_layers: function (a) {
      var keys = Object.keys(LAYERS), bad = [].concat(a.only || [], a.show || [], a.hide || []).filter(function (k) { return !LAYERS[k]; });
      if (bad.length) return { error: 'Unknown layers: ' + bad.join(', ') };
      if (a.only && a.only.length) keys.forEach(function (k) { active[k] = a.only.indexOf(k) >= 0; });
      (a.show || []).forEach(function (k) { active[k] = true; });
      (a.hide || []).forEach(function (k) { active[k] = false; });
      refresh(); syncInputs(); ui.mapChanged = true;
      var on = keys.filter(function (k) { return active[k]; });
      ui.log.push(on.length ? 'Showing ' + on.map(function (k) { return LAYERS[k].label.toLowerCase(); }).join(', ') : 'All history layers hidden');
      return 'Historical layers now on: ' + (on.join(', ') || 'none') + '. Visible places: ' + visibleNames() + '.';
    },
    set_today_layers: function (a) {
      var bad = [].concat(a.show || [], a.hide || []).filter(function (k) { return !OSM[k]; });
      if (bad.length) return { error: 'Unknown layers: ' + bad.join(', ') };
      (a.show || []).forEach(function (k) { osmActive[k] = true; });
      (a.hide || []).forEach(function (k) { osmActive[k] = false; map.removeLayer(osmGroups[k]); });
      store.set('osm', osmActive); syncInputs(); ui.mapChanged = true;
      var need = (a.show || []).map(function (k) { return OSM[k].minZoom; }).reduce(function (x, y) { return Math.max(x, y); }, 0);
      var note = '';
      if (need && map.getZoom() < need) { map.setZoom(need); note = ' Zoomed in to level ' + need + ' so they can load.'; }
      refreshOSM();
      if ((a.show || []).length) ui.log.push('Turned on ' + a.show.map(function (k) { return OSM[k].label.toLowerCase(); }).join(', '));
      if ((a.hide || []).length) ui.log.push('Turned off ' + a.hide.map(function (k) { return OSM[k].label.toLowerCase(); }).join(', '));
      return 'Present-day layers now on: ' + (onOff(osmActive, Object.keys(OSM)).join(', ') || 'none') + '. They load from OpenStreetMap over the next few seconds.' + note;
    },
    set_basemap: function (a) {
      if (!BASEMAPS[a.style]) return { error: 'Unknown style ' + a.style };
      setBase(a.style); ui.mapChanged = true; ui.log.push('Switched to ' + BASEMAPS[a.style].name.toLowerCase() + ' view');
      return 'Map style is now ' + a.style + '.';
    },
    set_periods: function (a) {
      Object.keys(PERIOD_KEYS).forEach(function (k) { if (typeof a[k] === 'boolean') periods[PERIOD_KEYS[k]] = a[k]; });
      refresh(); syncInputs(); ui.mapChanged = true;
      var on = Object.keys(PERIODS).filter(function (k) { return periods[k]; }).map(function (k) { return PERIODS[k]; });
      ui.log.push('Time period: ' + (on.join(', ') || 'none'));
      return 'Periods shown: ' + (on.join(', ') || 'none') + '. Visible places: ' + visibleNames() + '.';
    },
    set_display: function (a) {
      var changed = [];
      Object.keys(DISPLAY_KEYS).forEach(function (k) { if (typeof a[k] === 'boolean') { active[DISPLAY_KEYS[k]] = a[k]; changed.push(k.replace(/_/g, ' ') + (a[k] ? ' on' : ' off')); } });
      refresh(); syncInputs(); ui.mapChanged = true;
      if (changed.length) ui.log.push(changed.join(', '));
      return 'Display updated: ' + (changed.join(', ') || 'nothing changed') + '.';
    },
    fly_to: function (a) {
      ui.mapChanged = true;
      if (a.place_ids && a.place_ids.length) {
        var ss = a.place_ids.map(function (id) { return BY_ID[id]; }).filter(Boolean);
        if (!ss.length) return { error: 'No matching place ids' };
        ss.forEach(ensureVisible);
        if (ss.length === 1) { map.flyTo([ss[0].lat, ss[0].lon], Math.max(map.getZoom(), 15), { duration: 0.8 }); markSelected(ss[0].id); }
        else map.flyToBounds(L.latLngBounds(ss.map(function (s) { return [s.lat, s.lon]; })).pad(0.3), { duration: 0.8, maxZoom: 15 });
        ui.log.push('Moved map to ' + ss.map(function (s) { return s.name; }).join(', '));
        ss.slice(0, 3).forEach(function (s) { ui.chips.push(s); });
        return 'Map now shows: ' + ss.map(function (s) { return s.name; }).join(', ') + '.';
      }
      if (a.whole_city) { map.flyToBounds(HOME, { duration: 0.8 }); ui.log.push('Showing all of Tripoli'); return 'Map shows all of Tripoli.'; }
      if (a.district) {
        var want = String(a.district).toLowerCase().replace(/[^a-z]/g, '');
        var d = DISTRICTS.filter(function (x) { return x[0].toLowerCase().replace(/[^a-z]/g, '') === want || x[1] === a.district; })[0]
          || DISTRICTS.filter(function (x) { var n = x[0].toLowerCase().replace(/[^a-z]/g, ''); return n.indexOf(want) >= 0 || want.indexOf(n) >= 0; })[0];
        if (!d) return { error: 'Unknown district. Known districts: ' + DISTRICTS.map(function (x) { return x[0]; }).join(', ') };
        map.flyTo([d[2], d[3]], a.zoom || 15, { duration: 0.8 }); ui.log.push('Moved map to ' + d[0]);
        return 'Map centred on ' + d[0] + ' (approximate district centre).';
      }
      if (a.lat != null && a.lon != null) {
        var z = Math.min(18, Math.max(10, a.zoom || 15));
        map.flyTo([+a.lat, +a.lon], z, { duration: 0.8 }); ui.log.push('Moved map to ' + (+a.lat).toFixed(4) + ', ' + (+a.lon).toFixed(4));
        return 'Map centred on ' + a.lat + ', ' + a.lon + ' at zoom ' + z + '.';
      }
      return { error: 'Give place_ids, district, lat/lon or whole_city.' };
    },
    open_place: function (a) {
      var s = BY_ID[a.id];
      if (!s) return { error: 'No place with id ' + a.id };
      ensureVisible(s); ui.mapChanged = true;
      if (DESKTOP.matches) { openSite(s); map.flyTo([s.lat, s.lon], Math.max(map.getZoom(), 15), { duration: 0.8 }); ui.log.push('Opened ' + s.name); return 'Details panel for ' + s.name + ' is open.'; }
      ui.chips.push(s); ui.log.push('Added a button to open ' + s.name);
      return 'On this phone a button to open ' + s.name + ' was added under your reply.';
    },
    set_historical_map: function (a) {
      if (!OVERLAYS.length) return { error: 'No historical maps are available yet.' };
      if (a.id === 'none' || a.show === false) { OVERLAYS.forEach(function (o) { if (a.id === 'none' || o.id === a.id) setOverlay(o.id, false); }); ui.mapChanged = true; ui.log.push('Historical map hidden'); return 'Historical maps hidden.'; }
      var o = OVERLAYS.filter(function (x) { return x.id === a.id || String(x.year) === String(a.year); })[0];
      if (!o) return { error: 'Unknown map. Available: ' + OVERLAYS.map(function (x) { return x.id + ' (' + x.year + ')'; }).join(', ') };
      setOverlay(o.id, true);
      if (a.opacity) { overlayOpacity[o.id] = Math.max(0.2, Math.min(1, +a.opacity)); overlayLayers[o.id].setOpacity(overlayOpacity[o.id]); }
      if (!map.getBounds().intersects(o.bounds)) map.flyToBounds(o.bounds, { duration: 0.8 });
      ui.mapChanged = true; ui.log.push('Showing the ' + o.year + ' map');
      return 'Showing ' + o.title + '.';
    },
    search_archive: function (a) {
      return loadRecords().then(function () {
        var words = String(a.query || '').split(/\s+/).filter(function (w) { return w.length > 2; });
        var res = scoreRecords({ words: words.length ? [a.query].concat(words) : [], places: a.place_id ? [a.place_id] : [], year_from: a.year_from, year_to: a.year_to, type: a.type });
        if (!words.length && !a.place_id) res = (RECORDS || []).filter(function (r) { var y = +(r.d || '0').slice(0, 4); return (!a.year_from || y >= a.year_from) && (!a.year_to || y <= a.year_to) && (!a.type || r.y === a.type); });
        var n = Math.min(20, a.limit || 10);
        return JSON.stringify({ total: res.length, records: res.slice(0, n).map(function (r) { return { id: r.i, date: r.d, type: r.y, title: r.t, source: r.s, places: r.p, summary: String(r.m || '').slice(0, 500) }; }) });
      });
    },
    get_record: function (a) {
      return loadRecords().then(function () {
        var r = REC_BY_ID[a.id]; if (!r) return { error: 'No record with id ' + a.id };
        var base = { id: r.i, date: r.d, type: r.y, title: r.t, source: r.c || r.s, held_at: r.a || null, places: r.p, summary: r.m, link: r.u, rights: r.rn };
        if (!r.f) return JSON.stringify(base);
        return fetch('data/docs/' + encodeURIComponent(r.i) + '.txt').then(function (x) { return x.ok ? x.text() : ''; }).then(function (t) { base.full_text = String(t).slice(0, 5000); return JSON.stringify(base); }).catch(function () { return JSON.stringify(base); });
      });
    },
    get_area: function (a) {
      var ar = a.name ? areaByName(a.name) : null;
      if (!ar && a.lat != null) { var x = areaAt(L.latLng(+a.lat, +a.lon)); ar = x && x.a; }
      if (!ar) return { error: 'No profile found. Known areas include: ' + AREAS.slice(0, 60).map(function (x) { return x.name; }).join(', ') };
      return JSON.stringify({ id: ar.id, name: ar.name, arabic: ar.ar, kind: ar.kind, lat: ar.lat, lon: ar.lon, summary: ar.summary, history: ar.history, gaddafi_era: ar.era, today: ar.today, uncertain: ar.uncertain, sources: (ar.sources || []).map(function (x) { return x.t; }) });
    },
    open_record: function (a) {
      return loadRecords().then(function () {
        var r = REC_BY_ID[a.id]; if (!r) return { error: 'No record with id ' + a.id };
        ui.docs.push(r); ui.log.push('Added a button to open “' + r.t.slice(0, 60) + '”');
        return 'A button to open the document was added under your reply.';
      });
    },
    suggest_request: function (a) { ui.requests.push(a); return 'The request form is shown to the reader, filled in with: ' + (a.title || '') + '.'; }
  };
  var STEP_LABEL = { get_map_state: 'Checking the map', search_places: 'Searching the map', get_place: 'Reading place details', describe_spot: 'Looking up the area',
    set_layers: 'Changing layers', set_today_layers: 'Loading present-day layers', set_basemap: 'Changing the map style', set_periods: 'Changing the time period',
    set_display: 'Adjusting the display', fly_to: 'Moving the map', open_place: 'Opening the place', suggest_request: 'Preparing a request',
    search_archive: 'Searching the archive', set_historical_map: 'Laying an old map over the city', get_record: 'Reading a document', get_area: 'Reading the area profile', open_record: 'Opening a document', web_search: 'Searching the web' };
  function runTool(name, input) {
    try {
      var fn = TOOLS[name];
      var r = fn ? fn(input || {}) : { error: 'Unknown tool ' + name };
      return Promise.resolve(r).then(function (v) { return typeof v === 'string' ? { content: v } : { content: v.error || JSON.stringify(v), is_error: !!v.error }; });
    } catch (e) { return Promise.resolve({ content: 'Tool failed: ' + e.message, is_error: true }); }
  }
  function trimConvo() {
    while (convo.length > 30) {
      convo.shift();
      while (convo.length && !(convo[0].role === 'user' && typeof convo[0].content === 'string')) convo.shift();
    }
  }
  var MAX_STEPS = 8;
  function runAgent(code, setStatus) {
    var steps = 0, lastText = '';
    function step() {
      steps++;
      return relay(code, { agent: true, messages: convo, catalog: CATALOG, state: mapState() }).then(function (j) {
        (j.sources || []).forEach(function (x) { if (!ui.sources.some(function (y) { return y.url === x.url; })) ui.sources.push(x); });
        var content = (j.content || []).filter(function (b) { return b && (b.type === 'text' || b.type === 'tool_use'); });
        if (!content.length) content = [{ type: 'text', text: lastText || 'I don’t have an answer for that.' }];
        convo.push({ role: 'assistant', content: content });
        var text = content.filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('\n').trim();
        if (text) lastText = text;
        var uses = content.filter(function (b) { return b.type === 'tool_use'; });
        if (!uses.length) return lastText;
        setStatus(uses.map(function (u) { return STEP_LABEL[u.name] || 'Working'; }).join(' · ') + '…');
        var chain = Promise.resolve(), results = [];
        uses.forEach(function (u) { chain = chain.then(function () { return runTool(u.name, u.input).then(function (r) { results.push({ type: 'tool_result', tool_use_id: u.id, content: r.content, is_error: !!r.is_error }); }); }); });
        return chain.then(function () {
          if (steps >= MAX_STEPS) { results.forEach(function (r) { r.content += ' (Step limit reached: give your final answer now.)'; }); }
          convo.push({ role: 'user', content: results });
          if (steps >= MAX_STEPS + 1) return lastText;
          return step();
        });
      });
    }
    return step();
  }
  function send(text) {
    text = (text || '').trim();
    if (!text || $('chat-send').disabled) return;
    openChat();
    var code = store.get('code', '');
    if (!code) { codeCard(function () { send(text); }); return; }
    trimConvo();
    var mark = convo.length;
    convo.push({ role: 'user', content: text });
    bubble('user', text);
    $('chat-input').value = '';
    var wait = bubble('bot', 'Thinking…'); wait.classList.add('wait');
    $('chat-send').disabled = true;
    ui = { log: [], chips: [], requests: [], docs: [], sources: [], mapChanged: false };
    runAgent(code, function (s) { wait.querySelector('p').textContent = s; scrollChat(); })
      .then(function (reply) {
        wait.remove();
        var m = bubble('bot', reply || (ui.log.length ? 'Done.' : 'I don’t have an answer for that.'));
        if (ui.log.length) m.appendChild(h('ul', { class: 'did' }, ui.log.map(function (x) { return h('li', { text: x }); })));
        var box = h('div', { class: 'acts' }), seen = {};
        ui.chips.forEach(function (s) { if (seen[s.id]) return; seen[s.id] = 1; box.appendChild(h('button', { class: 'act', onclick: function () { if (!DESKTOP.matches) closeChat(); focusSite(s); } }, [glyph(s.layer), h('span', { text: 'Open ' + s.name })])); });
        ui.docs.forEach(function (r) { box.appendChild(h('button', { class: 'act', onclick: function () { if (!DESKTOP.matches) closeChat(); openRecord(r); } }, [h('span', { class: 'dtag', text: TYPE_LABEL[r.y] || 'Doc' }), h('span', { text: r.t.slice(0, 80) })])); });
        if (ui.mapChanged && !DESKTOP.matches) box.appendChild(h('button', { class: 'act', text: 'View the map ↓', onclick: closeChat }));
        if (ui.sources.length) m.appendChild(h('details', { class: 'ai-src' }, [h('summary', { text: 'Web sources (' + ui.sources.length + ')' }), h('ol', {}, ui.sources.map(function (x) { return h('li', {}, [h('a', { href: x.url, target: '_blank', rel: 'noopener', text: x.title })]); }))]));
        if (box.children.length) m.appendChild(box);
        ui.requests.forEach(function (r) { requestCard(r.title, r.details); });
        scrollChat();
      })
      .catch(function (e) {
        wait.remove();
        convo.length = mark;
        if (e.code === 401) { store.set('code', ''); codeCard(function () { send(text); }); return; }
        var m = bubble('bot', e.code === 402 ? 'AI answers are paused because the AI credit has run out. Let ' + OWNER + ' know.'
          : e.code === 429 ? 'Too many questions just now. Wait a minute and try again.'
          : 'I couldn’t reach the AI right now. Check your connection and try again.');
        m.classList.add('err');
      })
      .then(function () { $('chat-send').disabled = false; });
  }
  if (CFG.aiEndpoint) {
    $('chat').hidden = false;
    document.documentElement.classList.add('has-chat');
    $('chat-form').addEventListener('submit', function (e) { e.preventDefault(); send($('chat-input').value); });
    $('chat-input').addEventListener('focus', openChat);
    $('chat-close').onclick = closeChat;
    $('chat-suggest').onclick = function () { openChat(); requestCard('', ''); };
  }

  if (GATED) store.set('code', 'session');

  /* ---------- welcome password ---------- */
  function showTip() { if (!store.get('tipSeen', false)) $('tip').hidden = false; }
  function closeWelcome() { $('welcome').hidden = true; showTip(); }
  function maybeWelcome() {
    if (!CFG.aiEndpoint || store.get('code', '') || session.get('skip')) { showTip(); return; }
    $('welcome').hidden = false;
    setTimeout(function () { $('wel-code').focus(); }, 50);
  }
  $('wel-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var code = $('wel-code').value.trim(), msg = $('wel-msg');
    msg.classList.remove('err');
    if (!code) { msg.classList.add('err'); msg.textContent = 'Type the password, or tap Skip for now.'; return; }
    $('wel-go').disabled = true; msg.textContent = 'Checking…';
    relay(code, { status: true })
      .then(function () { store.set('code', code); closeWelcome(); status('AI answers are on.', 2500); })
      .catch(function (err) {
        if (err.code === 401) { msg.classList.add('err'); msg.textContent = 'That password isn’t right. Please try again.'; $('wel-code').select(); return; }
        store.set('code', code); closeWelcome(); status('Password saved. It will be checked when you ask a question.', 4000);
      })
      .then(function () { $('wel-go').disabled = false; });
  });
  $('wel-skip').onclick = function () { session.set('skip', '1'); closeWelcome(); };

  /* ---------- settings, tip, text size ---------- */
  function setSize(sz) {
    document.documentElement.classList.remove('big', 'huge');
    if (sz === 'big' || sz === 'huge') document.documentElement.classList.add(sz);
    document.querySelectorAll('#sizes button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.size === sz ? 'true' : 'false'); });
    store.set('size', sz);
    if ($('credit') && !$('credit').hidden) fitBanner();
  }
  document.querySelectorAll('#sizes button').forEach(function (b) { b.addEventListener('click', function () { setSize(b.dataset.size); }); });
  function openSettings() {
    $('settings').hidden = false;
    $('code-field').hidden = !CFG.aiEndpoint || GATED;
    $('sign-out').hidden = !GATED;
    $('family-code').value = store.get('code', '');
    $('set-close').focus();
  }
  function closeSettings() { if (CFG.aiEndpoint && !GATED) store.set('code', $('family-code').value.trim()); $('settings').hidden = true; }
  $('btn-settings').onclick = openSettings;
  $('btn-settings-2').onclick = function () { if (!DESKTOP.matches) closePanel('drawer'); openSettings(); };
  $('set-close').onclick = closeSettings;
  $('settings').addEventListener('click', function (e) { if (e.target.id === 'settings') closeSettings(); });
  $('tip-ok').onclick = function () { $('tip').hidden = true; store.set('tipSeen', true); };
  $('tip-again').onclick = function () { closeSettings(); $('tip').hidden = false; };
  if (DESKTOP.matches) $('tip-text').textContent = 'Click any marker to read about it. Right-click anywhere on the map to ask about that spot.';

  $('btn-layers').onclick = function () { $('drawer').classList.contains('open') ? closePanel('drawer') : openPanel('drawer'); };
  $('drawer-close').onclick = function () { closePanel('drawer'); };
  $('sheet-close').onclick = function () { closePanel('sheet'); };
  $('reset-view').onclick = function () { map.flyToBounds(HOME, { duration: 0.8 }); if (!DESKTOP.matches) closePanel('drawer'); };
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('term').hidden) closeTerm();
    else if (picking) setPicking(false);
    else if (!$('chat-panel').hidden) closeChat();
    else if (!$('settings').hidden) closeSettings();
    else if ($('sheet').classList.contains('open')) closePanel('sheet');
    else closePanel('drawer');
  });

  /* ---------- start ---------- */
  setSize(store.get('size', 'normal'));
  setBase(store.get('base', 'dark'));
  refresh();
  refreshOSM();
  hud(map.getCenter());
  if (DESKTOP.matches) openPanel('drawer');
  maybeWelcome();
  var code = store.get('code', '');
  if (CFG.aiEndpoint && code) relay(code, { status: true }).catch(function () {});
})();
