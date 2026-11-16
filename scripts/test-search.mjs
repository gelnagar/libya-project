// Checks public/name-fold.js: spelling variants of one name become the same text, and different names stay different.
//   node scripts/test-search.mjs
import fs from 'node:fs'; import vm from 'node:vm';
const w = {}; vm.runInNewContext(fs.readFileSync('public/name-fold.js', 'utf8'), { window: w }); const f = w.ATLAS_NAMEFOLD;
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const same = (...xs) => ok('same: ' + xs.join(' = '), new Set(xs.map(f)).size === 1);
const diff = (a, b) => ok('different: ' + a + ' / ' + b, f(a) !== f(b));
same('Gaddafi', 'Qaddafi', 'Kadhafi', 'Gadhafi', 'Khadafy', 'Qadhafi');
same('Tajoura', 'Tajura'); same('Tarhouna', 'Tarhuna'); same('Ben Ashour', 'Bin Ashur'); same('Mitiga', 'Mitiqa');
same('Benghazi', 'Benghazy'); same('Ghadames', 'Gadames'); same('Souq al-Jumaa', 'Suq al-Jumaa');
diff('Tripoli', 'Tarhuna'); diff('Misrata', 'Sirte'); diff('Zawiya', 'Zliten'); diff('Abu Salim', 'Ain Zara');
ok('Arabic passes through', f('أبو سليم') === 'أبو سليم'); ok('digits kept', f('1984') === '1984'); ok('empty', f('') === '' && f(null) === '');
// a name typed without its vowels, and a name given in the other language
const sk = w.ATLAS_SKELETON, alt = w.ATLAS_NAMEALT, P = [['Abu Salim prison', 'سجن أبو سليم'], ['Ain Zara prison', 'سجن عين زارة'], ['Tajoura', 'تاجوراء']];
ok('Slim has the same consonants as Salim', sk('Slim').join() === sk('Salim').join());
ok('Abu Salim keeps the consonants of Salim', sk('Abu Salim').includes('slm'));
ok('different names keep different consonants', sk('Tripoli').join() !== sk('Tarhuna').join());
ok('one-consonant words are not matched on', sk('Abu').length === 0 && sk('a').length === 0);
ok('Arabic text has no Latin skeleton', sk('أبو سليم').length === 0);
ok('a Latin name gives the Arabic name of the place', alt('Abu Salim', P).join() === 'سجن أبو سليم');
ok('a spelling variant still finds the Arabic name', alt('Tajura', P).join() === 'تاجوراء');
ok('an Arabic query gives the English name', alt('سليم', P).join() === 'Abu Salim prison');
ok('a name not on the map gives nothing', alt('Atlantis', P).length === 0 && alt('', P).length === 0 && alt('x', null).length === 0);
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
