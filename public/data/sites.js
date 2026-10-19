/*
  Historical sites and events.
  layer:  which overlay the entry belongs to (see ATLAS_LAYERS)
  level:  documented | testimony | suspected | context
  y0, y1: first and last year the entry applies to
  r:      position uncertainty in km
*/
window.ATLAS_LAYERS = {
  detention: { label: 'Prisons & detention',               code: 'P', color: '#5d3f6a', shape: 'circle' },
  security:  { label: 'Security & police',                 code: 'S', color: '#29508f', shape: 'square' },
  military:  { label: 'Military installations',            code: 'M', color: '#55603a', shape: 'square' },
  airstrike: { label: 'Foreign airstrikes',                code: 'A', color: '#8a6a1f', shape: 'diamond' },
  battle:    { label: 'Ground battles & attacks',          code: 'B', color: '#7a4524', shape: 'square' },
  massacre:  { label: 'Killings & repression',         code: 'X', color: '#8a1c34', shape: 'diamond' },
  power:     { label: "Gaddafi's residences & seats of power", code: 'G', color: '#6b6f78', shape: 'square' },
  landmark:  { label: 'Landmarks & events',                code: 'L', color: '#38787a', shape: 'circle' }
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


var A91 = { t: "Amnesty International, prisoner concerns in the light of recent legal reforms (1991)", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190021991en.pdf" }, A97 = { t: "Amnesty International, Libya: Gross human rights violations amid secrecy and isolation (1997)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190081997en.pdf" };
window.ATLAS_SITES = [
  /* ---------- prisons & detention ---------- */
  {
    id: 'abusalim', layer: 'detention', level: 'documented', y0: 1984, y1: 2011,
    name: 'Abu Salim prison', ar: 'سجن أبو سليم',
    lat: 32.8333, lon: 13.1739, r: 1, period: 'Completed 1984',
    relevance: "The main prison for political prisoners under Gaddafi. People arrested for opposing the government, or only suspected of it, were held here, often for years without trial.",
    text: "Built inside the Military Police Command compound to replace the colonial-era Black Horse prison. The first political prisoners arrived after the arrests that followed the May 1984 attack on Bab al-Aziziya. In March 1988, 426 of its 530 political prisoners were released in an amnesty, but many others stayed. More arrests of religious activists and suspected opponents followed in 1989 and 1990. Amnesty's 1997 report describes underground rooms beneath the administration building used for interrogation and torture. On 4 October 2006 security forces reportedly killed at least one prisoner and wounded at least nine during a disturbance. Human Rights Watch was allowed into the prison in April 2009.",
    sources: [SRC.wikiAbuSalim, SRC.hrsly, SRC.ai1992, { t: "Amnesty International, Libya: Gross human rights violations amid secrecy and isolation (1997)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190081997en.pdf" }, { t: "Amnesty International, Libya: investigation needed into prison deaths (2006)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/08/mde190062006en.pdf" }]
  },
  {
    id: 'jdeida', layer: 'detention', level: 'documented', y0: 1979, y1: 2011,
    name: "Jdeida prison", ar: "سجن الجديدة",
    lat: 32.73, lon: 13.1, r: 3.5, period: "Named 1979\u20132009",
    relevance: "A civilian prison under the justice committee where political prisoners were held, and one of three Tripoli prisons Amnesty was allowed into in 2009.",
    text: "Amnesty reports a prisoner of conscience held in solitary confinement here in 1979, 24 students held incommunicado after sentencing in December 1995, and an Eritrean migrant beaten by a guard in January 2004. Amnesty's 1997 report puts it in the al-Farnaj area just outside Tripoli. Former detainees also describe transfer here after interrogation at the 7 April prison in Benghazi. The marker shows the Jdeida area only; the exact building is not documented in these sources.",
    sources: [SRC.shareef, SRC.sahli, SRC.hrw2011, { t: "Amnesty International, prisoner concerns in the light of recent legal reforms (1991)", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190021991en.pdf" }, { t: "Amnesty International, Libya: Gross human rights violations amid secrecy and isolation (1997)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190081997en.pdf" }, { t: "Amnesty International, Libya: Time to make human rights a reality (2004)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190022004en.pdf" }, { t: "Amnesty International, first fact-finding visit in over five years (May 2009)", u: "https://www.amnesty.org/zh-hant/wp-content/uploads/2021/07/mde190032009eng.pdf" }]
  },
  {
    id: 'maktab', layer: 'detention', level: 'suspected', y0: null, y1: 2011,
    name: 'Maktab al-Nasser',
    lat: 32.840, lon: 13.179, r: 2, period: 'Dates unverified',
    relevance: "An internal security office that also held prisoners, many of whom were later moved to Abu Salim.",
    text: "Described as a prison and internal security office in the Abu Salim district before 2011. Sources give no start date, so use under Gaddafi is unconfirmed. Placed by district only.",
    sources: [{ t: 'Maktab al-Nasser prison, Wikipedia', u: 'https://en.wikipedia.org/wiki/Maktab_al-Nasser_prison' }]
  },
  {
    id: 'hadba', layer: 'detention', level: 'suspected', y0: null, y1: null,
    name: 'Hadba al-Khadra prison', ar: 'سجن الهضبة الخضراء',
    lat: 32.8444, lon: 13.191, r: 1.8, period: 'Dates unverified',
    relevance: "Best known after 2011, when senior officials of the former government were held here.",
    text: "A Ministry of Defence facility in the Hadba al-Khadra area. No source found shows it in use under Gaddafi. Reported locations differ by a kilometre or more.",
    sources: [{ t: 'Reuters (2017)', u: 'https://reuters.screenocean.com/record/877072' }]
  },
  {
    id: 'ainzara', layer: 'detention', level: 'documented', y0: 2004, y1: 2011,
    name: "Ain Zara prison", ar: "سجن عين زارة",
    lat: 32.79, lon: 13.27, r: 3, period: "Documented 2004 and 2009",
    relevance: "A state prison on the southeast edge of Tripoli that held political prisoners in the 2000s.",
    text: "Amnesty reports that dissident Fathi al-Jahmi was moved here from Abu Salim during its February 2004 visit, that another prisoner spent most of his detention here, and that a wing was believed to be under Internal Security Agency control. Amnesty delegates were given access to prisoners here in May 2009. No source found shows political detention here before 2004. Placed by suburb only.",
    sources: [{ t: "Amnesty International, Libya: Time to make human rights a reality (2004)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190022004en.pdf" }, { t: "Amnesty International, first fact-finding visit in over five years (May 2009)", u: "https://www.amnesty.org/zh-hant/wp-content/uploads/2021/07/mde190032009eng.pdf" }, { t: 'USIP, Prisons and Detention in Libya', u: 'https://www.usip.org/sites/default/files/PW119-Prisons-and-Detention-in-Libya.pdf' }, SRC.hrw2011]
  },
  {
    id: 'tajoura-prison', layer: 'detention', level: 'testimony', y0: 1996, y1: 2000,
    name: "Tajoura prison and security-agency interrogation site", ar: "سجن تاجوراء",
    lat: 32.8834, lon: 13.3526, r: 4, period: "Reported 1996 and 2000",
    relevance: "A prison and an External Security Agency building in the Tajoura suburb, named by Amnesty in the 1990s and 2000.",
    text: "Amnesty's 1997 report says traders arrested in the 1996 anti-corruption sweep were held in Tajoura prison, reportedly over suspected links to Islamist activists. Its 2004 report says a man returning to Libya in February 2000 was held in solitary confinement and interrogated at the External Security Agency headquarters in Tajoura; the agency's deputy head told Amnesty it ran no place of detention. Neither source gives a street address, so the marker is the Tajoura district.",
    sources: [{ t: "Amnesty International, Libya: Gross human rights violations amid secrecy and isolation (1997)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190081997en.pdf" }, { t: "Amnesty International, Libya: Time to make human rights a reality (2004)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190022004en.pdf" }]
  },
  {
    id: 'blackhorse', layer: 'detention', level: 'testimony', y0: 1980, y1: 1984,
    name: "\"Black Horse\" prison, airport road",
    lat: 32.78, lon: 13.16, r: 5, period: "Reported March 1980",
    relevance: "A Tripoli prison reported in 1980 to hold Tunisian recruits who refused to follow orders, with a second new intelligence prison 7 km from the city.",
    text: "A Cairo weekly (Akhir Sa'ah, 12 March 1980), translated by the US JPRS service, says refractory recruits were banished or held in the \"Black Horse\" prison on the Tripoli International Airport road, or in a new prison set up by Libyan intelligence 7 km from Tripoli. It rests on one unnamed eyewitness and comes from a press hostile to Gaddafi. Wikipedia says Abu Salim was built to replace Black Horse. The marker sits on the airport road; the exact spot is not known.",
    sources: [{ t: "JPRS Near East/North Africa Report No. 2124 (1980)", u: "https://archive.org/details/jprs-report_jprs-75801" }, SRC.wikiAbuSalim]
  },
  {
    id: 'towisha', layer: 'detention', level: 'documented', y0: 2009, y1: 2013,
    name: "Twaisha migrant detention centre",
    lat: 32.6949, lon: 13.1589, r: 0.6, period: "Documented 2009 and 2013",
    relevance: "A holding centre for undocumented migrants near Tripoli's airport.",
    text: "The Global Detention Project lists it as run by the Interior Ministry's anti-infiltration and illegal immigration departments, with a standard capacity of 900 in 2009. Human Rights Watch documented migrant centres in Tripoli and at Twaisha near the airport in June 2009, and Amnesty visited it in 2013. The Detention Project gives the coordinates used here.",
    sources: [{ t: "Global Detention Project: Towisha detention centre", u: "https://www.globaldetentionproject.org/countries/africa/libya/detention-centres/994/towisha-detention-centre" }, { t: "Detention centres in Libya, Wikipedia", u: "https://en.wikipedia.org/wiki/Detention_centres_in_Libya" }]
  },
  {
    id: 'gharghour-security', layer: 'detention', level: 'documented', y0: 2011, y1: 2011,
    name: "Internal Security building at Gharghour (Al-Amal al-Akhdar)",
    lat: 32.859, lon: 13.171, r: 1, period: "August 2011",
    relevance: "A makeshift prison where about 25 detainees were held in the last days of the regime and at least 17 were shot.",
    text: "Human Rights Watch reports that about 25 people were held in the Libyan Internal Security building at Gargur, that at least 17 were shot around 21 August 2011, and that two more bodies were found in a closet under the stairs on 26 August. A survivor said he had first been held at a house used by the Khamis Brigade. The 17 bodies were taken to Mitiga hospital on 24 August. The marker is the Gharghour district; the article gives no coordinates.",
    sources: [{ t: "Human Rights Watch, Gaddafi forces suspected of executing detainees (28 Aug 2011)", u: "https://www.hrw.org/news/2011/08/28/libya-gaddafi-forces-suspected-executing-detainees" }]
  },
  {
    id: 'mitiga-prison', layer: 'detention', level: 'documented', y0: 2014, y1: 2020,
    name: "Mitiga prison (Special Deterrence Force)",
    lat: 32.8945, lon: 13.276, r: 1, period: "After 2011",
    relevance: "A detention facility inside Tripoli's only working airport, run by the Special Deterrence Force (Radaa), not a Gaddafi-era prison.",
    text: "The UN fact-finding mission calls Mitiga the largest prison in western Libya, with up to 5,000 held and over 40 first-hand accounts of abuse, some held up to seven years. The prosecutor general's office put the number held at about 2,600 at the end of November 2017. The airbase was the Gaddafi-era Wheelus/Okba Ben Nafi base; its use as a prison dates from after 2011.",
    sources: [{ t: "UN Independent Fact-Finding Mission on Libya, A/HRC/50/63 (2022)", u: "https://digitallibrary.un.org/record/4022642/files/A_HRC_50_63-EN.pdf" }, { t: "UN, Abuse Behind Bars: arbitrary and unlawful detention in Libya (2018)", u: "https://www.ecoi.net/en/file/local/2004491/AbuseBehindBarsArbitraryUnlawful_EN.pdf" }]
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
    text: "Wikipedia reports that on the night of 25 April 2011 two Royal Norwegian Air Force F-16s bombed Gaddafi's residence inside Tripoli, according to US military sources. Gaddafi's forces reportedly kept civilians around the compound and other key sites to deter air strikes. NATO said it hit a command and control building there on 1 May, and Al Jazeera reported more raids around the compound on 16 June (it was not clear what was hit). Libyan state television also claimed NATO strikes killed 19 civilians in Tripoli on 24 May and seven on 19 June; those tolls come from the government and were not independently confirmed here.",
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
    relevance: "The worst single killing of Gaddafi's rule. It happened in 1996, inside the prison built under his rule.",
    text: "After prisoners protested about conditions, security forces killed an estimated 1,200 or more inmates in the prison courtyards. The government denied it for years. Families' protests over the killings helped spark the February 2011 uprising.",
    sources: [SRC.hrw1996, SRC.wikiAbuSalim]
  },
  {
    id: 'as-nato-saifarab', layer: 'airstrike', level: 'testimony', y0: 2011, y1: 2011,
    name: "NATO strike, 30 April 2011: Gaddafi's son and grandchildren reported killed",
    lat: 32.8954, lon: 13.1839, r: 4, period: "30 April 2011",
    relevance: "A strike on a house in a residential area with several embassies; Libyan officials said Saif al-Arab Gaddafi and three children died.",
    text: "An alternative account (Arabic Wikipedia) says an air strike hit his home in Gargaresh on 26 April and he died later in hospital. Airwars records three children killed and calls it a likely strike. NATO said it hit a command and control building and ammunition storage and had video showing no civilians; Airwars rates that position as unsubstantiated. The sources do not name the street or district, so the marker is a city-level position.",
    sources: [{ t: "Airwars: 30 April 2011", u: "https://airwars.org/incidents/lib2011-081-april-30-2011" }]
  },
  {
    id: 'as-nato-0619', layer: 'airstrike', level: 'documented', y0: 2011, y1: 2011,
    name: "NATO strike, 19 June 2011: civilian casualties admitted",
    lat: 32.87, lon: 13.16, r: 5, period: "18\u201319 June 2011",
    relevance: "NATO said a weapon aimed at a missile site apparently failed and civilians may have been hurt.",
    text: "Lt. Gen. Charles Bouchard said a weapons system failure may have caused the civilian casualties. Libyan state television said seven civilians were killed in a house. The sources do not name the street or district, so the marker is a city-level position.",
    sources: [{ t: "NATO: acknowledges civilian casualties in Tripoli strike", u: "https://www.nato.int/cps/en/natohq/news_75639.htm" }, { t: "Al Jazeera: NATO admits civilian deaths", u: "https://www.aljazeera.com/news/2011/6/19/nato-admits-civilian-deaths-in-libya-raid" }]
  },
  {
    id: 'as-nato-tv', layer: 'airstrike', level: 'testimony', y0: 2011, y1: 2011,
    name: "NATO strike on state TV, 30 July 2011",
    lat: 32.8866, lon: 13.1909, r: 4, period: "30 July 2011",
    relevance: "Al-Jamahiriya TV, the state broadcaster, said three journalists died when its Tripoli headquarters and two installations were hit.",
    text: "NATO said it disabled three state TV satellite dishes in Tripoli. Al-Jamahiriya reported three journalists killed and 15 to 21 wounded (the figures differ by source); NATO conceded no civilian casualties. The sources do not name the street or district, so the marker is a city-level position.",
    sources: [{ t: "Reporters Without Borders", u: "https://rsf.org/en/news/nato-attacks-national-tv-headquarters-and-installations-tripoli" }, { t: "Airwars: 30 July 2011", u: "https://airwars.org/incidents/lib2011-131-july-30-2011" }]
  },
  {
    id: 'as-nato-port', layer: 'airstrike', level: 'documented', y0: 2011, y1: 2011,
    name: "NATO strike on Tripoli port, May 2011",
    lat: 32.905, lon: 13.195, r: 0.6, period: "May 2011",
    relevance: "NATO jets hit Libyan navy ships at Tripoli's main port overnight.",
    text: "Reporters saw flames and smoke over a stricken warship; a port official said damage to the port itself was limited.",
    sources: [{ t: "NBC News: NATO bombs Gadhafi warships", u: "https://www.nbcnews.com/id/wbna43106115" }]
  },
  {
    id: 'as-2014-air', layer: 'airstrike', level: 'suspected', y0: 2014, y1: 2014,
    name: "Unidentified air raids around Tripoli, August 2014",
    lat: 32.6635, lon: 13.159, r: 4, period: "18\u201324 August 2014",
    relevance: "Raids on militia positions around the airport and south of the city; US officials said the UAE flew them from Egypt, which denied it.",
    text: "A Friday-night raid around the airport reportedly killed 13. On 23 August a second round hit rocket launchers, vehicles and a warehouse south of the city. Haftar's forces claimed some raids. Attribution is unconfirmed.",
    sources: [{ t: "Al Jazeera: Unidentified jets attack targets in Tripoli", u: "https://www.aljazeera.com/news/2014/8/24/unidentified-jets-attack-targets-in-tripoli" }, { t: "Al Jazeera: UAE behind air strikes in Libya", u: "https://www.aljazeera.com/news/2014/8/26/uae-behind-air-strikes-in-libya" }]
  },
  {
    id: 'bt-2014-airport', layer: 'battle', level: 'documented', y0: 2014, y1: 2014,
    name: "Tripoli airport destroyed, July 2014",
    lat: 32.6635, lon: 13.159, r: 1.5, period: "July\u2013August 2014",
    relevance: "Fighting between rival armed coalitions wrecked the international airport.",
    text: "Chronology entry for 13 July 2014; the airport profile covers its later history.",
    sources: [{ t: "Tripoli International Airport, Wikipedia", u: "https://en.wikipedia.org/wiki/Tripoli_International_Airport" }]
  },
  {
    id: 'bt-2018', layer: 'battle', level: 'documented', y0: 2018, y1: 2018,
    name: "Battle of Tripoli, 27 August\u201325 September 2018",
    lat: 32.8241, lon: 13.2201, r: 3, period: "27 Aug\u201325 Sep 2018",
    relevance: "Militias from Tarhuna and Tripoli fought in the southern suburbs until a ceasefire.",
    text: "Fighting began in Salah Eddine and Qasr bin Ghashir. The airport closed on 31 August after rocket damage, and 400 prisoners escaped from Ain Zara prison on 2 September.",
    sources: [{ t: "Battle of Tripoli (2018), Wikipedia", u: "https://en.wikipedia.org/wiki/Battle_of_Tripoli_(2018)" }]
  },
  {
    id: 'bt-2025', layer: 'battle', level: 'documented', y0: 2025, y1: 2025,
    name: "Tripoli clashes, from 12 May 2025",
    lat: 32.7984, lon: 13.2205, r: 6, period: "12\u201315 May 2025",
    relevance: "The killing of the Stability Support Apparatus commander at Tekbali camp set off fighting across the south and centre.",
    text: "Clashes between the 444th Brigade and the SSA followed; fighting was reported near Al Jadida prison, Ain Zara and the port. A ceasefire was announced on 14 May but gunfire continued. The marker is Tekbali camp; the fighting spread over many districts.",
    sources: [{ t: "2025 Tripoli clashes, Wikipedia", u: "https://en.wikipedia.org/wiki/2025_Tripoli_clashes" }]
  },
  {
    id: 'mk-yarmuk-2011', layer: 'massacre', level: 'documented', y0: 2011, y1: 2011,
    name: "Yarmuk warehouse killings, 23 August 2011",
    lat: 32.7764, lon: 13.2009, r: 1.2, period: "23 August 2011",
    relevance: "Detainees held in a warehouse beside the Yarmuk base were shot and grenaded as Tripoli fell.",
    text: "About 153 names were read at roll call. Human Rights Watch counted about 45 sets of remains and a survivor said about 20 escaped; Wikipedia's infobox says 124 killed. HRW attributes it to the Khamis Brigade. The marker is the Yarmuk camp profile; the warehouse stood next to the base.",
    sources: [{ t: "HRW: Evidence suggests Khamis Brigade killed 45 detainees", u: "https://www.hrw.org/news/2011/08/29/libya-evidence-suggests-khamis-brigade-killed-45-detainees" }, { t: "Yarmuk massacre, Wikipedia", u: "https://en.wikipedia.org/wiki/Yarmuk_massacre" }]
  },
  {
    id: 'mk-qasr-2011', layer: 'massacre', level: 'testimony', y0: 2011, y1: 2011,
    name: "Qasr bin Ghashir camp, 26 August 2011",
    lat: 32.69, lon: 13.18, r: 4, period: "26 August 2011",
    relevance: "Eyewitnesses said loyalists killed numerous detainees at a camp in the Tripoli area.",
    text: "Wikipedia, citing eyewitnesses, says grenades and gunfire were used on a large group of prisoners after about 160 escaped from a metal hangar. It names two camps, Khilit al-Ferjan and Qasr bin Ghashir. The marker is the Qasr bin Ghashir area.",
    sources: [{ t: "Battle of Tripoli (2011), Wikipedia", u: "https://en.wikipedia.org/wiki/Battle_of_Tripoli_(2011)" }]
  },
  {
    id: 'mk-tajoura-2019', layer: 'massacre', level: 'documented', y0: 2019, y1: 2019,
    name: "Tajoura detention centre air strike, 2 July 2019",
    lat: 32.8347, lon: 13.3847, r: 0.5, period: "2 July 2019",
    relevance: "An air strike on a migrant detention centre killed at least 53 people.",
    text: "The centre sits inside a complex that also housed a pro-GNA militia. The UN said the strike was probably flown by a state other than Libya; the LNA denied it. The UN Panel of Experts said LNA aircraft could not have delivered the munitions used.",
    sources: [{ t: "Tajoura migrant center airstrike, Wikipedia", u: "https://en.wikipedia.org/wiki/Tajoura_migrant_center_airstrike" }]
  },
  {
    id: 'mk-hadba-2020', layer: 'massacre', level: 'documented', y0: 2020, y1: 2020,
    name: "Military college air strike, 4 January 2020",
    lat: 32.839, lon: 13.2025, r: 0.5, period: "4 January 2020",
    relevance: "An air strike killed about 30 cadets on the parade ground at al-Hadba.",
    text: "Reported by Al Jazeera; the site is the Military College profile.",
    sources: [{ t: "Al Jazeera: Dozens killed in attack on military academy", u: "https://www.aljazeera.com/news/2020/1/5/dozens-killed-in-attack-on-military-academy-in-libyas-tripoli" }]
  },
  {
    id: 'bt-1980-embassies', layer: 'battle', level: 'documented', y0: 1980, y1: 1984,
    name: "Embassies sacked by mobs, 1980\u20131984",
    lat: 32.8772, lon: 13.2126, r: 3, period: "Feb 1980 \u00b7 Feb 1984 \u00b7 Apr 1984",
    relevance: "Crowds attacked the French embassy in 1980 and the Jordanian, Tunisian and French embassies in 1984, with police standing aside.",
    text: "FBIS reported demonstrators ransacking the French embassy on 4 February 1980; a CIA report says a mob burned the Jordanian embassy in February 1984 and Libyan-linked mobs sacked the Tunisian and French embassies that spring while the authorities did nothing. The sources give no street addresses; the marker is the Ben Ashour embassy district, where the French embassy stood in 1986.",
    sources: [{ t: "FBIS, 5 Feb 1980", u: "https://archive.org/details/micro_IA1176908_0539" }, { t: "FBIS, 21 Feb 1984", u: "https://archive.org/details/micro_IA1176909_0354" }, { t: "CIA reading room: Libyan involvement in terrorism", u: "https://www.cia.gov/readingroom/document/cia-rdp90t00114r000800810001-1" }]
  },
  {
    id: 'bt-1985-port-bomb', layer: 'battle', level: 'testimony', y0: 1985, y1: 1985,
    name: "Car bomb in the port area, September 1985",
    lat: 32.905, lon: 13.195, r: 1, period: "September 1985",
    relevance: "A CIA briefing note says a car bomb exploded in the Tripoli port area, possibly aimed at Qadhafi.",
    text: "The note, written in January 1986, mentions it in the middle of reports of arrests after the August 1985 coup attempt. It gives no casualties or exact place.",
    sources: [{ t: "CIA reading room: Qadhafi's domestic position (1986)", u: "https://www.cia.gov/readingroom/document/cia-rdp91b00874r000200080011-1" }]
  },
  {
    id: 'bt-1985-bab-shooting', layer: 'battle', level: 'testimony', y0: 1985, y1: 1985,
    name: "Reported attempt on Gaddafi at Bab al-Aziziya, November 1985",
    lat: 32.848, lon: 13.151, r: 0.8, period: "November 1985",
    relevance: "Western diplomats said an assassination attempt at the barracks ended in gunfire that killed a provincial governor.",
    text: "Reported in January 1986 by CIA files citing Western diplomats; the officer named is Col. Hassan Eshqal. Not confirmed by other sources here.",
    sources: [{ t: "CIA reading room: Officers feared by Qaddafi reportedly close", u: "https://www.cia.gov/readingroom/document/cia-rdp05-01559r000400470002-2" }]
  },
  {
    id: 'bt-2011-feb21', layer: 'battle', level: 'testimony', y0: 2011, y1: 2011,
    name: "Protesters try to storm Bab al-Aziziya, 21 February 2011",
    lat: 32.848, lon: 13.151, r: 1.5, period: "21 February 2011",
    relevance: "Activists said protesters tried to storm the compound and were driven back by heavy gunfire.",
    text: "Wikipedia's timeline also reports the People's Hall set on fire, the state television building smashed and a police station burned that day, and says activists claimed about 80 dead. These are reports, not confirmed counts.",
    sources: [{ t: "Timeline of the 2011 Libyan civil war before military intervention, Wikipedia", u: "https://en.wikipedia.org/wiki/Timeline_of_the_2011_Libyan_civil_war_before_military_intervention" }]
  },
  {
    id: 'bt-2012-abusalim', layer: 'battle', level: 'documented', y0: 2012, y1: 2012,
    name: "Zintan militia clashes with Abu Salim residents, 18 March 2012",
    lat: 32.8455, lon: 13.1712, r: 1.6, period: "18 March 2012",
    relevance: "A clash in the district that had stayed loyal to Gaddafi.",
    text: "Reported in Wikipedia's account of factional violence after the war; no casualty figures in the text used here.",
    sources: [{ t: "Factional violence in Libya (2011\u20132014), Wikipedia", u: "https://en.wikipedia.org/wiki/Factional_violence_in_Libya_(2011%E2%80%932014)" }]
  },
  {
    id: 'bt-2012-dahmani', layer: 'battle', level: 'documented', y0: 2012, y1: 2012,
    name: "Al-Shaab Al-Dahmani mosque and shrine bulldozed, 25 August 2012",
    lat: 32.8937, lon: 13.2075, r: 0.5, period: "25 August 2012",
    relevance: "Armed Salafists, including members of the security forces, demolished the shrine in daylight.",
    text: "Witnesses said police kept people back instead of stopping the demolition. The mosque stood in the Zawiyat al-Dahmani area of central Tripoli.",
    sources: [{ t: "Factional violence in Libya (2011\u20132014), Wikipedia", u: "https://en.wikipedia.org/wiki/Factional_violence_in_Libya_(2011%E2%80%932014)" }]
  },
  {
    id: 'bt-2019-abusalim', layer: 'battle', level: 'documented', y0: 2019, y1: 2019,
    name: "Rocket attacks on Abu Salim, 15\u201317 April 2019",
    lat: 32.8455, lon: 13.1712, r: 1.6, period: "15\u201317 April 2019",
    relevance: "Inaccurate rockets fell on three densely populated residential areas in and near Abu Salim.",
    text: "Amnesty International called them unlawful attacks that could amount to war crimes.",
    sources: [{ t: "Western Libya campaign, Wikipedia", u: "https://en.wikipedia.org/wiki/Western_Libya_campaign" }]
  },
  {
    id: 'bt-2019-yarmouk', layer: 'battle', level: 'documented', y0: 2019, y1: 2019,
    name: "Yarmouk camp changes hands, April\u2013May 2019",
    lat: 32.7764, lon: 13.2009, r: 0.9, period: "April\u2013May 2019",
    relevance: "The camp south of Tripoli passed between the GNA and the LNA at least five times in six weeks.",
    text: "Part of the 2019\u20132020 offensive on Tripoli, which ended in June 2020 when the LNA withdrew.",
    sources: [{ t: "Western Libya campaign, Wikipedia", u: "https://en.wikipedia.org/wiki/Western_Libya_campaign" }]
  },
  {
    id: 'bt-2023', layer: 'battle', level: 'documented', y0: 2023, y1: 2023,
    name: "Tripoli clashes, 14\u201315 August 2023",
    lat: 32.8075, lon: 13.287, r: 4, period: "14\u201315 August 2023",
    relevance: "The 444 Brigade fought the Al-Radaa force after the arrest of its commander at Mitiga airport.",
    text: "Fighting was reported in Ain Zara and near Mitiga airport and Tripoli University. The emergency medicine centre counted 27 dead and 106 wounded; flights were diverted to Misrata.",
    sources: [{ t: "The New Arab: Clashes in Libya capital kill 27", u: "https://www.newarab.com/news/clashes-libya-capital-tripoli-kill-27-wound-over-100" }]
  },
  {
    id: 'mk-sadr-1978', layer: 'massacre', level: 'suspected', y0: 1978, y1: 1978,
    name: "Reported execution at the Janzur firing range, 1978",
    lat: 32.8255, lon: 13.0263, r: 4, period: "September 1978 (reported)",
    relevance: "A 1979 FBIS report said Imam Musa al-Sadr and two companions were executed here; this is unproven.",
    text: "The report says the three were shot by an officer and four under-officers and that travel documents were falsified. It is a single report. No remains have been found, and the claim is not confirmed.",
    sources: [{ t: "FBIS, 7 Dec 1979", u: "https://archive.org/details/micro_IA1176908_0500" }]
  },
  {
    id: 'mk-suwani-1982', layer: 'massacre', level: 'testimony', y0: 1982, y1: 1982,
    name: "Four officers executed south of Tripoli, December 1982",
    lat: 32.7124, lon: 13.0672, r: 2.5, period: "December 1982",
    relevance: "Officers who tried an unreported coup were shot in a villa used by intelligence for interrogation and torture.",
    text: "The US translation service reports the executions took place at a cattle farm at Suwani bin Yadim, in a villa of the former King Idris. The marker is the Sawani area.",
    sources: [{ t: "JPRS Near East/North Africa Report No. 2701", u: "https://archive.org/details/jprs-report_jprs-82800" }]
  },
  {
    id: 'mk-gargaresh-2011', layer: 'massacre', level: 'documented', y0: 2011, y1: 2011,
    name: "Detainees shot and bodies dumped near Gharghour, August 2011",
    lat: 32.8535, lon: 13.161, r: 1.2, period: "21\u201326 August 2011",
    relevance: "Human Rights Watch found bodies of detainees at the Internal Security building and in a dry riverbed between Gharghour and Bab al-Aziziya.",
    text: "At least 17 detainees were shot around 21 August at the Internal Security building, and Human Rights Watch found 18 more bodies in the dry riverbed on 26 August, killed in the week before 25 August. HRW did not determine who was responsible. English Wikipedia attributes the 17 killings to the Khamis Brigade. The marker lies between the two places.",
    sources: [{ t: "Human Rights Watch, Gaddafi forces suspected of executing detainees (28 Aug 2011)", u: "https://www.hrw.org/news/2011/08/28/libya-gaddafi-forces-suspected-executing-detainees" }, { t: "Khamis Brigade, Wikipedia", u: "https://en.wikipedia.org/wiki/Khamis_Brigade" }]
  },
  {
    id: 'mk-janzour-2012', layer: 'massacre', level: 'testimony', y0: 2012, y1: 2012,
    name: "Tawergha camp raided, 6 February 2012",
    lat: 32.8162, lon: 12.9461, r: 2, period: "6 February 2012",
    relevance: "Seven black Libyan civilians from Tawergha were killed when militias raided their makeshift camp at the former naval academy.",
    text: "Survivors said the attackers seemed to be from Misrata because of their number plates; the Misrata militia denied it.",
    sources: [{ t: "Factional violence in Libya (2011\u20132014), Wikipedia", u: "https://en.wikipedia.org/wiki/Factional_violence_in_Libya_(2011%E2%80%932014)" }]
  },
  {
    id: 'mk-gharghour-2013', layer: 'massacre', level: 'documented', y0: 2013, y1: 2013,
    name: "Gharghour protest shooting, 15 November 2013",
    lat: 32.859, lon: 13.171, r: 0.6, period: "15 November 2013",
    relevance: "Misrata militias fired on unarmed protesters marching against militias.",
    text: "Human Rights Watch reports that the militias fired from three villas on Gharghour Street. The government said 43 died over the day and 460 were hurt. Security forces present apparently did not protect the marchers.",
    sources: [{ t: "HRW: Militias kill unarmed protesters", u: "https://hrw.org/news/2013/11/17/libya-militias-kill-unarmed-protesters" }]
  },
  {
    id: 'mk-corinthia-2015', layer: 'massacre', level: 'documented', y0: 2015, y1: 2015,
    name: "Corinthia Hotel attack, 27 January 2015",
    lat: 32.8972, lon: 13.1703, r: 0.2, period: "27 January 2015",
    relevance: "Gunmen killed ten people, five of them foreigners; a car bomb had injured six outside.",
    text: "A group calling itself Islamic State in Tripoli Province claimed it, saying it was to avenge Abu Anas al-Libi.",
    sources: [{ t: "Corinthia Hotel Tripoli, Wikipedia", u: "https://en.wikipedia.org/wiki/Corinthia_Hotel_Tripoli" }]
  },
  {
    id: 'as-nato-khamis', layer: 'airstrike', level: 'testimony', y0: 2011, y1: 2011,
    name: "NATO strike on Khamis Brigade headquarters, 18 April 2011",
    lat: 32.86, lon: 12.92, r: 8, period: "18 April 2011",
    relevance: "NATO aircraft reportedly destroyed the brigade's headquarters near Tripoli.",
    text: "Wikipedia says NATO sources said it was used to coordinate attacks on civilians, and elsewhere that the headquarters was 26 km west of Tripoli when rebels overran it on 21 August. The marker shows that distance and is only approximate.",
    sources: [{ t: "Khamis Brigade, Wikipedia", u: "https://en.wikipedia.org/wiki/Khamis_Brigade" }]
  },

  /* ---------- seats of power ---------- */
  {
    id: 'bab', layer: 'power', level: 'documented', y0: 1969, y1: 2011,
    name: 'Bab al-Aziziya compound', ar: 'باب العزيزية',
    lat: 32.848, lon: 13.151, r: 0.8, period: 'Throughout 1969–2011',
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
    id: 'mk-babcamp-2011', layer: 'massacre', level: 'documented', y0: 2011, y1: 2011,
    name: "Field clinic outside Bab al-Aziziya: 29 bodies, August 2011",
    lat: 32.848, lon: 13.151, r: 1.2, period: "August 2011",
    relevance: "Human Rights Watch found 29 bodies in and around a makeshift field clinic outside the compound, four of them on beds inside it.",
    text: "HRW did not determine who was responsible. Wikipedia's list of massacres had given at least 29 killed at a camp outside the compound; this is the same figure and the HRW report is the primary source.",
    sources: [{ t: "Human Rights Watch, Gaddafi forces suspected of executing detainees (28 Aug 2011)", u: "https://www.hrw.org/news/2011/08/28/libya-gaddafi-forces-suspected-executing-detainees" }, SRC.massList]
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
  { name: 'Police stations and checkpoints', when: '1969–2011', text: 'No published source maps Tripoli’s police posts or checkpoints for this period.' },
  { name: 'Military intelligence prison, Tripoli', when: '1984', text: 'A former detainee describes being held there after the May 1984 arrests. Its location is not given.', src: SRC.shareef },
  { name: 'Tripoli Central Prison', when: '1982–1984', text: 'An old prison, said to date from the Fascist period, where 21 people arrested in February 1982 were held without trial until 1984 and then moved to Abu Salim (Amnesty International, 1991; a 1980 JPRS translation of an exile appeal also names it). No source gives its address.', src: A91 },
  { name: 'Tripoli military prison', when: 'Late 1980', text: 'Amnesty International names it as the place a prisoner of conscience was moved to in late 1980, with family visits allowed once every three months. No source gives its address.', src: A91 },
  { name: 'Al-Ataba prison, Tripoli', when: 'June–July 1996', text: 'Amnesty International says Sudanese and other African workers were held here in 1996. No source gives its address.', src: A97 },
  { name: 'Tobacco-factory prison, Tripoli', when: '2011', text: 'Wikipedia says one of the most notorious hidden prisons of 2011 was set up in a tobacco factory in Tripoli, where inmates were reportedly given half a loaf of bread and a bottle of water a day. The Red Cross was denied access. No source gives its location.', src: { t: 'Libyan civil war (2011), Wikipedia', u: 'https://en.wikipedia.org/wiki/Libyan_civil_war_(2011)' } },
  { name: 'Al-Ruwaimi prison', when: 'After 2011', text: 'A Tripoli prison where 12 prisoners released by court order in June 2016 were found dead a day later (UNSMIL). It was among the sites the 444th Brigade took in May 2025. No source seen gives its coordinates or when it opened.', src: { t: '2025 Tripoli clashes, Wikipedia', u: 'https://en.wikipedia.org/wiki/2025_Tripoli_clashes' } },
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
