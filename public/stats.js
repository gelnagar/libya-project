/* Moved out of stats.html so the site can refuse inline scripts. */
(function () {
  var KEY = 'atlas.owner', DKEY = 'atlas.statsDays';
  function get(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function set(k, v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} }
  var $ = function (id) { return document.getElementById(id); };
  var days = parseInt(get(DKEY), 10) || 30, code = get(KEY), last = null;

  function call(c, body) {
    return fetch('/api', { credentials: 'same-origin', method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Owner-Code': c }, body: JSON.stringify(Object.assign({ owner: true }, body)) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || r.status); e.code = r.status; throw e; } return j; }); });
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var NF = new Intl.NumberFormat();
  function num(n) { return NF.format(Math.round(n || 0)); }
  function usd(n) { n = n || 0; return '$' + (n > 0 && n < 0.01 ? n.toFixed(4) : n.toFixed(2)); }
  function usdAxis(n) { return '$' + (n >= 10 ? Math.round(n) : n.toFixed(2)); }
  var REGION = (function () { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { return null; } })();
  function country(c) { if (!c) return 'Unknown'; if (c === 'T1') return 'Tor network'; if (c === 'XX') return 'Unknown'; try { return (REGION && REGION.of(c)) || c; } catch (e) { return c; } }
  var KIND = { site: 'place', area: 'area', record: 'record', person: 'person', story: 'story', report: 'family' };

  /* ---------- small builders ---------- */
  function tile(box, k, v, s, hero) { var t = el('div', 'tile' + (hero ? ' hero' : '')); t.appendChild(el('span', 'k', k)); t.appendChild(el('span', 'v', v)); if (s) t.appendChild(el('span', 's', s)); box.appendChild(t); }
  function hbars(box, rows, opt) {
    box.innerHTML = ''; opt = opt || {};
    if (!rows.length) { box.appendChild(el('p', 'empty', 'Nothing yet for this period.')); return; }
    var max = Math.max.apply(null, rows.map(function (r) { return r.v; })) || 1;
    rows.forEach(function (r) {
      var row = el('div', 'hb-row'), lab = el('span', 'lab');
      if (r.tag) lab.appendChild(el('small', null, r.tag));
      lab.appendChild(document.createTextNode(r.label)); lab.title = r.label;
      row.appendChild(lab); row.appendChild(el('span', 'val', r.text || num(r.v)));
      var tr = el('div', 'track'), f = el('div', 'fill'); f.style.width = Math.max(2, r.v / max * 100) + '%'; tr.appendChild(f); row.appendChild(tr);
      box.appendChild(row);
    });
  }
  function meter(box, label, used, limit, unit) {
    var pct = limit ? Math.min(100, used / limit * 100) : 0;
    var st = pct >= 90 ? ['critical', '✖ Near the limit'] : pct >= 70 ? ['serious', '▲ Getting close'] : ['good', '✓ Plenty left'];
    var m = el('div', 'meter'), top = el('div', 'top');
    top.appendChild(el('span', null, label)); top.appendChild(el('span', null, num(used) + ' of ' + num(limit) + (unit ? ' ' + unit : '')));
    var tr = el('div', 'track'), f = el('div', 'fill'); f.style.width = Math.max(1, pct) + '%'; f.style.background = 'var(--' + st[0] + ')'; tr.appendChild(f);
    var s = el('span', 'status', st[1]); s.style.color = 'var(--' + st[0] + ')';
    m.appendChild(top); m.appendChild(tr); m.appendChild(s); box.appendChild(m);
  }
  // gridline count that lands on round numbers for niceMax's 1 / 2 / 5 / 10 steps
  function divs(max) { var p = Math.pow(10, Math.floor(Math.log10(max))), n = Math.round(max / p); return n === 2 ? 4 : 5; }
  function niceMax(v) { if (v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function tipFor(box) { var t = el('div', 'tip'); t.hidden = true; box.appendChild(t); return t; }
  function showTip(tip, box, x, y, title, lines) {
    tip.innerHTML = ''; tip.appendChild(el('b', null, title)); lines.forEach(function (l) { tip.appendChild(el('span', null, l)); }); tip.hidden = false;
    var w = box.clientWidth, tw = tip.offsetWidth; tip.style.left = Math.min(Math.max(0, x - tw / 2), w - tw) + 'px'; tip.style.top = Math.max(0, y - tip.offsetHeight - 10) + 'px';
  }
  function fmtDay(d) { var p = d.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' }); }

  /* line chart: several series over days, one axis, crosshair + tooltip */
  function lineChart(box, labels, series, fmt) {
    box.innerHTML = ''; fmt = fmt || num;
    var W = Math.max(280, box.clientWidth || 760), H = 240, L = 44, R = 16, T = 14, B = 26, iw = W - L - R, ih = H - T - B;
    var max = niceMax(Math.max.apply(null, series.map(function (s) { return Math.max.apply(null, s.data.concat([0])); })));
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': series.map(function (s) { return s.name; }).join(' and ') + ' per day' });
    var dv = divs(max); for (var i = 0; i <= dv; i++) { var y = T + ih - ih * i / dv; svg.appendChild(svgEl('line', { x1: L, x2: W - R, y1: y, y2: y, class: i ? 'gl' : 'ax' })); var tx = svgEl('text', { x: L - 6, y: y + 4, 'text-anchor': 'end' }); tx.textContent = fmt(max * i / dv); svg.appendChild(tx); }
    var n = labels.length, xs = function (i) { return L + (n === 1 ? iw / 2 : iw * i / (n - 1)); }, ys = function (v) { return T + ih - ih * v / max; };
    var step = Math.max(1, Math.ceil(n / Math.min(7, Math.max(3, Math.floor(iw / 70)))));
    labels.forEach(function (d, i) { if (i % step && i !== n - 1) return; var tx = svgEl('text', { x: xs(i), y: H - 6, 'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle' }); tx.textContent = fmtDay(d); svg.appendChild(tx); });
    series.forEach(function (s) {
      var d = s.data.map(function (v, i) { return (i ? 'L' : 'M') + xs(i).toFixed(1) + ' ' + ys(v).toFixed(1); }).join(' ');
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      if (n <= 31) s.data.forEach(function (v, i) { svg.appendChild(svgEl('circle', { cx: xs(i), cy: ys(v), r: 3, fill: s.color, stroke: 'var(--panel)', 'stroke-width': 2 })); });
    });
    var cross = svgEl('line', { y1: T, y2: T + ih, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '3 3', visibility: 'hidden' }); svg.appendChild(cross);
    var hit = svgEl('rect', { x: L, y: T, width: iw, height: ih, fill: 'transparent' }); svg.appendChild(hit);
    box.appendChild(svg); var tip = tipFor(box);
    function move(ev) {
      var r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) * W / r.width, i = n === 1 ? 0 : Math.round((x - L) / iw * (n - 1)); i = Math.max(0, Math.min(n - 1, i));
      cross.setAttribute('x1', xs(i)); cross.setAttribute('x2', xs(i)); cross.setAttribute('visibility', 'visible');
      showTip(tip, box, xs(i) * r.width / W, ys(Math.max.apply(null, series.map(function (s) { return s.data[i]; }))) * r.height / H, fmtDay(labels[i]), series.map(function (s) { return s.name + ': ' + fmt(s.data[i]); }));
    }
    hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', function () { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); });
  }
  /* column chart: one series, per-column hover */
  function columnChart(box, labels, data, opt) {
    box.innerHTML = ''; opt = opt || {}; var fmt = opt.fmt || num, afmt = opt.axisFmt || fmt;
    var W = Math.max(280, box.clientWidth || 760), H = 200, L = 52, R = 10, T = 12, B = 24, iw = W - L - R, ih = H - T - B, n = labels.length;
    opt.ticks = Math.min(opt.ticks || 8, Math.max(3, Math.floor(iw / 56)));
    var max = niceMax(Math.max.apply(null, data.concat([0])) || (opt.minMax || 1));
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': opt.label || 'chart' });
    var dv = divs(max); for (var i = 0; i <= dv; i++) { var y = T + ih - ih * i / dv; svg.appendChild(svgEl('line', { x1: L, x2: W - R, y1: y, y2: y, class: i ? 'gl' : 'ax' })); var tx = svgEl('text', { x: L - 6, y: y + 4, 'text-anchor': 'end' }); tx.textContent = afmt(max * i / dv); svg.appendChild(tx); }
    var slot = iw / n, bw = Math.max(2, Math.min(28, slot - 2)), step = Math.max(1, Math.ceil(n / (opt.ticks || 8)));
    box.appendChild(svg); var tip = tipFor(box);
    data.forEach(function (v, i) {
      var x = L + slot * i + (slot - bw) / 2, h = Math.max(v > 0 ? 2 : 0, ih * v / max), y = T + ih - h, r = Math.min(4, bw / 2, h);
      if (h > 0) svg.appendChild(svgEl('path', { d: 'M' + x + ' ' + (T + ih) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + bw - r) + 'Q' + (x + bw) + ' ' + y + ' ' + (x + bw) + ' ' + (y + r) + 'V' + (T + ih) + 'Z', fill: 'var(--s1)' }));
      if (!(i % step) || i === n - 1) { var tx = svgEl('text', { x: x + bw / 2, y: H - 6, 'text-anchor': 'middle' }); tx.textContent = opt.tick ? opt.tick(labels[i]) : labels[i]; svg.appendChild(tx); }
      var hit = svgEl('rect', { x: L + slot * i, y: T, width: slot, height: ih, fill: 'transparent' }); svg.appendChild(hit);
      var on = function () { var rr = svg.getBoundingClientRect(); showTip(tip, box, (x + bw / 2) * rr.width / W, y * rr.height / H, opt.title ? opt.title(labels[i]) : labels[i], [opt.name + ': ' + fmt(v)].concat(opt.extra ? opt.extra(i) : [])); };
      hit.addEventListener('pointerenter', on); hit.addEventListener('pointerdown', on); hit.addEventListener('pointerleave', function () { tip.hidden = true; });
    });
  }
  function dayRange(since, today) { var out = [], t = Date.parse(since + 'T00:00:00Z'), end = Date.parse(today + 'T00:00:00Z'); for (; t <= end; t += 86400000) out.push(new Date(t).toISOString().slice(0, 10)); return out; }
  function byDay(rows, key) { var m = {}; rows.forEach(function (r) { m[r.day] = r[key] || 0; }); return m; }

  /* ---------- render ---------- */
  function render(j) {
    last = j;
    $('dash-msg').textContent = j.error || '';
    var tot = j.totals || {}, cost = j.cost || {}, label = days === 1 ? 'today' : 'last ' + days + ' days';
    var opens = (j.opensDaily || []).reduce(function (a, r) { return a + r.n; }, 0);
    var t = $('tiles'); t.innerHTML = '';
    tile(t, 'Visits', num(tot.visits), label);
    tile(t, 'Different visitors', num(tot.visitors), label);
    tile(t, 'Came back another day', num(tot.returning), 'visitors seen on 2+ days');
    tile(t, 'Things opened', num(opens), 'places, records, stories…');
    tile(t, 'Cost this month', usd(cost.totalMonth), 'AI + Cloudflare + email', true);

    // costs
    var monthDays = new Date(Date.UTC(+j.today.slice(0, 4), +j.today.slice(5, 7), 0)).getUTCDate(), dayOfMonth = +j.today.slice(8, 10);
    var aiM = (j.aiMonth || {}).cost || 0, proj = dayOfMonth ? aiM / dayOfMonth * monthDays : 0;
    var c = $('cost-tiles'); c.innerHTML = '';
    tile(c, 'AI this month', usd(aiM), num((j.aiMonth || {}).calls) + ' answers · on pace for ' + usd(proj));
    tile(c, 'Cloudflare this month', usd(cost.cloudflareMonth), j.plan === 'paid' ? 'Workers Paid: $5 base + overage' : 'Workers Free plan: never billed');
    tile(c, 'Email this month', usd(cost.emailMonth), num((j.emailsMonth || {}).ok) + ' alerts sent' + (j.email && j.email.configured ? '' : ' · not set up yet'));
    tile(c, 'AI in this period', usd((j.aiPeriod || {}).cost), num((j.aiPeriod || {}).calls) + ' answers, ' + label);
    tile(c, 'AI since tracking began', usd(j.aiSpentAllTime), j.credit && j.credit.tracked ? usd(j.credit.remaining) + ' Anthropic credit left' + (j.credit.low ? ' (low)' : '') : 'set CREDIT_LOADED to track credit left');
    $('cost-note').textContent = 'Month of ' + new Date(j.month + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
    var range = dayRange(j.since, j.today), aim = byDay(j.aiDaily || [], 'cost'), aic = byDay(j.aiDaily || [], 'calls');
    columnChart($('ch-ai'), range, range.map(function (d) { return aim[d] || 0; }), { name: 'AI cost', label: 'AI spending per day', fmt: usd, axisFmt: usdAxis, tick: fmtDay, title: fmtDay, extra: function (i) { return [num(aic[range[i]] || 0) + ' answers']; }, ticks: 6 });
    var mt = $('meters'); mt.innerHTML = '';
    var reqToday = (j.reqsToday || []).reduce(function (a, r) { return a + r.n; }, 0);
    if (j.plan === 'paid') meter(mt, 'Worker requests this month (included)', j.reqsMonth || 0, 10000000);
    else meter(mt, 'Worker requests today', reqToday, 100000);
    meter(mt, 'Statistics database writes today', j.d1WritesToday || 0, 100000);
    meter(mt, 'Alert emails this month', (j.emailsMonth || {}).n || 0, 3000);
    if (j.lastEmail) mt.appendChild(el('p', 'note', 'Last alert email ' + new Date(j.lastEmail.ts).toLocaleString() + ': ' + (j.lastEmail.ok ? 'sent' : 'failed (' + j.lastEmail.info + ')')));
    else if (!(j.email && j.email.configured)) mt.appendChild(el('p', 'note', 'Alert emails are off until RESEND_API_KEY and ALERT_EMAIL are set in Cloudflare (see SETUP-AI.md).'));

    // visits
    var vis = byDay(j.daily || [], 'visits'), uni = byDay(j.daily || [], 'visitors');
    lineChart($('ch-visits'), range, [{ name: 'Visits', color: 'var(--s1)', data: range.map(function (d) { return vis[d] || 0; }) }, { name: 'Different visitors', color: 'var(--s2)', data: range.map(function (d) { return uni[d] || 0; }) }]);

    // top
    hbars($('top'), (j.top || []).map(function (r) { var k = String(r.item || '').split(':')[0]; return { tag: KIND[k] || k, label: r.name || r.item, v: r.n, text: num(r.n) + ' opens · ' + num(r.u) + ' visitors' }; }));
    hbars($('countries'), (j.countries || []).map(function (r) { return { label: country(r.k), v: r.u, text: num(r.u) + ' · ' + num(r.n) + ' visits' }; }));
    hbars($('cities'), (j.cities || []).map(function (r) { var p = String(r.k).split(', '); return { label: p[0] + (p[1] ? ', ' + country(p[1]) : ''), v: r.u, text: num(r.u) }; }));
    hbars($('orgs'), (j.orgs || []).map(function (r) { return { label: r.k, v: r.u, text: num(r.u) }; }));
    hbars($('devices'), (j.devices || []).map(function (r) { return { label: r.k ? r.k[0].toUpperCase() + r.k.slice(1) : 'Unknown', v: r.u, text: num(r.u) + ' · ' + num(r.n) + ' visits' }; }));
    hbars($('audience'), (j.audience || []).map(function (r) { return { label: r.k ? 'Family (signed in)' : 'Public', v: r.u, text: num(r.u) + ' · ' + num(r.n) + ' visits' }; }));
    hbars($('refs'), (j.refs || []).map(function (r) { return { label: r.k, v: r.n, text: num(r.n) + ' visits' }; }));

    // hours, shifted from UTC to the viewer's time zone
    var off = Math.round(-new Date().getTimezoneOffset() / 60), hrs = []; for (var h = 0; h < 24; h++) hrs.push(0);
    (j.hours || []).forEach(function (r) { hrs[((r.h + off) % 24 + 24) % 24] += r.n; });
    $('hours-note').textContent = 'Visits by hour, in your time zone (UTC' + (off >= 0 ? '+' : '') + off + '), ' + label;
    var hl = hrs.map(function (_, i) { return i; });
    columnChart($('ch-hours'), hl, hrs, { name: 'Visits', label: 'Visits by hour', tick: function (i) { return String(i).padStart(2, '0'); }, title: function (i) { return String(i).padStart(2, '0') + ':00–' + String(i).padStart(2, '0') + ':59'; }, ticks: 12 });

    var rq = $('reqs'); rq.innerHTML = '';
    var NAMES = { page: 'Pages through the Worker', login: 'Sign-in', logout: 'Sign-out', 'api:track': 'Visitor statistics', 'api:question': 'AI: Ask about a place', 'api:agent': 'AI: chat guide', 'api:report': 'Family report added', 'api:reports': 'Family reports read', 'api:mediaGet': 'Photo / voice played', 'api:mediaPut': 'Photo / voice uploaded', 'api:request': 'Research request', 'api:status': 'Credit check', 'api:owner': 'Owner pages', 'api:reportDelete': 'Report removed' };
    (j.reqsToday || []).forEach(function (r) { var tr = el('tr'); tr.appendChild(el('td', null, NAMES[r.kind] || r.kind)); tr.appendChild(el('td', 'n', num(r.n))); rq.appendChild(tr); });
    if (!(j.reqsToday || []).length) { var tr = el('tr'); tr.appendChild(el('td', 'empty', 'None yet today.')); tr.appendChild(el('td')); rq.appendChild(tr); }
  }

  function load() {
    var msg = $('login-msg'); msg.textContent = 'Loading…';
    document.querySelectorAll('[data-days]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.days === days)); });
    return call(code, { stats: true, days: days }).then(function (j) {
      set(KEY, code); msg.textContent = ''; $('login').hidden = true; $('dash').hidden = false; render(j);
    }).catch(function (e) {
      $('login').hidden = false; $('dash').hidden = true;
      msg.textContent = e.code === 401 ? 'That owner password is not right.' : e.code === 429 ? 'Too many wrong passwords. Wait 15 minutes.' : 'Could not load the statistics (' + e.message + ').';
      set(KEY, '');
    });
  }
  $('login').addEventListener('submit', function (e) { e.preventDefault(); code = $('code').value.trim(); if (code) load(); });
  document.querySelectorAll('[data-days]').forEach(function (b) { b.onclick = function () { days = +b.dataset.days; set(DKEY, String(days)); load(); }; });
  $('reload').onclick = load;
  $('logout').onclick = function () { set(KEY, ''); location.reload(); };
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (last) render(last); }, 200); });
  if (code) load();
})();
