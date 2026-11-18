/* Greater Tripolitania: entries written from the review candidates that two or more stored documents support.
   Positions are the centre of the town the documents name (Wikipedia's coordinates). Owner's instruction in chat, 16 Nov 2026:
   finish the remaining regions from the sources already held; entries that allege a killing, name a private person, or rest on a
   hostile source were left out. */
(function () {
  var cia = function (id, t) { return { t: 'CIA reading room: ' + t, u: 'https://www.cia.gov/readingroom/document/' + id }; };
  window.ATLAS_SITES = (window.ATLAS_SITES || []).concat([
    {
      id: 'tp-zuwarah-1973', region: 'tripolitania', pos: 'town', layer: 'landmark', level: 'documented', y0: 1973, y1: 1973,
      name: 'Gaddafi proclaims the Cultural Revolution at Zuwarah, 15 April 1973', lat: 32.9333, lon: 12.0833, r: 5, period: '15 April 1973',
      relevance: 'A speech at Zuwarah launched the "popular revolution" that reshaped Libya\'s institutions.',
      text: 'The Library of Congress country study says that in an April 15, 1973 speech at Zuwarah Qadhafi proclaimed a cultural revolution; Wikipedia\'s article on the Cultural Revolution gives the same date and place and adds that the Revolutionary Command Council had expected him to announce his resignation instead. The speech began a period of nearly four years of political and social change, also called the People\'s Revolution. This entry records the speech only. Mapped at the centre of Zuwara; the sources do not locate the venue.',
      sources: [
        { t: 'Library of Congress country study, Libya: The Cultural Revolution', u: 'http://countrystudies.us/libya/79.htm' },
        { t: 'Wikipedia, Cultural Revolution (Libya)', u: 'https://en.wikipedia.org/wiki/Cultural_Revolution_(Libya)' }
      ]
    },
    {
      id: 'tp-misrata-1983', region: 'tripolitania', pos: 'town', layer: 'landmark', level: 'suspected', y0: 1983, y1: 1983,
      name: 'Students of Misrata reported to demonstrate, 10 May 1983', lat: 32.3775, lon: 15.092, r: 8, period: '10 May 1983',
      relevance: 'State radio reported a student demonstration at Misrata backing the regime after an alleged plot against Gaddafi.',
      text: 'A US Foreign Broadcast Information Service report (11 May 1983) carries the text of a Libyan state radio broadcast ("Voice of the Greater Arab Homeland", 10 May 1983, 20:15 GMT) saying that the students of Misrata municipality staged a demonstration denouncing an alleged plot to assassinate Qadhafi, said to have been assigned by the CIA to a Palestinian, and protesting the Lebanese-Israeli agreement. A copy of the same text is held in the CIA reading room. The only source for the demonstration is the Libyan state broadcast; it was not independently confirmed here. The entry records that the broadcast was made, not that the plot existed.',
      sources: [
        { t: 'FBIS Daily Report: Middle East & Africa, Vol. V No. 092 (11 May 1983), Internet Archive', u: 'https://archive.org/details/micro_IA1176909_0151' },
        cia('cia-rdp05-01559r000400390032-8', 'Al-Qadhdhafi on Lebanese relations, Al-Asad visit (FBIS text, 11 May 1983)')
      ]
    }
  ]);
})();
