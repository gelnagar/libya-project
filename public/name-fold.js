/* Search that does not care how a Libyan name is spelled (PRD s10).
     ATLAS_NAMEFOLD(text)       the text lower-cased, with common spelling variants reduced to one form.
     ATLAS_SKELETON(text)       the consonants of each word, so a name typed without its vowels still finds it (Slim finds Salim).
     ATLAS_NAMEALT(query, pairs) the other-language forms of a name already on the map: a Latin query gives the Arabic names of the
                                 places it matches, and an Arabic query gives their English names. `pairs` is [[english, arabic], ...]
                                 (public/data/names.js, built by scripts/build-names.mjs from names the map and its sources already carry).
   Applied to both what the person types and what is searched, so Qaddafi, Gaddafi, Kadhafi, Gadhafi and Khadafy all become one
   word, as do Tajoura and Tajura. The skeleton match is used only when the ordinary search finds nothing, and the page says so.
   What the fold does: qh/g/k/q/c -> k; kh, gh -> k; dh -> d; th -> t; ph -> f; ou, oo -> u; ee -> i; e, y -> i; o -> u; doubled letters -> one.
   It only touches the letters a-z, so Arabic text passes through unchanged (Arabic is normalised in app.js).
   It will sometimes match more than a person meant; for a search box that is the safe direction. Tested by scripts/test-search.mjs. */
(function (root) {
  function nameFold(t) {
    return String(t == null ? '' : t).toLowerCase()
      .replace(/kh|gh/g, 'k').replace(/dh/g, 'd').replace(/th/g, 't').replace(/ph/g, 'f')
      .replace(/ou|oo/g, 'u').replace(/ee/g, 'i')
      .replace(/[qgc]/g, 'k').replace(/[ey]/g, 'i').replace(/o/g, 'u')
      .replace(/([a-z])\1+/g, '$1');
  }
  var plain = function (t) { return nameFold(String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`ʿʾ\-_.,()]/g, ' ').replace(/\s+/g, ' ').trim()); };
  // consonants of each Latin word; words with fewer than two consonants are dropped (too little to match on)
  function skeleton(t) {
    return plain(t).split(' ').map(function (w) { return /^[a-z]+$/.test(w) ? w.replace(/[aiu]/g, '') : ''; }).filter(function (w) { return w.length >= 2; });
  }
  var hasArabic = function (t) { return /[؀-ۿ]/.test(t); };
  var arKey = function (t) { return String(t || '').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').trim(); };
  function nameAlt(q, pairs) {
    var out = [], seen = {}, add = function (x) { if (x && !seen[x]) { seen[x] = 1; out.push(x); } };
    var qq = String(q || '').trim(); if (!qq || !pairs) return out;
    if (hasArabic(qq)) {
      var a = arKey(qq);
      pairs.forEach(function (p) { if (p[1] && arKey(p[1]).indexOf(a) >= 0) add(p[0]); });
    } else {
      var ws = plain(qq).split(' ').filter(function (w) { return w.length > 1; }); if (!ws.length) return out;
      pairs.forEach(function (p) { if (p[1]) { var n = plain(p[0]); if (ws.every(function (w) { return n.indexOf(w) >= 0; })) add(p[1]); } });
    }
    return out.slice(0, 12);
  }
  root.ATLAS_NAMEFOLD = nameFold; root.ATLAS_SKELETON = skeleton; root.ATLAS_NAMEALT = nameAlt;
})(typeof window !== 'undefined' ? window : globalThis);
