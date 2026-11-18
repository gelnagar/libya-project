/* Sirte and the central coast: entries written from the review candidates that two or more stored documents support.
   Positions are the centre of the town the documents name (Wikipedia's coordinates). Owner's instruction in chat, 16 Nov 2026:
   finish the remaining regions from the sources already held; entries that allege a killing, name a private person, or rest on a
   hostile source were left out. */
(function () {
  var cia = function (id, t) { return { t: 'CIA reading room: ' + t, u: 'https://www.cia.gov/readingroom/document/' + id }; };
  window.ATLAS_SITES = (window.ATLAS_SITES || []).concat([
    {
      id: 'st-gulf-sidra-1986', region: 'sirte', pos: 'town', layer: 'battle', level: 'documented', y0: 1986, y1: 1986,
      name: 'Gulf of Sidra clash, 24 March 1986', lat: 31.205, lon: 16.5886, r: 40, period: '24 March 1986',
      relevance: 'US naval aircraft struck Libyan patrol boats and a missile site near Sirte after Libyan missiles were fired at US aircraft over the Gulf of Sidra.',
      text: 'A New York Post report kept in CIA files says US warplanes destroyed two Libyan attack ships and a missile site on 24 March 1986 after Libyan forces fired anti-aircraft missiles at US aircraft six times; it gives the US Defense Secretary as saying that 50 to 100 Libyans were thought to have been killed (the figure is the US official\'s estimate, not confirmed). Wikipedia describes the same operation (Operation Prairie Fire): Libyan SA-5 missiles fired from near Surt at US F-14s missed, and two MiG-25s from Benina were intercepted without missiles being fired. A third item in CIA files says Libya fired two SA-5 missiles at US planes and that US forces then struck Libyan targets over the following hours, including the Surt missile base. The sources differ on the number of missiles fired and on casualties. Libya claimed the whole Gulf as territorial water and the US held that it was international. Mapped at the centre of Sirte, the town the missile base is named for; the engagements took place over a wider area at sea.',
      sources: [
        cia('cia-rdp90-00965r000302030010-6', 'New York Post, "Blown out of the water" (March 1986)'),
        cia('cia-rdp90-00965r000706460001-1', '"Sailing in harm\'s way" (April 1986)'),
        { t: 'Wikipedia, Action in the Gulf of Sidra (1986)', u: 'https://en.wikipedia.org/wiki/Action_in_the_Gulf_of_Sidra_(1986)' }
      ]
    },
    {
      id: 'st-brega', region: 'sirte', pos: 'site', posSrc: { t: 'Wikipedia: Brega (the town is the subject)', u: 'https://en.wikipedia.org/wiki/Brega' }, layer: 'landmark', level: 'documented', y0: 1969, y1: 2011,
      name: 'Marsa el Brega: oil port, gas plant and university', lat: 30.435, lon: 19.6669, r: 10, period: 'Oil port and gas plant; university opened 1981',
      relevance: 'An oil-export and gas-processing town on the Gulf of Sidra, site of a technical university opened in 1981.',
      text: 'The CIA\'s National Intelligence Survey on the Libyan economy records a refinery and a large liquefied natural gas plant at Marsa al Burayqah, and the US Library of Congress country study describes an export terminal and liquefaction plant there. An undated US contingency-planning paper on a possible Libyan flight counts about 350 Americans at the Exxon oil port of Marsa Brega, out of some 2,200 in Libya, and a December 1981 intelligence estimate presumes that most or all had been withdrawn from the Esso facilities there. A JPRS translation of a Libyan press item describes the Marsa Brega university as the focus of technical training in the Jamahiriya, and the Library of Congress study says a technical university specialising in engineering and petroleum opened there in 1981. Mapped at Brega as given by Wikipedia.',
      sources: [
        cia('cia-rdp01-00707r000200080012-4', 'National Intelligence Survey 49: Libya: the economy'),
        { t: 'Library of Congress country study, Libya: Industry', u: 'http://countrystudies.us/libya/60.htm' },
        { t: 'Library of Congress country study, Libya: Education', u: 'http://countrystudies.us/libya/56.htm' },
        cia('loc-hak-452-7-10-1', 'Contingency planning for Libyan flight'),
        cia('cia-rdp84b00049r000200260002-5', 'Intelligence estimate on the Libyan situation (7 December 1981)'),
        { t: 'JPRS Near East/North Africa Report No. 2602, Internet Archive', u: 'https://archive.org/details/ufiche-test-document_jprs-81541' }
      ]
    }
  ]);
})();
