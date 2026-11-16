/* Search that does not care how a Libyan name is spelled in Latin letters (PRD s10).
     ATLAS_NAMEFOLD(text) -> the text lower-cased, with common spelling variants reduced to one form.
   Applied to both what the person types and what is searched, so Qaddafi, Gaddafi, Kadhafi, Gadhafi and Khadafy all become one
   word, as do Tajoura and Tajura. A missing vowel (Salim, Slim) is not treated as a spelling variant.
   What it does: qh/g/k/q/c -> k; kh, gh -> k; dh -> d; th -> t; ph -> f; ou, oo -> u; ee -> i; e, y -> i; o -> u; doubled letters -> one.
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
  root.ATLAS_NAMEFOLD = nameFold;
})(typeof window !== 'undefined' ? window : globalThis);
