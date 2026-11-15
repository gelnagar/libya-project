/* Reads the dates out of a record's "when" text so a record with no map position can still be placed on the timeline.
   It reads only what the text says. It never supplies a year the text does not contain, and it refuses a bound ("before
   1911"), because a bound is not a date.
     whenYears(text, first, last) -> { kind, y0, y1, approx, also }
       kind 'point'   one date, or several separate ones: y0 is the earliest, `also` lists the others
       kind 'range'   an explicit range such as 1925-1928 or 1860-65
       kind 'decade'  only decades were given (1920s, 1910s-1920s): drawn as a range and marked approximate
       kind 'outside' a date earlier than the timeline's first year
       kind 'none'    no date that can be drawn (empty, "Ottoman period", "before 1911", "late 15th century")
   approx is true for decades and for "c.", "circa", "about", "early", "late". Tested by scripts/test-timeline.mjs. */
(function (root) {
  function whenYears(w, first, last) {
    var t = String(w == null ? '' : w), A = first == null ? 1905 : first, D = last == null ? 2026 : last, out = { kind: 'none', y0: null, y1: null, approx: false, also: [] };
    if (!t.trim() || /\b(before|after|until|since|prior to|up to|by the)\b/i.test(t)) return out;
    var approx = /(?:^|[^a-z])(?:c\.|ca\.|circa|about|around|approx|approximately|early|late|mid)(?![a-z])/i.test(t);
    // a year-shaped number that counts people or things ("2000 prisoners") is not a date
    var COUNTED = '(?!\\s+(?:people|prisoners|detainees|dead|killed|men|women|soldiers|civilians|deaths|troops|fighters|victims|inmates|cases|documents|pages))';
    var years = (t.match(new RegExp('\\b(?:1[0-9]\\d\\d|20[0-2]\\d)\\b' + COUNTED, 'g')) || []).map(Number).filter(function (y) { return y <= D; });
    var r = t.match(/\b(1[0-9]\d\d|20[0-2]\d)\s*[–-]\s*(\d{4}|\d{2})\b(?!s)/);
    if (r) {
      var a = +r[1], b = r[2].length === 2 ? Math.floor(a / 100) * 100 + +r[2] : +r[2];
      if (b >= a && b <= D) { if (a < A) { out.kind = 'outside'; out.y0 = a; out.y1 = b; return out; } out.kind = 'range'; out.y0 = a; out.y1 = b; out.approx = approx; out.also = years.filter(function (y, i) { return (y < a || y > b) && years.indexOf(y) === i; }).sort(); return out; }
    }
    if (years.length) {
      var lo = Math.min.apply(null, years);
      if (lo < A) { out.kind = 'outside'; out.y0 = lo; out.y1 = lo; return out; }
      out.kind = 'point'; out.y0 = out.y1 = lo; out.approx = approx;
      out.also = years.filter(function (y, i) { return y !== lo && years.indexOf(y) === i; }).sort();
      return out;
    }
    var dec = (t.match(/\b(?:1[0-9]|20)\d0s\b/g) || []).map(function (x) { return parseInt(x, 10); });
    if (dec.length) {
      var d0 = Math.min.apply(null, dec), d1 = Math.min(D, Math.max.apply(null, dec) + 9);
      if (d0 < A) { out.kind = 'outside'; out.y0 = d0; out.y1 = d1; return out; }
      out.kind = 'decade'; out.y0 = d0; out.y1 = d1; out.approx = true; return out;
    }
    return out;
  }
  root.ATLAS_WHEN = whenYears;
})(typeof window !== 'undefined' ? window : globalThis);
