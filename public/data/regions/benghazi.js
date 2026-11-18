/* Benghazi: entries written from the review candidates that two or more stored documents support.
   Positions are the centre of Benghazi (Wikipedia's coordinates); no document gives a coordinate for the specific place.
   Owner's instruction in chat, 16 Nov 2026: finish the remaining regions from the sources already held. Victims are not named here
   even where a published source names them (the corrections page offers families removal, and a name adds nothing to the record
   of the event); anything resting on a hostile source alone, or dated after 2011, was left out. */
(function () {
  window.ATLAS_SITES = (window.ATLAS_SITES || []).concat([
    {
      id: 'bn-1969-coup', region: 'benghazi', pos: 'town', layer: 'landmark', level: 'documented', y0: 1969, y1: 1969,
      name: 'The coup of 1 September 1969 is launched from Benghazi', lat: 32.1167, lon: 20.0667, r: 8, period: '1 September 1969',
      relevance: 'The Free Officers seized power in Benghazi and abolished the monarchy; Muammar Gaddafi\'s rule begins here.',
      text: 'The Library of Congress country study says that on 1 September 1969 about seventy young army officers and enlisted men, mostly of the Signal Corps, seized control of the government and abolished the Libyan monarchy; the coup was launched at Benghazi. Wikipedia\'s articles on the Free Officers movement and on the history of Libya under Gaddafi give the same account, and say Gaddafi had founded the Free Officers movement at the Royal Military Academy in Benghazi. The country study reports no deaths or violent incidents in the seizure. Wikipedia adds that the coup was completed within hours. The entry marks the start of the period of the map; it is mapped at the centre of Benghazi, not at a specific building.',
      sources: [
        { t: 'Library of Congress country study, Libya: The September 1969 Coup', u: 'http://countrystudies.us/libya/28.htm' },
        { t: 'Wikipedia, Free Officers movement (Libya)', u: 'https://en.wikipedia.org/wiki/Free_Officers_movement_(Libya)' },
        { t: 'Wikipedia, History of Libya under Muammar Gaddafi', u: 'https://en.wikipedia.org/wiki/History_of_Libya_under_Muammar_Gaddafi' }
      ]
    },
    {
      id: 'bn-1977-hangings', region: 'benghazi', pos: 'town', layer: 'massacre', level: 'testimony', y0: 1977, y1: 1977,
      name: 'Public hanging of students, Benghazi, April 1977 (reported)', lat: 32.1167, lon: 20.0667, r: 5, period: 'April 1977',
      relevance: 'Students arrested after the 1976 protests were reported to have been hanged in public in Benghazi.',
      text: 'A statement of the Libyan opposition, published in London in 1979 and translated by the US Joint Publications Research Service, says three students were hanged on the gallows in the main square of Benghazi; a second JPRS item (1980) adds that they were brought from Tripoli Central Prison, were hanged in the main square in front of the Socialist Union, and that an Egyptian man and a Libyan businessman were executed at the port of Benghazi. Wikipedia\'s article on the 1976 protests says students were publicly executed in Benghazi on the anniversary of the protests, with anti-Gaddafi military officers executed later that week, and an Arabic Wikipedia article on human-rights violations under Gaddafi says students were hanged in public before thousands of spectators. The opposition statements are partisan accounts and the two Wikipedia articles are secondary; no first-hand or official record is held here, which is why the entry is graded as testimony and not as documented. The date is taken as April 1977 from the Wikipedia article; the JPRS items do not give a day. The students are not named here.',
      sources: [
        { t: 'JPRS Near East/North Africa Report No. 2038 (Libyan opposition statement, AL-JIHAD, London, September 1979), Internet Archive', u: 'https://archive.org/details/jprs-report_jprs-74485' },
        { t: 'JPRS Near East/North Africa Report No. 2148, Internet Archive', u: 'https://archive.org/details/jprs-report_jprs-76051' },
        { t: 'Wikipedia, 1976 Libyan protests', u: 'https://en.wikipedia.org/wiki/1976_Libyan_protests' },
        { t: 'Arabic Wikipedia, human-rights violations under Gaddafi', u: 'https://ar.wikipedia.org/wiki/%D8%A7%D9%86%D8%AA%D9%87%D8%A7%D9%83%D8%A7%D8%AA_%D8%AD%D9%82%D9%88%D9%82_%D8%A7%D9%84%D8%A5%D9%86%D8%B3%D8%A7%D9%86_%D9%81%D9%8A_%D8%B9%D9%87%D8%AF_%D8%A7%D9%84%D9%82%D8%B0%D8%A7%D9%81%D9%8A' }
      ]
    }
  ]);
})();
