(function () {
  'use strict';

  var CFG = window.ATLAS_CONFIG || {};
  var LAYERS = window.ATLAS_LAYERS, LEVELS = window.ATLAS_LEVELS, SITES = window.ATLAS_SITES;
  var QS = window.ATLAS_QUESTIONS || {}, SPOTQ = window.ATLAS_SPOT_QUESTIONS || [], FEATQ = window.ATLAS_FEATURE_QUESTIONS || {};
  var LINKS = window.ATLAS_LINKS || [], UNPLACED = (window.ATLAS_UNPLACED || []).concat(window.ATLAS_UNPLACED_MORE || []), DISTRICTS = window.ATLAS_DISTRICTS;
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
  var LAYER_ICON = { massacre: '<svg class="noose" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5v5.2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/><rect x="9" y="5.4" width="6" height="8.2" rx="1.6" fill="currentColor"/><path d="M9.4 7.4h5.2M9.4 9.5h5.2M9.4 11.6h5.2" stroke="rgba(0,0,0,.35)" stroke-width=".9"/><ellipse cx="12" cy="18" rx="4.6" ry="4.8" stroke="currentColor" stroke-width="2.2" fill="none"/></svg>' };
  function codeHtml(k) { return LAYER_ICON[k] || LAYERS[k].code; }
  var SITE_ICON = { university: '<svg class="noose" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3 1 9l11 6 9-4.9V17h2V9zM5 13.2v4L12 21l7-3.8v-4L12 17z"/></svg>' };
  function siteCode(s) { return SITE_ICON[s.icon] || codeHtml(s.layer); }
  function glyph(layerKey, size) {
    var lay = LAYERS[layerKey];
    var g = h('span', { class: 'glyph ' + lay.shape, style: 'background:' + lay.color + (size ? ';width:' + size + 'px;height:' + size + 'px' : '') }, [h('span', { html: codeHtml(layerKey) })]);
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
    light: { name: 'Light', note: 'Clean grey map', layers: [
      L.tileLayer(ESRI + 'Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, maxZoom: 19, attribution: 'Basemap &copy; Esri, HERE, Garmin, ' + OSM_ATTR }),
      L.tileLayer(ESRI + 'Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, maxZoom: 19 })
    ] },
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
    if (!BASEMAPS[key]) key = 'light';
    if (currentBase) BASEMAPS[currentBase].layers.forEach(function (l) { map.removeLayer(l); });
    BASEMAPS[key].layers.forEach(function (l) { l.addTo(map); });
    currentBase = key; store.set('base2', key);
    document.querySelectorAll('#basemaps button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.key === key ? 'true' : 'false'); });
  }
  Object.keys(BASEMAPS).forEach(function (k) {
    var tz = 12, tx = Math.floor((13.19 + 180) / 360 * Math.pow(2, tz)), la = 32.885 * Math.PI / 180,
        ty = Math.floor((1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2 * Math.pow(2, tz));
    var tile = { light: ESRI + 'Canvas/World_Light_Gray_Base/MapServer/tile/' + tz + '/' + ty + '/' + tx, dark: ESRI + 'Canvas/World_Dark_Gray_Base/MapServer/tile/' + tz + '/' + ty + '/' + tx,
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
    var icon = L.divIcon({ className: '', iconSize: [28, 36], iconAnchor: [14 - s.dx, 36 - s.dy],
      html: '<div class="mk ' + lay.shape + ' v-' + s.level + '" style="--c:' + lay.color + '"><b>' + siteCode(s) + '</b></div>' });
    markers[s.id] = L.marker([s.lat, s.lon], { icon: icon, title: s.name, keyboard: true, riseOnHover: true })
      .bindTooltip(s.name, { permanent: true, direction: 'right', offset: [16 + s.dx, -22 + s.dy], className: 'site-label', interactive: false })
      .on('click', function () { openSite(s); })
      .on('mouseover', function () { hoverCard([s.lat, s.lon], lay.color, siteCode(s), s.name, [['When', s.period], ['Type', lay.label], ['Evidence', LEVELS[s.level]], ['Accuracy', '± ' + s.r + ' km']], [-s.dx, -36 + s.dy]); })
      .on('mouseout', hideCard);
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

  /* opacity by time: drag the timeline cursor; places appear when they occur, are bright while active and fade after */
  var timeYear = null, playTimer = null;
  function activeAt(s, y) { var r = span(s); return y >= r[0] && y <= r[1] + (r[1] === r[0] ? 1 : 0); }
  var cardTip = null;
  function hoverCard(ll, color, code, title, rows, off) {
    if (!DESKTOP.matches) return;
    var html = '<div class="fy-card" style="--c:' + color + '"><div class="ch"><i>' + (/^<svg/.test(code) ? code : esc(code)) + '</i>' + esc(title) + '</div>' +
      rows.filter(function (r) { return r[1]; }).map(function (r) { return '<div class="cr"><span>' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></div>'; }).join('') + '</div>';
    if (!cardTip) cardTip = L.tooltip({ direction: 'top', className: 'fy-tip', opacity: 1, interactive: false });
    cardTip.options.offset = off || [0, -20];
    cardTip.setLatLng(ll).setContent(html); map.openTooltip(cardTip);
  }
  function hideCard() { if (cardTip) map.closeTooltip(cardTip); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function refresh() {
    SITES.forEach(function (s) {
      var on = visible(s) && (timeYear == null || span(s)[0] <= timeYear) && (!timeRange || (span(s)[1] >= timeRange[0] && span(s)[0] <= timeRange[1]));
      if (on) { if (!siteLayer.hasLayer(markers[s.id])) siteLayer.addLayer(markers[s.id]); markers[s.id].setOpacity(timeYear == null || activeAt(s, timeYear) ? 1 : 0.3); }
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
    declutter();
    if (typeof syncEraChips === 'function') syncEraChips();
    if (selected) markSelected(selected);
    save();
  }
  /* keep map labels from overlapping: place labels in priority order and hide any that would collide */
  var declutterTimer;
  function declutter() {
    clearTimeout(declutterTimer);
    declutterTimer = setTimeout(function () {
      var c = map.getContainer();
      var els = [].slice.call(c.querySelectorAll('.leaflet-tooltip.site-label')).concat([].slice.call(c.querySelectorAll('.district')));
      els.forEach(function (e) { e.classList.remove('lbl-hide'); });
      var placed = [], marks = [].slice.call(c.querySelectorAll('.leaflet-marker-icon .mk')).map(function (m) { return m.getBoundingClientRect(); });
      var hit = function (r, list, pad) { return list.some(function (q) { return r.left < q.right + pad && r.right > q.left - pad && r.top < q.bottom + pad && r.bottom > q.top - pad; }); };
      els.forEach(function (e) {
        var r = e.getBoundingClientRect(); if (!r.width) return;
        var isDistrict = e.classList.contains('district');
        if (hit(r, placed, 3) || (isDistrict && hit(r, marks, 0))) e.classList.add('lbl-hide'); else placed.push(r);
      });
    }, 60);
  }
  map.on('zoomend moveend', declutter);
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
    military: 'Bases and training sites', airstrike: 'The April 1986 US raid', massacre: 'Killings, executions and crackdowns',
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
  // Time period: the same historical periods as the timeline; one at a time, or all years
  periods.pre = periods.main = periods.post = true;
  function buildEraChips() {
    var box = $('periods'); box.innerHTML = '';
    box.appendChild(h('button', { 'data-era': 'all', 'aria-pressed': 'true', text: 'All years', onclick: function () { stopPlay(); timeRange = null; timeYear = null; refresh(); } }));
    ERAS.forEach(function (e) {
      box.appendChild(h('button', { 'data-era': e[0] + '-' + e[1], 'aria-pressed': 'false', title: e[2] + ', ' + e[0] + '–' + e[1], onclick: function () { stopPlay(); timeYear = null; timeRange = timeRange && timeRange[0] === e[0] && timeRange[1] === e[1] ? null : [e[0], e[1]]; refresh(); } },
        [e[2], h('small', { text: e[0] + '–' + (e[1] === 2026 ? 'today' : e[1]) })]));
    });
  }
  function syncEraChips() {
    var key = timeRange ? timeRange[0] + '-' + timeRange[1] : 'all';
    document.querySelectorAll('#periods button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.era === key ? 'true' : 'false'); });
  }
  setTimeout(buildEraChips, 0);
  function ensureVisible(s) {
    var changed = false;
    if ((timeRange && !(span(s)[1] >= timeRange[0] && span(s)[0] <= timeRange[1])) || (timeYear != null && span(s)[0] > timeYear)) { timeRange = null; timeYear = null; stopPlay(); changed = true; }
    if (!active[s.layer]) { active[s.layer] = true; inputs[s.layer].checked = true; changed = true; if (typeof syncGroups === 'function') setTimeout(syncGroups, 0); }
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
  /* timeline: one lane per subject, years run left to right; spans show how long a place was in use */
  function tx(y) {
    if (y < 1969) return 0.17 * Math.max(0, y - 1905) / 64;
    if (y <= 2012) return 0.17 + 0.75 * (y - 1969) / 43;
    return 0.92 + 0.08 * (Math.min(y, 2026) - 2012) / 14;
  }
  var ERAS = [[1905, 1911, 'Ottoman', 'Ott.'], [1911, 1943, 'Italian colony', 'Italian'], [1943, 1951, 'British rule', 'UK'], [1951, 1969, 'Kingdom of Libya', 'Kingdom'],
    [1969, 1977, 'Revolution', 'Revolution'], [1977, 1986, 'Jamahiriya and terror', 'Jamahiriya'], [1986, 1992, 'US raid and Lockerbie', '1986–92'],
    [1992, 2003, 'UN sanctions', 'Sanctions'], [2003, 2011, 'Opening to the West', 'Opening'], [2011, 2012, '2011 uprising and war', '2011'], [2012, 2026, 'After Gaddafi', 'After']];
  var timeRange = null;
  function pos(f) { return 'calc(14px + ' + f.toFixed(4) + ' * (100% - 28px))'; }
  var TL_LANES = [['Prisons & security', ['detention', 'security']], ['Military', ['military', 'airstrike']], ['Killings', ['massacre']], ['Power', ['power']], ['Landmarks', ['landmark']]];
  function drawTimeline() {
    var tl = $('timeline');
    tl.querySelectorAll('.tl-lane,.tl-lab,.tl-axis,.tl-band,.tl-tick,.tl-dot,.tl-span,.tl-bar,.tl-hint,.tl-hit,.tl-cursor,.tl-ctrl,.tl-era,.tl-grid').forEach(function (e) { e.remove(); });
    var L0 = 118, R0 = 14, W = Math.max(200, tl.clientWidth - L0 - R0), TOP = 42, LH = 15;
    var X = function (y) { return L0 + tx(y) * W; };
    tl.querySelectorAll('.tl-era,.tl-grid').forEach(function (e) { e.remove(); });
    ERAS.forEach(function (e, i) {
      var x0 = X(e[0]), w = X(e[1]) - x0, sel = timeRange && timeRange[0] === e[0] && timeRange[1] === e[1];
      var label = w > e[2].length * 5.6 + 10 ? e[2] : w > e[3].length * 5.4 + 4 ? e[3] : w > 22 ? e[3].slice(0, 3) + '.' : '';
      tl.appendChild(h('button', { class: 'tl-era' + (i % 2 ? ' alt' : '') + (sel ? ' sel' : ''), style: 'left:' + x0.toFixed(1) + 'px;width:' + Math.max(2, w - 1).toFixed(1) + 'px', title: e[2] + ', ' + e[0] + '–' + e[1] + '. Click to show only this period.', 'aria-pressed': sel ? 'true' : 'false',
        text: label, onclick: function () { stopPlay(); timeYear = null; timeRange = sel ? null : [e[0], e[1]]; refresh(); } }));
      if (i) tl.appendChild(h('div', { class: 'tl-grid', style: 'left:' + x0.toFixed(1) + 'px;top:' + (TOP - 4) + 'px;height:' + (TL_LANES.length * LH + 8) + 'px' }));
    });
    tl.appendChild(h('div', { class: 'tl-band', style: 'left:' + X(1969).toFixed(1) + 'px;width:' + (X(2011.7) - X(1969)).toFixed(1) + 'px;top:' + (TOP - 4) + 'px;height:' + (TL_LANES.length * LH + 6) + 'px', title: 'Gaddafi era, 1969–2011' }));
    TL_LANES.forEach(function (lane, li) {
      var y = TOP + li * LH;
      tl.appendChild(h('div', { class: 'tl-lab', style: 'top:' + (y - 1) + 'px', text: lane[0] }));
      tl.appendChild(h('div', { class: 'tl-lane', style: 'top:' + (y + 6) + 'px;left:' + L0 + 'px;right:' + R0 + 'px' }));
      var used = {};
      SITES.filter(function (s) { return lane[1].indexOf(s.layer) >= 0 && s.y0 != null && visible(s); }).sort(function (a, b) { return a.y0 - b.y0; }).forEach(function (s) {
        var lay = LAYERS[s.layer], x0 = X(s.y0);
        if (s.y1 != null && s.y1 > s.y0) {
          tl.appendChild(h('div', { class: 'tl-span', title: s.name + ', ' + s.y0 + '–' + s.y1, style: 'left:' + x0.toFixed(1) + 'px;width:' + Math.max(2, X(s.y1) - x0).toFixed(1) + 'px;top:' + (y + 4) + 'px;background:' + lay.color + (timeRange && !(s.y1 >= timeRange[0] && s.y0 <= timeRange[1]) ? ';opacity:.12' : '') }));
        }
        var slot = Math.round(x0 / 9), n = 0; while (used[slot + n]) n++; used[slot + n] = 1;
        tl.appendChild(h('button', { class: 'tl-dot ' + lay.shape + (selected === s.id ? ' sel' : ''), title: s.y0 + (s.y1 && s.y1 > s.y0 ? '–' + s.y1 : '') + ' · ' + s.name, 'aria-label': s.y0 + ', ' + s.name,
          style: 'left:' + (x0 + n * 9).toFixed(1) + 'px;top:' + (y + 1) + 'px;background:' + lay.color + (timeRange && !(span(s)[1] >= timeRange[0] && span(s)[0] <= timeRange[1]) ? ';opacity:.15' : ''), onclick: function () { focusSite(s); } }));
      });
    });
    var axisY = TOP + TL_LANES.length * LH + 4;
    tl.appendChild(h('div', { class: 'tl-axis', style: 'top:' + axisY + 'px;left:' + L0 + 'px;right:' + R0 + 'px' }));
    var last = -99;
    [1911, 1945, 1951, 1969, 1975, 1980, 1985, 1990, 1996, 2000, 2005, 2011, 2020].forEach(function (yr) {
      var x = X(yr); if (x - last < 34) return; last = x;
      tl.appendChild(h('button', { class: 'tl-tick', style: 'left:' + x.toFixed(1) + 'px;top:' + (axisY + 3) + 'px', text: String(yr), title: 'Look up ' + yr + ' in the Encyclopedia', onclick: function () { openTerm(String(yr)); } }));
    });
    tl.appendChild(h('div', { class: 'tl-hint', text: timeRange ? 'Showing ' + timeRange[0] + '–' + timeRange[1] + ' only. Click the period again or “All years” to show everything.' : timeYear == null ? 'Click a period to show only it · drag along the lanes to step through time · tap a dot to open a place · tap a year to look it up' : 'Showing ' + timeYear + ': bright = active that year, faded = earlier, hidden = not yet' }));
    var hit = h('div', { class: 'tl-hit', style: 'left:' + L0 + 'px;width:' + W + 'px;top:' + (TOP - 4) + 'px;height:' + (TL_LANES.length * LH + 6) + 'px', title: 'Click or drag to pick a year' });
    var yearAt = function (cx) { var r = tl.getBoundingClientRect(), f = (cx - r.left - L0) / W; f = Math.max(0, Math.min(1, f));
      var y = f < 0.17 ? 1905 + f / 0.17 * 64 : f <= 0.92 ? 1969 + (f - 0.17) / 0.75 * 43 : 2012 + (f - 0.92) / 0.08 * 14; return Math.round(y); };
    hit.addEventListener('pointerdown', function (e) {
      e.preventDefault(); stopPlay(); setYear(yearAt(e.clientX));
      var mv = function (ev) { var y = yearAt(ev.clientX); if (y !== timeYear) setYear(y); };
      var up = function () { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
    tl.insertBefore(hit, tl.firstChild);
    if (timeYear != null) tl.appendChild(h('div', { class: 'tl-cursor', style: 'left:' + (X(timeYear) - 1).toFixed(1) + 'px;top:' + (TOP + 2) + 'px;height:' + (TL_LANES.length * LH) + 'px' }, [h('b', { text: String(timeYear) })]));
    tl.appendChild(h('div', { class: 'tl-ctrl' }, [
      h('button', { 'aria-pressed': playTimer ? 'true' : 'false', text: playTimer ? 'Pause' : 'Play 1969–2011', onclick: function () { playTimer ? stopPlay() : startPlay(); } }),
      timeYear != null || timeRange ? h('button', { text: 'All years', onclick: function () { stopPlay(); timeRange = null; setYear(null); } }) : null
    ]));
    if (timeYear != null) tl.querySelectorAll('.tl-dot').forEach(function (d) { var y = +d.getAttribute('aria-label').slice(0, 4); d.style.opacity = y <= timeYear ? '' : '.15'; });
  }
  function setYear(y) { timeYear = y; if (y != null) timeRange = null; refresh(); }
  function startPlay() { if (timeYear == null || timeYear >= 2011) timeYear = 1968; playTimer = setInterval(function () { if (timeYear >= 2011) { stopPlay(); return; } setYear(timeYear + 1); }, 700); setYear(timeYear + 1); }
  function stopPlay() { if (playTimer) { clearInterval(playTimer); playTimer = null; drawTimeline(); } }
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

  /* more present-day places, saved from OpenStreetMap: hospitals, campuses, government offices, police, embassies, mosques, sights, cemeteries */
  var EXTRA = [['hospitals', 'Hospitals & clinics', 11, 'Public and private hospitals', '#ff6b81', '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>', function (t) { return t.healthcare === 'clinic' ? 'Clinic' : 'Hospital'; }, 'A hospital or clinic mapped today. Many of these were rebuilt or reopened after 2011; during the 2011 fighting and the 2019–2020 war some received the dead and wounded.'],
   ['schools', 'Universities & colleges', 11, 'University of Tripoli, institutes, colleges', '#9ad17f', '<path d="M12 3 1 9l11 6 9-4.9V17h2V9zM5 13.2v4L12 21l7-3.8v-4L12 17z"/>', function () { return 'University or college'; }, 'A university or college site mapped today. Under Gaddafi, the University of Tripoli was called Al-Fateh University and student opposition was often crushed there.'],
   ['govt', 'Government offices & courts', 13, 'Ministries, courts, civil registries, offices', '#b4a1e0', '<path d="M12 2 2 7v2h20V7zM4 11v8H2v3h20v-3h-2v-8h-3v8h-2v-8h-4v8H9v-8z"/>', function (t) { return t.amenity === 'courthouse' ? 'Court' : t.amenity === 'townhall' ? 'Town hall' : 'Government office'; }, 'A government office or court mapped today. Many ministries moved or changed name after 2011, so the use of a building may differ from the Gaddafi era.'],
   ['police', 'Police stations', 12, 'Police stations and checkpoints', '#5fd0c0', '<path fill-rule="evenodd" d="M12 2 4 5v6c0 5.2 3.4 9.4 8 11 4.6-1.6 8-5.8 8-11V5zm0 5 1.2 2.6 2.8.3-2.1 1.9.6 2.8L12 13l-2.5 1.6.6-2.8L8 9.9l2.8-.3z"/>', function () { return 'Police station'; }, 'A police station mapped today. Policing in Tripoli is now shared between the Interior Ministry and armed groups, and the Gaddafi-era security network was organised differently.'],
   ['embassies', 'Embassies & consulates', 11, 'Foreign embassies, today', '#f2c94c', '<path d="M5 2h2v20H5zm3 1h11l-3 4 3 4H8z"/>', function () { return 'Embassy or diplomatic office'; }, 'A diplomatic site mapped today. Many embassies closed in 2011 or 2014 and some reopened later, so the building may not match the Gaddafi-era embassy.'],
   ['mosques', 'Mosques & places of worship', 14, 'Hundreds of mosques; zoom in', '#c8d6a0', '<path d="M12 2c-.8 1-1.5 2-1.5 3.2 0 .6.2 1.1.5 1.6C7.8 7.7 6 10 6 12.5V14H4v8h16v-8h-2v-1.5c0-2.5-1.8-4.8-5-5.7.3-.5.5-1 .5-1.6C13.5 4 12.8 3 12 2z"/>', function (t) { return t.religion === 'christian' ? 'Church' : 'Mosque or place of worship'; }, 'A place of worship mapped today.'],
   ['sights', 'Monuments, sights & stadiums', 11, 'Castle, memorials, museums, stadiums, airports', '#7fd3ff', '<path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.5 5.8 21l1.4-7L2 9.3l7-.8z"/>', function (t) { return t.aeroway ? 'Airport' : t.leisure === 'stadium' ? 'Stadium' : t.tourism === 'museum' ? 'Museum' : t.historic ? 'Historic site' : 'Sight'; }, 'A historic site, memorial, museum, stadium or sight mapped today.'],
   ['cemeteries', 'Cemeteries', 12, 'Muslim, Christian and war cemeteries', '#a0a8b5', '<path d="M9 2h6v4h4v4h-4v12H9V10H5V6h4z"/>', function (t) { return 'Cemetery'; }, 'A cemetery mapped today. Tripoli has Muslim, Italian-era Christian and Commonwealth war cemeteries.']
  ];
  EXTRA.forEach(function (d) {
    var k = d[0];
    OSM[k] = { label: d[1], minZoom: d[2], note: d[3], saved: true, q: function () { return ''; }, point: d[4],
      style: function () { return { color: d[4], weight: 1.5, fillColor: d[4], fillOpacity: 0.15 }; } };
    OSM_ICONS[k] = d[5];
  });
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
  // Saved building tiles (public/data/buildings, refreshed monthly) load first; Overpass is only a fallback.
  var bIndex = null, bBox = null, bIndexWait = fetch('data/buildings/index.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { bIndex = j ? new Set(j.tiles) : new Set(); bBox = j ? j.bbox : null; }).catch(function () { bIndex = new Set(); });
  function savedTile(key) {
    return bIndexWait.then(function () {
      var ij = key.split('_').map(Number), inside = bBox && (ij[0] + 0.5) * TILE > bBox[0] && (ij[0] + 0.5) * TILE < bBox[2] && (ij[1] + 0.5) * TILE > bBox[1] && (ij[1] + 0.5) * TILE < bBox[3];
      if (!inside) return null;
      if (!bIndex.has(key)) return { elements: [], saved: true };
      return fetch('data/buildings/' + key + '.json').then(function (r) { if (!r.ok) throw new Error('missing'); return r.json(); }).then(function (j) {
        return { saved: true, elements: j.b.map(function (b) { var c = b[2], x = 0, y = 0, g = []; for (var k = 0; k < c.length; k += 2) { x += c[k]; y += c[k + 1]; g.push({ lat: x / 1e5, lon: y / 1e5 }); } return { type: 'way', id: b[0], tags: b[1] || { building: 'yes' }, geometry: g }; }) };
      });
    });
  }
  function fetchTile(key, i, j, race) {
    return savedTile(key).catch(function () { return null; }).then(function (s) {
      if (s) return s;
      return cacheGet(key);
    }).then(function (hit) {
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
    ['landuse', 'military', 'water', 'oil', 'hospitals', 'embassies'].forEach(function (k) {
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
    if (id === 'sheet') { decorateSheet(); $('sheet-body').scrollTop = 0; requestAnimationFrame(function () { $('sheet-body').scrollTop = 0; }); }
    if (id === 'drawer') { $('btn-layers').setAttribute('aria-expanded', 'true'); syncGroups(); }
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
  EXTRA.forEach(function (d) { KIND[d[0]] = d[6]; EXPLAIN[d[0]] = d[7]; });
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

  /* researched landmarks and buildings: one marker each, opening the full profile */
  var profGroup = L.layerGroup(), profOn = store.get('prof', true), milGroup = L.layerGroup(), milOn = store.get('milprof', true);
  var PROF_SVG = '<path d="M12 2 2 7v2h20V7zM4 11v8H2v3h20v-3h-2v-8h-3v8h-2v-8h-4v8H9v-8z"/>';
  function drawProfiles() {
    profGroup.clearLayers(); milGroup.clearLayers();
    var merged = {}; SITES.forEach(function (s) { if (s.profile) merged[s.profile] = 1; });
    AREAS.filter(function (a) { return ['landmark', 'government', 'prison', 'military'].indexOf(a.kind) >= 0 && a.lat && a.lon && !merged[a.id]; }).forEach(function (a) {
      var dup = SITES.some(function (s) { return map.distance([a.lat, a.lon], [s.lat, s.lon]) < 120 && (s.layer === 'landmark' || s.layer === 'power') && fold(s.name).split(' ')[0] === fold(a.name).split(' ')[0]; });
      if (dup) return;
      var m = L.marker([a.lat, a.lon], { keyboard: false, title: a.name, zIndexOffset: -200, icon: L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 14],
        html: '<div class="osm-ic prof" style="--c:' + (a.kind === 'military' || /^wp-/.test(a.id) ? '#ec9a3c' : '#e0b95a') + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + PROF_SVG + '</svg></div>' }) });
      m.bindTooltip(a.name, { direction: 'top', offset: [0, -12], className: 'site-label' });
      m.on('click', function (ev) { L.DomEvent.stop(ev); if (picking) { openSpot(ev.latlng); return; } openArea(a); });
      m.on('mouseover', function () { m.closeTooltip(); hoverCard([a.lat, a.lon], a.kind === 'military' || /^wp-/.test(a.id) ? '#ec9a3c' : '#e0b95a', '▣', a.name, [['Type', KIND_LABEL[a.kind] || a.kind], ['Arabic', a.ar], ['About', (a.summary || '').length > 90 ? a.summary.slice(0, 88) + '…' : a.summary]], [0, -16]); });
      m.on('mouseout', hideCard);
      m.addTo(a.kind === 'military' || /^wp-/.test(a.id) ? milGroup : profGroup);
    });
  }
  function syncProfiles() { if (profOn && map.getZoom() >= 14) map.addLayer(profGroup); else map.removeLayer(profGroup); if (milOn && map.getZoom() >= 11) map.addLayer(milGroup); else map.removeLayer(milGroup); }
  map.on('zoomend', syncProfiles);
  $('hist-toggles').appendChild(toggleRow('profiles', 'Researched landmarks & buildings', 'Ministries, hospitals, mosques, old city and historic sites, with histories', profOn, function (v) { profOn = v; store.set('prof', v); syncProfiles(); }));
  $('hist-toggles').appendChild(toggleRow('milprof', 'Camps & weapons sites', 'Researched military camps, missile and weapons-programme sites', milOn, function (v) { milOn = v; store.set('milprof', v); syncProfiles(); }));
  setTimeout(function () { drawProfiles(); syncProfiles(); }, 0);
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
    if (more) box.appendChild(h('button', { class: 'more', onclick: function () { openTerm(more); } }, [h('span', { text: 'Look up “' + more + '” in the Encyclopedia' })]));
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
  var TERM_SRCS = [['all', 'All sources'], ['us', 'US diplomatic papers'], ['radio', 'Libyan radio & press (translated)'], ['cia', 'CIA files'], ['decl', 'Presidential & declassified files'], ['rights', 'Human rights & UN'], ['law', 'Libyan laws'], ['ref', 'Reference & encyclopedias']];
  var termSrc = 'all';
  function srcGroup(r) {
    var s = r.s || '';
    if (/^FRUS/.test(s)) return 'us';
    if (/^(FBIS|JPRS)/.test(s)) return 'radio';
    if (/^CIA/.test(s)) return 'cia';
    if (/Reagan|Bush|Thatcher|Wilson Center|National Security Archive|Nixon|Carter/i.test(s)) return 'decl';
    if (r.y === 'law' || /security-legislation|legislation/i.test(s + ' ' + (r.c || ''))) return 'law';
    if (/Wikipedia|Library of Congress|country study/i.test(s)) return 'ref';
    return 'rights';
  }
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
      if (termKind === 'doc' && termSrc !== 'all' && srcGroup(r) !== termSrc) return;
      var y = +(r.d || '0').slice(0, 4); if (yf && (y < yf || y > yt)) return;
      if (words.length && !match(r.t + ' ' + (r.m || '') + ' ' + (r.s || '') + ' ' + (r.k || []).join(' '))) return;
      out.push({ k: r.y === 'event' ? 'event' : 'doc', sort: r.y === 'event' ? 1.5 : 2, sc: rel(r.t, (r.m || '') + ' ' + (r.s || '')), d: r.d, t: r.t, sub: (TYPE_LABEL[r.y] || r.y) + ' · ' + (r.s || '') + ' · ' + String(r.m || '').slice(0, 160), go: function () { closeTerm(); openRecord(r); } });
    });
    if (!words.length && !yf && termKind === 'all') out = out.filter(function (x) { return x.k !== 'doc'; });
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
    if (res.length > 200) list.appendChild(h('p', { class: 'd-text muted', text: 'Showing the first 200 of ' + res.length + '. Type a word, a name or a year, or pick a source above, to narrow it down. Add words or a year to narrow it down.' }));
  }
  TERM_KINDS.forEach(function (k) {
    $('term-kinds').appendChild(h('button', { 'aria-pressed': k[0] === termKind ? 'true' : 'false', 'data-k': k[0], text: k[1], onclick: function () {
      termKind = k[0]; document.querySelectorAll('#term-kinds button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === termKind ? 'true' : 'false'); }); $('term-src').hidden = termKind !== 'doc'; runTerm(); } }));
  });
  TERM_SRCS.forEach(function (k) {
    $('term-src').appendChild(h('button', { 'aria-pressed': k[0] === termSrc ? 'true' : 'false', 'data-k': k[0], text: k[1], onclick: function () {
      termSrc = k[0]; document.querySelectorAll('#term-src button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === termSrc ? 'true' : 'false'); }); runTerm(); } }));
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

  /* ---------- grouped layer chooser: history and today side by side, one row per subject ---------- */
  var GROUPS = [
    { t: 'Prisons, police & security', n: 'Prisons, security services, police', parts: [['detention', 'Prisons', 'then'], ['security', 'Security services', 'then'], ['osm-police', 'Police stations', 'now']] },
    { t: 'Military & weapons', n: 'Bases, camps, missile and weapons sites', parts: [['military', 'Bases', 'then'], ['milprof', 'Camps & weapons sites', 'then'], ['osm-military', 'Military areas', 'now']] },
    { t: 'Killings & attacks', n: 'Massacres, executions, the 1986 raid', parts: [['massacre', 'Killings & repression', 'then'], ['airstrike', '1986 US raid', 'then']] },
    { t: 'Power & government', n: "Gaddafi's compounds, ministries, courts, embassies", parts: [['power', 'Seats of power', 'then'], ['osm-govt', 'Offices & courts', 'now'], ['osm-embassies', 'Embassies', 'now']] },
    { t: 'Landmarks & history', n: 'Squares, old city, researched buildings, monuments', parts: [['landmark', 'Events & squares', 'then'], ['profiles', 'Researched buildings', 'then'], ['osm-sights', 'Monuments & sights', 'now'], ['osm-mosques', 'Mosques', 'now'], ['osm-cemeteries', 'Cemeteries', 'now']] },
    { t: 'Hospitals & universities', n: 'Health and education today', parts: [['osm-hospitals', 'Hospitals', 'now'], ['osm-schools', 'Universities', 'now']] },
    { t: 'The city today', n: 'Zones, buildings, water, oil', parts: [['osm-landuse', 'Zones', 'now'], ['osm-buildings', 'Buildings', 'now'], ['osm-water', 'Water', 'now'], ['osm-oil', 'Oil & gas', 'now']] }
  ];
  var groupEls = [];
  function partColor(k) { if (LAYERS[k]) return LAYERS[k].color; if (k === 'profiles') return '#e0b95a'; if (k === 'milprof') return '#ec9a3c'; if (k === 'net') return '#2d72d2'; if (k === 'reports') return '#d1980b'; var o = OSM[k.replace(/^osm-/, '')]; return o ? (o.point || o.swatch) : '#888'; }
  function syncGroups() {
    (groupEls || []).forEach(function (g) {
      var on = 0;
      g.btns.forEach(function (b) { var i = inputs[b.dataset.k]; var v = !!(i && i.checked); if (v) on++; b.setAttribute('aria-pressed', v ? 'true' : 'false'); });
      var st = on === 0 ? 'none' : on === g.btns.length ? 'all' : 'some';
      g.head.dataset.state = st; g.box.textContent = st === 'all' ? '✓' : st === 'some' ? '–' : '';
      g.head.setAttribute('aria-pressed', st === 'none' ? 'false' : st === 'all' ? 'true' : 'mixed');
    });
  }
  function setInput(k, v) { var i = inputs[k]; if (i && i.checked !== v) i.click(); }
  function buildGroups() {
    var box = $('groups'); if (!box) return;
    GROUPS.forEach(function (g) {
      var parts = g.parts.filter(function (p) { return inputs[p[0]]; });
      if (!parts.length) return;
      var btns = parts.map(function (p) {
        var b = h('button', { 'data-k': p[0], 'aria-pressed': 'false', title: p[2] === 'then' ? 'Research on 1969–2011 and earlier' : 'Today’s OpenStreetMap data' },
          [h('span', { class: 'dot', style: 'background:' + partColor(p[0]) }), p[1], h('span', { class: 'tm ' + p[2], text: p[2] === 'then' ? 'Then' : 'Now' })]);
        b.addEventListener('click', function () { setInput(p[0], !inputs[p[0]].checked); syncGroups(); });
        inputs[p[0]].addEventListener('change', syncGroups);
        return b;
      });
      var boxEl = h('span', { class: 'box', 'aria-hidden': 'true' });
      var head = h('button', { class: 'grp-head', 'aria-pressed': 'false' }, [boxEl, h('span', { class: 'gt' }, [g.t, h('small', { text: g.n })])]);
      head.addEventListener('click', function () { var turnOn = head.dataset.state !== 'all'; parts.forEach(function (p) { setInput(p[0], turnOn); }); syncGroups(); });
      box.appendChild(h('div', { class: 'grp' }, [head, h('div', { class: 'grp-parts' }, btns)]));
      groupEls.push({ head: head, box: boxEl, btns: btns });
    });
    syncGroups();
  }
  setTimeout(buildGroups, 0);
  function syncInputs() {
    Object.keys(LAYERS).concat(['districts', 'rings', 'labels', 'grid', 'timeline']).forEach(function (k) { if (inputs[k]) inputs[k].checked = !!active[k]; });
    Object.keys(OSM).forEach(function (k) { if (inputs['osm-' + k]) inputs['osm-' + k].checked = !!osmActive[k]; });
    Object.keys(PERIODS).forEach(function (k) { var b = document.querySelector('#periods [data-k="' + k + '"]'); if (b) b.setAttribute('aria-pressed', periods[k] ? 'true' : 'false'); });
    syncGroups();
  }
  function visibleNames() { var v = SITES.filter(visible); return v.length ? v.map(function (s) { return s.name; }).join('; ') : 'none'; }
  function brief(s) { return { id: s.id, name: s.name, category: LAYERS[s.layer].label, when: s.period, visible: visible(s) }; }
  var selLayer = L.layerGroup();
  var ui = null; // per-turn collector: { log: [], chips: [], mapChanged: bool }
  var TOOLS = {
    get_map_state: function () { return mapState(); },
    find_anything: function (a) {
      var words = fold(a.query || '').split(' ').filter(function (w) { return w.length > 1; });
      var kinds = a.kinds && a.kinds.length ? a.kinds : ['site', 'area', 'report', 'osm'];
      var near = a.lat != null && a.lon != null ? L.latLng(+a.lat, +a.lon) : null, rad = +a.radius_m || 2000;
      var ok = function (text, lat, lon, y0, y1) {
        if (words.length && !words.every(function (w) { return fold(text).indexOf(w) >= 0; })) return false;
        if (near && (lat == null || map.distance(near, [lat, lon]) > rad)) return false;
        if (a.year_from != null && y1 != null && y1 < a.year_from) return false;
        if (a.year_to != null && y0 != null && y0 > a.year_to) return false;
        return true;
      };
      var out = [];
      var dist = function (lat, lon) { return near ? Math.round(map.distance(near, [lat, lon])) : undefined; };
      if (kinds.indexOf('site') >= 0) SITES.forEach(function (s) { var r = span(s); if (ok(s.name + ' ' + (s.ar || '') + ' ' + s.relevance + ' ' + s.text + ' ' + LAYERS[s.layer].label, s.lat, s.lon, r[0], r[1])) out.push({ ref: 'site:' + s.id, name: s.name, type: LAYERS[s.layer].label, when: s.period, m: dist(s.lat, s.lon) }); });
      if (kinds.indexOf('area') >= 0) AREAS.forEach(function (x) { if (ok(areaNames(x).join(' ') + ' ' + (x.summary || '') + ' ' + (x.era || '') + ' ' + KIND_LABEL[x.kind], x.lat, x.lon)) out.push({ ref: 'area:' + x.id, name: x.name, type: KIND_LABEL[x.kind] || x.kind, m: dist(x.lat, x.lon) }); });
      if (kinds.indexOf('report') >= 0) REPORTS.forEach(function (r) { if (r.lat != null && ok(r.title + ' ' + r.text + ' ' + r.cat, r.lat, r.lon)) out.push({ ref: 'report:' + r.id, name: r.title, type: 'Family report (' + r.cat + ')', when: r.when, m: dist(r.lat, r.lon) }); });
      var osmKeys = (a.osm_layers && a.osm_layers.length ? a.osm_layers : ['hospitals', 'schools', 'govt', 'police', 'embassies', 'sights', 'cemeteries', 'military']).filter(function (k) { return OSM[k] && OSM[k].saved; });
      var loads = kinds.indexOf('osm') >= 0 ? osmKeys.map(function (k) {
        return (savedData[k] ? Promise.resolve(savedData[k]) : fetch('data/osm/' + k + '.json').then(function (r) { return r.json(); }).then(function (j) { savedData[k] = savedData[k] || { elements: (j.features || []).map(expand), generated: j.generated }; savedState[k] = savedState[k] || 'ready'; return savedData[k]; }))
          .then(function (d) { d.elements.forEach(function (el) { var t = el.tags || {}, nm = t['name:en'] || t.name; if (!nm) return; var lat = el.lat || (el.bounds && (el.bounds.minlat + el.bounds.maxlat) / 2), lon = el.lon || (el.bounds && (el.bounds.minlon + el.bounds.maxlon) / 2);
            if (ok(nm + ' ' + (t.name || '') + ' ' + (t['name:ar'] || '') + ' ' + KIND[k](t), lat, lon)) out.push({ ref: 'osm:' + k + ':' + el.type + ':' + el.id, name: nm, type: KIND[k](t) + ' (today)', m: dist(lat, lon) }); }); }).catch(function () {});
      }) : [];
      return Promise.all(loads).then(function () {
        if (near) out.sort(function (x, y) { return (x.m || 0) - (y.m || 0); });
        var n = Math.min(80, a.limit || 40);
        return JSON.stringify({ total: out.length, results: out.slice(0, n) });
      });
    },
    select: function (a) {
      var refs = (a.refs || []).slice(0, 120), pts = [], names = [];
      selLayer.clearLayers();
      var add = function (lat, lon, name, color) { pts.push([lat, lon]); names.push(name);
        L.circleMarker([lat, lon], { radius: 17, color: '#2d72d2', weight: 3, fillColor: '#2d72d2', fillOpacity: 0.12, interactive: false }).addTo(selLayer); };
      var jobs = refs.map(function (ref) {
        var p = String(ref).split(':');
        if (p[0] === 'site' && BY_ID[p[1]]) { var s = BY_ID[p[1]]; ensureVisible(s); add(s.lat, s.lon, s.name); return null; }
        if (p[0] === 'area' && AREA_BY_ID[p[1]]) { var x = AREA_BY_ID[p[1]]; if (x.kind === 'military' && !milOn) inputs.milprof.click(); else if (['landmark', 'government', 'prison'].indexOf(x.kind) >= 0 && !profOn) inputs.profiles.click(); add(x.lat, x.lon, x.name); return null; }
        if (p[0] === 'report') { var r = REPORTS.filter(function (z) { return z.id === p[1]; })[0]; if (r && r.lat != null) { if (!inputs.reports.checked) inputs.reports.click(); add(r.lat, r.lon, r.title); } return null; }
        if (p[0] === 'osm' && OSM[p[1]]) { if (!osmActive[p[1]]) inputs['osm-' + p[1]].click(); var d = savedData[p[1]]; var el = d && d.elements.filter(function (e) { return e.type === p[2] && String(e.id) === p[3]; })[0];
          if (el) { add(el.lat || (el.bounds.minlat + el.bounds.maxlat) / 2, el.lon || (el.bounds.minlon + el.bounds.maxlon) / 2, (el.tags && (el.tags['name:en'] || el.tags.name)) || p[1]); return null; } return ref; }
        return ref;
      });
      var missing = jobs.filter(Boolean);
      if (!pts.length) return { error: 'Nothing matched. Use refs returned by find_anything, e.g. "site:abusalim", "area:tekbali-camp".' };
      selLayer.addTo(map);
      if (a.frame !== false) { if (pts.length === 1) map.flyTo(pts[0], Math.max(map.getZoom(), 15), { duration: 0.8 }); else map.flyToBounds(L.latLngBounds(pts).pad(0.25), { duration: 0.8, maxZoom: 16 }); }
      ui.mapChanged = true; ui.log.push('Highlighted ' + pts.length + ' place' + (pts.length > 1 ? 's' : '') + (names.length <= 4 ? ': ' + names.join(', ') : ''));
      if (a.open_first) { var f = String(refs[0]).split(':'); if (f[0] === 'site' && BY_ID[f[1]]) TOOLS.open_place({ id: f[1] }); else if (f[0] === 'area' && AREA_BY_ID[f[1]]) TOOLS.open_area({ id: f[1] }); }
      return 'Highlighted ' + pts.length + ' on the map with blue rings' + (missing.length ? '. Not found: ' + missing.join(', ') : '') + '.';
    },
    open_3d_view: function (a) { var lat = +a.lat, lon = +a.lon; if (a.place_id && BY_ID[a.place_id]) { lat = BY_ID[a.place_id].lat; lon = BY_ID[a.place_id].lon; } if (a.area_id && AREA_BY_ID[a.area_id]) { lat = AREA_BY_ID[a.area_id].lat; lon = AREA_BY_ID[a.area_id].lon; } if (isNaN(lat) || isNaN(lon)) return { error: 'Give lat/lon, place_id or area_id' }; setTimeout(function () { closeChat(); openStreet(lat, lon, a.name || ''); }, 300); ui.log.push('Opened the street-level 3D view'); return 'The 3D street-level view is open.'; },
    clear_selection: function () { selLayer.clearLayers(); ui.log.push('Cleared highlights'); return 'Highlights cleared.'; },
    set_visibility: function (a) {
      var all = []; GROUPS.forEach(function (g) { g.parts.forEach(function (p) { if (inputs[p[0]]) all.push(p[0]); }); });
      var bad = [].concat(a.only || [], a.show || [], a.hide || []).filter(function (k) { return all.indexOf(k) < 0; });
      if (bad.length) return { error: 'Unknown keys: ' + bad.join(', ') + '. Valid: ' + all.join(', ') };
      var want = {};
      if (a.only && a.only.length) all.forEach(function (k) { want[k] = a.only.indexOf(k) >= 0; });
      (a.show || []).forEach(function (k) { want[k] = true; }); (a.hide || []).forEach(function (k) { want[k] = false; });
      Object.keys(want).forEach(function (k) { if (inputs[k].checked !== want[k]) inputs[k].click(); });
      syncGroups(); ui.mapChanged = true;
      var on = all.filter(function (k) { return inputs[k].checked; });
      ui.log.push('Showing: ' + on.join(', '));
      return 'Now on: ' + on.join(', ') + '.';
    },
    set_time: function (a) {
      stopPlay();
      if (a.all) { timeRange = null; timeYear = null; refresh(); ui.log.push('All years'); return 'Showing all years.'; }
      if (a.era) { var e = ERAS.filter(function (x) { return fold(x[2]).indexOf(fold(a.era)) >= 0 || fold(x[3]) === fold(a.era); })[0]; if (!e) return { error: 'Unknown era. Eras: ' + ERAS.map(function (x) { return x[2] + ' (' + x[0] + '–' + x[1] + ')'; }).join('; ') }; timeYear = null; timeRange = [e[0], e[1]]; refresh(); ui.log.push('Period: ' + e[2]); ui.mapChanged = true; return 'Showing ' + e[2] + ', ' + e[0] + '–' + e[1] + '. Visible places: ' + visibleNames() + '.'; }
      if (a.year_from != null || a.year_to != null) { timeYear = null; timeRange = [a.year_from != null ? +a.year_from : 1900, a.year_to != null ? +a.year_to : 2026]; refresh(); ui.mapChanged = true; ui.log.push('Years ' + timeRange[0] + '–' + timeRange[1]); return 'Showing ' + timeRange[0] + '–' + timeRange[1] + '. Visible places: ' + visibleNames() + '.'; }
      if (a.year != null) { setYear(+a.year); ui.mapChanged = true; ui.log.push('Year ' + a.year); return 'Time cursor at ' + a.year + '. Visible places: ' + visibleNames() + '.'; }
      if (a.play) { startPlay(); ui.log.push('Playing through 1969–2011'); return 'Playing through the years.'; }
      return { error: 'Give era, year, year_from/year_to, play or all.' };
    },
    open_area: function (a) {
      var x = (a.id && AREA_BY_ID[a.id]) || (a.name && areaByName(a.name));
      if (!x) return { error: 'No area profile ' + (a.id || a.name) };
      ui.mapChanged = true; map.flyTo([x.lat, x.lon], Math.max(map.getZoom(), 15), { duration: 0.8 });
      if (DESKTOP.matches) { openArea(x); ui.log.push('Opened ' + x.name); return 'Profile of ' + x.name + ' is open.'; }
      ui.areas.push(x); ui.log.push('Added a button to open ' + x.name); return 'A button to open ' + x.name + ' was added under your reply.';
    },
    open_encyclopedia: function (a) { closeChat(); termKind = a.tab || 'all'; openTerm(a.query || ''); document.querySelectorAll('#term-kinds button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === termKind ? 'true' : 'false'); }); $('term-src').hidden = termKind !== 'doc'; return 'The Encyclopedia is open on “' + (a.query || '') + '”.'; },
    start_report: function (a) { ui.log.push('Opened the Add to map form'); setTimeout(function () { closeChat(); openReportForm({ lat: a.lat != null ? +a.lat : null, lon: a.lon != null ? +a.lon : null, cat: a.category || '', keep: {} }); if (a.title) $('rep-name').value = a.title; if (a.notes) $('rep-text').value = a.notes; }, 400); return 'The Add to map form is open for the reader to finish and save.'; },

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
        linked: connFor(s.id).map(function (x) { return x.other.id + ' (' + x.c.kind + '): ' + x.c.why; }), sources: s.sources.map(function (x) { return x.t; }) }));
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
    find_anything: 'Searching places', select: 'Highlighting places', clear_selection: 'Clearing highlights', set_visibility: 'Changing what is shown', set_time: 'Changing the time period', open_area: 'Opening the profile', open_encyclopedia: 'Opening the Encyclopedia', start_report: 'Opening the form', open_3d_view: 'Opening the 3D view',
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
  var MAX_STEPS = 16;
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
    ui = { log: [], chips: [], requests: [], docs: [], areas: [], sources: [], mapChanged: false };
    runAgent(code, function (s) { wait.querySelector('p').textContent = s; scrollChat(); })
      .then(function (reply) {
        wait.remove();
        var m = bubble('bot', reply || (ui.log.length ? 'Done.' : 'I don’t have an answer for that.'));
        if (ui.log.length) m.appendChild(h('ul', { class: 'did' }, ui.log.map(function (x) { return h('li', { text: x }); })));
        var box = h('div', { class: 'acts' }), seen = {};
        ui.chips.forEach(function (s) { if (seen[s.id]) return; seen[s.id] = 1; box.appendChild(h('button', { class: 'act', onclick: function () { if (!DESKTOP.matches) closeChat(); focusSite(s); } }, [glyph(s.layer), h('span', { text: 'Open ' + s.name })])); });
        ui.areas.forEach(function (x) { box.appendChild(h('button', { class: 'act', onclick: function () { if (!DESKTOP.matches) closeChat(); openArea(x); } }, [h('span', { class: 'dtag', text: KIND_LABEL[x.kind] || 'Area' }), h('span', { text: 'Open ' + x.name })])); });
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


  /* ---------- Foundry workspace: theme, legend tab, selection header ---------- */
  function setTheme(t, keepBase) {
    var dark = t === 'dark';
    document.documentElement.classList.toggle('dark', dark); store.set('theme', dark ? 'dark' : 'light');
    document.querySelectorAll('#themes button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.theme === (dark ? 'dark' : 'light') ? 'true' : 'false'); });
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#252a31' : '#ffffff';
    if (!keepBase && (currentBase === 'light' || currentBase === 'dark')) setBase(dark ? 'dark' : 'light');
  }
  document.querySelectorAll('#themes button').forEach(function (b) { b.addEventListener('click', function () { setTheme(b.dataset.theme); }); });

  function showTab(which) {
    var lg = which === 'legend';
    $('tab-layers').setAttribute('aria-selected', lg ? 'false' : 'true'); $('tab-legend').setAttribute('aria-selected', lg ? 'true' : 'false');
    $('layers-body').hidden = lg; $('legend-body').hidden = !lg;
    if (lg) drawLegend();
  }
  $('tab-layers').onclick = function () { showTab('layers'); };
  $('tab-legend').onclick = function () { showTab('legend'); };
  function drawLegend() {
    var box = $('legend'); box.innerHTML = '';
    var row = function (color, label, n, shape) { return h('div', { class: 'lg' }, [h('span', { class: 'sw', style: 'background:' + color + (shape === 'ring' ? ';background:none;border:2px dashed ' + color + ';border-radius:50%' : '') }), label, n != null ? h('small', { text: String(n) }) : null]); };
    box.appendChild(h('h4', { text: 'Shown on the map' }));
    var any = false;
    GROUPS.forEach(function (g) { g.parts.forEach(function (p) {
      var i = inputs[p[0]]; if (!i || !i.checked) return; any = true;
      var n = LAYERS[p[0]] ? SITES.filter(function (s) { return s.layer === p[0] && visible(s); }).length : p[0] === 'profiles' ? AREAS.filter(function (x) { return ['landmark', 'government', 'prison'].indexOf(x.kind) >= 0 || /^wp-/.test(x.id); }).length : p[0] === 'reports' ? REPORTS.length : (savedData[p[0].replace(/^osm-/, '')] ? savedData[p[0].replace(/^osm-/, '')].elements.length : null);
      box.appendChild(row(partColor(p[0]), p[1] + (p[2] === 'now' ? ' (today)' : ''), n));
    }); });
    if (!any) box.appendChild(h('p', { text: 'Nothing is switched on. Open the Layers tab to choose.' }));
    box.appendChild(h('h4', { text: 'How to read the pins' }));
    box.appendChild(h('div', { class: 'lg' }, [h('span', { class: 'sw', style: 'background:#e76a6e' }), 'Solid pin: documented']));
    box.appendChild(h('div', { class: 'lg' }, [h('span', { class: 'sw', style: 'background:#fff;border:2px solid #e76a6e' }), 'White pin: reported, not confirmed']));
    box.appendChild(row('#e76a6e', 'Dashed circle: how far off the position could be', null, 'ring'));
    box.appendChild(h('div', { class: 'lg' }, [h('span', { class: 'sw', style: 'background:#e0b95a' }), 'Gold building: researched profile']));
    box.appendChild(h('div', { class: 'lg' }, [h('span', { class: 'sw', style: 'background:#d1980b;border-radius:50% 50% 50% 0' }), 'Teardrop: added by family, not verified']));
    if (timeYear != null) box.appendChild(h('p', { text: 'Time filter: ' + timeYear + '. Faded pins were active earlier; later ones are hidden.' }));
  }

  var curTarget = null;
  function decorateSheet() {
    var b = $('sheet-body'), t = b.querySelector('.d-title');
    if (t && !b.querySelector('.selhead')) {
      var wrap = t.parentNode, tag = b.querySelector('.tag'), c = tag ? (tag.style.getPropertyValue('--c') || '') : '';
      var kind = $('sheet-kind').textContent || '';
      var head = h('div', { class: 'selhead' }, [h('div', { class: 'ic', style: c ? '--c:' + c : '', text: curTarget && curTarget.code && !/^<svg/.test(curTarget.code) ? curTarget.code : (kind.charAt(0) || '•') }), h('div', { class: 'tt' })]);
      if (curTarget && /^<svg/.test(curTarget.code || '')) head.firstChild.innerHTML = curTarget.code;
      var tt = head.querySelector('.tt'); tt.appendChild(t); var ar = wrap.querySelector('.d-ar'); if (ar) tt.appendChild(ar); tt.appendChild(h('div', { class: 'sub', text: kind }));
      if (wrap !== b && !wrap.children.length) wrap.remove();
      b.insertBefore(head, b.firstChild);
    }
    familyNotesSection(b);
    connSection(b);
    profileSections(b);
    var old3 = b.querySelector('.st-open'); if (old3) old3.remove();
    if (curTarget && curTarget.lat != null && !curTarget.isReport) {
      var t3 = curTarget, btn3 = h('div', { class: 'row-btns st-open' }, [h('button', { class: 'btn', text: 'Street-level 3D view', onclick: function () { openStreet(t3.lat, t3.lon, t3.name || ''); } })]);
      var head3 = b.querySelector('.selhead'); if (head3 && head3.nextSibling) b.insertBefore(btn3, head3.nextSibling); else b.appendChild(btn3);
    }
  }

  /* ---------- family reports: anyone with the password can add a place or a note ---------- */
  var REPORT_CATS = [
    { k: 'military', t: 'Military site', c: '#ec9a3c' }, { k: 'checkpoint', t: 'Checkpoint', c: '#14a3a3' },
    { k: 'prison', t: 'Prison or detention', c: '#e76a6e' }, { k: 'security', t: 'Security or police', c: '#3fa36b' },
    { k: 'event', t: 'Something happened here', c: '#f5498b' }, { k: 'landmark', t: 'Landmark or building', c: '#2d72d2' },
    { k: 'home', t: 'Family or friends’ place', c: '#8f6bd6' }, { k: 'remember', t: 'Someone we remember', c: '#3a3f47' }, { k: 'other', t: 'Other', c: '#738091' }];
  var CAT_BY = {}; REPORT_CATS.forEach(function (c) { CAT_BY[c.k] = c; });
  var HOW = { saw: 'Saw it myself', family: 'Told by family or friends', read: 'Read or heard it', unsure: 'Not sure' };
  var REPORTS = [], reportLayer = L.layerGroup(), mine = store.get('myReports', {});
  var PIN_SVG = '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="3.2"/></svg>';
  var canReport = !!CFG.aiEndpoint;
  $('hist-toggles').appendChild(toggleRow('reports', 'Family reports', 'Places and notes added by family', store.get('repOn', true), function (v) { store.set('repOn', v); if (v) reportLayer.addTo(map); else map.removeLayer(reportLayer); }));
  GROUPS.splice(0, 0, { t: 'Family reports', n: 'Places and notes added by family, not verified', parts: [['reports', 'Family reports', 'now']] });
  if (store.get('repOn', true)) reportLayer.addTo(map);
  function drawReports() {
    reportLayer.clearLayers();
    REPORTS.forEach(function (r) {
      if (r.lat == null || r.cat === 'remember') return;
      var c = (CAT_BY[r.cat] || CAT_BY.other).c;
      var m = L.marker([r.lat, r.lon], { title: r.title, keyboard: true, icon: L.divIcon({ className: '', iconSize: [26, 26], iconAnchor: [13, 30], html: '<div class="rep-pin" style="--c:' + c + '">' + PIN_SVG + '</div>' }) });
      m.on('click', function (ev) { L.DomEvent.stop(ev); openReport(r); });
      m.on('mouseover', function () { hoverCard([r.lat, r.lon], c, '+', r.title, [['Type', (CAT_BY[r.cat] || CAT_BY.other).t], ['When', r.when], ['Added by', r.by || 'family member'], ['Status', 'Not verified']], [0, -30]); });
      m.on('mouseout', hideCard);
      m.addTo(reportLayer);
    });
  }
  function loadReports() {
    if (!canReport) return;
    relay(store.get('code', ''), { reports: true }).then(function (j) { REPORTS = (j.reports || []).sort(function (x, y) { return y.at - x.at; }); drawReports(); }).catch(function () {});
  }
  function notesFor(t) {
    if (!t) return [];
    return REPORTS.filter(function (r) { return (t.id && r.target === t.id) || (!r.target && t.lat != null && r.lat != null && map.distance([t.lat, t.lon], [r.lat, r.lon]) < 150); });
  }
  function familyNotesSection(b) {
    if (!canReport || !curTarget || curTarget.isReport) return;
    var old = b.querySelector('.fam-sec'); if (old) old.remove();
    var notes = notesFor(curTarget);
    var list = h('div', { class: 'fam-notes' });
    notes.forEach(function (r) { list.appendChild(h('div', { class: 'fam-note' }, [h('b', { text: r.title }), h('small', { text: [r.when, (r.by || 'Family member') + ', ' + new Date(r.at).toLocaleDateString(), HOW[r.how]].filter(Boolean).join(' · ') }), h('div', { text: r.text })])); });
    if (!notes.length) list.appendChild(h('p', { class: 'd-text muted', text: 'No family notes yet. Know something about this place?' }));
    list.appendChild(h('div', { class: 'row-btns' }, [h('button', { class: 'btn', text: curTarget.id ? 'Add a note about this' : 'Add something here', onclick: function () { openReportForm({ lat: curTarget.lat, lon: curTarget.lon, target: curTarget.id || '', targetName: curTarget.name || '', cat: curTarget.id ? 'event' : '' }); } })]));
    var sec = h('div', { class: 'sec fam-sec' }, [h('h3', { text: 'Family notes (' + notes.length + ')' }), list]);
    var ai = b.querySelector('.ai'); if (ai) b.insertBefore(sec, ai); else b.appendChild(sec);
  }
  function openReport(r) {
    var cat = CAT_BY[r.cat] || CAT_BY.other;
    var body = newSheet('Family report');
    markSelected(null); curTarget = { isReport: true, code: '+' };
    body.appendChild(h('div', { class: 'tags' }, [h('span', { class: 'tag', style: '--c:' + cat.c, text: cat.t }), h('span', { class: 'tag', style: '--c:#d1980b', text: 'Added by family, not verified' })]));
    body.appendChild(h('div', {}, [h('h1', { class: 'd-title', text: r.title })]));
    var dl = h('dl', { class: 'meta' });
    [['When', r.when], ['How they know', HOW[r.how]], ['Source', r.src], ['Added by', r.by || 'Family member'], ['Added on', new Date(r.at).toLocaleDateString()], ['About', r.targetName], ['Position', r.lat != null ? r.lat.toFixed(5) + ', ' + r.lon.toFixed(5) : null]]
      .forEach(function (x) { if (x[1]) { dl.appendChild(h('dt', { text: x[0] })); dl.appendChild(h('dd', { text: x[1] })); } });
    body.appendChild(dl);
    body.appendChild(h('p', { class: 'd-text', text: r.text }));
    var btns = [];
    if (r.target && (BY_ID[r.target] || AREA_BY_ID[r.target])) btns.push(h('button', { class: 'btn', text: 'Open ' + (r.targetName || 'the place'), onclick: function () { if (BY_ID[r.target]) focusSite(BY_ID[r.target]); else openArea(AREA_BY_ID[r.target]); } }));
    if (mine[r.id]) btns.push(h('button', { class: 'btn', text: 'Remove my report', onclick: function () {
      relay(store.get('code', ''), { reportDelete: { id: r.id, token: mine[r.id] } }).then(function () {
        REPORTS = REPORTS.filter(function (x) { return x.id !== r.id; }); delete mine[r.id]; store.set('myReports', mine); drawReports(); closePanel('sheet'); status('Removed.', 3000);
      }).catch(function (e) { status(e.message, 4000); });
    } }));
    if (btns.length) body.appendChild(h('div', { class: 'row-btns' }, btns));
    if (r.lat != null) map.flyTo([r.lat, r.lon], Math.max(map.getZoom(), 15), { duration: 0.6 });
    openPanel('sheet');
  }
  // remember what each sheet is about, so notes can be attached to it
  var _openSite = openSite; openSite = function (s) { curTarget = { id: s.id, name: s.name, lat: s.lat, lon: s.lon, code: siteCode(s), profile: s.profile }; _openSite(s); };
  var _openArea = openArea; openArea = function (x) { var host = SITES.filter(function (s) { return s.profile === x.id; })[0]; if (host) { focusSite(host); return; } curTarget = { id: x.id, name: x.name, lat: x.lat, lon: x.lon }; _openArea(x); };
  var _openSpot = openSpot; openSpot = function (ll) { curTarget = { lat: ll.lat, lon: ll.lng, name: '' }; _openSpot(ll); };
  var _openFeature = openFeature; openFeature = function (k, el) { var lat = el.lat || (el.bounds ? (el.bounds.minlat + el.bounds.maxlat) / 2 : null), lon = el.lon || (el.bounds ? (el.bounds.minlon + el.bounds.maxlon) / 2 : null); curTarget = lat != null ? { id: 'osm-' + el.type + '-' + el.id, name: (el.tags && (el.tags['name:en'] || el.tags.name)) || '', lat: lat, lon: lon } : null; _openFeature(k, el); };
  var _openRecord = openRecord; openRecord = function (r) { curTarget = null; _openRecord(r); };
  // the AI sees family notes too (never homes), marked as unverified
  var _contextFor = contextFor; contextFor = function (o) {
    var base = _contextFor(o), ll = o.lat != null ? [o.lat, o.lon] : null, ids = (o.places || []).concat((o.areas || []).map(function (x) { return x && x.id; }));
    var notes = REPORTS.filter(function (r) { return r.cat !== 'home' && ((r.target && ids.indexOf(r.target) >= 0) || (ll && r.lat != null && map.distance(ll, [r.lat, r.lon]) < 1500)); }).slice(0, 8);
    if (!notes.length) return base;
    return (base + '\n\nFAMILY REPORTS (added by family members, NOT verified; say so if you use them)\n' + notes.map(function (r) { return '- ' + r.title + (r.when ? ' (' + r.when + ')' : '') + ': ' + r.text.slice(0, 500) + ' [' + HOW[r.how] + (r.src ? '; source: ' + r.src : '') + ']'; }).join('\n')).slice(0, 16000);
  };

  // the form
  var repState = {};
  REPORT_CATS.forEach(function (c) {
    $('rep-cats').appendChild(h('button', { type: 'button', 'data-k': c.k, 'aria-pressed': 'false', style: '--c:' + c.c, onclick: function () { pickCat(c.k); } }, [h('i'), c.t]));
  });
  function pickCat(k) { repState.cat = k; document.querySelectorAll('#rep-cats button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === k ? 'true' : 'false'); }); $('rep-private').hidden = k !== 'home'; }
  function openReportForm(o) {
    if (!canReport) { status('Adding to the map works on the online, password-protected version.', 5000); return; }
    repState = Object.assign({ cat: '' }, repState.keep || {}, o || {});
    if (repState.lat == null) { startPick(); return; }
    $('rep-where').innerHTML = '';
    $('rep-where').appendChild(h('span', { text: repState.targetName ? 'About: ' + repState.targetName : 'Location' }));
    $('rep-where').appendChild(h('span', { text: repState.lat.toFixed(5) + ', ' + repState.lon.toFixed(5) }));
    $('rep-by').value = store.get('repBy', '');
    pickCat(repState.cat || '');
    $('rep-msg').textContent = '';
    $('report').hidden = false; setTimeout(function () { $('rep-name').focus(); }, 30);
  }
  function closeReportForm() { $('report').hidden = true; }
  var repPicking = false;
  function startPick() {
    closeReportForm(); repPicking = true; $('pick-banner').hidden = false; document.body.classList.add('picking');
    if (!DESKTOP.matches) { closePanel('sheet'); closePanel('drawer'); }
  }
  function stopPick() { repPicking = false; $('pick-banner').hidden = true; document.body.classList.remove('picking'); }
  map.on('click', function (e) { if (!repPicking) return; stopPick(); repState.lat = e.latlng.lat; repState.lon = e.latlng.lng; openReportForm(repState); });
  $('pick-cancel').onclick = stopPick;
  $('btn-report').onclick = function () { repState = {}; openReportForm(curTarget && $('sheet').classList.contains('open') && !curTarget.isReport ? { lat: curTarget.lat, lon: curTarget.lon, target: curTarget.id || '', targetName: curTarget.name || '' } : {}); };
  $('rep-close').onclick = closeReportForm;
  $('rep-move').onclick = function () { repState.keep = { title: $('rep-name').value }; repState.target = ''; repState.targetName = ''; startPick(); };
  $('report').addEventListener('click', function (e) { if (e.target.id === 'report') closeReportForm(); });
  $('rep-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!repState.cat) { $('rep-msg').textContent = 'Pick what it is first.'; return; }
    var payload = { cat: repState.cat, title: $('rep-name').value.trim(), when: $('rep-when').value.trim(), text: $('rep-text').value.trim(), how: $('rep-how').value, src: $('rep-src').value.trim(), by: $('rep-by').value.trim(), lat: repState.lat, lon: repState.lon, target: repState.target || '', targetName: repState.targetName || '' };
    if (!payload.title || !payload.text) { $('rep-msg').textContent = 'Add a title and what you know.'; return; }
    store.set('repBy', payload.by);
    $('rep-save').disabled = true; $('rep-msg').textContent = 'Saving…';
    relay(store.get('code', ''), { report: payload }).then(function (j) {
      mine[j.report.id] = j.token; store.set('myReports', mine);
      REPORTS.unshift(j.report); drawReports();
      ['rep-name', 'rep-when', 'rep-text', 'rep-src'].forEach(function (id) { $(id).value = ''; });
      closeReportForm(); repState = {};
      if (!inputs.reports.checked) inputs.reports.click();
      openReport(j.report); status('Added to the map. Thank you.', 4000);
    }).catch(function (err) { $('rep-msg').textContent = 'Could not save: ' + err.message; })
      .then(function () { $('rep-save').disabled = false; });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (repPicking) stopPick(); else if (!$('report').hidden) closeReportForm(); } });
  if (!canReport) $('btn-report').title = 'Adding to the map works on the online version';


  /* ---------- street-level 3D view: MapLibre + OpenFreeMap 3D buildings over satellite, with the atlas pins ---------- */
  var ML = null, stMap = null, stOrbit = null, stMarkers = [];
  function loadMapLibre() {
    if (ML) return ML;
    ML = new Promise(function (ok, bad) {
      var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'vendor/maplibre/maplibre-gl.css'; document.head.appendChild(css);
      var s = document.createElement('script'); s.src = 'vendor/maplibre/maplibre-gl.js'; s.onload = function () { ok(window.maplibregl); }; s.onerror = function () { ML = null; bad(new Error('3D viewer could not load')); }; document.head.appendChild(s);
    });
    return ML;
  }
  function stPins(lat, lon) {
    stMarkers.forEach(function (m) { m.remove(); }); stMarkers = [];
    var ll = L.latLng(lat, lon), items = [];
    SITES.forEach(function (s) { var m = map.distance(ll, [s.lat, s.lon]); if (m < 2500) items.push({ lat: s.lat, lon: s.lon, name: s.name, c: LAYERS[s.layer].color, code: codeHtml(s.layer), go: function () { closeStreet(); focusSite(s); } }); });
    AREAS.forEach(function (x) { if (['landmark', 'government', 'prison', 'military'].indexOf(x.kind) < 0) return; var m = map.distance(ll, [x.lat, x.lon]); if (m < 1500) items.push({ lat: x.lat, lon: x.lon, name: x.name, c: x.kind === 'military' ? '#ec9a3c' : '#e0b95a', code: '▣', go: function () { closeStreet(); openArea(x); } }); });
    REPORTS.forEach(function (r) { if (r.lat == null) return; if (map.distance(ll, [r.lat, r.lon]) < 1500) items.push({ lat: r.lat, lon: r.lon, name: r.title, c: (CAT_BY[r.cat] || CAT_BY.other).c, code: '+', go: function () { closeStreet(); openReport(r); } }); });
    items.forEach(function (it) {
      var el = h('div', { class: 'st-pin', title: it.name, style: '--c:' + it.c }, [h('i', { html: /^<svg/.test(it.code) ? it.code : esc(it.code) }), h('span', { text: it.name })]);
      el.addEventListener('click', function (e) { e.stopPropagation(); it.go(); });
      stMarkers.push(new window.maplibregl.Marker({ element: el, anchor: 'bottom-left' }).setLngLat([it.lon, it.lat]).addTo(stMap));
    });
  }
  function stGround(sat) {
    $('st-sat').setAttribute('aria-selected', sat ? 'true' : 'false'); $('st-map').setAttribute('aria-selected', sat ? 'false' : 'true');
    if (stMap && stMap.getLayer('sat')) stMap.setLayoutProperty('sat', 'visibility', sat ? 'visible' : 'none');
    store.set('stSat', sat);
  }
  function stSpin(on) {
    $('st-orbit').setAttribute('aria-pressed', on ? 'true' : 'false');
    cancelAnimationFrame(stOrbit); stOrbit = null;
    if (!on || !stMap) return;
    var last = performance.now();
    (function step(t) { stMap.setBearing(stMap.getBearing() + (t - last) * 0.006); last = t; stOrbit = requestAnimationFrame(step); })(last);
  }
  function openStreet(lat, lon, name) {
    $('street').hidden = false; $('street-title').textContent = name ? name : 'Street-level view';
    $('street-sub').textContent = lat.toFixed(5) + ', ' + lon.toFixed(5) + ' · 3D buildings from OpenStreetMap · satellite: Esri';
    $('st-photos').href = 'https://www.mapillary.com/app/?lat=' + lat + '&lng=' + lon + '&z=17';
    $('st-photos').title = 'Real street-level photos from Mapillary, where people have uploaded them';
    loadMapLibre().then(function (maplibregl) {
      if (!stMap) {
        stMap = new maplibregl.Map({ container: 'street-map', style: 'https://tiles.openfreemap.org/styles/liberty', center: [lon, lat], zoom: 17, pitch: 65, bearing: -20, maxPitch: 85, attributionControl: { compact: true } });
        stMap.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
        stMap.on('load', function () {
          var first = (stMap.getStyle().layers || []).filter(function (l) { return l.type === 'fill-extrusion' || l.type === 'symbol'; })[0];
          stMap.addSource('sat', { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 18, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' });
          stMap.addLayer({ id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-opacity': 0.95 } }, first ? first.id : undefined);
          (stMap.getStyle().layers || []).forEach(function (l) { if (l.type === 'fill-extrusion') { stMap.setPaintProperty(l.id, 'fill-extrusion-opacity', 0.88); } });
          stGround(store.get('stSat', true));
        });
        ['mousedown', 'touchstart', 'wheel'].forEach(function (ev) { stMap.on(ev, function () { stSpin(false); }); });
        // If the OpenFreeMap style can't be reached, fall back to satellite + the atlas's own saved buildings, extruded.
        var fellBack = false;
        var fallback = function () {
          if (fellBack || stMap.loaded()) return; fellBack = true;
          var c = stMap.getCenter(), keys = [];
          for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) keys.push(Math.floor(c.lat / TILE + di) + '_' + Math.floor(c.lng / TILE + dj));
          Promise.all(keys.map(function (k) { return savedTile(k).catch(function () { return null; }); })).then(function (ts) {
            var feats = [];
            ts.forEach(function (t) { (t && t.elements || []).forEach(function (el) { var lv = parseFloat((el.tags || {})['building:levels']) || 0, ht = parseFloat((el.tags || {}).height) || 0;
              feats.push({ type: 'Feature', properties: { h: ht || (lv ? lv * 3.2 : 7) }, geometry: { type: 'Polygon', coordinates: [el.geometry.map(function (p) { return [p.lon, p.lat]; })] } }); }); });
            stMap.setStyle({ version: 8, sources: {
              sat: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 18, attribution: 'Imagery © Esri' },
              bld: { type: 'geojson', data: { type: 'FeatureCollection', features: feats }, attribution: '© OpenStreetMap contributors' } },
              layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#20262e' } }, { id: 'sat', type: 'raster', source: 'sat' },
                { id: 'bld', type: 'fill-extrusion', source: 'bld', paint: { 'fill-extrusion-color': '#d9d3c7', 'fill-extrusion-height': ['get', 'h'], 'fill-extrusion-opacity': 0.88 } }] });
            stMap.once('styledata', function () { stPins(c.lat, c.lng); });
          });
        };
        stMap.on('error', function (e) { if (!stMap.loaded() && /style|fetch|Failed/i.test(String(e && e.error && e.error.message || e))) fallback(); });
        setTimeout(fallback, 8000);
      } else { stMap.resize(); stMap.jumpTo({ center: [lon, lat], zoom: 17, pitch: 65 }); }
      var place = function () { stPins(lat, lon); var here = h('div', { class: 'st-pin here' }, [h('i', { text: '●' })]); stMarkers.push(new maplibregl.Marker({ element: here }).setLngLat([lon, lat]).addTo(stMap)); };
      if (stMap.loaded()) place(); else stMap.once('load', place);
      stSpin(true);
    }).catch(function (e) { closeStreet(); status(e.message + '. Check the connection and try again.', 5000); });
  }
  function closeStreet() { stSpin(false); $('street').hidden = true; }
  $('st-close').onclick = closeStreet;
  $('st-sat').onclick = function () { stGround(true); };
  $('st-map').onclick = function () { stGround(false); };
  $('st-orbit').onclick = function () { stSpin($('st-orbit').getAttribute('aria-pressed') !== 'true'); };
  $('st-street').onclick = function () { if (!stMap) return; stSpin(false); stMap.easeTo({ zoom: 18.6, pitch: 82, duration: 1200 }); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('street').hidden) closeStreet(); });
  var StreetControl = L.Control.extend({ options: { position: 'topright' }, onAdd: function () {
    var wrap = L.DomUtil.create('div', 'leaflet-bar'), b = L.DomUtil.create('a', '', wrap);
    b.href = '#'; b.textContent = '3D'; b.title = 'Street-level 3D view here'; b.setAttribute('role', 'button'); b.style.fontSize = '13px'; b.style.fontWeight = '700';
    L.DomEvent.on(b, 'click', function (e) { L.DomEvent.stop(e); var c = map.getCenter(); openStreet(c.lat, c.lng, ''); });
    L.DomEvent.disableClickPropagation(wrap); return wrap; } });
  new StreetControl().addTo(map);


  /* ---------- connections between places (evidence-based) ---------- */
  var CONN = window.ATLAS_CONNECTIONS || [];
  var CONN_KIND = { transfer: 'Prisoner transfer', 'same-unit': 'Same unit or agency', attack: 'Attack and target', casualties: 'Where the dead and wounded went', 'same-place': 'Same place, other entry', programme: 'Same weapons programme', event: 'Same event', control: 'Who controlled it', context: 'Context' };
  var CONN_COL = { transfer: '#e76a6e', 'same-unit': '#8f6bd6', attack: '#d99e0b', casualties: '#f5498b', 'same-place': '#738091', programme: '#ec9a3c', event: '#2d72d2', control: '#3fa36b', context: '#9aa5b4' };
  function ent(id) {
    var s = BY_ID[id]; if (s) return { id: id, name: s.name, lat: s.lat, lon: s.lon, open: function () { focusSite(s); } };
    var x = AREA_BY_ID[id]; if (x) return { id: id, name: x.name, lat: x.lat, lon: x.lon, open: function () { openArea(x); map.flyTo([x.lat, x.lon], Math.max(map.getZoom(), 15), { duration: 0.8 }); } };
    return null;
  }
  function connFor(id) { return CONN.filter(function (c) { return c.a === id || c.b === id; }).map(function (c) { return { c: c, other: ent(c.a === id ? c.b : c.a) }; }).filter(function (x) { return x.other; }); }
  // While a place is selected, make every connected place visible even if its layer is off (cleared with the lines on deselect).
  function showLinkedEnd(o) {
    var s = BY_ID[o.id];
    if (s) {
      if (siteLayer.hasLayer(markers[s.id]) && map.hasLayer(siteLayer)) return;
      L.marker([s.lat, s.lon], { icon: markers[s.id].options.icon, title: s.name, zIndexOffset: 400 }).bindTooltip(s.name, { direction: 'right', offset: [16, -22], className: 'site-label' }).on('click', function () { focusSite(s); }).addTo(linkLayer);
      return;
    }
    var x = AREA_BY_ID[o.id]; if (!x) return;
    var mil = x.kind === 'military' || /^wp-/.test(x.id), drawn = ['landmark', 'government', 'prison', 'military'].indexOf(x.kind) >= 0;
    if (drawn && map.hasLayer(mil ? milGroup : profGroup)) return;
    L.marker([x.lat, x.lon], { zIndexOffset: 400, title: x.name, icon: L.divIcon({ className: '', iconSize: [24, 24], iconAnchor: [12, 12], html: '<div class="osm-ic prof" style="--c:' + (mil ? '#ec9a3c' : drawn ? '#e0b95a' : '#738091') + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + PROF_SVG + '</svg></div>' }) })
      .bindTooltip(x.name, { direction: 'right', offset: [12, 0], className: 'site-label' }).on('click', function () { openArea(x); }).addTo(linkLayer);
  }
  function profileSections(b) {
    var old = b.querySelector('.prof-secs'); if (old) old.remove();
    if (!curTarget || !curTarget.profile || !AREA_BY_ID[curTarget.profile]) return;
    var x = AREA_BY_ID[curTarget.profile], box = h('div', { class: 'prof-secs' });
    [['History', x.history], ['Under Gaddafi, 1969–2011', x.era], ['Today', x.today], ['Still unclear', x.uncertain]].forEach(function (y) { if (y[1]) box.appendChild(h('div', { class: 'sec' }, [h('h3', { text: y[0] }), h('p', { class: 'd-text', text: y[1] })])); });
    if (!box.children.length) return;
    var anchor = b.querySelector('.conn-sec') || b.querySelector('.fam-sec') || b.querySelector('.ai'); if (anchor) b.insertBefore(box, anchor); else b.appendChild(box);
  }
  function connSection(b) {
    var old = b.querySelector('.conn-sec'); if (old) old.remove();
    if (!curTarget || !curTarget.id) return;
    var me = ent(curTarget.id), all = connFor(curTarget.id).concat(curTarget.profile ? connFor(curTarget.profile).filter(function (x) { return x.other.id !== curTarget.id; }) : []);
    var same = all.filter(function (x) { return x.c.kind === 'same-place'; }), list = all.filter(function (x) { return x.c.kind !== 'same-place'; });
    if (!all.length || !me) return;
    linkLayer.clearLayers();
    var box = h('div', { class: 'conn' });
    list.sort(function (x, y) { return (x.c.kind === 'same-place') - (y.c.kind === 'same-place') || (x.c.year || 0) - (y.c.year || 0); }).forEach(function (x) {
      var c = x.c, col = CONN_COL[c.kind] || '#738091';
      showLinkedEnd(x.other);
      if (map.distance([me.lat, me.lon], [x.other.lat, x.other.lon]) > 60) L.polyline([[me.lat, me.lon], [x.other.lat, x.other.lon]], { color: col, weight: 3, opacity: 0.85, dashArray: c.confidence === 'documented' ? null : '6 6', interactive: false }).addTo(linkLayer);
      var src = (c.sources || [])[0];
      box.appendChild(h('div', { class: 'conn-row', style: '--c:' + col }, [
        h('button', { class: 'conn-go', onclick: x.other.open }, [h('b', { text: x.other.name }), h('small', { text: (CONN_KIND[c.kind] || c.kind) + (c.year ? ' · ' + c.year : '') + (c.confidence === 'reported' ? ' · reported' : '') })]),
        h('p', { text: c.why }),
        src ? h('a', { href: src.u, target: '_blank', rel: 'noopener', text: 'Source: ' + src.t }) : null
      ]));
    });
    if (same.length) box.appendChild(h('p', { class: 'conn-same' }, ['Also in the atlas as: '].concat(same.map(function (x, i) { return h('span', {}, [i ? ', ' : '', h('button', { class: 'linkbtn', text: x.other.name, title: x.c.why, onclick: x.other.open })]); }))));
    var sec = h('div', { class: 'sec conn-sec' }, [h('h3', { text: list.length ? 'Connections (' + list.length + ')' : 'Other entries' }), box]);
    var anchor = b.querySelector('.fam-sec') || b.querySelector('.ai'); if (anchor) b.insertBefore(sec, anchor); else b.appendChild(sec);
  }
  // network layer: every connection as a faint line
  var netLayer = L.layerGroup(), netOn = store.get('net', false);
  function drawNet() {
    netLayer.clearLayers();
    CONN.forEach(function (c) { if (c.kind === 'same-place') return; var x = ent(c.a), y = ent(c.b); if (!x || !y) return;
      L.polyline([[x.lat, x.lon], [y.lat, y.lon]], { color: CONN_COL[c.kind] || '#738091', weight: 2, opacity: 0.55, dashArray: c.confidence === 'documented' ? null : '5 6' })
        .bindTooltip(x.name + ' ↔ ' + y.name + ': ' + c.why, { sticky: true, className: 'site-label' }).on('click', function () { curTarget = { id: x.id, name: x.name, lat: x.lat, lon: x.lon }; x.open(); }).addTo(netLayer); });
  }
  $('hist-toggles').appendChild(toggleRow('net', 'Connections', 'Lines between linked places', netOn, function (v) { netOn = v; store.set('net', v); if (v) { drawNet(); netLayer.addTo(map); } else map.removeLayer(netLayer); }));
  GROUPS.push({ t: 'Connections', n: 'Transfers, units, attacks, where the dead were taken', parts: [['net', 'All connections', 'then']] });
  if (netOn) setTimeout(function () { drawNet(); netLayer.addTo(map); }, 0);
  // the AI sees them too
  var _ctx2 = contextFor; contextFor = function (o) {
    var base = _ctx2(o), ids = (o.places || []).concat((o.areas || []).map(function (x) { return x && x.id; })).filter(Boolean), seen = {}, lines = [];
    ids.forEach(function (id) { connFor(id).forEach(function (x) { var k = x.c.a + x.c.b + x.c.kind; if (seen[k]) return; seen[k] = 1; lines.push('- ' + (ent(id) || {}).name + ' ↔ ' + x.other.name + ' (' + (CONN_KIND[x.c.kind] || x.c.kind) + (x.c.year ? ', ' + x.c.year : '') + ', ' + x.c.confidence + '): ' + x.c.why); }); });
    return lines.length ? (base + '\n\nCONNECTIONS\n' + lines.slice(0, 20).join('\n')).slice(0, 17000) : base;
  };


  /* ---------- In memory: numbers, ranges and names, each with its source ---------- */
  var MEM = window.ATLAS_MEMORIAL || { items: [], names: [] };
  function fmtN(n) { return n == null ? '' : Number(n).toLocaleString('en-US'); }
  function rangeText(it) { if (it.low != null && it.high != null && it.low !== it.high) return fmtN(it.low) + '–' + fmtN(it.high); return fmtN(it.best != null ? it.best : (it.high != null ? it.high : it.low)); }
  function memBars(items, label) {
    if (!items.length) return null;
    var max = Math.max.apply(null, items.map(function (it) { return it.high || it.best || it.low || 0; })) || 1;
    var rows = items.map(function (it) {
      var lo = it.low != null ? it.low : (it.best || it.high), hi = it.high != null ? it.high : (it.best || it.low), best = it.best != null ? it.best : hi;
      var pct = function (v) { return (100 * v / max).toFixed(2) + '%'; };
      var src = (it.sources || [])[0];
      var tip = it.note + (src ? '\nSource: ' + src.t : '');
      return h('div', { class: 'mb-row', title: tip, tabindex: '0', 'aria-label': it.label + ': ' + rangeText(it) + ' ' + it.unit + '. ' + it.note }, [
        h('div', { class: 'mb-lab' }, [h('b', { text: it.label }), h('small', { text: [it.year, it.place].filter(Boolean).join(' · ') })]),
        h('div', { class: 'mb-track' }, [
          h('span', { class: 'mb-bar', style: 'width:' + pct(best) }),
          lo !== hi ? h('span', { class: 'mb-range', style: 'left:' + pct(lo) + ';width:calc(' + pct(hi) + ' - ' + pct(lo) + ')' }) : null
        ]),
        h('div', { class: 'mb-val', text: rangeText(it) })
      ]);
    });
    return h('figure', { class: 'mem-fig' }, [h('figcaption', { text: label }), h('div', { class: 'mb' }, rows),
      h('p', { class: 'mem-note', text: 'Bars show the most-cited figure; the lighter band is the range between sources. Hover or tap a row for who counted.' })]);
  }
  function renderMemorial() {
    var b = $('mem-body'); b.innerHTML = '';
    b.appendChild(h('p', { class: 'mem-dedication', text: 'For the people of Tripoli and of all Libya who were killed, executed, or taken and never came home.' }));
    var lines = (MEM.lines || []);
    if (lines.length) b.appendChild(h('ul', { class: 'mem-lines' }, lines.map(function (l) { return h('li', {}, [h('span', { class: 'ml-n', text: l.n }), h('span', { class: 'ml-t', text: l.t })]); })));
    b.appendChild(h('p', { class: 'mem-rest', text: 'And countless thousands more, if not orders of magnitude more, whose names we may never know.' }));
    var counted = lines.filter(function (l) { return l.count; });
    if (counted.length) {
      var total = counted.reduce(function (s, l) { return s + l.count; }, 0);
      var cv = h('canvas', { class: 'mem-dots', role: 'img', 'aria-label': 'One dot for each of about ' + total.toLocaleString('en-US') + ' people counted above, followed by fainter dots for the many more never counted' });
      var tip = h('div', { class: 'mem-dot-tip', hidden: '' });
      b.appendChild(h('figure', { class: 'mem-dotfig' }, [h('div', { class: 'mem-dotwrap' }, [cv, tip]),
        h('figcaption', { text: 'Each solid dot is one person in the counts above, about ' + total.toLocaleString('en-US') + ' in all. The fading dots after them stand for the people never counted; their number is not known.' })]));
      setTimeout(function () { drawDots(cv, tip, counted); }, 30);
    }
    var fam = REPORTS.filter(function (r) { return r.cat === 'remember'; });
    var names = (MEM.names || []).map(function (n) { return { name: n.name, what: n.what, site: n.site }; }).concat(fam.map(function (r) { return { name: r.title, what: [r.when, r.text].filter(Boolean).join(' · '), by: r.by || 'family' }; }));
    if (names.length) {
      b.appendChild(h('h3', { class: 'mem-h', text: 'We remember' }));
      b.appendChild(h('ul', { class: 'mem-names' }, names.map(function (n) {
        var site = n.site && BY_ID[n.site];
        return h('li', {}, [h('b', { text: n.name }), n.what ? h('span', { text: ' ' + n.what }) : null, n.by ? h('small', { text: ' Added by ' + n.by + '.' }) : null, site ? h('button', { class: 'linkbtn', text: 'Where', onclick: function () { closeMemorial(); focusSite(site); } }) : null]);
      })));
    }
    if (canReport) b.appendChild(h('div', { class: 'row-btns' }, [h('button', { class: 'btn', text: 'Remember someone', onclick: function () {
      closeMemorial(); openReportForm({ lat: 32.8925, lon: 13.1802, target: 'memorial', targetName: 'In memory', cat: 'remember' });
      $('rep-name').placeholder = 'Their name'; $('rep-text').placeholder = 'Who they were, and what happened to them.'; } })]));
  }
  function drawDots(cv, tip, groups) {
    var W = cv.parentNode.clientWidth, D = W < 500 ? 4 : 5, G = 2, S = D + G, cols = Math.floor(W / S), ghosts = 9000;
    var total = groups.reduce(function (s, l) { return s + l.count; }, 0), n = total + ghosts, rows = Math.ceil(n / cols);
    var dpr = window.devicePixelRatio || 1; cv.width = cols * S * dpr; cv.height = rows * S * dpr; cv.style.width = cols * S + 'px'; cv.style.height = rows * S + 'px';
    var c = cv.getContext('2d'); c.scale(dpr, dpr);
    var ink = getComputedStyle(document.documentElement).getPropertyValue('--mem').trim() || '#8a2846';
    var ranges = [], i = 0;
    groups.forEach(function (g) { ranges.push([i, i + g.count, g]); i += g.count; });
    var draw = function (hi) {
      c.clearRect(0, 0, cols * S, rows * S);
      for (var k = 0; k < n; k++) {
        var x = (k % cols) * S + D / 2, y = Math.floor(k / cols) * S + D / 2;
        if (k < total) { var r = ranges.filter(function (q) { return k >= q[0] && k < q[1]; })[0]; c.globalAlpha = hi && r !== hi ? 0.28 : 1; c.fillStyle = ink; }
        else { c.globalAlpha = Math.max(0.05, 0.42 * (1 - (k - total) / ghosts)); c.fillStyle = ink; }
        c.beginPath(); c.arc(x, y, D / 2, 0, 6.2832); c.fill();
      }
      c.globalAlpha = 1;
    };
    draw(null);
    var at = function (ev) { var rc = cv.getBoundingClientRect(), k = Math.floor((ev.clientY - rc.top) / S) * cols + Math.floor((ev.clientX - rc.left) / S); return k; };
    var show = function (ev) {
      var k = at(ev), r = ranges.filter(function (q) { return k >= q[0] && k < q[1]; })[0];
      if (r) { draw(r); tip.hidden = false; tip.textContent = r[2].n + ' ' + r[2].t; }
      else if (k >= total && k < n) { draw(null); tip.hidden = false; tip.textContent = 'The uncounted: people killed or disappeared whose deaths were never recorded.'; }
      else { draw(null); tip.hidden = true; }
      var rc = cv.getBoundingClientRect(); tip.style.left = Math.min(ev.clientX - rc.left + 12, rc.width - 260) + 'px'; tip.style.top = (ev.clientY - rc.top + 14) + 'px';
    };
    cv.addEventListener('mousemove', show); cv.addEventListener('click', show);
    cv.addEventListener('mouseleave', function () { draw(null); tip.hidden = true; });
  }
  function openMemorial() { renderMemorial(); $('memorial').hidden = false; $('mem-close').focus(); }
  function closeMemorial() { $('memorial').hidden = true; }
  $('btn-memorial').onclick = openMemorial;
  $('mem-close').onclick = closeMemorial;
  $('memorial').addEventListener('click', function (e) { if (e.target.id === 'memorial') closeMemorial(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('memorial').hidden) closeMemorial(); });

  /* ---------- start ---------- */
  setSize(store.get('size', 'normal'));
  setBase(store.get('base2', document.documentElement.classList.contains('dark') ? 'dark' : 'light'));
  refresh();
  refreshOSM();
  hud(map.getCenter());
  if (DESKTOP.matches) openPanel('drawer');
  maybeWelcome();
  setTheme(store.get('theme', 'light'), true);
  loadReports();
  var code = store.get('code', '');
  if (CFG.aiEndpoint && code) relay(code, { status: true }).catch(function () {});
})();
