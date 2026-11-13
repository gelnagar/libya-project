// The regions of the all-Libya plan and the town names (with the spellings sources use) that place a text in one.
// Shared by build-regions.mjs (map and counts) and build-review.mjs (which region a candidate belongs to).
// order follows the plan: where the stored material is thickest first
export const REGIONS = [
  { id: 'tripoli', name: 'Tripoli', ar: 'طرابلس', towns: [['Tripoli', 'Tripoli, Libya', /tripoli|tarabulus/i]] },
  { id: 'benghazi', name: 'Benghazi', ar: 'بنغازي', towns: [['Benghazi', 'Benghazi', /b[ea]ng[h]?azi|bengasi/i]] },
  { id: 'tripolitania', name: 'Greater Tripolitania', ar: 'إقليم طرابلس', towns: [['Zawiya', 'Zawiya, Libya', /\b(?:az[- ])?zawiya[h]?\b/i], ['Misrata', 'Misrata', /mis[u]?rata[h]?/i], ['Tarhuna', 'Tarhuna', /tarhuna[h]?/i], ['Bani Walid', 'Bani Walid', /bani wal[i]?d/i],
    ['Gharyan', 'Gharyan', /gh?ar[i]?yan|garian/i], ['Zuwara', 'Zuwarah', /zuwara[h]?|zuara/i], ['Khoms', 'Khoms, Libya', /\bkhoms\b|al[- ]khums|\bhoms\b(?=.{0,40}liby)/i], ['Zliten', 'Zliten', /zl[i]?t[ae]n/i], ['Nalut', 'Nalut', /\bnalut\b/i], ['Zintan', 'Zintan', /z[i]?ntan/i], ['Yafran', 'Yafran', /yafran|yefren|jefren/i]] },
  { id: 'cyrenaica', name: 'Cyrenaica', ar: 'برقة', towns: [['Derna', 'Derna, Libya', /\bderna\b|darna[h]?\b/i], ['Bayda', 'Bayda, Libya', /al[- ]bayda|\bbeida\b|\bbayda\b/i], ['Tobruk', 'Tobruk', /tobru[kq]|tubru[kq]/i], ['Ajdabiya', 'Ajdabiya', /ajdabiya[h]?|agedabia/i]] },
  { id: 'sirte', name: 'Sirte and the central coast', ar: 'سرت والساحل الأوسط', towns: [['Sirte', 'Sirte', /\bsirte\b|\bsurt\b/i], ['Ras Lanuf', 'Ras Lanuf', /ras lanu[f]/i], ['Brega', 'Brega', /\bbrega\b|burayqa[h]?/i]] },
  { id: 'fezzan', name: 'Fezzan and the south', ar: 'فزان والجنوب', towns: [['Sabha', 'Sabha, Libya', /\bs[ae]bha[h]?\b/i], ['Murzuq', 'Murzuk', /murzu[kq]/i], ['Kufra', 'Kufra', /kufra[h]?/i], ['Ghat', 'Ghat, Libya', /\bghat\b/i], ['Ghadames', 'Ghadames', /ghadam[ei]s/i]] }
];

/** The region a piece of text points to, by the first town name found; null if none. Tripoli is checked last,
 *  because "Tripoli" appears in almost every document as the capital or the dateline. */
export function regionOfText(t) {
  t = String(t || '');
  for (const r of REGIONS) { if (r.id === 'tripoli') continue; if (r.towns.some((x) => x[2].test(t))) return r.id; }
  return REGIONS[0].towns[0][2].test(t) ? 'tripoli' : null;
}
/** True when a name is nothing more than a town of the plan ("Benghazi", "Al Bayda, Libya"): the town itself, not a place in it. */
export function townOnly(name) {
  let t = String(name || '');
  for (const r of REGIONS) for (const x of r.towns) t = t.replace(new RegExp(x[2].source, 'gi'), ' ');
  return !t.replace(/\b(libya|libyan|city|town|of|the|al|el|area|region|province|municipality)\b/gi, ' ').replace(/[^A-Za-z0-9]+/g, '').length;
}
