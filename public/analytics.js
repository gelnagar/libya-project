/* The public analytics page: totals only, read from the Worker's `publicStats`. Names come from this page's own data files,
   never from the server, so nothing a visitor typed can show up here. */
(function () {
  var CFG = window.ATLAS_CONFIG || {};
  function $(id) { return document.getElementById(id); }
  function n(v) { return Number(v || 0).toLocaleString('en-US'); }
  function cell(tag, text, cls) { var e = document.createElement(tag); e.textContent = text; if (cls) e.className = cls; return e; }

  // ids the map sends are prefixed: site:, area:, story:. Anything this page cannot name is left out rather than shown as a raw id.
  var NAMES = {};
  (window.ATLAS_SITES || []).forEach(function (s) { NAMES['site:' + s.id] = s.name; });
  (window.ATLAS_AREAS || []).forEach(function (a) { NAMES['area:' + a.id] = a.name; });
  (window.ATLAS_STORIES || []).forEach(function (s) { NAMES['story:' + s.id] = s.title || s.name; });

  var url = (location.protocol !== 'file:' && !/github\.io$/.test(location.hostname)) ? '/api' : CFG.aiEndpoint;
  if (!url) { $('lead').textContent = 'The server address is not set.'; return; }
  fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicStats: true }) })
    .then(function (r) { return r.json().then(function (j) { if (!r.ok || j.error) throw new Error(j.error || r.status); return j; }); })
    .then(draw)
    .catch(function () { $('lead').textContent = 'The numbers could not be loaded just now. Please try again later.'; });

  function draw(S) {
    var t = S.totals || {}, daily = S.daily || [];
    if (!t.visits) { $('lead').textContent = 'No visits have been counted yet.'; return; }
    $('lead').textContent = 'Last ' + S.days + ' days, to ' + S.today + '. Updated about every ten minutes.';
    $('s-figs').hidden = false; $('f-vis').textContent = n(t.visitors); $('f-vst').textContent = n(t.visits);
    $('f-since').textContent = S.firstDay || '-';
    $('f-since-s').textContent = S.firstDay && S.firstDay > S.since ? 'counting began then' : 'start of this window';

    // one bar per day, including days with none, so a quiet day shows as a gap and not as a missing bar
    var by = {}; daily.forEach(function (d) { by[d.day] = d; });
    var days = [], d0 = new Date(S.since + 'T00:00:00Z'), max = 1, i, k;
    for (i = 0; i < S.days; i++) { k = new Date(d0.getTime() + i * 86400000).toISOString().slice(0, 10); days.push({ day: k, visitors: by[k] ? by[k].visitors : 0, visits: by[k] ? by[k].visits : 0 }); max = Math.max(max, days[i].visitors); }
    var bars = $('bars'); bars.innerHTML = '';
    days.forEach(function (d) { var b = document.createElement('i'); b.style.height = Math.max(d.visitors ? 2 : 0, Math.round(100 * d.visitors / max)) + '%'; b.title = d.day + ': ' + n(d.visitors) + ' visitors'; bars.appendChild(b); });
    $('ax-a').textContent = days[0].day; $('ax-b').textContent = days[days.length - 1].day + '  (most in a day: ' + n(max) + ')';
    var tb = $('t-days').tBodies[0]; tb.innerHTML = '';
    days.slice().reverse().forEach(function (d) { var tr = document.createElement('tr'); tr.appendChild(cell('td', d.day)); tr.appendChild(cell('td', n(d.visitors), 'n')); tr.appendChild(cell('td', n(d.visits), 'n')); tb.appendChild(tr); });
    $('s-days').hidden = false;

    var top = (S.top || []).filter(function (x) { return NAMES[x.item]; }), body = $('t-top'); body.innerHTML = '';
    var mx = top.length ? top[0].visitors : 1;
    top.forEach(function (x) {
      var tr = document.createElement('tr'), td = document.createElement('td'), bar = document.createElement('span');
      td.appendChild(document.createTextNode(NAMES[x.item])); bar.className = 'bar'; bar.style.width = Math.round(100 * x.visitors / mx) + '%'; td.appendChild(bar);
      tr.appendChild(td); tr.appendChild(cell('td', n(x.visitors), 'n')); body.appendChild(tr);
    });
    $('top-note').textContent = top.length ? 'Counted by different visitors, not by clicks. Only entries opened by at least ' + S.minVisitors + ' different visitors appear.' : 'No entry has yet been opened by ' + S.minVisitors + ' or more different people, so none is listed.';
    $('s-top').hidden = false;
  }
})();
