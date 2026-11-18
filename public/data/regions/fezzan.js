/* Fezzan and the south: entries written from the review candidates that two or more stored documents support.
   Positions are the centre of the town the documents name (Wikipedia's coordinates for Kufra and Sabha), with a wide uncertainty:
   no document here gives a coordinate for the site itself. Owner's instruction in chat, 16 Nov 2026: finish the remaining regions
   from the sources already held; entries that allege a killing, name a private person, or rest on a hostile source were left out. */
(function () {
  var cia = function (id, t) { return { t: 'CIA reading room: ' + t, u: 'https://www.cia.gov/readingroom/document/' + id }; };
  window.ATLAS_SITES = (window.ATLAS_SITES || []).concat([
    {
      id: 'fz-kufra-airfield', region: 'fezzan', pos: 'town', layer: 'military', level: 'documented', y0: 1982, y1: 1983,
      name: 'Kufra airfield', lat: 24.1833, lon: 23.2833, r: 15, period: 'Observed 1982-1983',
      relevance: 'A military airfield in the far south-east, watched by US satellite imagery during the Libya-Chad conflict.',
      text: 'US National Photographic Interpretation Center (NPIC) reports from 1982 and 1983 describe the airfield as hosting a Fishbed fighter unit and serving as a support base in southern Libya for operations towards Chad. One report (January 1982) records an increased number of SF.260 light ground-attack aircraft there; another (September 1983) says ten Flogger fighters were probably preparing to depart; a third records four SF.260s, a G.222T transport and two Twin Otter aircraft arriving while four Fishbed fighters, a Candid transport and two C-130s departed; a further report says a third Blinder medium bomber had deployed there, probably from Umm Aitiqah. The reports are US intelligence products and describe equipment seen in imagery; they do not say what the aircraft were used for on any given day. Mapped at the centre of Kufra, because none of the documents gives the airfield\'s own coordinates.',
      sources: [
        cia('cia-rdp90t00784r000100070005-3', 'Ground attack aircraft deployment, Kufra airfield, Libya (NPIC)'),
        cia('cia-rdp91t00712r000100260005-0', 'Probable Flogger departure preparations, Kufra airfield, Libya (NPIC, 1983)'),
        cia('cia-rdp91t00712r000100220008-1', 'Libya-Chad conflict (NPIC)'),
        cia('cia-rdp90t00784r000200610002-5', 'Libyan threat to Sudan (NPIC)')
      ]
    },
    {
      id: 'fz-kufrah-barracks', region: 'fezzan', pos: 'town', layer: 'military', level: 'documented', y0: 1980, y1: 1983,
      name: 'Al Kufrah barracks', lat: 24.1833, lon: 23.2833, r: 15, period: 'Explosion September 1980; observed to 1983',
      relevance: 'A military barracks at Kufra, the scene of an explosion in 1980 and a staging area during the Libya-Chad conflict.',
      text: 'A US imagery analysis report of September 1980 describes damage from an explosion at Al Kufrah barracks, in which four buildings were destroyed and at least five other large buildings damaged, together with vehicles and weapons. The report does not give a cause or any casualties. Later NPIC reports (August 1983) show logistics and support forces forming convoys, a long-range artillery battery moving in, nine BTR-60 armoured personnel carriers (four on heavy-lift transporters) and three BM-21 multiple rocket launchers parked in the centre of the facility. These are US intelligence readings of imagery. Mapped at the centre of Kufra; the documents give no coordinates for the barracks.',
      sources: [
        cia('cia-rdp80t01782r000100360001-7', 'Damage from explosion to Al Kufrah barracks, Libya (imagery analysis report, September 1980)'),
        cia('cia-rdp84t00171r000200330001-4', 'Libya-Chad conflict (NPIC, August 1983)'),
        cia('cia-rdp84t00171r000200050001-5', 'Libyan/dissident activity, Faya Largeau, Chad; Al Kufrah barracks, Libya (NPIC)'),
        cia('cia-rdp90t00784r000200610002-5', 'Libyan threat to Sudan (NPIC)')
      ]
    },
    {
      id: 'fz-otrag-1981', region: 'fezzan', pos: 'town', layer: 'landmark', level: 'documented', y0: 1981, y1: 1981,
      name: 'Otrag rocket launch near Sabha, 1 March 1981', lat: 27.0389, lon: 14.4264, r: 40, period: '1 March 1981',
      relevance: 'A rocket built by a Munich firm, Otrag, was launched from a desert pad in Libya before the firm left the country.',
      text: 'A German magazine article, translated by the US Joint Publications Research Service, reports that after a violent internal dispute the Munich rocket firm Otrag left Libya, and that at 11:20 local time on 1 March 1981 a 12-metre rocket left its launch pad at the oasis of Sebha, about 800 kilometres south of Tripoli. The article is the only source held here and describes the launch from the firm\'s side. Mapped at the centre of Sabha with a wide margin, because the pad itself is not located.',
      sources: [
        { t: 'JPRS Near East/North Africa Report No. 2442 (translation of the German article "Extravagances with Qaddafi"), Internet Archive', u: 'https://archive.org/details/jprs-report_jprs-79525' }
      ]
    },
    {
      id: 'fz-sebha-airfield-1983', region: 'fezzan', pos: 'site', posSrc: { t: 'Wikipedia: Sabha Airbase', u: 'https://en.wikipedia.org/wiki/Sabha_Airbase' }, layer: 'military', level: 'documented', y0: 1983, y1: 1983,
      name: 'Sebha airfield: transporters and armoured carriers, August 1983', lat: 26.9958, lon: 14.4692, r: 5, period: '24 August 1983',
      relevance: 'US imagery of August 1983 shows equipment gathering at Sebha as part of the resupply of Chadian dissidents backed by Libya.',
      text: 'Two copies of a US imagery report headed Libya-Chad Conflict, Sebha Airfield (NPIC, August 1983) say the significance was resupply efforts towards Libyan-backed Chadian dissidents. They record heavy-lift transporters carrying mechanised armoured personnel carriers assembled north of the airfield: twelve BTR-60 carriers, eleven of them on transporters, four empty transporters and one transporter with a possible water tank. This is a US intelligence reading of imagery. Mapped at the Sabha air base position given by Wikipedia.',
      sources: [
        cia('cia-rdp84t00171r000200470001-9', 'Libya-Chad conflict, Sebha airfield, Libya (NPIC, 24 August 1983)'),
        cia('cia-rdp91t00712r000100220006-3', 'Libya-Chad conflict, Sebha airfield, Libya (NPIC, August 1983)'),
        { t: 'Wikipedia, Sabha Airbase (position)', u: 'https://en.wikipedia.org/wiki/Sabha_Airbase' }
      ]
    }
  ]);
})();
