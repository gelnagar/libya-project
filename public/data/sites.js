/*
  Historical sites and events.
  layer:  which overlay the entry belongs to (see ATLAS_LAYERS)
  level:  documented | testimony | suspected | context
  y0, y1: first and last year the entry applies to
  r:      position uncertainty in km
*/
window.ATLAS_LAYERS = {
  detention: { label: 'Prisons & detention',               code: 'P', color: '#e76a6e', shape: 'circle' },
  security:  { label: 'Security & police',                 code: 'S', color: '#72ca9b', shape: 'square' },
  military:  { label: 'Military installations',            code: 'M', color: '#ec9a3c', shape: 'square' },
  airstrike: { label: 'Foreign airstrikes',                code: 'A', color: '#fbd065', shape: 'diamond' },
  battle:    { label: 'Ground battles & attacks',          code: 'B', color: '#9bbf3f', shape: 'square' },
  massacre:  { label: 'Killings & repression',         code: 'X', color: '#f5498b', shape: 'diamond' },
  power:     { label: "Gaddafi's residences & seats of power", code: 'G', color: '#bdadff', shape: 'square' },
  landmark:  { label: 'Landmarks & events',                code: 'L', color: '#68c1ee', shape: 'circle' }
};

var cia = function (id, t) { return { t: 'CIA reading room: ' + t, u: 'https://www.cia.gov/readingroom/document/' + id }; };

window.ATLAS_LEVELS = {
  documented: 'Documented',
  testimony:  'Named in testimony · area only',
  suspected:  'Reported · not confirmed',
  context:    'Context'
};

var SRC = {
  wikiAbuSalim: { t: 'Abu Salim prison, Wikipedia', u: 'https://en.wikipedia.org/wiki/Abu_Salim_prison' },
  hrsly: { t: 'Human Rights Solidarity Organization, Abu Salim annex', u: 'https://hrsly.com/en/annex-1-the-abu-salim-prison-massacre/' },
  ai1992: { t: 'Amnesty International (1992)', u: 'https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190031992en.pdf' },
  shareef: { t: 'Abubaker Shareef interview, Tarikhi', u: 'https://tarikhi.org/interview/abubaker-shareef/' },
  sahli: { t: 'Majda Sahli interview, Tarikhi', u: 'https://tarikhi.org/?p=356' },
  hrw2011: { t: 'Human Rights Watch (2011)', u: 'https://www.hrw.org/node/97287' },
  usaf: { t: 'US Air Force Historical Support Division, Operation El Dorado Canyon', u: 'https://www.afhistory.af.mil/FAQs/Fact-Sheets/Article/458950/operation-el-dorado-canyon' },
  merip: { t: 'MERIP, "US Raid Haunts Libya" (1986)', u: 'https://www.merip.org/1986/07/us-raid-haunts-libya/' },
  binAshur: { t: 'Bin Ashur, Wikipedia', u: 'https://en.wikipedia.org/wiki/Bin_Ashur' },
  massList: { t: 'List of massacres in Libya, Wikipedia', u: 'https://en.wikipedia.org/wiki/List_of_massacres_in_Libya' },
  sharShatt: { t: 'Battle and massacre at Shar al-Shatt, Wikipedia', u: 'https://en.wikipedia.org/wiki/Battle_and_massacre_at_Shar_al-Shatt' },
  hrw1996: { t: 'Human Rights Watch, Libya: June 1996 Killings at Abu Salim Prison', u: 'https://www.hrw.org/reports/2006/06/28/libya-june-1996-killings-abu-salim-prison' },
  wp1984: { t: '1984 Libyan coup attempt, Wikipedia', u: 'https://en.wikipedia.org/wiki/1984_Libyan_coup_attempt' },
  wpEmbassy: { t: '1979 U.S. Embassy Burning in Libya, Wikipedia', u: 'https://en.wikipedia.org/wiki/1979_U.S._Embassy_Burning_in_Libya' },
  wp2011: { t: 'Battle of Tripoli (2011), Wikipedia', u: 'https://en.wikipedia.org/wiki/Battle_of_Tripoli_(2011)' },
  wpNato: { t: '2011 military intervention in Libya, Wikipedia', u: 'https://en.wikipedia.org/wiki/2011_military_intervention_in_Libya' },
  rgc: { t: 'Revolutionary Guard Corps (Libya), Wikipedia', u: 'https://en.wikipedia.org/wiki/Revolutionary_Guard_Corps_(Libyan_paramilitary_unit)' }
};

window.ATLAS_SITES = [
  /* ---------- prisons & detention ---------- */
  {
    id: 'abusalim', layer: 'detention', level: 'documented', y0: 1984, y1: 2011,
    name: 'Abu Salim prison', ar: 'سجن أبو سليم',
    lat: 32.8333, lon: 13.1739, r: 1, period: 'Completed 1984',
    relevance: "The main prison for political prisoners under Gaddafi. People arrested for opposing the government, or only suspected of it, were held here, often for years without trial.",
    text: "Built inside the Military Police Command compound to replace the colonial-era Black Horse prison. The first political prisoners arrived after the arrests that followed the May 1984 attack on Bab al-Aziziya. In March 1988, 426 of its 530 political prisoners were released in an amnesty, but many others stayed. More arrests of religious activists and suspected opponents followed in 1989 and 1990.",
    sources: [SRC.wikiAbuSalim, SRC.hrsly, SRC.ai1992]
  },
  {
    id: 'jdeida', layer: 'detention', level: 'testimony', y0: 1980, y1: 2011,
    name: 'Jdeida prison', ar: 'سجن الجديدة',
    lat: 32.73, lon: 13.10, r: 3.5, period: 'Named for the 1980s',
    relevance: "A civilian prison where political detainees were sent after interrogation elsewhere, including people brought from Benghazi.",
    text: "Former detainees describe interrogation at the 7 April prison in Benghazi before transfer to Jdeida in Tripoli, and being held in both Jdeida and Abu Salim. The marker shows the Jdeida area only; the exact building is not documented in these sources.",
    sources: [SRC.shareef, SRC.sahli, SRC.hrw2011]
  },
  {
    id: 'maktab', layer: 'detention', level: 'suspected', y0: null, y1: 2011,
    name: 'Maktab al-Nasser',
    lat: 32.840, lon: 13.179, r: 2, period: 'Dates unverified',
    relevance: "An internal security office that also held prisoners, many of whom were later moved to Abu Salim.",
    text: "Described as a prison and internal security office in the Abu Salim district before 2011. Sources give no start date, so use during 1969–1989 is unconfirmed. Placed by district only.",
    sources: [{ t: 'Maktab al-Nasser prison, Wikipedia', u: 'https://en.wikipedia.org/wiki/Maktab_al-Nasser_prison' }]
  },
  {
    id: 'hadba', layer: 'detention', level: 'suspected', y0: null, y1: null,
    name: 'Hadba al-Khadra prison', ar: 'سجن الهضبة الخضراء',
    lat: 32.8444, lon: 13.191, r: 1.8, period: 'Dates unverified',
    relevance: "Best known after 2011, when senior officials of the former government were held here.",
    text: "A Ministry of Defence facility in the Hadba al-Khadra area. No source found shows it in use during 1969–1989. Reported locations differ by a kilometre or more.",
    sources: [{ t: 'Reuters (2017)', u: 'https://reuters.screenocean.com/record/877072' }]
  },
  {
    id: 'ainzara', layer: 'detention', level: 'suspected', y0: null, y1: null,
    name: 'Ain Zara prison', ar: 'سجن عين زارة',
    lat: 32.79, lon: 13.27, r: 3, period: 'Dates unverified',
    relevance: "A long-running state prison on the southeast edge of Tripoli.",
    text: "A Ministry of Justice prison in the Ain Zara suburb. Human Rights Watch lists it among possible detention sites in 2011. No source found confirms political detention here between 1969 and 1989. Placed by suburb only.",
    sources: [{ t: 'USIP, Prisons and Detention in Libya', u: 'https://www.usip.org/sites/default/files/PW119-Prisons-and-Detention-in-Libya.pdf' }, SRC.hrw2011]
  },

  /* ---------- security & police ---------- */
  {
    id: 'cso', layer: 'security', level: 'suspected', y0: 1986, y1: 1986,
    name: 'Central Security Organization (reported)', ar: 'جهاز الأمن المركزي',
    lat: 32.8772, lon: 13.2126, r: 1, period: 'Reported 1986',
    relevance: "A state security building that may have been the real target when US bombs hit the Ben Ashour neighbourhood in 1986.",
    text: "Japan's ambassador to Libya suggested the bombs that fell on Ben Ashour were meant for the Central Security Organization, located behind the French embassy. Its exact position is not published; the marker shows the Ben Ashour area.",
    sources: [SRC.binAshur]
  },

  /* ---------- military ---------- */
  {
    id: 'wheelus', layer: 'military', level: 'documented', y0: 1970, y1: 1989,
    name: 'Okba Ben Nafi Air Base (former Wheelus)', ar: 'قاعدة عقبة بن نافع الجوية',
    lat: 32.8941, lon: 13.2760, r: 0.8, period: 'Handed over 1970',
    relevance: "Removing this large American air base was one of the new government's first big moves after the 1969 coup.",
    text: "Wheelus Air Base was a major US Air Force base on Tripoli's eastern coast. The United States withdrew in 1970 and the base was renamed Okba Ben Nafi Air Base. Today it is Mitiga airport.",
    sources: [{ t: 'Mitiga International Airport, Wikipedia', u: 'https://en.wikipedia.org/wiki/Mitiga' }]
  },
  {
    id: 'tip', layer: 'military', level: 'documented', y0: 1969, y1: 1989,
    name: 'Tripoli military airport', ar: 'مطار طرابلس الدولي',
    lat: 32.6635, lon: 13.159, r: 1.5, period: 'Throughout',
    relevance: "The military side of Tripoli's international airport, south of the city.",
    text: "Listed by the US Air Force among the Tripoli targets of the April 1986 strikes.",
    sources: [SRC.usaf]
  },
  {
    id: 'sidibilal', layer: 'military', level: 'documented', y0: 1986, y1: 1986,
    name: 'Sidi Bilal naval school', ar: 'سيدي بلال',
    lat: 32.830, lon: 13.000, r: 4, period: 'Named 1986',
    relevance: "A naval training site on the coast west of Tripoli, including a frogman school.",
    text: "Described in 1986 reporting as a naval secondary school and frogman training school west of Tripoli. Its exact position is not given in these sources; the marker shows the Janzour coast area.",
    sources: [SRC.merip, SRC.usaf]
  },

  /* ---------- foreign airstrikes ---------- */
  {
    id: 'as-bab', layer: 'airstrike', level: 'documented', y0: 1986, y1: 1986,
    name: '1986 US strike: Bab al-Aziziya', lat: 32.848, lon: 13.151, r: 0.8, period: '15 April 1986',
    relevance: "The main target of the US raid on Tripoli, aimed at Gaddafi's home and command centre.",
    text: "US F-111 aircraft bombed the compound. Eight craters were clustered near Gaddafi's home, tent and offices. Two of his sons were seriously wounded and an adopted daughter was reported killed. A US press report in CIA files says nine jets targeted the compound after US intelligence traced terrorist communications to it.",
    sources: [SRC.usaf, SRC.merip, cia('cia-rdp91-00901r000500230008-3', 'Target Qaddafi (1987)'), cia('cia-rdp90-00965r000706870020-5', 'U.S. targeted Qaddafi compound after tracing terror message (1986)')]
  },
  {
    id: 'as-benashour', layer: 'airstrike', level: 'documented', y0: 1986, y1: 1986,
    name: '1986 US strike: Ben Ashour homes', ar: 'بن عاشور',
    lat: 32.8772, lon: 13.2126, r: 1, period: '15 April 1986',
    relevance: "The raid's worst civilian damage: bombs fell on a crowded residential neighbourhood with many embassies.",
    text: "About ten apartment buildings were damaged. A bomb hit a building just behind the French embassy and killed a family, and the embassy itself was damaged. The bombs appear to have missed their intended target. A 1987 press report in CIA files says one F-111 mistakenly hit a residential area near the French embassy.",
    sources: [SRC.merip, SRC.binAshur, cia('cia-rdp90-00965r000403730006-2', 'Target Qaddafi (1987)')]
  },
  {
    id: 'as-tip', layer: 'airstrike', level: 'documented', y0: 1986, y1: 1986,
    name: '1986 US strike: Tripoli military airport', lat: 32.6635, lon: 13.159, r: 1.5, period: '15 April 1986',
    relevance: "The last target of the raid; reporting describes extensive damage to the air base.",
    text: "Five US F-111 aircraft made the final strike of the raid on the military side of Tripoli's airport.",
    sources: [SRC.usaf, SRC.merip]
  },
  {
    id: 'as-sidibilal', layer: 'airstrike', level: 'documented', y0: 1986, y1: 1986,
    name: '1986 US strike: Sidi Bilal', lat: 32.830, lon: 13.000, r: 4, period: '15 April 1986',
    relevance: "A naval training site west of Tripoli that the United States described as a training camp for attacks abroad.",
    text: "Three US F-111 aircraft hit the site. Reporting from Libya afterwards said half of the naval secondary school was reduced to rubble.",
    sources: [SRC.usaf, SRC.merip]
  },

  {
    id: 'as-nato-bab', layer: 'airstrike', level: 'documented', y0: 2011, y1: 2011,
    name: '2011 NATO strikes: Bab al-Aziziya', lat: 32.848, lon: 13.151, r: 0.8, period: 'March–August 2011',
    relevance: "The compound was hit again, 25 years after the 1986 raid, during the NATO air campaign against Gaddafi's forces.",
    text: "Wikipedia reports that on the night of 25 April 2011 two Royal Norwegian Air Force F-16s bombed Gaddafi's residence inside Tripoli, according to US military sources. Gaddafi's forces reportedly kept civilians around the compound and other key sites to deter air strikes. Libyan state television also claimed NATO strikes killed 19 civilians in Tripoli on 24 May and seven on 19 June; those tolls come from the government and were not independently confirmed here.",
    sources: [SRC.wpNato]
  },

  /* ---------- ground battles and attacks ---------- */
  {
    id: 'bt-1979-embassy', layer: 'battle', level: 'documented', y0: 1979, y1: 1979,
    name: 'US Embassy burned, 2 December 1979', lat: 32.78664, lon: 13.1336, r: 1.5, period: '2 December 1979',
    relevance: "A mob set the US Embassy on fire; the US withdrew its staff and the embassy stayed closed until 2004.",
    text: "Protesters burned the embassy, angry over false claims that the US was involved in the seizure of the Grand Mosque in Mecca. CIA files, mostly press clippings, describe mobs burning the embassy and American diplomats leaving Tripoli. The map position is the embassy profile's approximate location and may not be exact.",
    sources: [SRC.wpEmbassy, cia('cia-rdp90-00965r000302640078-5', 'Reagan weighs economic steps against Libyans (1981)'), cia('cia-rdp90-00552r000100990092-3', 'Billy Carter used by Brzezinski as Libya go-between (1980)')]
  },
  {
    id: 'bt-1984-bab', layer: 'battle', level: 'documented', y0: 1984, y1: 1984,
    name: 'Attack on Bab al-Aziziya, 8 May 1984', lat: 32.848, lon: 13.151, r: 0.8, period: '8 May 1984',
    relevance: "Armed exiles of the National Front for the Salvation of Libya attacked Gaddafi's barracks; the fighting lasted hours and was followed by mass arrests.",
    text: "Wikipedia describes around 20 to 30 gunmen attacking the compound with rocket-propelled grenades and automatic weapons; Libyan forces repelled them and, per official accounts, killed all of them. CIA files give other figures: a 1986 press clipping says 12 men attacked and all 12 were killed, with some 2,000 people arrested afterwards; another report calls it a five-hour gun battle. The government later arrested up to 3,000 people and executed at least seven without trial (Wikipedia). Many of those held were taken to Abu Salim. The accounts differ on numbers.",
    sources: [SRC.wp1984, cia('cia-rdp90-00552r000505250009-7', 'Libyan military termed restive under Qaddafi (1986)'), cia('cia-rdp90-00965r000100120080-3', 'Five-hour gun battle at the Bab Aziziya barracks (CIA files)'), cia('cia-rdp90-00965r000100120021-8', 'Qaddafi rival spurns CIA overtures (1985)')]
  },
  {
    id: 'bt-2011-uprising', layer: 'battle', level: 'documented', y0: 2011, y1: 2011,
    name: 'Tripoli rises: Fashloum and Souq al-Juma, 20 August 2011', lat: 32.8845, lon: 13.2218, r: 2.2, period: '20–21 August 2011',
    relevance: "The first night of the battle: neighbourhoods east of the centre rose against the regime as rebels moved in.",
    text: "Wikipedia reports that uprisings spread through Tripoli, notably the districts of Fashloum, Souq al-Juma, Tajoura and Ben Ashur, and that fighting in Souq al-Juma continued on 21 August. Many rebels were reported dead in the district of Qadah.",
    sources: [SRC.wp2011]
  },
  {
    id: 'bt-2011-tajoura', layer: 'battle', level: 'documented', y0: 2011, y1: 2011,
    name: 'Tajoura captured, 21 August 2011', lat: 32.8834, lon: 13.3526, r: 3, period: '21 August 2011',
    relevance: "The eastern district fell to rebel forces early in the battle.",
    text: "Wikipedia reports that the entire Tajoura district was captured by rebel forces, while fighting in Souq al-Juma and at Mitiga airport continued. Loyalists still held a hospital in Tajoura the next day.",
    sources: [SRC.wp2011]
  },
  {
    id: 'bt-2011-mitiga', layer: 'battle', level: 'documented', y0: 2011, y1: 2011,
    name: 'Mitiga airbase fighting, 20–21 August 2011', lat: 32.90384, lon: 13.27368, r: 1.5, period: '20–21 August 2011',
    relevance: "Rebels coming by sea advanced on the airbase and asked it to surrender.",
    text: "Following a rebel amphibious landing, they advanced toward the Mitiga airbase. Reports said it was surrounded and then that rebels had taken it; the situation was unclear for some time.",
    sources: [SRC.wp2011]
  },
  {
    id: 'bt-2011-green', layer: 'battle', level: 'documented', y0: 2011, y1: 2011,
    name: "Green Square taken, 21–22 August 2011", lat: 32.895, lon: 13.1811, r: 0.3, period: '21–22 August 2011',
    relevance: "Crowds filled the square and rebels entered it; it was renamed Martyrs' Square.",
    text: "Al Jazeera and the BBC confirmed that opposition fighters had entered the square. Rebels briefly pulled back, then took it again; Al Jazeera confirmed rebel control by the afternoon of 22 August.",
    sources: [SRC.wp2011]
  },
  {
    id: 'bt-2011-bab', layer: 'battle', level: 'documented', y0: 2011, y1: 2011,
    name: 'Fall of Bab al-Aziziya, 23 August 2011', lat: 32.848, lon: 13.151, r: 0.8, period: '22–23 August 2011',
    relevance: "Rebels assaulted a gate and then breached the compound that had been the centre of Gaddafi's power.",
    text: "Heavy clashes took place around Mansoura as rebels advanced within 500 metres of the compound. They assaulted a gate in the afternoon of 23 August and breached the compound; news channels broadcast rebels gathered around the monument of a fist crushing a US aircraft. Fighting continued inside the compound against snipers. Gaddafi called the loss a tactical move.",
    sources: [SRC.wp2011]
  },
  {
    id: 'bt-2011-abusalim', layer: 'battle', level: 'documented', y0: 2011, y1: 2011,
    name: 'Abu Salim district fighting, 24–26 August 2011', lat: 32.838, lon: 13.172, r: 1.3, period: '24–26 August 2011',
    relevance: "A district with strong loyalist support, around the prison, fought on after the compound fell.",
    text: "A rebel spokesman claimed Abu Salim secured on 23 August, but fighting continued and loyalists were later reported to still hold the area and al-Hadba. Reuters reported rebels storming the district after a NATO air strike.",
    sources: [SRC.wp2011]
  },
  {
    id: 'bt-2011-airport', layer: 'battle', level: 'documented', y0: 2011, y1: 2011,
    name: 'Tripoli airport road, 24 August 2011', lat: 32.6709, lon: 13.1508, r: 1.5, period: '24 August 2011',
    relevance: "The airport was secured, but fighting continued on the highway into the city.",
    text: "Despite the airport being secure, clashes were still ongoing on the road near it, and sporadic heavy artillery fire occurred when rebels tried to take the highway leading from the airport to Tripoli.",
    sources: [SRC.wp2011]
  },

  /* ---------- massacres ---------- */
  {
    id: 'mk-sharshatt', layer: 'massacre', level: 'documented', y0: 1911, y1: 1911,
    name: 'Shar al-Shatt killings', ar: 'معركة الشط',
    lat: 32.8953, lon: 13.2103, r: 1.5, period: '23–26 October 1911',
    relevance: "The first weeks of the Italian invasion. A battle at Shar al-Shatt was followed by mass Italian reprisals against civilians in Tripoli's oasis.",
    text: "On 23 October 1911, Ottoman and Libyan fighters overran an Italian position at Shar al-Shatt; about 290 Italian soldiers were killed after surrendering. In the following days Italian forces killed thousands of people in and around Tripoli, with estimates of some 4,000 dead.",
    sources: [SRC.sharShatt, SRC.massList]
  },
  {
    id: 'mk-riots', layer: 'massacre', level: 'documented', y0: 1945, y1: 1967,
    name: 'Anti-Jewish riots (1945, 1948, 1967)', ar: 'المدينة القديمة',
    lat: 32.8962, lon: 13.1745, r: 1, period: '1945 · 1948 · 1967',
    relevance: "Three waves of riots against Tripoli's Jewish community, centred on the old city, which drove most of the community to leave Libya.",
    text: "More than 140 people were killed in November 1945, 12 in June 1948, and 18 in June 1967. By the time Gaddafi took power in 1969 almost no Jewish residents remained. The marker shows the old city area.",
    sources: [SRC.massList]
  },
  {
    id: 'mk-abusalim', layer: 'massacre', level: 'documented', y0: 1996, y1: 1996,
    name: 'Abu Salim prison massacre', ar: 'مجزرة سجن أبو سليم',
    lat: 32.8333, lon: 13.1739, r: 1, period: '29 June 1996',
    relevance: "The worst single killing of Gaddafi's rule. It happened after the 1969–1989 period but in the prison built during it.",
    text: "After prisoners protested about conditions, security forces killed an estimated 1,200 or more inmates in the prison courtyards. The government denied it for years. Families' protests over the killings helped spark the February 2011 uprising.",
    sources: [SRC.hrw1996, SRC.wikiAbuSalim]
  },

  /* ---------- seats of power ---------- */
  {
    id: 'bab', layer: 'power', level: 'documented', y0: 1969, y1: 2011,
    name: 'Bab al-Aziziya compound', ar: 'باب العزيزية',
    lat: 32.848, lon: 13.151, r: 0.8, period: 'Throughout 1969–1989',
    relevance: "Gaddafi's home and command headquarters, the centre of power in Libya. Both the 1984 attack and the 1986 US bombing were aimed here.",
    text: "A fortified barracks in southern Tripoli that Gaddafi expanded in the 1980s. On 8 May 1984 an armed opposition group attacked it; mass arrests across Libya followed, and many of those detained ended up in Abu Salim. On 15 April 1986, US aircraft bombed the compound. It was demolished after 2011.",
    sources: [{ t: 'Bab al-Azizia, Wikipedia', u: 'https://en.wikipedia.org/wiki/Bab_al-Azizia' }, SRC.ai1992]
  },
  {
    id: 'palace', layer: 'power', level: 'context', y0: 1969, y1: 1969,
    name: "Royal Palace (People's Palace)", ar: 'قصر الشعب',
    lat: 32.8876, lon: 13.1899, r: 1, period: 'Taken over 1969',
    relevance: "The Tripoli palace of King Idris. After the 1969 coup ended the monarchy it was renamed the People's Palace.",
    text: "A symbol of the old monarchy in central Tripoli. Its renaming marked the new government's break with the king. Position is approximate.",
    sources: [{ t: 'Idris of Libya, Wikipedia', u: 'https://en.wikipedia.org/wiki/Idris_of_Libya' }]
  },

  /* ---------- landmarks ---------- */
  {
    id: 'green', layer: 'landmark', level: 'context', y0: 1969, y1: 2011,
    name: 'Green Square (Martyrs’ Square)', ar: 'الساحة الخضراء',
    lat: 32.8963, lon: 13.1806, r: 0.3, period: 'Renamed after 1969',
    relevance: "Tripoli's main square, renamed Green Square under Gaddafi and used for his rallies and speeches. It is now Martyrs' Square.",
    text: "Beside the Red Castle and the old city walls. The name followed the green of Gaddafi's flag and his Green Book.",
    sources: [{ t: "Martyrs' Square, Tripoli, Wikipedia", u: 'https://en.wikipedia.org/wiki/Martyrs%27_Square,_Tripoli' }]
  },
  {
    id: 'fateh', layer: 'landmark', level: 'documented', y0: 1957, y1: 2026, icon: 'university', profile: 'lb-university-of-tripoli',
    name: 'University of Tripoli / Al-Fateh University', ar: 'جامعة طرابلس / جامعة الفاتح',
    lat: 32.8545, lon: 13.2265, r: 0.5, period: '1957–today (Al-Fateh University 1976–2011)',
    relevance: "Libya's largest university and, under Gaddafi, a main stage for student opposition and its punishment: the 7 April 1976 crackdown, the “Day of Judgement” anniversaries, a public hanging on campus in 1984 and arrests of religious students in 1989.",
    text: "Grew from the Tripoli faculties of the University of Libya (Science 1957), became the University of Tripoli in 1973 and was renamed Al-Fateh University in 1976 after the “Al-Fateh” (1 September) revolution. Key events: on 7 April 1976 police and regime loyalists attacked students protesting military control and demanding elections, and many were jailed; Gaddafi reportedly called the anniversary the “Day of Judgement”, and the military tribunal that sentenced students hanged in Benghazi in 1977 sat in Tripoli; in April 1984 student Rashid Kaabar was hanged at the Faculty of Pharmacy while students were made to watch; Revolutionary Committees policed campus life through the 1980s; in 1989 security forces arrested religious students here (Amnesty International). In August 2011 students rose against the regime during the Battle of Tripoli, and the name University of Tripoli returned. Its teaching hospitals include Tripoli Medical Center.",
    sources: [SRC.sahli, SRC.ai1992, { t: 'University of Tripoli, Wikipedia', u: 'https://en.wikipedia.org/wiki/University_of_Tripoli' }, { t: '1976 Libyan protests, Wikipedia', u: 'https://en.wikipedia.org/wiki/1976_Libyan_protests' }, { t: 'Human rights in Libya under Muammar Gaddafi, Wikipedia', u: 'https://en.wikipedia.org/wiki/Human_rights_in_Libya_under_Muammar_Gaddafi' }]
  },
  {
    id: 'mk-april1976', layer: 'massacre', level: 'testimony', y0: 1976, y1: 1976,
    name: '7 April 1976 crackdown on students', ar: 'قمع الطلاب في 7 أبريل 1976',
    lat: 32.8553, lon: 13.2236, r: 0.6, period: '7 April 1976',
    relevance: "The attack on student protesters that made 7 April a date of repression, later marked as the “Day of Judgement”.",
    text: "Students at the universities in Tripoli and Benghazi protested against military control of campus life and called for free elections. Police and regime loyalists attacked them, and many students were detained for months. No reliable death toll has been published for Tripoli. A year later, on 7 April 1977, students sentenced by a military tribunal in Tripoli were hanged in public in Benghazi. Account of the Tripoli attack: a former student (Tarikhi interview) and Wikipedia.",
    sources: [SRC.sahli, { t: '1976 Libyan protests, Wikipedia', u: 'https://en.wikipedia.org/wiki/1976_Libyan_protests' }, { t: 'Human rights in Libya under Muammar Gaddafi, Wikipedia', u: 'https://en.wikipedia.org/wiki/Human_rights_in_Libya_under_Muammar_Gaddafi' }]
  },
  {
    id: 'mk-hang-1984', layer: 'massacre', level: 'testimony', y0: 1984, y1: 1984,
    name: 'University of Tripoli hanging, April 1984', ar: 'إعدام طالب في جامعة الفاتح',
    lat: 32.8558, lon: 13.2213, r: 0.4, period: 'April 1984 (probably 16 April)',
    relevance: "A public hanging of a student on campus, with other students forced to watch, during the April 1984 wave of executions.",
    text: "Student Rashid Mansour Kaabar was hanged at the Faculty of Pharmacy, University of Tripoli (then Al-Fateh University). Another student, Mustafa al-Nuwairi, was hanged at Benghazi University the same month. A Washington Post report of 22 April 1984 speaks of two students hanged on Monday for treason, which probably means 16 April. The date is not 7 April. Accounts rest on newspapers and exile sources; the exact venue on campus is from a single account.",
    sources: [{ t: 'Washington Post, 22 Apr 1984: Libya hanged 2 students Monday for treason', u: 'https://www.washingtonpost.com/archive/politics/1984/04/22/libya-hanged-2-students-monday-for-treason/f639373f-d89a-4259-bd91-11ffbfbc2fab/' }, { t: 'Asharq Al-Awsat on the 7 April hangings', u: 'https://aawsat.com/node/4263251' }]
  },
  {
    id: 'mk-feb2011', layer: 'massacre', level: 'documented', y0: 2011, y1: 2011,
    name: 'Tripoli crackdown, 20–25 February 2011', ar: 'قمع احتجاجات طرابلس',
    lat: 32.8963, lon: 13.1806, r: 3, period: '20–25 February 2011',
    relevance: "Security forces fired on protesters in several districts as the uprising reached Tripoli.",
    text: "Shooting was reported around Green Square, Fashloum, Tajoura and Ben Ashour. Human Rights Watch counted at least 62 bodies at two Tripoli hospital morgues by 22 February but could not confirm the cause for each. Figures for the whole week vary widely, from about 300 to 700 killed. The marker is centred on Green Square, but events happened in many districts.",
    sources: [{ t: 'HRW, 22 Feb 2011: Libya commanders should face justice for killings', u: 'https://www.hrw.org/news/2011/02/22/libya-commanders-should-face-justice-killings' }, { t: 'HRW, 13 Mar 2011: End violent crackdown in Tripoli', u: 'https://www.hrw.org/news/2011/03/13/libya-end-violent-crackdown-tripoli' }]
  },
  {
    id: 'mk-babcamp-2011', layer: 'massacre', level: 'suspected', y0: 2011, y1: 2011,
    name: 'Camp near Bab al-Aziziya, August 2011 (reported)', 
    lat: 32.848, lon: 13.151, r: 1.2, period: 'August 2011',
    relevance: "A reported killing of at least 29 people at a camp outside the compound during the fall of Tripoli.",
    text: "Wikipedia's list of massacres in Libya gives at least 29 killed at a camp outside the Bab al-Aziziya compound in August 2011. I found no primary report, so the place and the toll are unconfirmed.",
    sources: [{ t: 'List of massacres in Libya, Wikipedia', u: 'https://en.wikipedia.org/wiki/List_of_massacres_in_Libya' }]
  }
];

/* Connections drawn on the map when one end is selected */
window.ATLAS_LINKS = [
  ['bab', 'abusalim', 'After the May 1984 attack, those arrested were taken to Abu Salim'],
  ['maktab', 'abusalim', 'Prisoners were often moved on to Abu Salim'],
  ['jdeida', 'abusalim', 'Former detainees were held in both prisons'],
  ['abusalim', 'mk-abusalim', 'Same prison, 1996 massacre'],
  ['bab', 'as-bab', 'Bombed on 15 April 1986'],
  ['tip', 'as-tip', 'Bombed on 15 April 1986'],
  ['sidibilal', 'as-sidibilal', 'Bombed on 15 April 1986'],
  ['as-bab', 'as-benashour', 'Same raid, 15 April 1986'],
  ['as-bab', 'as-tip', 'Same raid, 15 April 1986'],
  ['as-bab', 'as-sidibilal', 'Same raid, 15 April 1986'],
  ['as-benashour', 'cso', 'Reported intended target of the bombs'],
  ['palace', 'bab', 'Seat of power moved from the king’s palace to Gaddafi’s barracks'],
  ['bab', 'bt-1984-bab', 'Attacked by armed exiles on 8 May 1984'],
  ['bt-1984-bab', 'abusalim', 'Arrests after the attack: many detainees ended up in Abu Salim'],
  ['bab', 'bt-2011-bab', 'Stormed by rebels on 23 August 2011'],
  ['bab', 'as-nato-bab', 'Bombed again in 2011'],
  ['as-bab', 'as-nato-bab', 'Same compound hit in 1986 and 2011'],
  ['green', 'bt-2011-green', 'Rebels took the square on 21–22 August 2011'],
  ['abusalim', 'bt-2011-abusalim', 'District and prison fought over in August 2011'],
  ['tip', 'bt-2011-airport', 'Airport road clashes, 24 August 2011'],
  ['wheelus', 'bt-2011-mitiga', 'Mitiga airbase fought over, 20–21 August 2011'],
  ['bt-2011-uprising', 'bt-2011-tajoura', 'Same battle, 20–21 August 2011'],
  ['bt-2011-green', 'bt-2011-bab', 'Same battle, 21–23 August 2011'],
  ['bt-2011-mitiga', 'bt-2011-bab', 'Same battle, 20–23 August 2011'],
  ['bt-2011-bab', 'bt-2011-abusalim', 'Same battle, 23–26 August 2011']
];

/* Known activity with no published location */
window.ATLAS_UNPLACED = [
  { name: 'Rixos Al Nasr hotel, Tripoli', when: 'August 2011', text: 'Foreign journalists were kept at this hotel during the battle of Tripoli. Heavy fighting took place around it and it stayed in loyalist hands until about 24 August, when the journalists left in Red Cross vans (Wikipedia, Battle of Tripoli (2011)). I did not confirm its exact location.', src: SRC.wp2011 },
  { name: 'Libyan government claims of NATO strikes in Tripoli', when: 'May–June 2011', text: 'Libyan state television said NATO strikes killed 19 civilians in Tripoli on 24 May 2011 and seven on 19 June, and fifteen at Sorman near Tripoli on 20 June. These are government claims reported by Wikipedia and were not independently confirmed here; no sites are given.', src: SRC.wpNato },
  { name: 'Revolutionary Guard Corps', when: '1980s', text: 'Grew out of the Revolutionary Committees. It watched soldiers inside barracks, reportedly controlled ammunition at the main bases, and fought regular army units in Tripoli’s streets during a May 1985 coup attempt. No source gives its bases.', src: SRC.rgc },
  { name: 'Police stations and checkpoints', when: '1969–1989', text: 'No published source maps Tripoli’s police posts or checkpoints for this period.' },
  { name: 'Military intelligence prison, Tripoli', when: '1984', text: 'A former detainee describes being held there after the May 1984 arrests. Its location is not given.', src: SRC.shareef },
  { name: 'Black Horse prison', when: 'Until 1984', text: 'Italian-era prison replaced by Abu Salim. No source places it on a map.', src: SRC.hrsly },
  { name: '7 April, the “Day of Judgement”', when: '1976–1980s', text: 'English Wikipedia says Gaddafi called the anniversary of the 7 April 1976 student protests the “Day of Judgement”. On 7 April 1977 students Omar Dabboub and Mohamed Ben Saoud were hanged in public in Benghazi after a military tribunal in Tripoli; the broadcast was shown on television. Some sources say executions were repeated every 7 April until the late 1980s; that is disputed and no Tripoli venue is named. The University of Tripoli, where students were attacked in 1976 and a student was hanged in April 1984, is on the map.', src: { t: 'Human rights in Libya under Muammar Gaddafi, Wikipedia', u: 'https://en.wikipedia.org/wiki/Human_rights_in_Libya_under_Muammar_Gaddafi' } },
  { name: 'Firing-squad executions', when: '30 May 2010', text: 'Eighteen people were shot by firing squad: 14 in Tripoli and 4 in Benghazi, many of them foreign nationals. The Tripoli venue is not named. Amnesty International and the European Parliament condemned the executions.', src: { t: 'Human rights violations during the Gaddafi regime, Wikipedia', u: 'https://en.wikipedia.org/wiki/Human_rights_violations_during_the_Gaddafi_regime' } },
  { name: 'Public executions', when: 'Late 1970s–1980s', text: 'Public hangings were staged around 7 April anniversaries, including at universities and a sports arena. The documented cases with places are in Benghazi, outside this map, except the April 1984 hanging at the University of Tripoli.', src: { t: 'Human rights violations during the Gaddafi regime, Wikipedia', u: 'https://en.wikipedia.org/wiki/Human_rights_violations_during_the_Gaddafi_regime' } }
];

window.ATLAS_DISTRICTS = [
  ['Old City', 'المدينة القديمة', 32.8975, 13.1755],
  ['Dahra', 'الظهرة', 32.8925, 13.1990],
  ['Ben Ashour', 'بن عاشور', 32.8780, 13.2050],
  ['Fashloum', 'فشلوم', 32.8845, 13.2185],
  ['Souq al-Juma', 'سوق الجمعة', 32.8810, 13.2500],
  ['Tajoura', 'تاجوراء', 32.8830, 13.3520],
  ['Hay al-Andalus', 'حي الأندلس', 32.8720, 13.1390],
  ['Gargaresh', 'قرقارش', 32.8575, 13.1180],
  ['Janzour', 'جنزور', 32.8170, 13.0100],
  ['Abu Salim', 'أبو سليم', 32.8380, 13.1720],
  ['Hadba', 'الهضبة', 32.8330, 13.2000],
  ['Salah al-Din', 'صلاح الدين', 32.8150, 13.2250],
  ['Ain Zara', 'عين زارة', 32.7950, 13.2650],
  ['Qasr Ben Ghashir', 'قصر بن غشير', 32.6900, 13.1800]
];
