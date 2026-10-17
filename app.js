(function () {
  'use strict';

  var CFG = window.ATLAS_CONFIG || {};
  var LAYERS = window.ATLAS_LAYERS, LEVELS = window.ATLAS_LEVELS, SITES = window.ATLAS_SITES, DISTRICTS = window.ATLAS_DISTRICTS;
  var HOME = L.latLngBounds([32.79, 13.08], [32.91, 13.30]);
  var DESKTOP = window.matchMedia('(min-width: 900px)');

  /* ---------- small helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('atlas.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('atlas.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var statusTimer;
  function status(msg, ms) {
    var s = $('status');
    clearTimeout(statusTimer);
    if (!msg) { s.hidden = true; return; }
    s.textContent = msg; s.hidden = false;
    if (ms) statusTimer = setTimeout(function () { s.hidden = true; }, ms);
  }

  /* ---------- map ---------- */
  var map = L.map('map', { zoomControl: false, preferCanvas: true, maxZoom: 19, minZoom: 9, tap: true });
  L.control.zoom({ position: 'topright' }).addTo(map);
  L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);
  map.fitBounds(HOME);

  var OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  var BASEMAPS = {
    dark: { name: 'Dark', note: 'Night view', layers: [L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19, attribution: OSM_ATTR + ' &copy; <a href="https://carto.com/attributions">CARTO</a>' })] },
    satellite: { name: 'Satellite', note: 'Photos from above', layers: [
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 18, maxZoom: 19, attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics' }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 18, maxZoom: 19 })
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

  /* ---------- historical layers ---------- */
  var active = store.get('layers', { detention: true, military: true, power: true, landmark: true, districts: true, rings: true, labels: true });
  var groups = {}, rings = L.layerGroup(), markers = {};
  Object.keys(LAYERS).forEach(function (k) { groups[k] = L.layerGroup(); });

  SITES.forEach(function (s) {
    var lay = LAYERS[s.layer];
    var icon = L.divIcon({ className: '', iconSize: [34, 34], iconAnchor: [17, 17],
      html: '<div class="mk l-' + s.layer + ' v-' + s.level + '" style="--c:' + lay.color + '">' + lay.code + '</div>' });
    var m = L.marker([s.lat, s.lon], { icon: icon, title: s.name, keyboard: true, riseOnHover: true })
      .bindTooltip(s.name, { permanent: true, direction: 'right', offset: [18, 0], className: 'site-label', interactive: false })
      .on('click', function () { openSite(s); });
    m.addTo(groups[s.layer]);
    markers[s.id] = m;
    L.circle([s.lat, s.lon], { radius: s.r * 1000, color: lay.color, weight: 1.5, dashArray: '5 5', fillColor: lay.color, fillOpacity: 0.035, interactive: false, layer: s.layer }).addTo(rings);
  });

  var districtGroup = L.layerGroup();
  DISTRICTS.forEach(function (d) {
    L.marker([d[2], d[3]], { interactive: false, keyboard: false,
      icon: L.divIcon({ className: '', iconSize: [160, 34], iconAnchor: [80, 17], html: '<div class="district">' + d[0] + '<span>' + d[1] + '</span></div>' }) }).addTo(districtGroup);
  });

  var HIST_TOGGLES = [
    { key: 'detention', label: LAYERS.detention.label, note: 'Prisons and interrogation sites' },
    { key: 'military', label: LAYERS.military.label, note: 'Bases and the 1986 strike targets' },
    { key: 'power', label: LAYERS.power.label, note: 'Bab al-Aziziya and the old royal palace' },
    { key: 'landmark', label: LAYERS.landmark.label, note: 'Squares, campuses and events' },
    { key: 'districts', label: 'District names', note: 'English and Arabic, approximate' },
    { key: 'rings', label: 'Uncertainty rings', note: 'How far off each marker could be' },
    { key: 'labels', label: 'Place names on markers', note: 'Shown when zoomed in' }
  ];

  function applyHist() {
    Object.keys(LAYERS).forEach(function (k) { if (active[k]) groups[k].addTo(map); else map.removeLayer(groups[k]); });
    if (active.districts) districtGroup.addTo(map); else map.removeLayer(districtGroup);
    rings.eachLayer(function (c) { if (active.rings && active[c.options.layer]) { if (!map.hasLayer(c)) c.addTo(map); } else map.removeLayer(c); });
    updateZoomClasses();
    store.set('layers', active);
  }
  function updateZoomClasses() {
    var z = map.getZoom(), el = map.getContainer();
    el.classList.toggle('hide-labels', !active.labels || z < 13);
    el.classList.toggle('hide-districts', z < 12);
  }
  map.on('zoomend', updateZoomClasses);

  function toggleRow(t, checked, onchange, swatch) {
    var input = h('input', { type: 'checkbox', id: 'tg-' + t.key });
    input.checked = !!checked;
    input.addEventListener('change', function () { onchange(input.checked); });
    return h('label', { class: 'toggle', for: 'tg-' + t.key }, [input, swatch || null, h('span', { class: 't' }, [t.label, h('small', { text: t.note })])]);
  }
  HIST_TOGGLES.forEach(function (t) {
    var lay = LAYERS[t.key];
    var sw = lay ? h('span', { class: 'sw' + (t.key === 'military' || t.key === 'power' ? ' sq' : ''), style: 'background:' + lay.color, text: lay.code }) : null;
    $('hist-toggles').appendChild(toggleRow(t, active[t.key], function (v) { active[t.key] = v; applyHist(); }, sw));
  });

  /* places list */
  Object.keys(LAYERS).forEach(function (k) {
    SITES.filter(function (s) { return s.layer === k; }).forEach(function (s) {
      var lay = LAYERS[k];
      $('places').appendChild(h('button', { onclick: function () {
        if (!active[k]) { active[k] = true; var cb = $('tg-' + k); if (cb) cb.checked = true; applyHist(); }
        map.flyTo([s.lat, s.lon], Math.max(map.getZoom(), 14), { duration: 0.8 });
        openSite(s);
      } }, [h('span', { class: 'sw' + (k === 'military' || k === 'power' ? ' sq' : ''), style: 'background:' + lay.color + ';width:22px;height:22px;display:grid;place-items:center;border-radius:' + (k === 'military' || k === 'power' ? '3px' : '50%') + ';font:600 12px var(--f-data);color:#0a0e13;flex:none', text: lay.code }), h('span', { text: s.name })]));
    });
  });

  /* ---------- present-day OpenStreetMap layers (live, via Overpass) ---------- */
  var OSM = {
    landuse: { label: 'Residential, commercial & industrial zones', minZoom: 13, note: 'Zoom in to see zones',
      q: function (b) { return '(way["landuse"~"^(residential|commercial|retail|industrial)$"](' + b + ');relation["landuse"~"^(residential|commercial|retail|industrial)$"](' + b + '););out geom 4000;'; },
      style: function (t) { var c = { residential: '#8fa6bd', commercial: '#4cc9f0', retail: '#4cc9f0', industrial: '#ff8a5b' }[t.landuse] || '#8fa6bd'; return { color: c, weight: 1, fillColor: c, fillOpacity: 0.2 }; } },
    buildings: { label: 'Buildings', minZoom: 16, note: 'Zoom in close to see buildings',
      q: function (b) { return 'way["building"](' + b + ');out geom 3000;'; },
      style: function () { return { color: '#c9d3dd', weight: 0.6, fillColor: '#9fb0c2', fillOpacity: 0.35 }; } },
    military: { label: 'Military areas (today)', minZoom: 11, note: 'Areas tagged military now',
      q: function (b) { return '(way["landuse"="military"](' + b + ');relation["landuse"="military"](' + b + ');way["military"](' + b + ');node["military"](' + b + '););out geom 1500;'; },
      style: function () { return { color: '#ffb224', weight: 2, dashArray: '6 4', fillColor: '#ffb224', fillOpacity: 0.1 }; }, point: '#ffb224' },
    water: { label: 'Water wells, towers & reservoirs', minZoom: 11, note: 'Water infrastructure',
      q: function (b) { return '(node["man_made"~"^(water_well|water_tower|water_works|reservoir_covered)$"](' + b + ');way["man_made"~"^(water_tower|water_works|reservoir_covered)$"](' + b + ');way["landuse"="reservoir"](' + b + '););out geom 1500;'; },
      style: function () { return { color: '#3fa7ff', weight: 1.5, fillColor: '#3fa7ff', fillOpacity: 0.3 }; }, point: '#3fa7ff' },
    oil: { label: 'Oil & gas wells, depots, refineries', minZoom: 9, note: 'Few in Tripoli itself',
      q: function (b) { return '(node["man_made"="petroleum_well"](' + b + ');way["man_made"="petroleum_well"](' + b + ');way["industrial"~"^(oil|refinery|fuel)$"](' + b + ');node["industrial"~"^(oil|refinery)$"](' + b + ');way["man_made"="storage_tank"]["content"~"oil|fuel|petrol|gas"](' + b + '););out geom 1500;'; },
      style: function () { return { color: '#f4d35e', weight: 1.5, fillColor: '#f4d35e', fillOpacity: 0.3 }; }, point: '#f4d35e' }
  };
  var ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  var osmActive = store.get('osm', {});
  var osmGroups = {}, osmCache = {}, osmAbort = {};
  var canvas = L.canvas({ padding: 0.4 });
  Object.keys(OSM).forEach(function (k) { osmGroups[k] = L.layerGroup().addTo(map); });

  Object.keys(OSM).forEach(function (k) {
    var o = OSM[k];
    var sw = h('span', { class: 'sw sq', style: 'background:' + (o.point || o.style({ landuse: 'industrial' }).color) });
    $('osm-toggles').appendChild(toggleRow({ key: 'osm-' + k, label: o.label, note: o.note }, osmActive[k], function (v) {
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
  function draw(k, data) {
    var o = OSM[k], g = osmGroups[k];
    g.clearLayers();
    (data.elements || []).forEach(function (el) {
      var t = el.tags || {}, shape = null;
      if (el.type === 'node') {
        shape = L.circleMarker([el.lat, el.lon], { renderer: canvas, radius: 7, color: '#0a0e13', weight: 2, fillColor: o.point || '#fff', fillOpacity: 1 });
      } else if (el.type === 'way' && el.geometry) {
        var pts = el.geometry.map(function (p) { return [p.lat, p.lon]; });
        var closed = pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
        shape = closed ? L.polygon(pts, Object.assign({ renderer: canvas }, o.style(t))) : L.polyline(pts, Object.assign({ renderer: canvas }, o.style(t), { fill: false }));
      } else if (el.type === 'relation' && el.members) {
        var rings = el.members.filter(function (m) { return m.geometry && m.role !== 'inner'; }).map(function (m) { return m.geometry.map(function (p) { return [p.lat, p.lon]; }); });
        if (rings.length) shape = L.polygon(rings, Object.assign({ renderer: canvas }, o.style(t)));
      }
      if (shape) { shape.on('click', function (ev) { L.DomEvent.stop(ev); openFeature(k, el); }); shape.addTo(g); }
    });
  }
  var refreshTimer;
  function refreshOSM() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () {
      var z = map.getZoom(), key = bboxKey(), waiting = [], tooFar = [];
      Object.keys(OSM).forEach(function (k) {
        if (!osmActive[k]) return;
        var o = OSM[k];
        if (z < o.minZoom) { osmGroups[k].clearLayers(); tooFar.push(o.label.split(',')[0].toLowerCase()); return; }
        var ck = k + '|' + key;
        if (osmCache[ck]) { draw(k, osmCache[ck]); return; }
        if (osmAbort[k]) osmAbort[k].abort();
        var ac = new AbortController(); osmAbort[k] = ac;
        waiting.push(o.label);
        status('Loading ' + o.label.toLowerCase() + '…');
        overpass(o.q(key), ac.signal).then(function (data) {
          osmCache[ck] = data;
          if (osmActive[k]) draw(k, data);
          var n = (data.elements || []).length;
          status(n ? null : 'No ' + o.label.toLowerCase() + ' mapped in this area.', 3000);
          if (n) status(null);
        }).catch(function (e) {
          if (e.name === 'AbortError') return;
          status('Could not load ' + o.label.toLowerCase() + ' right now. Move the map to try again.', 5000);
        });
      });
      if (!waiting.length && tooFar.length) status('Zoom in to see ' + tooFar.join(', ') + '.', 3500);
    }, 600);
  }
  map.on('moveend', refreshOSM);

  /* ---------- detail sheet ---------- */
  var selected = null;
  function openPanel(id) {
    var p = $(id); p.classList.add('open');
    if (id === 'drawer') $('btn-layers').setAttribute('aria-expanded', 'true');
    if (!DESKTOP.matches) {
      if (id === 'sheet') closePanel('drawer');
      if (id === 'drawer') closePanel('sheet');
    }
  }
  function closePanel(id) {
    $(id).classList.remove('open');
    if (id === 'drawer') $('btn-layers').setAttribute('aria-expanded', 'false');
    if (id === 'sheet' && selected) { var el = markers[selected] && markers[selected].getElement(); if (el) el.firstChild.classList.remove('sel'); selected = null; }
  }
  function selectMarker(id) {
    if (selected && markers[selected] && markers[selected].getElement()) markers[selected].getElement().firstChild.classList.remove('sel');
    selected = id;
    var el = markers[id] && markers[id].getElement();
    if (el) el.firstChild.classList.add('sel');
  }

  function openSite(s) {
    var lay = LAYERS[s.layer];
    selectMarker(s.id);
    $('sheet-kind').textContent = lay.label;
    var body = $('sheet-body'); body.innerHTML = '';
    body.appendChild(h('div', { class: 'tags' }, [
      h('span', { class: 'tag', style: 'color:' + lay.color, text: lay.label }),
      h('span', { class: 'tag', style: 'color:var(--muted)', text: LEVELS[s.level] })
    ]));
    body.appendChild(h('div', {}, [h('h1', { class: 'd-title', text: s.name }), s.ar ? h('div', { class: 'd-ar', lang: 'ar', dir: 'rtl', text: s.ar }) : null]));
    body.appendChild(h('dl', { class: 'meta' }, [
      h('dt', { text: 'Period' }), h('dd', { text: s.period }),
      h('dt', { text: 'Position' }), h('dd', { text: s.lat.toFixed(4) + '° N, ' + s.lon.toFixed(4) + '° E' }),
      h('dt', { text: 'Accuracy' }), h('dd', { text: 'within about ' + s.r + ' km' })
    ]));
    body.appendChild(h('p', { class: 'brief', text: s.relevance }));
    body.appendChild(h('p', { class: 'd-text', text: s.text }));
    var ai = aiBox({ kind: 'historical site', name: s.name, arabic: s.ar, category: lay.label, evidence: LEVELS[s.level], period: s.period, summary: s.relevance + ' ' + s.text, lat: s.lat, lon: s.lon });
    if (ai) body.appendChild(ai);
    body.appendChild(h('div', { class: 'sec' }, [h('h3', { text: 'Sources' }), h('ol', { class: 'srcs' }, s.sources.map(function (x) { return h('li', {}, [h('a', { href: x.u, target: '_blank', rel: 'noopener', text: x.t })]); }))]));
    body.appendChild(h('div', { class: 'row-btns' }, [h('button', { class: 'btn', text: 'Zoom to this place', onclick: function () { map.flyTo([s.lat, s.lon], 16, { duration: 0.8 }); } })]));
    body.scrollTop = 0;
    openPanel('sheet');
  }

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
    selectMarker(null);
    var name = t['name:en'] || t.name || KIND[k](t);
    var lat = el.lat || (el.bounds ? (el.bounds.minlat + el.bounds.maxlat) / 2 : null);
    var lon = el.lon || (el.bounds ? (el.bounds.minlon + el.bounds.maxlon) / 2 : null);
    $('sheet-kind').textContent = 'Present-day map data';
    var body = $('sheet-body'); body.innerHTML = '';
    body.appendChild(h('div', { class: 'tags' }, [h('span', { class: 'tag', style: 'color:var(--accent)', text: 'OpenStreetMap · today' })]));
    body.appendChild(h('div', {}, [h('h1', { class: 'd-title', text: name }), t.name && t.name !== name ? h('div', { class: 'd-ar', text: t.name }) : null]));
    body.appendChild(h('p', { class: 'brief', text: KIND[k](t) + '. ' + EXPLAIN[k] }));
    var rows = Object.keys(t).filter(function (x) { return !/^(source|note|fixme|wikidata|created_by)/.test(x); }).slice(0, 12);
    if (rows.length) body.appendChild(h('div', { class: 'sec' }, [h('h3', { text: 'Map details' }), h('table', { class: 'kv' }, [h('tbody', {}, rows.map(function (x) { return h('tr', {}, [h('td', { text: x.replace(/_/g, ' ') }), h('td', { text: t[x] })]); }))])]));
    var ai = aiBox({ kind: 'present-day map feature', type: KIND[k](t), name: name, tags: t, lat: lat, lon: lon });
    if (ai) body.appendChild(ai);
    body.appendChild(h('p', { class: 'd-text', style: 'font-size:.8em;color:var(--muted)', html: '<a href="https://www.openstreetmap.org/' + el.type + '/' + el.id + '" target="_blank" rel="noopener">View on OpenStreetMap</a>' }));
    openPanel('sheet');
  }

  /* ---------- AI answers (through the family relay) ---------- */
  function aiBox(place) {
    if (!CFG.aiEndpoint) return null;
    var q = h('textarea', { 'aria-label': 'Your question', id: 'ai-q' });
    q.value = 'Why does this place matter, and what is still uncertain?';
    var out = h('p', { class: 'ai-out', hidden: '' });
    var pw = h('input', { type: 'password', id: 'ai-pw', autocomplete: 'off', 'aria-label': 'Family password' });
    var pwWrap = h('div', { class: 'field' }, [h('label', { for: 'ai-pw', text: 'Family password' }), pw, h('small', { text: 'Only needed once on this phone.' })]);
    pwWrap.hidden = !!store.get('code', '');
    var btn = h('button', { class: 'btn primary', text: 'Ask AI' });
    btn.addEventListener('click', function () {
      var code = store.get('code', '') || (pw.value || '').trim();
      if (!code) { pwWrap.hidden = false; pw.focus(); return; }
      store.set('code', code); pwWrap.hidden = true;
      btn.disabled = true; btn.textContent = 'Thinking…';
      out.hidden = false; out.classList.remove('err'); out.textContent = '';
      fetch(CFG.aiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Family-Code': code }, body: JSON.stringify({ place: place, question: q.value.slice(0, 500) }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || ('Error ' + r.status)); e.code = r.status; throw e; } return j; }); })
        .then(function (j) { out.textContent = j.text || 'No answer came back. Try again.'; })
        .catch(function (e) {
          out.classList.add('err');
          if (e.code === 401) { store.set('code', ''); pw.value = ''; pwWrap.hidden = false; }
          out.textContent = e.code === 401 ? 'That password was not accepted. Please type it again.' : e.code === 429 ? 'Too many questions just now. Wait a minute and try again.' : 'Could not reach the AI right now. Check your connection and try again.';
        })
        .then(function () { btn.disabled = false; btn.textContent = 'Ask AI'; });
    });
    return h('div', { class: 'ai' }, [h('h3', { style: 'margin:0;font:500 .7em var(--f-data);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)', text: 'Ask AI about this place' }), q, pwWrap, btn, out]);
  }

  /* ---------- settings, tip, text size ---------- */
  function setSize(sz) {
    document.documentElement.classList.remove('big', 'huge');
    if (sz === 'big' || sz === 'huge') document.documentElement.classList.add(sz);
    document.querySelectorAll('#sizes button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.size === sz ? 'true' : 'false'); });
    store.set('size', sz);
  }
  document.querySelectorAll('#sizes button').forEach(function (b) { b.addEventListener('click', function () { setSize(b.dataset.size); }); });
  function openSettings(focusCode) {
    $('settings').hidden = false;
    $('code-field').hidden = !CFG.aiEndpoint;
    $('family-code').value = store.get('code', '');
    (focusCode && CFG.aiEndpoint ? $('family-code') : $('set-close')).focus();
  }
  function closeSettings() { store.set('code', $('family-code').value.trim()); $('settings').hidden = true; }
  $('btn-settings').onclick = function () { openSettings(false); };
  $('set-close').onclick = closeSettings;
  $('settings').addEventListener('click', function (e) { if (e.target.id === 'settings') closeSettings(); });
  $('tip-ok').onclick = function () { $('tip').hidden = true; store.set('tipSeen', true); };
  $('tip-again').onclick = function () { closeSettings(); $('tip').hidden = false; };

  $('btn-layers').onclick = function () { $('drawer').classList.contains('open') ? closePanel('drawer') : openPanel('drawer'); };
  $('drawer-close').onclick = function () { closePanel('drawer'); };
  $('sheet-close').onclick = function () { closePanel('sheet'); };
  $('reset-view').onclick = function () { map.flyToBounds(HOME, { duration: 0.8 }); if (!DESKTOP.matches) closePanel('drawer'); };
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('settings').hidden) closeSettings(); else if ($('sheet').classList.contains('open')) closePanel('sheet'); else closePanel('drawer');
  });

  /* ---------- start ---------- */
  setSize(store.get('size', 'normal'));
  setBase(store.get('base', 'dark'));
  applyHist();
  refreshOSM();
  if (DESKTOP.matches) openPanel('drawer');
  if (!store.get('tipSeen', false)) $('tip').hidden = false;
})();
