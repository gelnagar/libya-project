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
    $('basemaps').appendChild(h('button', { 'data-key': k, 'aria-pressed': 'false', onclick: function () { setBase(k); } }, [BASEMAPS[k].name, h('small', { text: BASEMAPS[k].note })]));
  });

  /* ---------- state ---------- */
  var DEFAULT_ON = { detention: true, security: true, military: true, airstrike: true, massacre: true, power: true, landmark: true, districts: true, rings: false, labels: true, grid: true, timeline: true };
  var active = Object.assign({}, DEFAULT_ON, store.get('layers2', {}));
  var PERIODS = { pre: 'Before 1969', main: '1969–1989', post: 'After 1989' };
  var periods = Object.assign({ pre: true, main: true, post: true }, store.get('periods', {}));
  function save() { store.set('layers2', active); store.set('periods', periods); }

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
    L.marker([d[2], d[3]], { interactive: false, keyboard: false,
      icon: L.divIcon({ className: '', iconSize: [160, 34], iconAnchor: [80, 17], html: '<div class="district">' + d[0] + '<span>' + d[1] + '</span></div>' }) }).addTo(districtLayer);
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
   ['rings', 'Uncertainty rings', 'How far off each marker could be (off by default)'],
   ['labels', 'Place names on markers', 'Shown when zoomed in'],
   ['grid', 'Coordinate grid', 'Lines every 0.05°'],
   ['timeline', 'Timeline bar', 'Computer screens only']].forEach(function (d) {
    $('display-toggles').appendChild(toggleRow(d[0], d[1], d[2], active[d[0]], function (v) { active[d[0]] = v; refresh(); }));
  });
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
    tl.querySelectorAll('.tl-axis,.tl-band,.tl-tick,.tl-dot').forEach(function (e) { e.remove(); });
    tl.appendChild(h('div', { class: 'tl-axis' }));
    tl.appendChild(h('div', { class: 'tl-band', style: 'left:' + pos(tx(1969)) + ';width:calc(' + (tx(1989) - tx(1969)).toFixed(4) + ' * (100% - 28px))' }));
    [1911, 1945, 1969, 1974, 1979, 1984, 1989, 2011].forEach(function (y) { tl.appendChild(h('div', { class: 'tl-tick', style: 'left:' + pos(tx(y)), text: String(y) })); });
    var stack = {};
    SITES.filter(function (s) { return s.y0 != null && visible(s); }).sort(function (a, b) { return a.y0 - b.y0; }).forEach(function (s) {
      var lay = LAYERS[s.layer], n = stack[s.y0] = (stack[s.y0] || 0) + 1;
      tl.appendChild(h('button', { class: 'tl-dot ' + lay.shape + (selected === s.id ? ' sel' : ''), title: s.y0 + ' · ' + s.name, 'aria-label': s.y0 + ', ' + s.name,
        style: 'left:' + pos(tx(s.y0)) + ';bottom:' + (18 + (n - 1) * 13) + 'px;background:' + lay.color, onclick: function () { focusSite(s); } }));
    });
  }

  /* ---------- HUD ---------- */
  function hud(ll) {
    $('hud').innerHTML = 'LAT <b>' + ll.lat.toFixed(5) + '°N</b> · LON <b>' + ll.lng.toFixed(5) + '°E</b> · ZOOM <b>' + map.getZoom() + '</b>';
  }
  map.on('mousemove', function (e) { hud(e.latlng); });
  map.on('moveend', function () { hud(map.getCenter()); });

  /* ---------- present-day OpenStreetMap layers ---------- */
  var OSM = {
    landuse: { label: 'Residential, commercial & industrial zones', minZoom: 13, note: 'Zoom in to see zones',
      q: function (b) { return '(way["landuse"~"^(residential|commercial|retail|industrial)$"](' + b + ');relation["landuse"~"^(residential|commercial|retail|industrial)$"](' + b + '););out geom 4000;'; },
      style: function (t) { var c = { residential: '#8f99a8', commercial: '#68c1ee', retail: '#68c1ee', industrial: '#ec9a3c' }[t.landuse] || '#8f99a8'; return { color: c, weight: 1, fillColor: c, fillOpacity: 0.18 }; }, swatch: '#8f99a8' },
    buildings: { label: 'Buildings', minZoom: 16, note: 'Zoom in close to see buildings',
      q: function (b) { return 'way["building"](' + b + ');out geom 3000;'; },
      style: function () { return { color: '#c5cbd3', weight: 0.6, fillColor: '#8f99a8', fillOpacity: 0.35 }; }, swatch: '#c5cbd3' },
    military: { label: 'Military areas (today)', minZoom: 11, note: 'Areas tagged military now',
      q: function (b) { return '(way["landuse"="military"](' + b + ');relation["landuse"="military"](' + b + ');way["military"](' + b + ');node["military"](' + b + '););out geom 1500;'; },
      style: function () { return { color: '#ec9a3c', weight: 2, dashArray: '6 4', fillColor: '#ec9a3c', fillOpacity: 0.08 }; }, point: '#ec9a3c' },
    water: { label: 'Water wells, towers & reservoirs', minZoom: 11, note: 'Water infrastructure',
      q: function (b) { return '(node["man_made"~"^(water_well|water_tower|water_works|reservoir_covered)$"](' + b + ');way["man_made"~"^(water_tower|water_works|reservoir_covered)$"](' + b + ');way["landuse"="reservoir"](' + b + '););out geom 1500;'; },
      style: function () { return { color: '#4c90f0', weight: 1.5, fillColor: '#4c90f0', fillOpacity: 0.3 }; }, point: '#4c90f0' },
    oil: { label: 'Oil & gas wells, depots, refineries', minZoom: 9, note: 'Few in Tripoli itself',
      q: function (b) { return '(node["man_made"="petroleum_well"](' + b + ');way["man_made"="petroleum_well"](' + b + ');way["industrial"~"^(oil|refinery|fuel)$"](' + b + ');node["industrial"~"^(oil|refinery)$"](' + b + ');way["man_made"="storage_tank"]["content"~"oil|fuel|petrol|gas"](' + b + '););out geom 1500;'; },
      style: function () { return { color: '#d0b090', weight: 1.5, fillColor: '#d0b090', fillOpacity: 0.3 }; }, point: '#d0b090' }
  };
  var ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  var osmActive = store.get('osm', {});
  var osmGroups = {}, osmCache = {}, osmAbort = {};
  var canvas = L.canvas({ padding: 0.4 });
  Object.keys(OSM).forEach(function (k) {
    osmGroups[k] = L.layerGroup().addTo(map);
    var o = OSM[k];
    var sw = h('span', { class: 'glyph square', style: 'background:' + (o.point || o.swatch) });
    $('osm-toggles').appendChild(toggleRow('osm-' + k, o.label, o.note, osmActive[k], function (v) {
      osmActive[k] = v; store.set('osm', osmActive);
      if (!v) { osmGroups[k].clearLayers(); if (osmAbort[k]) osmAbort[k].abort(); }
      refreshOSM();
    }, sw));
  });
  function bboxKey() {
    var b = map.getBounds().pad(0.15);
    function r(n) { return Math.round(n * 200) / 200; }
    return [r(b.getSouth()), r(b.getWest()), r(b.getNorth()), r(b.getEast())].join(',');
  }
  function overpass(query, signal, i) {
    i = i || 0;
    return fetch(ENDPOINTS[i], { method: 'POST', body: 'data=' + encodeURIComponent('[out:json][timeout:25];' + query), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: signal })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(function (e) { if (e.name === 'AbortError' || i + 1 >= ENDPOINTS.length) throw e; return overpass(query, signal, i + 1); });
  }
  function drawOSM(k, data) {
    var o = OSM[k], g = osmGroups[k];
    g.clearLayers();
    (data.elements || []).forEach(function (el) {
      var t = el.tags || {}, shape = null;
      if (el.type === 'node') {
        shape = L.circleMarker([el.lat, el.lon], { renderer: canvas, radius: 7, color: '#111418', weight: 2, fillColor: o.point || '#fff', fillOpacity: 1 });
      } else if (el.type === 'way' && el.geometry) {
        var pts = el.geometry.map(function (p) { return [p.lat, p.lon]; });
        var closed = pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
        shape = closed ? L.polygon(pts, Object.assign({ renderer: canvas }, o.style(t))) : L.polyline(pts, Object.assign({ renderer: canvas }, o.style(t), { fill: false }));
      } else if (el.type === 'relation' && el.members) {
        var rs = el.members.filter(function (m) { return m.geometry && m.role !== 'inner'; }).map(function (m) { return m.geometry.map(function (p) { return [p.lat, p.lon]; }); });
        if (rs.length) shape = L.polygon(rs, Object.assign({ renderer: canvas }, o.style(t)));
      }
      if (shape) { shape.on('click', function (ev) { L.DomEvent.stop(ev); if (picking) { openSpot(ev.latlng); return; } openFeature(k, el); }); shape.addTo(g); }
    });
  }
  var osmTimer;
  function refreshOSM() {
    clearTimeout(osmTimer);
    osmTimer = setTimeout(function () {
      var z = map.getZoom(), key = bboxKey(), loading = false, tooFar = [];
      Object.keys(OSM).forEach(function (k) {
        if (!osmActive[k]) return;
        var o = OSM[k];
        if (z < o.minZoom) { osmGroups[k].clearLayers(); tooFar.push(o.label.split(',')[0].split(' (')[0].toLowerCase()); return; }
        var ck = k + '|' + key;
        if (osmCache[ck]) { drawOSM(k, osmCache[ck]); return; }
        if (osmAbort[k]) osmAbort[k].abort();
        var ac = new AbortController(); osmAbort[k] = ac;
        loading = true;
        status('Loading ' + o.label.toLowerCase() + '…');
        overpass(o.q(key), ac.signal).then(function (data) {
          osmCache[ck] = data;
          if (osmActive[k]) drawOSM(k, data);
          if ((data.elements || []).length) status(null); else status('No ' + o.label.toLowerCase() + ' mapped in this area.', 3000);
        }).catch(function (e) {
          if (e.name === 'AbortError') return;
          status('Could not load ' + o.label.toLowerCase() + ' right now. Move the map to try again.', 5000);
        });
      });
      if (!loading && tooFar.length) status('Zoom in to see ' + tooFar.join(', ') + '.', 3500);
    }, 600);
  }
  map.on('moveend', refreshOSM);

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
    if (id === 'sheet') { markSelected(null); linkLayer.clearLayers(); if (spotMarker) { map.removeLayer(spotMarker); spotMarker = null; } }
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
    var body = $('sheet-body'); body.innerHTML = ''; body.scrollTop = 0;
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
      h('span', { class: 'tag', style: 'color:' + lay.color, text: lay.label }),
      h('span', { class: 'tag', style: 'color:var(--muted)', text: LEVELS[s.level] }),
      outside ? h('span', { class: 'tag', style: 'color:var(--focus)', text: 'Outside 1969–1989' }) : null
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
    add(body, aiBox({ kind: 'historical site', name: s.name, arabic: s.ar, category: lay.label, evidence: LEVELS[s.level], period: s.period, summary: s.relevance + ' ' + s.text, lat: s.lat, lon: s.lon }, QS[s.id] || []));
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
    body.appendChild(h('div', { class: 'tags' }, [h('span', { class: 'tag', style: 'color:var(--accent)', text: 'OpenStreetMap · today' })]));
    body.appendChild(h('div', {}, [h('h1', { class: 'd-title', text: name }), t.name && t.name !== name ? h('div', { class: 'd-ar', text: t.name }) : null]));
    body.appendChild(h('p', { class: 'brief', text: KIND[k](t) + '. ' + EXPLAIN[k] }));
    var rows = Object.keys(t).filter(function (x) { return !/^(source|note|fixme|wikidata|created_by)/.test(x); }).slice(0, 12);
    if (rows.length) body.appendChild(h('div', { class: 'sec' }, [h('h3', { text: 'Map details' }), h('table', { class: 'kv' }, [h('tbody', {}, rows.map(function (x) { return h('tr', {}, [h('td', { text: x.replace(/_/g, ' ') }), h('td', { text: t[x] })]); }))])]));
    add(body, aiBox({ kind: 'present-day map feature', type: KIND[k](t), name: name, tags: t, lat: lat, lon: lon }, (FEATQ[k] || []).map(function (x) { return x.replace(/\{x\}/g, name); })));
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
    var title = h('h1', { class: 'd-title', text: dist.m < 2500 ? dist.name : 'Selected spot' });
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
    var nearName = near.length ? near[0].s.name : null;
    var spotQs = SPOTQ.filter(function (x) { return nearName || x.indexOf('{n}') < 0; }).map(function (x) { return x.replace(/\{d\}/g, dist.name).replace(/\{n\}/g, nearName); });
    add(body, aiBox(place, spotQs));
    body.appendChild(h('div', { class: 'row-btns' }, [h('button', { class: 'btn', text: 'Ask about another spot', onclick: function () { setPicking(true); } })]));
    openPanel('sheet');

    var ac = new AbortController(); setTimeout(function () { ac.abort(); }, 8000);
    fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&accept-language=en&lat=' + ll.lat + '&lon=' + ll.lng, { signal: ac.signal })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (j) {
        var a = j.address || {};
        var area = a.neighbourhood || a.suburb || a.quarter || a.city_district || a.village || a.town;
        if (area) title.textContent = area;
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
    return fetch(CFG.aiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Family-Code': code }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (j && j.credit) showCredit(j.credit); if (!r.ok) { var e = new Error(j.error || ('Error ' + r.status)); e.code = r.status; throw e; } return j; }); });
  }
  function aiBox(place, qs) {
    if (!CFG.aiEndpoint) return null;
    var list = (qs || []).slice();
    var idx = list.length ? Math.floor(Math.random() * list.length) : 0;
    var q = h('textarea', { 'aria-label': 'Your question', id: 'ai-q', placeholder: 'Or type your own question' });
    var pw = h('input', { type: 'password', id: 'ai-pw', autocomplete: 'off', autocapitalize: 'none', 'aria-label': 'Family password' });
    var pwWrap = h('div', { class: 'field' }, [h('label', { for: 'ai-pw', text: 'Family password' }), pw, h('small', { text: 'Only needed once on this device.' })]);
    pwWrap.hidden = !!store.get('code', '');
    var out = h('p', { class: 'ai-out', hidden: '' });
    var asked = h('p', { class: 'ai-asked', hidden: '' });
    var btn = h('button', { class: 'btn primary', text: 'Ask AI' });
    var sugg = h('div', { class: 'sugg' });
    function renderSugg() {
      sugg.innerHTML = '';
      for (var i = 0; i < Math.min(3, list.length); i++) {
        (function (t) { sugg.appendChild(h('button', { class: 'qchip', text: t, onclick: function () { q.value = t; ask(); } })); })(list[(idx + i) % list.length]);
      }
      if (list.length > 3) sugg.appendChild(h('button', { class: 'qmore', text: 'More questions ↻', onclick: function () { idx = (idx + 3) % list.length; renderSugg(); } }));
    }
    renderSugg();
    function ask() {
      var question = q.value.trim() || list[idx % Math.max(1, list.length)] || 'Tell me about this place.';
      var code = store.get('code', '') || (pw.value || '').trim();
      if (!code) { pwWrap.hidden = false; pw.focus(); return; }
      store.set('code', code); pwWrap.hidden = true;
      btn.disabled = true; btn.textContent = 'Thinking…';
      asked.hidden = false; asked.textContent = question;
      out.hidden = false; out.classList.remove('err'); out.textContent = '';
      relay(code, { place: place, question: question.slice(0, 500) })
        .then(function (j) { out.textContent = j.text || 'No answer came back. Try again.'; })
        .catch(function (e) {
          out.classList.add('err');
          if (e.code === 401) { store.set('code', ''); pw.value = ''; pwWrap.hidden = false; }
          out.textContent = e.code === 401 ? 'That password was not accepted. Please type it again.'
            : e.code === 402 ? 'AI answers are paused because the AI credit has run out.'
            : e.code === 429 ? 'Too many questions just now. Wait a minute and try again.'
            : 'Could not reach the AI right now. Check your connection and try again.';
        })
        .then(function () { btn.disabled = false; btn.textContent = 'Ask AI'; asked.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    }
    btn.addEventListener('click', ask);
    return h('div', { class: 'ai' }, [h('h3', { style: 'margin:0;font:500 .7em var(--f-data);letter-spacing:.14em;text-transform:uppercase;color:#8abbff', text: 'Ask AI · tap a question' }), sugg, q, pwWrap, btn, asked, out]);
  }

  /* ---------- chat guide (agent loop) ---------- */
  var convo = [];
  var CATALOG = SITES.map(function (s) { return [s.id, s.name, LAYERS[s.layer].label, s.period, s.relevance].join(' | '); }).join('\n') +
    '\nKnown but with no map location: ' + UNPLACED.map(function (u) { return u.name + ' (' + u.when + ')'; }).join('; ');
  var STARTERS = ['Show me only the massacres', 'Where were political prisoners held?', 'What happened in the 1986 US air raid?', 'Switch to satellite and take me to Ben Ashour'];
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
    var m = bubble('bot', 'Ask me anything about Tripoli between 1969 and 1989, or tell me what to show. I can change the map for you, and if something isn’t here yet I can help you ask ' + OWNER + ' to look into it.');
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
      (a.hide || []).forEach(function (k) { osmActive[k] = false; osmGroups[k].clearLayers(); });
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
    suggest_request: function (a) { ui.requests.push(a); return 'The request form is shown to the reader, filled in with: ' + (a.title || '') + '.'; }
  };
  var STEP_LABEL = { get_map_state: 'Checking the map', search_places: 'Searching the map', get_place: 'Reading place details', describe_spot: 'Looking up the area',
    set_layers: 'Changing layers', set_today_layers: 'Loading present-day layers', set_basemap: 'Changing the map style', set_periods: 'Changing the time period',
    set_display: 'Adjusting the display', fly_to: 'Moving the map', open_place: 'Opening the place', suggest_request: 'Preparing a request' };
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
    ui = { log: [], chips: [], requests: [], mapChanged: false };
    runAgent(code, function (s) { wait.querySelector('p').textContent = s; scrollChat(); })
      .then(function (reply) {
        wait.remove();
        var m = bubble('bot', reply || (ui.log.length ? 'Done.' : 'I don’t have an answer for that.'));
        if (ui.log.length) m.appendChild(h('ul', { class: 'did' }, ui.log.map(function (x) { return h('li', { text: x }); })));
        var box = h('div', { class: 'acts' }), seen = {};
        ui.chips.forEach(function (s) { if (seen[s.id]) return; seen[s.id] = 1; box.appendChild(h('button', { class: 'act', onclick: function () { if (!DESKTOP.matches) closeChat(); focusSite(s); } }, [glyph(s.layer), h('span', { text: 'Open ' + s.name })])); });
        if (ui.mapChanged && !DESKTOP.matches) box.appendChild(h('button', { class: 'act', text: 'View the map ↓', onclick: closeChat }));
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
    $('code-field').hidden = !CFG.aiEndpoint;
    $('family-code').value = store.get('code', '');
    $('set-close').focus();
  }
  function closeSettings() { if (CFG.aiEndpoint) store.set('code', $('family-code').value.trim()); $('settings').hidden = true; }
  $('btn-settings').onclick = openSettings;
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
    if (picking) setPicking(false);
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
