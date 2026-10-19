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
    text: "Built inside the Military Police Command compound to replace the colonial-era Black Horse prison. The first political prisoners arrived after the arrests that followed the May 1984 attack on Bab al-Aziziya. In March 1988, 426 of its 530 political prisoners were released in an amnesty, but many others stayed. More arrests of religious activists and suspected opponents followed in 1989 and 1990. Amnesty's 1997 report describes underground rooms beneath the administration building used for interrogation and torture. On 4 October 2006 security forces reportedly killed at least one prisoner and wounded at least nine during a disturbance. Human Rights Watch was allowed into the prison in April 2009. Testimony on tarikhi.org from the 1984 round-up: Othman Zirti was interrogated for 26 days at Abu Salim after handing himself in on 11 May and was hanged on 5 June; Maayouf Halasa, arrested at his home on 11 May, was held about three years, mostly here; Ausama Shwehdy says the prison was new and that he was among the first inmates; two brothers of Jamila Fallag, arrested after the raid, were held here for about four years. Amnesty's 1992 report says Revolutionary Committees arrested hundreds of suspected sympathisers after the 8 May 1984 attack, that most of those still held were believed to be at Abu Salim “on the outskirts of Tripoli”, that before 1986 some prisoners were denied medical care and in some cases allegedly died as a result, and that reported torture included beating the soles of the feet, hanging by the wrists, electric shocks, cigarette burns, mock executions and threats against relatives. Amnesty (1991) says family visits were banned for almost all political prisoners from the May 1984 clash until March 1988; that Fathi al-Sha'iri and Mahmud al-Shaltat, held since 1981, were reportedly sentenced to death in February 1985; that Hassan 'Ali Yahya Mu'ammar was summarily tried in 1987 and reportedly tortured here; that in June 1988 death sentences on four soldiers, including Mu'ammar, al-Shaltat, al-Sha'iri and Usama al-Sanussi Shalluf, were commuted; that about 63 of some 75 prisoners held from before March 1988 were believed to be here; and that at least 394 people were arrested between January 1989 and April 1990, with Rashid al-'Urfia and 'Umran al-Turbi still held without trial in February 1991. Abdelkader Tholthy's wife, Widad, told Tarikhi that after Gaddafi ordered the prison walls knocked down in April 1988 she made her first visit and saw the prisoners lined up against a wall. Salah Houni described being brought here from Benghazi in March 1990, standing blindfolded facing a wall for twelve hours, being beaten that night with sticks and cables, and then spending 21 months in a damp 2 x 3 metre cell; he says National Front members Jaballah Matar and Ezzat Magariaf, handed over from Cairo in March 1990, were in cell 7. Amnesty (1992) adds that Dr Muhammad Najib 'Ali al-Rajbani was held incommunicado from his 1984 arrest until family visits resumed in March 1988 and is believed to be held here, that at least 14 of the 1984 Tripoli-area detainees on its list were still held here after the March 1988 amnesty, and that Ahmad Barniya, tried and acquitted by the People's Court in November 1985, stayed in detention. Later facts from Amnesty, Human Rights Watch and the US State Department: Amnesty says writer Abdelnasser al-Rabbasi, arrested in January 2003 for an email to a newspaper, was serving 15 years here in 2009 and that two men returned from Guantanamo in 2006 and 2007 were held here with their legal status undisclosed. HRW, interviewing in April 2009, found al-Rabbasi here and says the Internal Security Agency runs both Abu Salim and Ain Zara for “security” detainees. The authorities appointed a judge to investigate the 1996 killings in September 2009, announced in October 2009 that the prison would be demolished (the families feared evidence would be destroyed), and on the night of 15 October 2009 released 45 members of the Libyan Islamic Fighting Group and 43 from other jihadist groups, while about 200 prisoners who had served their sentences or been acquitted stayed held on Internal Security orders. The State Department says 214 prisoners were released from Abu Salim on 24 March 2010 and 37 more on 31 August 2010, that Ain Zara and Abu Salim together held an estimated 400 to 500 prisoners at the end of 2010, and that the state security court was believed to sit inside Abu Salim in some cases. Amnesty's report also records a death in custody here in May 2009 (see the Killings layer). The State Department says the government released 86 Muslim Brotherhood prisoners held here on 2 March 2006. The World Organisation Against Torture says the state security court that sentenced eleven demonstration organisers on 10 June 2008 is reportedly located inside Abu Salim prison (see the unplaced entry on the February 2007 arrests).",
    sources: [SRC.wikiAbuSalim, SRC.hrsly, SRC.ai1992, { t: "Amnesty International, Libya: Gross human rights violations amid secrecy and isolation (1997)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190081997en.pdf" }, { t: "Amnesty International, Libya: investigation needed into prison deaths (2006)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/08/mde190062006en.pdf" }, { t: "Tarikhi: Dheiba Diaf Zirti", u: "https://tarikhi.org/interview/dheiba-diaf-zirti/" }, { t: "Tarikhi: Maayouf Halasa", u: "https://tarikhi.org/interview/maayouf-halasa/" }, { t: "Tarikhi: Ausama Shwehdy", u: "https://tarikhi.org/interview/ausama-shwehdy/" }, { t: "Tarikhi: Jamila Fallag", u: "https://tarikhi.org/interview/jamila-fallag/" }, { t: "Amnesty International, Libya: further information on political detention (1992)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190031992en.pdf" }, { t: "Amnesty International, MDE 19/002/1991: Libya, prisoner concerns after the legal reforms", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190021991en.pdf" }, { t: "Amnesty International, MDE 19/001/1991", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190011991en.pdf" }, { t: "Abdelkader Tholthy interview, Tarikhi", u: "https://tarikhi.org/interview/abdelkader-tholthy/" }, { t: "Salah Houni interview, Tarikhi", u: "https://tarikhi.org/interview/salah-houni/" }, { t: "Amnesty International, MDE 19/003/1992", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190031992en.pdf" }, { t: "Amnesty International Annual Report 2010: Libya", u: "https://www.amnestyusa.org/reports/annual-report-libya-2010/" }, { t: "Human Rights Watch, Libya: Free all unjustly detained prisoners (16 Oct 2009)", u: "https://www.hrw.org/news/2009/10/16/libya-free-all-unjustly-detained-prisoners" }, { t: "US State Department, 2010 Country Reports on Human Rights Practices: Libya (via Refworld)", u: "https://www.refworld.org/node/78703" }, { t: "US State Department, Country Reports on Human Rights Practices for 2006: Libya", u: "https://jewishvirtuallibrary.org/report-on-human-rights-practices-for-2006-libya" }, { t: "OMCT: eleven demonstration organisers sentenced in Libya (2008)", u: "https://www.omct.org/en/resources/urgent-interventions/follow-up-of-case-lby-031207-two-released-and-eleven-demonstration-organisers-sentenced" }]
  },
  {
    id: 'jdeida', layer: 'detention', level: 'documented', y0: 1979, y1: 2011,
    name: "Jdeida prison", ar: "سجن الجديدة",
    lat: 32.73, lon: 13.1, r: 3.5, period: "Named 1979\u20132009",
    relevance: "A civilian prison under the justice committee where political prisoners were held, and one of three Tripoli prisons Amnesty was allowed into in 2009.",
    text: "Amnesty reports a prisoner of conscience held in solitary confinement here in 1979, 24 students held incommunicado after sentencing in December 1995, and an Eritrean migrant beaten by a guard in January 2004. Amnesty's 1997 report puts it in the al-Farnaj area just outside Tripoli. Arabic Wikipedia says rebels freed 500 detainees from Jdeida prison during the fighting of 20–21 August 2011. Former detainees also describe transfer here after interrogation at the 7 April prison in Benghazi. The marker shows the Jdeida area only; the exact building is not documented in these sources. Amnesty says dissident Jamal al-Hajji, summoned by phone, went to the State Security Prosecution Office in Tripoli on 9 December 2009, called his wife at about noon to say he was being taken to Jdeida prison, and that his family had no contact afterwards and the authorities had not confirmed the arrest. He had earlier been sentenced to 12 years by the State Security Court in June 2008 and released in March 2009. Human Rights Watch says the State Security Court acquitted him in April 2010 of insulting judicial authorities and that he was freed after four months in prison. The World Organisation Against Torture says some of the eleven men arrested in February 2007 over a planned Tripoli demonstration were held before their June 2008 trial at “Aljadidah” prison, which I read as Jdeida, or at Ain Zara.",
    sources: [SRC.shareef, SRC.sahli, SRC.hrw2011, { t: "Arabic Wikipedia: Liberation of Tripoli (2011)", u: "https://ar.wikipedia.org/wiki/\u062a\u062d\u0631\u064a\u0631_\u0637\u0631\u0627\u0628\u0644\u0633_(2011)" }, { t: "Amnesty International, prisoner concerns in the light of recent legal reforms (1991)", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190021991en.pdf" }, { t: "Amnesty International, Libya: Gross human rights violations amid secrecy and isolation (1997)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190081997en.pdf" }, { t: "Amnesty International, Libya: Time to make human rights a reality (2004)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190022004en.pdf" }, { t: "Amnesty International, first fact-finding visit in over five years (May 2009)", u: "https://www.amnesty.org/zh-hant/wp-content/uploads/2021/07/mde190032009eng.pdf" }, { t: "Tarikhi: Ausama Shwehdy (moved to Jdeida prison, about 1983)", u: "https://tarikhi.org/interview/ausama-shwehdy/" }, { t: "Amnesty International, Libya: urgent action on Jamal al-Hajji (MDE 19/006/2009)", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190062009en.pdf" }, { t: "Human Rights Watch World Report 2011: Libya", u: "https://www.hrw.org/world-report/2011/country-chapters/libya" }, { t: "OMCT: eleven demonstration organisers sentenced in Libya (2008)", u: "https://www.omct.org/en/resources/urgent-interventions/follow-up-of-case-lby-031207-two-released-and-eleven-demonstration-organisers-sentenced" }]
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
    text: "Amnesty reports that dissident Fathi al-Jahmi was moved here from Abu Salim during its February 2004 visit, that another prisoner spent most of his detention here, and that a wing was believed to be under Internal Security Agency control. Amnesty delegates were given access to prisoners here in May 2009. Arabic Wikipedia says rebels freed thousands of prisoners from Ain Zara prison on 22 August 2011. No source found shows political detention here before 2004. Placed by suburb only. Human Rights Watch (October 2009) and the US State Department (2010) both say the Internal Security Agency controls Ain Zara and Abu Salim, where “security” detainees are held; the State Department says diplomats were denied access and that the two prisons held an estimated 400 to 500 prisoners at the end of 2010, with the Human Rights Society of Libya putting it at about 500. In 2010 the agency refused judicial orders to free prisoners. The World Organisation Against Torture says some of the eleven men arrested in February 2007 over a planned Tripoli demonstration were held here or at Jdeida before their June 2008 trial.",
    sources: [{ t: "Amnesty International, Libya: Time to make human rights a reality (2004)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190022004en.pdf" }, { t: "Amnesty International, first fact-finding visit in over five years (May 2009)", u: "https://www.amnesty.org/zh-hant/wp-content/uploads/2021/07/mde190032009eng.pdf" }, { t: 'USIP, Prisons and Detention in Libya', u: 'https://www.usip.org/sites/default/files/PW119-Prisons-and-Detention-in-Libya.pdf' }, SRC.hrw2011, { t: 'Arabic Wikipedia: Liberation of Tripoli (2011)', u: 'https://ar.wikipedia.org/wiki/تحرير_طرابلس_(2011)' }, { t: "Human Rights Watch, Libya: Free all unjustly detained prisoners (16 Oct 2009)", u: "https://www.hrw.org/news/2009/10/16/libya-free-all-unjustly-detained-prisoners" }, { t: "US State Department, 2010 Country Reports on Human Rights Practices: Libya (via Refworld)", u: "https://www.refworld.org/node/78703" }, { t: "Human Rights Watch World Report 2011: Libya", u: "https://www.hrw.org/world-report/2011/country-chapters/libya" }, { t: "OMCT: eleven demonstration organisers sentenced in Libya (2008)", u: "https://www.omct.org/en/resources/urgent-interventions/follow-up-of-case-lby-031207-two-released-and-eleven-demonstration-organisers-sentenced" }]
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
    lat: 32.78, lon: 13.16, r: 5, period: "Reported March 1980; students held 1982",
    relevance: "A Tripoli prison reported in 1980 to hold Tunisian recruits who refused to follow orders, with a second new intelligence prison 7 km from the city.",
    text: "A Cairo weekly (Akhir Sa'ah, 12 March 1980), translated by the US JPRS service, says refractory recruits were banished or held in the \"Black Horse\" prison on the Tripoli International Airport road, or in a new prison set up by Libyan intelligence 7 km from Tripoli. It rests on one unnamed eyewitness and comes from a press hostile to Gaddafi. Wikipedia says Abu Salim was built to replace Black Horse. The marker sits on the airport road; the exact spot is not known. Two later accounts on tarikhi.org place political prisoners here in 1982: a man arrested about a month after his final exams on a charge of a communist plot, who says three female students were among the first held; and a woman student who was held alone in a cell of about 180 by 180 cm in a prison “designed to create a lot of noise and instil fear”. Ali Akermi, sentenced in 1977, told the Tarikhi oral-history project he was held in the military police wing of Black Horse, where he describes about three months of interrogation with beatings by sticks and electric cables before a move to the civilian police wing; he does not give dates for each stage. Saleh Quosmy told Tarikhi that after his arrest on 30 April 1973 (during the wave that followed Gaddafi's 15 April 1973 Zuwara speech) he was interrogated for about three months in the military wing of the Black Horse prison, where guards beat detainees with plastic bricks, sticks and belts, then moved to the civilian police wing, where conditions were better and his family visited weekly; on 3 May 1980 he was returned to the military wing and lost family visits and access to newspapers, books, radio and television. On 30 September 1994 he was transferred to Abu Salim.",
    sources: [{ t: "JPRS Near East/North Africa Report No. 2124 (1980)", u: "https://archive.org/details/jprs-report_jprs-75801" }, SRC.wikiAbuSalim, { t: "Tarikhi: Ausama Shwehdy (held at Black Horse prison, Tripoli, 1982)", u: "https://tarikhi.org/interview/ausama-shwehdy/" }, { t: "Tarikhi: Jamila Fallag (held at Black Horse prison, 1982)", u: "https://tarikhi.org/interview/jamila-fallag/" }, { t: "Ali Akermi interview, Tarikhi", u: "https://tarikhi.org/interview/ali-akermi/" }, { t: "Tarikhi: Saleh Quosmy interview", u: "https://tarikhi.org/interview/saleh-quosmy/" }]
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
    text: "US F-111 aircraft bombed the compound. Eight craters were clustered near Gaddafi's home, tent and offices. Two of his sons were seriously wounded and an adopted daughter was reported killed. A US press report in CIA files says nine jets targeted the compound after US intelligence traced terrorist communications to it. MERIP notes that on 16 April, the day after the raid, Libyan officials gave an unconvincing explanation for an exchange of machine-gun fire at the compound, and that revolutionary committees set up checkpoints, checked identity cards and made arrests while many residents fled to the countryside. Wikipedia says Hanna's death is disputed: papers found after August 2011 suggested she survived and became a doctor in Tripoli. It also says a tour of the bombed house was part of the anniversary events in April 1987, and that Gaddafi later put up a monument of a fist crushing a US fighter jet. The Washington Times of 17 April 1986 reports that when the Libyan government bussed journalists to the compound that afternoon, soldiers ran out of the front gate and fired assault rifles as the bus approached, and that gunfire continued around the headquarters; officials denied it signalled factional fighting. The same report says there were unconfirmed claims of a mutiny at army barracks in Tarhuna and that Gaddafi had left Tripoli for Sabha, none of which was confirmed here.",
    sources: [SRC.usaf, SRC.merip, cia('cia-rdp91-00901r000500230008-3', 'Target Qaddafi (1987)'), cia('cia-rdp90-00965r000706870020-5', 'U.S. targeted Qaddafi compound after tracing terror message (1986)'), { t: "Bab al-Azizia, Wikipedia", u: "https://en.wikipedia.org/wiki/Bab_al-Azizia" }, { t: "1986 United States bombing of Libya, Wikipedia", u: "https://en.wikipedia.org/wiki/1986_United_States_bombing_of_Libya" }, cia("cia-rdp94b00280r000700170001-3", "Washington Times, 17 Apr 1986: Rival factions fighting in 2 locations in Libya")]
  },
  {
    id: 'as-benashour', layer: 'airstrike', level: 'documented', y0: 1986, y1: 1986,
    name: '1986 US strike: Ben Ashour homes', ar: 'بن عاشور',
    lat: 32.8772, lon: 13.2126, r: 1, period: '15 April 1986',
    relevance: "The raid's worst civilian damage: bombs fell on a crowded residential neighbourhood with many embassies.",
    text: "About ten apartment buildings were damaged. A bomb hit a building just behind the French embassy and killed a family, and the embassy itself was damaged. The bombs appear to have missed their intended target. A 1987 press report in CIA files says one F-111 mistakenly hit a residential area near the French embassy. Libyan Wanderer's collection of accounts adds that a bomb fell on the Meshergi (Msiherghi) family's villa, that another blast near the French embassy killed the Shirmit family's daughter, that a boy of fifteen living on Ben Ashour Street found his parents unconscious under dust and was told neighbours had died, and that a childhood friend of his brother was left paralysed after a wall fell on him; a Palestinian neighbour, Bassam Al Wifani, is said to have lost a daughter who died of fear. These are recollections, not a casualty list. Wikipedia's article says in one place that a stray bomb narrowly missed the French embassy and in a footnote that the embassy was hit. The Washington Times (17 April 1986, in CIA files) reported that the strikes also severely damaged a civilian neighbourhood of Tripoli and that Western diplomats said at least 100 people, and probably many more, were killed in Tripoli alone; this is an unverified early estimate and sits well above later figures. The CIA noted in June 1986 that the funeral procession in Tripoli for those killed drew only several thousand marchers in a city of about 900,000. Wikipedia's article on Tripoli gives the raid's toll as 45 Libyan military and government personnel and 15 civilians across Tripoli and Benghazi; figures in other accounts vary.",
    sources: [SRC.merip, SRC.binAshur, cia('cia-rdp90-00965r000403730006-2', 'Target Qaddafi (1987)'), { t: "35 years later: stories from Libyans during the US raid, Libyan Wanderer", u: "https://libyanwanderer.com/35-years-later-stories-from-libyans-during-the-us-raid-on-libya-1986/" }, { t: "1986 United States bombing of Libya, Wikipedia", u: "https://en.wikipedia.org/wiki/1986_United_States_bombing_of_Libya" }, cia("cia-rdp94b00280r000700170001-3", "Washington Times, 17 Apr 1986: Rival factions fighting in 2 locations in Libya"), cia("cia-rdp91b00874r000200140004-2", "Libya: Qadhafi’s political position since the airstrike (1986)"), { t: "Tripoli, Wikipedia (1986 raid toll)", u: "https://en.wikipedia.org/wiki/Tripoli,_Libya" }]
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
    text: "Wikipedia describes around 20 to 30 gunmen attacking the compound with rocket-propelled grenades and automatic weapons; Libyan forces repelled them and, per official accounts, killed all of them. CIA files give other figures: a 1986 press clipping says 12 men attacked and all 12 were killed, with some 2,000 people arrested afterwards; another report calls it a five-hour gun battle. The government later arrested up to 3,000 people and executed at least seven without trial (Wikipedia). Many of those held were taken to Abu Salim. The accounts differ on numbers. FBIS, quoting diplomatic sources in Tripoli the next day, says shooting was heard around the barracks for over four hours with 15 or 16 artillery explosions, and traffic resumed in the city between 1130 and 1230 GMT. A Libyan spokesman said the attackers had taken up positions in a building before being “liquidated” by the Revolutionary Committees. Libyan television had shown Ahmad Ahwas, killed near the Tunisian border two days earlier, as a wanted man. Afterwards people named by detainees or on lists were arrested; the tarikhi.org testimonies below describe men who handed themselves in on 11 May and were held at Abu Salim. Wikipedia adds that the attack began about 7 a.m., that troops forced the gunmen into a nearby three-storey building which military police surrounded, that fighting lasted until early afternoon, that state media said the attackers had taken women and children hostage before the building was stormed, and that on 12 May security forces killed the man named as the operation's leader in a shootout in Tripoli; the NFSL said seven people were hanged in their own neighbourhoods and up to 3,000 were arrested, while Western diplomats estimated about 200 arrests. Wikipedia's article on the National Front for the Salvation of Libya says the front was founded in Khartoum on 7 October 1981, ran a radio station and a commando training camp from Sudan until 1985, and took part in this attack; it says its leader, Ahmed Ibrahim Ihwas, was captured trying to enter Libya at the Tunisian border (Libyan television said he was killed). The same article says that according to various sources the front was supported by Saudi Arabia, and reports CIA support, citing Vandewalle (2006), Woodward (2005) and Nutter (1999). These are reports of outside backing; I have not seen a document that confirms them. A Washington Post column by Jack Anderson and Dale Van Atta (8 November 1985, filed in the CIA reading room) goes further than Wikipedia: it says the CIA trained and supported the National Front for the Salvation of Libya before, during and after the 8 May 1984 attempt, that the group was destroyed in a day-long battle less than a mile from the barracks, that its top military man had been captured near the Tunisian border two days earlier, and that its leader, Mohammed Youssef Magarieff, went ahead to show his CIA and Saudi backers what their $7 million in funding had bought. It is a newspaper column citing unnamed sources; I have not seen an official CIA document confirming the funding or training. A CIA assessment of May 1987 (Libyan opposition groups: much sound, little fury) calls it the only paramilitary operation the exiles have carried out inside Libya. It says the National Front for the Salvation of Libya infiltrated three commando teams of about 30 men in April 1984, that at least half were lost in the gunbattle with security forces, including its founder and leader of the Salvation Forces, Ahmad Ahwas, and that there were arrests and hangings of Berbers in the Jabal Nafusah afterwards. It assesses that the Front's cadre of trained commandos was then 50 to 80 and that the group was inactive.",
    sources: [SRC.wp1984, cia('cia-rdp90-00552r000505250009-7', 'Libyan military termed restive under Qaddafi (1986)'), cia('cia-rdp90-00965r000100120080-3', 'Five-hour gun battle at the Bab Aziziya barracks (CIA files)'), cia('cia-rdp90-00965r000100120021-8', 'Qaddafi rival spurns CIA overtures (1985)'), { t: "FBIS, 9 May 1984: attack on the Bab al-Aziziya barracks", u: "https://archive.org/details/micro_IA1176909_0413" }, { t: "Tarikhi: Dheiba Diaf Zirti, widow of a man hanged in June 1984", u: "https://tarikhi.org/interview/dheiba-diaf-zirti/" }, { t: "Tarikhi: Maayouf Halasa, arrested 11 May 1984", u: "https://tarikhi.org/interview/maayouf-halasa/" }, { t: "National Front for the Salvation of Libya, Wikipedia", u: "https://en.wikipedia.org/wiki/National_Front_for_the_Salvation_of_Libya" }, cia("cia-rdp90-00965r000706950014-3", "Washington Post (Anderson and Van Atta): Qaddafi rival spurns CIA overtures, 8 Nov 1985"), cia("cia-rdp88t00096r000600750001-4", "CIA: Libyan opposition groups, much sound, little fury (May 1987)")]
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
    text: "After prisoners protested about conditions, security forces killed an estimated 1,200 or more inmates in the prison courtyards. The government denied it for years. Families' protests over the killings helped spark the February 2011 uprising. One survivor's account, Anwar Haraga's, given to Al Jazeera in October 2011 and said to be corroborated by Human Rights Watch, dates the start to Friday 28 June 1996: at about 4:30 pm three inmates seized the keys from a guard delivering dinner and opened Blocks 3 to 6; the warden, Amr al-Masalati, threatened to shoot anyone who left a cell; Haraga says seven men were shot dead in the courtyards; intelligence chief Abdullah al-Senussi stopped the shooting, negotiated through an inmate, and demanded the seven dead and 120 seriously ill prisoners, who were taken away on buses and are presumed killed. Before dawn the prisoners from Blocks 1 and 2 were led into a walled courtyard between the political and military wings. At about 10:45 am explosions were heard, and a cook says guards threw at least one grenade from the roof; automatic fire lasted about two hours, followed by sporadic shots. Haraga says bodies were buried inside the prison. Around 1,700 men were held in the political wing and human rights groups say up to 1,200 were killed. Another prisoner, Saleh Quosmy, told Tarikhi that he had been moved to Abu Salim on 30 September 1994, was present in 1996 and puts the dead at 1,270. The US State Department says the Libyan Human Rights Solidarity group reported that 112 families had been told since 2001 that a relative died, without bodies or causes of death, and 238 had no confirmation; that authorities set up an inquiry committee in May 2005; and its 2010 report says around 800 families received death certificates without bodies or causes, that Muhammad Bashir al-Khadhar was appointed to head an inquiry in September 2009, and that families rejected an offer of 200,000 dinars each in return for dropping legal proceedings. Nobody has published the inquiry's findings. The dates given here are the survivor's; sources differ on 28 versus 29 June.",
    sources: [SRC.hrw1996, SRC.wikiAbuSalim, { t: "Al Jazeera: Libya survivor describes 1996 prison massacre (21 Oct 2011)", u: "https://www.aljazeera.com/features/2011/10/21/libya-survivor-describes-1996-prison-massacre/" }, { t: "Tarikhi: Saleh Quosmy interview", u: "https://tarikhi.org/interview/saleh-quosmy/" }, { t: "US State Department, Country Reports on Human Rights Practices for 2006: Libya", u: "https://jewishvirtuallibrary.org/report-on-human-rights-practices-for-2006-libya" }, { t: "US State Department, 2010 Country Reports on Human Rights Practices: Libya (via Refworld)", u: "https://www.refworld.org/node/78703" }]
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
    text: "About 153 names were read at roll call. Human Rights Watch counted about 45 sets of remains and a survivor said about 20 escaped; Wikipedia's infobox says 124 killed. HRW attributes it to the Khamis Brigade. Arabic Wikipedia says the killings took place in the warehouse of an agricultural association near the camp, and that victims' families count a second group held at a nearby Slovenian company site. The marker is the Yarmuk camp profile; the warehouse stood next to the base.",
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
    lat: 32.8772, lon: 13.2126, r: 3, period: "Feb 1980 \u00b7 Jun 1980 \u00b7 Nov 1983 \u00b7 Feb\u2013Apr 1984",
    relevance: "Crowds attacked the French embassy in 1980 and the Jordanian, Tunisian and French embassies in 1984, with police standing aside.",
    text: "FBIS reported demonstrators ransacking the French embassy on 4 February 1980; a CIA report says a mob burned the Jordanian embassy in February 1984 and Libyan-linked mobs sacked the Tunisian and French embassies that spring while the authorities did nothing. The sources give no street addresses; the marker is the Ben Ashour embassy district, where the French embassy stood in 1986. More detail from the same files: on 4 February 1980 a Tunisian embassy was also attacked as the French embassy was ransacked, and the French embassy was later rebuilt by the Libyan authorities; a firebomb was thrown into the British embassy on the night of 13 June 1980 (Press Association via FBIS); on 20 November 1983 demonstrators marched towards the French embassy; on 18 February 1984 Libyan radio described an “angry demonstration” by Palestinians and other Arabs at the Jordanian embassy in which a Jordanian flag was burned, and Jordan cut relations four days later; and in March 1984 students demonstrated at the British embassy in Tripoli, calling Libyan exiles in Britain “stray dogs” (Washington Post, 23 April 1984). The embassies' addresses in those years are not given. After Britain broke off relations in April 1984, the British embassy in Tripoli was evacuated and then ransacked, and the few remaining British diplomats moved into the Italian embassy (Wikipedia).",
    sources: [{ t: "FBIS, 5 Feb 1980", u: "https://archive.org/details/micro_IA1176908_0539" }, { t: "FBIS, 21 Feb 1984", u: "https://archive.org/details/micro_IA1176909_0354" }, { t: "CIA reading room: Libyan involvement in terrorism", u: "https://www.cia.gov/readingroom/document/cia-rdp90t00114r000800810001-1" }, { t: "FBIS, 16 Jun 1980: UK embassy in Tripoli firebombed 13 June", u: "https://archive.org/details/micro_IA1176908_0673" }, { t: "JPRS Near East/North Africa Report No. 2712 (1983): French embassy rebuilt after 4 Feb 1980", u: "https://archive.org/details/jprs-report_jprs-82924" }, { t: "FBIS, 21 Nov 1983: demonstrators head for the French embassy", u: "https://archive.org/details/micro_IA1176909_0289" }, { t: "FBIS, 24 Feb 1984: Jordan severs ties after the embassy demonstration", u: "https://archive.org/details/micro_IA1176909_0357" }, cia('cia-rdp90-00965r000807600015-8', 'Washington Post, 23 Apr 1984: Hangings in Tripoli (March student demonstration at the British embassy)'), { t: "1984 Libyan hostage incident, Wikipedia (British embassy ransacked)", u: "https://en.wikipedia.org/wiki/1984_Libyan_hostage_incident" }]
  },
  {
    id: 'bt-1985-port-bomb', layer: 'battle', level: 'testimony', y0: 1985, y1: 1985,
    name: "Car bomb near the Tripoli fair, 14 September 1985",
    lat: 32.905, lon: 13.195, r: 1, period: "14 September 1985",
    relevance: "A car bomb went off near an economic fair that Gaddafi was reportedly due to attend; the CIA read it as a possible attempt on his life.",
    text: "A CIA terrorism review of October 1985 says a car bomb exploded on 14 September near the site of an economic fair in Tripoli and destroyed a warehouse. Gaddafi was reportedly scheduled to attend the fair. Security in Tripoli was tightened afterwards, with nightly manhunts and car searches. No one claimed it; the CIA judged that Libyan exiles or disaffected soldiers were probably responsible. A separate CIA note of January 1986 mentions a car bomb in the port area among reports of arrests after the August 1985 coup attempt; this is probably the same blast, but neither document gives casualties or an exact place. A CIA talking-points paper of 14 January 1986 lists the port-area car bomb among reports of rising violence, says it may have been aimed at Gaddafi, and adds that there was at least one attempt to assassinate him early in 1985; it also says scores of officers were arrested in March 1985 after the discovery of the first organised coup plot in two years, with more arrests in September.",
    sources: [cia('05632817', 'Terrorism Review, 7 October 1985'), { t: "CIA reading room: Qadhafi's domestic position (1986)", u: "https://www.cia.gov/readingroom/document/cia-rdp91b00874r000200080011-1" }]
  },
  {
    id: 'bt-1985-bab-shooting', layer: 'battle', level: 'testimony', y0: 1985, y1: 1985,
    name: "Reported attempt on Gaddafi at Bab al-Aziziya, November 1985",
    lat: 32.848, lon: 13.151, r: 0.8, period: "November 1985",
    relevance: "Western diplomats said an assassination attempt at the barracks ended in gunfire that killed a provincial governor.",
    text: "Reported in January 1986 by CIA files citing Western diplomats; the officer named is Col. Hassan Eshqal. Not confirmed by other sources here. Wikipedia's article on Gaddafi says Colonel Hassan Ishkal (Eshqal), head of the Sirte military region and described as the third most powerful man in Libya, died in a suspicious car accident in November 1985, and that the death was attributed to Jalloud, Khalifa Hunaysh or Gaddafi; it does not mention a shooting at Bab al-Aziziya, so the two reports are not clearly the same event.",
    sources: [{ t: "CIA reading room: Officers feared by Qaddafi reportedly close", u: "https://www.cia.gov/readingroom/document/cia-rdp05-01559r000400470002-2" }, { t: "Muammar Gaddafi, Wikipedia (Hassan Ishkal)", u: "https://en.wikipedia.org/wiki/Muammar_Gaddafi" }]
  },
  {
    id: 'bt-2011-feb21', layer: 'massacre', level: 'testimony', y0: 2011, y1: 2011,
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
    text: "Grew from the Tripoli faculties of the University of Libya (Science 1957), became the University of Tripoli in 1973 and was renamed Al-Fateh University in 1976 after the “Al-Fateh” (1 September) revolution. Key events: on 7 April 1976 police and regime loyalists attacked students protesting military control and demanding elections, and many were jailed; Gaddafi reportedly called the anniversary the “Day of Judgement”, and the military tribunal that sentenced students hanged in Benghazi in 1977 sat in Tripoli; in April 1984 student Rashid Kaabar was hanged at the Faculty of Pharmacy while students were made to watch; Revolutionary Committees policed campus life through the 1980s; in 1989 security forces arrested religious students here (Amnesty International). Libya's news agency reported on 12 April 1976 that a central revolutionary committee had been formed at the university the day before to purge students and teaching staff of “remnants of the reactionary right” (FBIS report in CIA files). An exile-sourced article translated by the US government in 1982 claimed that more than 400 students and faculty had been arrested in Tripoli and Benghazi that April; this is unconfirmed. In August 2011 students rose against the regime during the Battle of Tripoli, and the name University of Tripoli returned. Its teaching hospitals include Tripoli Medical Center. Wikipedia's article on the 1984 attack says the university's main auditorium was set on fire in retaliation for the April 1984 hangings; it gives no date or perpetrator, so this is not confirmed. Amnesty (1991) says religious students demonstrated here on 9 January 1989 and that Sheikh Yusuf Muhammad Hussein, a student, was reportedly arrested on 10 January.",
    sources: [cia('cia-rdp05-01559r000400370055-5', 'FBIS: purge committee formed at Al-Fatih University, 12 April 1976'), { t: 'JPRS Near East/North Africa Report No. 2669 (1982)', u: 'https://archive.org/details/ufiche-test-document_jprs-82358' }, SRC.sahli, SRC.ai1992, { t: 'University of Tripoli, Wikipedia', u: 'https://en.wikipedia.org/wiki/University_of_Tripoli' }, { t: '1976 Libyan protests, Wikipedia', u: 'https://en.wikipedia.org/wiki/1976_Libyan_protests' }, { t: 'Human rights in Libya under Muammar Gaddafi, Wikipedia', u: 'https://en.wikipedia.org/wiki/Human_rights_in_Libya_under_Muammar_Gaddafi' }, { t: "1984 Libyan coup attempt, Wikipedia (auditorium fire)", u: "https://en.wikipedia.org/wiki/1984_Libyan_coup_attempt" }, { t: "Amnesty International, MDE 19/002/1991: Libya, prisoner concerns after the legal reforms", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190021991en.pdf" }]
  },
  {
    id: 'mk-jan1976', layer: 'massacre', level: 'testimony', y0: 1976, y1: 1976,
    name: 'Student protests and arrests, January 1976', ar: 'مظاهرات الطلبة واعتقالات يناير 1976',
    lat: 32.8562, lon: 13.2250, r: 1, period: '6–7 January 1976',
    relevance: "Three months before 7 April 1976: the first wave of protests at the Tripoli faculties and the first arrests of student leaders.",
    text: "When news spread that Republican Guard forces had fired on student marchers in Benghazi, killing one, protests broke out on 6 January 1976 across the faculties of Tripoli and some schools and institutes. The government sent out pro-regime marches the same day, whose members made clear they were ready for armed confrontation, and the security police arrested leaders of the student movement. Tripoli students then held a sit-in at the public prosecutor's office demanding that those who had fired on demonstrators be tried. Two of the student leaders were hanged on 7 April 1977. The account is from Arabic Wikipedia's history of modern Libya; the marker is the university, as the faculties involved are not named.",
    sources: [{ t: 'Contemporary history of Libya, Arabic Wikipedia', u: 'https://ar.wikipedia.org/wiki/%D8%AA%D8%A7%D8%B1%D9%8A%D8%AE_%D9%84%D9%8A%D8%A8%D9%8A%D8%A7_%D8%A7%D9%84%D9%85%D8%B9%D8%A7%D8%B5%D8%B1' }]
  },
  {
    id: 'mk-april1976', layer: 'massacre', level: 'testimony', y0: 1976, y1: 1976,
    name: '7 April 1976 crackdown on students', ar: 'قمع الطلاب في 7 أبريل 1976',
    lat: 32.8553, lon: 13.2236, r: 0.6, period: '7 April 1976',
    relevance: "The attack on student protesters that made 7 April a date of repression, later marked as the “Day of Judgement”.",
    text: "Students at the universities in Tripoli and Benghazi protested against military control of campus life and called for free elections. Police and regime loyalists attacked them, and many students were detained for months. No reliable death toll has been published for Tripoli. A British correspondent wrote in May 1976 that in Tripoli pro-government students attacked others who had not joined a march for the Revolutionary Command Council, that police broke up the fighting brutally, and that Prime Minister Jalloud came in person, drew his revolver and fired in the air. A year later, on 7 April 1977, students sentenced by a military tribunal in Tripoli were hanged in public in Benghazi. Account of the Tripoli attack: a former student (Tarikhi interview) and Wikipedia.",
    sources: [cia('cia-rdp05-01559r000400370064-5', 'British correspondent interviews al-Qadhdhafi, May 1976'), SRC.sahli, { t: '1976 Libyan protests, Wikipedia', u: 'https://en.wikipedia.org/wiki/1976_Libyan_protests' }, { t: 'Human rights in Libya under Muammar Gaddafi, Wikipedia', u: 'https://en.wikipedia.org/wiki/Human_rights_in_Libya_under_Muammar_Gaddafi' }]
  },
  {
    id: 'mk-hang-1983-eng', layer: 'massacre', level: 'testimony', y0: 1983, y1: 1983,
    name: 'Student hanged at the Faculty of Engineering, 7 April 1983', ar: 'إعدام محمد حفاف في كلية الهندسة',
    lat: 32.8548, lon: 13.2245, r: 0.5, period: '7 April 1983',
    relevance: "A student held for ten years was hanged on campus on the 7 April anniversary.",
    text: "Mohammed Mohammed Haffaf was arrested in April 1973, accused of belonging to the Islamic Liberation Party without sufficient evidence. Ten years later, on 7 April 1983, he was hanged at the Faculty of Engineering in Tripoli. The account comes from the list of executions on Arabic Wikipedia; the exact spot on campus is not given, so the marker is the university.",
    sources: [{ t: 'Human rights violations under Gaddafi, Arabic Wikipedia (list of executions)', u: 'https://ar.wikipedia.org/wiki/%D8%A7%D9%86%D8%AA%D9%87%D8%A7%D9%83%D8%A7%D8%AA_%D8%AD%D9%82%D9%88%D9%82_%D8%A7%D9%84%D8%A5%D9%86%D8%B3%D8%A7%D9%86_%D9%81%D9%8A_%D8%B9%D9%87%D8%AF_%D8%A7%D9%84%D9%82%D8%B0%D8%A7%D9%81%D9%8A' }]
  },
  {
    id: 'mk-hang-1984-agri', layer: 'massacre', level: 'testimony', y0: 1984, y1: 1984,
    name: 'Student hanged at the Faculty of Agriculture, 16 April 1984', ar: 'إعدام حافظ المدني في كلية الزراعة',
    lat: 32.8538, lon: 13.2290, r: 0.6, period: '16 April 1984',
    relevance: "A second student hanged on the University of Tripoli campus on the same day as Rashid Kaabar.",
    text: "Hafez al-Madani had been arrested after unrest at the Faculty of Engineering in November 1980. He was hanged at the Faculty of Agriculture in Tripoli on 16 April 1984, according to the list of executions on Arabic Wikipedia. The marker is the university; the faculty's exact position is approximate. The Washington Post reporter was shown the Agriculture Square on campus, where a fourth-year engineering student said the second gallows had stood.",
    sources: [{ t: 'Human rights violations under Gaddafi, Arabic Wikipedia (list of executions)', u: 'https://ar.wikipedia.org/wiki/%D8%A7%D9%86%D8%AA%D9%87%D8%A7%D9%83%D8%A7%D8%AA_%D8%AD%D9%82%D9%88%D9%82_%D8%A7%D9%84%D8%A5%D9%86%D8%B3%D8%A7%D9%86_%D9%81%D9%8A_%D8%B9%D9%87%D8%AF_%D8%A7%D9%84%D9%82%D8%B0%D8%A7%D9%81%D9%8A' }, cia('cia-rdp90-00965r000807600015-8', 'Washington Post, 23 Apr 1984: Hangings in Tripoli focus attention on Libyan dissent')]
  },
  {
    id: 'mk-hang-1984', layer: 'massacre', level: 'testimony', y0: 1984, y1: 1984,
    name: 'University of Tripoli hanging, April 1984', ar: 'إعدام طالب في جامعة الفاتح',
    lat: 32.8558, lon: 13.2213, r: 0.4, period: 'April 1984 (probably 16 April)',
    relevance: "A public hanging of a student on campus, with other students forced to watch, during the April 1984 wave of executions.",
    text: "Student Rashid Mansour Kaabar was hanged at the Faculty of Pharmacy, University of Tripoli (then Al-Fateh University). Another student, Mustafa al-Nuwairi, was hanged at Benghazi University the same month. A Washington Post report of 22 April 1984 speaks of two students hanged on Monday for treason, which probably means 16 April. The date is not 7 April. Accounts rest on newspapers and exile sources; the exact venue on campus is from a single account. A fuller copy of the Washington Post report from Tripoli (23 April 1984, held in the CIA reading room) says the Student Revolutionary Committee announced the hangings a week earlier, that thousands of students (estimates ran from 3,000 to 18,000) demonstrated in support on Sunday 15 April, and that on Monday gallows were put up, one beside a 10-by-20-foot portrait of Gaddafi at the university entrance. Two students in their twenties were hanged before thousands; some students vomited and ran off shrieking. Officials said the two had been tried by the student committee two to four years earlier and that these were the first executions at Tripoli University; an official put the April total of public hangings at 10, against a rumour of 23.",
    sources: [{ t: 'Washington Post, 22 Apr 1984: Libya hanged 2 students Monday for treason', u: 'https://www.washingtonpost.com/archive/politics/1984/04/22/libya-hanged-2-students-monday-for-treason/f639373f-d89a-4259-bd91-11ffbfbc2fab/' }, { t: 'Asharq Al-Awsat on the 7 April hangings', u: 'https://aawsat.com/node/4263251' }, cia('cia-rdp90-00965r000807600015-8', 'Washington Post, 23 Apr 1984: Hangings in Tripoli focus attention on Libyan dissent'), cia('cia-rdp90-00965r000807600013-0', 'Washington Post, 29 Apr 1984: Qaddafi’s authority said to be weakening')]
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
  },
  {
    id: 'mk-daghis-1980', layer: 'massacre', level: 'testimony', y0: 1980, y1: 1980,
    name: 'Lawyer Amir al-Daghis dies after his arrest, February 1980', ar: 'وفاة المحامي عامر الدغيس بعد اعتقاله، فبراير 1980',
    lat: 32.8480, lon: 13.1510, r: 0.8, period: '24–28 February 1980',
    relevance: "A Tripoli-born lawyer and former Ba'th Party leader was arrested at home and was dead within days; the authorities said he had killed himself.",
    text: "Two exile statements printed in London in March 1980 (translated by the US JPRS service) say Amir al-Tahir al-Daghis, a lawyer born in Tripoli in 1933 and a founder of the Libyan Ba'th Party, was arrested at his home in Tripoli on Sunday 24 February 1980 on the orders of the head of the security forces. One statement says he was taken to the “al-Aziziyah camp” and interrogated there, then tortured, and died on 27 February; the other says his body was handed to his family in a sealed box, they were allowed to see only his face, he was buried on 28 February, and the authorities said he had committed suicide in prison. The two statements are from opposition groups; no independent account is in our files. A report of September 1980 describes a funeral procession in Tripoli of an unnamed well-known Libyan who died under torture in “Tripoli Prison” and calls it a public protest; it may refer to this case, but it does not say so. The marker is the Bab al-Aziziya compound, the only place the statements name.",
    sources: [{ t: 'JPRS Near East/North Africa Report No. 2153 (23 Jul 1980): statements on the death of Amir al-Daghis', u: 'https://archive.org/details/jprs-report_jprs-76102' }, { t: 'JPRS Near East/North Africa Report No. 2185 (22 Sep 1980): funeral procession for a man who died under torture', u: 'https://archive.org/details/jprs-report_jprs-76460' }]
  },
  {
    id: 'mk-zirti-1984', layer: 'massacre', level: 'testimony', y0: 1984, y1: 1984,
    name: 'Othman Zirti hanged in public after the May 1984 raid, 5 June 1984', ar: 'إعدام عثمان علي زرتي شنقاً بعد هجوم باب العزيزية، يونيو 1984',
    lat: 32.8834, lon: 13.2571, r: 1.5, period: '5 June 1984',
    relevance: "A member of the National Front for the Salvation of Libya, born in Souq al-Juma, was hanged in a public square weeks after the attack on Bab al-Aziziya; his family's house was bulldozed.",
    text: "His widow, Dheiba Diaf, told the tarikhi.org oral-history project that Othman Ali Zirti (born 1934 in Souq al-Juma) was a member of the National Front for the Salvation of Libya whose name was reportedly on a list found on an NFSL leader killed after the 8 May raid. He hid at a cousin's house, handed himself in on 11 May, was interrogated for 26 days at Abu Salim, sentenced on 25 May and hanged on 5 June 1984 “in the public square surrounded by hordes of jeering men”; their youngest son watched it on television. The family was given an hour's notice before their house was bulldozed, a tent funeral was banned, a son was held for about a year and a half, and a son-in-law was jailed for seventeen years. The square is not named; her account places the hanging in the area where he was born, so the marker covers the Souq al-Juma district. Libyan radio announced the hanging that month of another man, Muhammad ash-Shabani, as a Muslim Brotherhood agent, and the same account says eight men were executed in several towns in June. Amnesty International's 1992 report on political detention in Libya independently lists his nephew, al-Sadiq Ahmad Zarti, as arrested in Tripoli in May 1984 and held at Abu Salim, and says his uncle 'Uthman 'Ali Zarti was executed, though it does not name the place.",
    sources: [{ t: 'Tarikhi: Dheiba Diaf Zirti', u: 'https://tarikhi.org/interview/dheiba-diaf-zirti/' }, { t: 'Tarikhi: Maayouf Halasa (men hanged live on television during Ramadan)', u: 'https://tarikhi.org/interview/maayouf-halasa/' }, { t: 'FBIS, 5 Jun 1984: hanging announced by Tripoli radio', u: 'https://archive.org/details/micro_IA1176909_0432' }, { t: "Amnesty International, Libya: further information on political detention (1992)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190031992en.pdf" }]
  },
  {
    id: "bt-2011-fateh", layer: "battle", level: "documented", y0: 2011, y1: 2011,
    name: "Students seize Al-Fateh University overnight, 20–21 August 2011", ar: "طلاب جامعة الفاتح يسيطرون على الجامعة ليلاً، 20–21 أغسطس 2011",
    lat: 32.85415, lon: 13.22753, r: 0.5, period: "Night of 20–21 August 2011",
    relevance: "Students inside the campus rose against the armed guards on the first night of the uprising.",
    text: "Wikipedia's account says students of Fateh University who sympathised with the rebellion rose up against the armed guards patrolling the perimeter and the snipers in taller buildings, and took control of the university during the night. It gives no casualty figures. The marker is the university as drawn in OpenStreetMap.",
    sources: [{ t: "Battle of Tripoli (2011), Wikipedia", u: "https://en.wikipedia.org/wiki/Battle_of_Tripoli_(2011)" }]
  },
  {
    id: "bt-2011-janzour", layer: "battle", level: "documented", y0: 2011, y1: 2011,
    name: "Rebels enter Tripoli through Janzour, 20–21 August 2011", ar: "دخول الثوار طرابلس عبر جنزور، 20–21 أغسطس 2011",
    lat: 32.8255, lon: 13.0263, r: 2, period: "20–21 August 2011",
    relevance: "The western column from Zawiya reached the city by this road.",
    text: "Wikipedia says rebels advancing east from Zawiya took Joudaim, then Al Maya just west of Tripoli, and the headquarters of the Khamis Brigade just outside the city, meeting only light resistance. Shortly after taking Janzur, rebels of the Tripoli Brigade took the Gheryan bridge, described as the western entrance to Tripoli proper. The point is the town of Janzour; the other places named are further west and are not marked.",
    sources: [{ t: "Battle of Tripoli (2011), Wikipedia", u: "https://en.wikipedia.org/wiki/Battle_of_Tripoli_(2011)" }]
  },
  {
    id: "bt-2011-west", layer: "battle", level: "documented", y0: 2011, y1: 2011,
    name: "Rebels clear Syhia, Hay al-Andalus and Gergarish, 21 August 2011", ar: "الثوار يطهّرون السياحية وحي الأندلس وقرقارش، 21 أغسطس 2011",
    lat: 32.87, lon: 13.12, r: 1.6, period: "21 August 2011",
    relevance: "Western neighbourhoods fell to the Tripoli Brigade within hours of the Gheryan bridge.",
    text: "Wikipedia says that after the Gheryan bridge the Tripoli Brigade entered the Syhia district and began clearing it, took the Hay al-Andalus area shortly after, and immediately advanced into the Gergarish area of central Tripoli. On the same day the same article reports boats from Misrata and Zliten landing rebels and arms in the early morning, and the Libyana telephone company building being taken. The marker sits between Hay al-Andalus and Gargaresh.",
    sources: [{ t: "Battle of Tripoli (2011), Wikipedia", u: "https://en.wikipedia.org/wiki/Battle_of_Tripoli_(2011)" }]
  },
  {
    id: "bt-2011-rixos", layer: "battle", level: "documented", y0: 2011, y1: 2011,
    name: "Rixos Al Nasr hotel: loyalist stronghold, 21–24 August 2011", ar: "فندق ريكسوس النصر، 21–24 أغسطس 2011",
    lat: 32.8601, lon: 13.1935, r: 0.3, period: "21–24 August 2011",
    relevance: "Foreign journalists were kept inside while loyalists held the hotel and fighting raged around it.",
    text: "Wikipedia's account says loyalist forces were known on 22 August to hold Bab al-Aziziya, the Rixos Al Nasr hotel, a hospital in Tajura and part of the port; that heavy fighting continued around the hotel on 22 August and journalists were not allowed to leave and were described as being used as a human shield; that early on 23 August Saif al-Islam Gaddafi appeared at the hotel and offered reporters a tour of loyalist-held areas, which showed he was not in rebel custody; that there was fighting in the hotel area on 24 August with snipers and dwindling food; and that at about 5 pm on 24 August all foreign reporters and staff left in four Red Cross vans. The marker is the hotel's building outline in OpenStreetMap (way 376444830). The same hotel was fought over again in 2016 and 2017.",
    sources: [{ t: "Battle of Tripoli (2011), Wikipedia", u: "https://en.wikipedia.org/wiki/Battle_of_Tripoli_(2011)" }, { t: "OpenStreetMap way 376444830 (RIXOS Hotel)", u: "https://www.openstreetmap.org/way/376444830" }]
  },
  {
    id: "bt-2011-salaheddin", layer: "battle", level: "documented", y0: 2011, y1: 2011,
    name: "Salaheddin base falls, the last loyalist base in Tripoli, late August 2011", ar: "سقوط معسكر صلاح الدين، أواخر أغسطس 2011",
    lat: 32.8241, lon: 13.2201, r: 1.6, period: "Late August 2011",
    relevance: "The final action of the battle, in the southern suburb.",
    text: "Wikipedia says that in the final actions of the battle, forces of the National Liberation Army attacked the last remaining loyalist base, in Salaheddin, a suburb about 5 km south of Tripoli, and took it after seven hours of fighting. It gives no casualty figures here. The same suburb was fought over again in 2017 and 2018.",
    sources: [{ t: "Battle of Tripoli (2011), Wikipedia", u: "https://en.wikipedia.org/wiki/Battle_of_Tripoli_(2011)" }]
  },
  {
    id: "bt-2016-rixos", layer: "battle", level: "documented", y0: 2016, y1: 2017,
    name: "Rixos hotel: Ghwell seizes it, then is driven out, 2016–2017", ar: "فندق ريكسوس: سيطرة الغويل ثم طرده، 2016–2017",
    lat: 32.8601, lon: 13.1935, r: 0.8, period: "14 Oct 2016 – 16 Mar 2017",
    relevance: "Rival governments and militias fought for the compound that housed the High Council of State.",
    text: "Wikipedia's list of western Libya clashes says that on 14–17 October 2016 supporters of Khalifa al-Ghwell's National Salvation Government took the Rixos hotel compound and the Government Palace, and the unity government's forces pulled back from the hotel without violence; on 16 October at least one woman was killed and six wounded, one a child, in Fallah near the airport road. On 1–2 December 2016 pro-unity-government and pro-Ghwell militias fought around the Rixos and Al-Nasr Park (Bab Benghashir), leaving eight dead including civilians and more than 20 wounded, with a ceasefire the next day. On 13–16 March 2017 fighting spread from Hay al-Andalus and Gurji toward the centre; militias including the Tripoli Revolutionaries Brigade, led by Haithem Tajouri, and Abdul Ghani al-Kikli's Abu Salim force retook the compound, and a ceasefire brokered by the Presidential Council on 15 March was rejected by two of the militias the next day. Libya Analysis reports Ghwell was reportedly injured. I read these in Wikipedia's summary and in Libya Analysis; I did not open the original news reports it cites.",
    sources: [{ t: "Western Libya clashes (2016–2018), Wikipedia", u: "https://en.wikipedia.org/wiki/Western_Libya_clashes_(2016%E2%80%932018)" }, { t: "Libya Analysis: Fragile ceasefire in Tripoli as Ghwell ousted from Rixos (March 2017)", u: "https://libya-analysis.com/fragile-ceasefire-in-tripoli-as-ghwell-ousted-from-rixos" }, { t: "OpenStreetMap way 376444830 (RIXOS Hotel)", u: "https://www.openstreetmap.org/way/376444830" }]
  },
  {
    id: "bt-2017-abusalim", layer: "battle", level: "documented", y0: 2017, y1: 2017,
    name: "Abu Salim fighting, February 2017", ar: "اشتباكات أبوسليم، فبراير 2017",
    lat: 32.8455, lon: 13.1712, r: 1.5, period: "8–24 February 2017",
    relevance: "Militias aligned with rival governments fought inside a residential district.",
    text: "Wikipedia's list says that on 8 February 2017 the Abu Salim Central Security Force, loyal to the unity government, fought the Salah al-Burki Brigade, which backed Ghwell, in Abu Salim and Salah al-Din, and that on 24 February fighting on Hamza Street in Abu Salim left eight dead, three of them civilians hit by a missile (citing the Libya Herald). I read this only in Wikipedia's table and did not open the Libya Herald reports.",
    sources: [{ t: "Western Libya clashes (2016–2018), Wikipedia", u: "https://en.wikipedia.org/wiki/Western_Libya_clashes_(2016%E2%80%932018)" }]
  },
  {
    id: "bt-2017-may", layer: "battle", level: "documented", y0: 2017, y1: 2017,
    name: "Tripoli fighting, 26–29 May 2017", ar: "معارك طرابلس، 26–29 مايو 2017",
    lat: 32.84, lon: 13.19, r: 3, period: "26–29 May 2017",
    relevance: "Pro-government militias drove hardliners out of the capital in a few days.",
    text: "Libya Security Monitor says the main clashes were on 26 May, that pro-unity-government militias including the Tripoli Revolutionaries Brigade and the Abu Salim brigade fought a coalition of anti-government militias allied to Khalifa al-Ghwell, and that 52 people were killed and more than 130 injured. Hadba prison, which holds former Gaddafi-era officers, was taken by the pro-government side; hardliners lost Yarmouk camp, other barracks south of the city and the destroyed Tripoli International Airport; militias stormed the Dar al-Iftar and destroyed the home of Khalid al-Sherif, who headed Hadba prison and had led the Libyan Islamic Fighting Group; the anti-government forces withdrew to Tarhouna, Zawiya and Sabratha. Wikipedia's list names the districts Abu Salim, Hai Damascus, Hai Akhwakh, Salahedeen and Qasr Bin Ghashir, and says the Kani Brigade from Tarhuna took the airport on 28 May. The marker is a rough centre of those districts.",
    sources: [{ t: "Libya Security Monitor: anti-GNA militias evicted from Tripoli (May 2017)", u: "https://libyasecuritymonitor.com/24-30-june-anti-gna-militias-evicted-from-tripoli/" }, { t: "Western Libya clashes (2016–2018), Wikipedia", u: "https://en.wikipedia.org/wiki/Western_Libya_clashes_(2016%E2%80%932018)" }]
  },
  {
    id: "bt-2017-jul-beach", layer: "battle", level: "documented", y0: 2017, y1: 2017,
    name: "Rocket-propelled grenade attack on a beach near Mitiga airport, 4 July 2017", ar: "هجوم بقذائف آر بي جي على شاطئ قرب مطار معيتيقة، 4 يوليو 2017",
    lat: 32.8945, lon: 13.276, r: 2, period: "4 July 2017",
    relevance: "An attack on a crowded beach killed five and injured more than 30.",
    text: "Wikipedia's list says unidentified attackers fired rocket-propelled grenades at a beach near Mitiga airport on 4 July 2017, killing five people and injuring more than 32, that the Tripoli Revolutionaries Brigade was sent to the area and that the airport closed (citing Reuters and the Libya Herald). The exact beach is not given, so the marker is the airport area. I did not open the original reports.",
    sources: [{ t: "Western Libya clashes (2016–2018), Wikipedia", u: "https://en.wikipedia.org/wiki/Western_Libya_clashes_(2016%E2%80%932018)" }]
  },
  {
    id: "bt-2018-mitiga", layer: "battle", level: "documented", y0: 2018, y1: 2018,
    name: "Attack on Mitiga airport, 15 January 2018", ar: "الهجوم على مطار معيتيقة، 15 يناير 2018",
    lat: 32.90384, lon: 13.27368, r: 1.2, period: "15 January 2018",
    relevance: "Gunmen tried to free prisoners held at the airport; the dead included people in two hospitals.",
    text: "Libya Security Monitor says gunmen of Infantry Brigade 33, from Tajoura and led by Bashir al-Bogra, attacked the airport and the prison beside it to free associates held by the Special Deterrence Force (Rada), which guards them, and that reinforcements from the Interior Ministry's Central Security Department helped push them back; it reports as many as 20 killed and more than 60 injured. The first report from the Times of Israel (AP) gave nine dead, five at Mitiga hospital and four at a cardiac surgery hospital in Tajoura, and said flights were suspended. Wikipedia adds that the airport reopened on 20 January and that Rada arrested 61 people.",
    sources: [{ t: "Libya Security Monitor: major clashes at Mitiga airport (January 2018)", u: "https://libyasecuritymonitor.com/10-16-jan-major-clashes-break-out-at-tripolis-mitiga-airport-leaving-as-many-as-twenty-dead/" }, { t: "Times of Israel: Clashes kill 9 at Libya’s main international airport (15 Jan 2018)", u: "https://www.timesofisrael.com/clashes-kill-9-at-libyas-main-international-airport/" }, { t: "Western Libya clashes (2016–2018), Wikipedia", u: "https://en.wikipedia.org/wiki/Western_Libya_clashes_(2016%E2%80%932018)" }]
  },
  {
    id: "bt-2022-jul", layer: "battle", level: "documented", y0: 2022, y1: 2022,
    name: "Rada and the Tripoli Revolutionaries Brigade fight in the east, 21–22 July 2022", ar: "اشتباكات الردع وكتيبة ثوار طرابلس، 21–22 يوليو 2022",
    lat: 32.83, lon: 13.26, r: 4, period: "21–22 July 2022",
    relevance: "Heavy weapons were used in Ain Zara, al-Furnaj and Sabaa for about a day.",
    text: "Libya Security Monitor says fighting broke out on the evening of 21 July between the Special Deterrence Force (Rada) and the Tripoli Revolutionaries Brigade, with the Presidential Guard and Judicial Guard involved, in Ain Zara, al-Furnaj and Sabaa; medium and heavy weapons including howitzers and tanks were used; Rada took several of the other side's bases including the Presidential Guard headquarters, and the Brigade and Guard were isolated in Sabaa and Souq al-Jumaa. The 444 Brigade closed roads and Mitiga flights were diverted to Misrata. The unity government's health ministry reported 16 killed and 52 injured, and a ceasefire was reached on 22 July. The marker is a rough centre of the three districts.",
    sources: [{ t: "Libya Security Monitor: Clashes in Tripoli between Rada and TRB (July 2022)", u: "https://libyasecuritymonitor.com/clashes-in-tripoli-between-rada-and-trb/" }]
  },
  {
    id: "bt-1911-landing", layer: "battle", level: "documented", y0: 1911, y1: 1911,
    name: "Italian bombardment and landing, Tripoli taken, 3–5 October 1911", ar: "القصف الإيطالي والإنزال واحتلال طرابلس، 3–5 أكتوبر 1911",
    lat: 32.895, lon: 13.1811, r: 1.2, period: "3–10 October 1911",
    relevance: "The opening of the Italian invasion: warships silenced the forts, then sailors walked in.",
    text: "Wikipedia says Italy's squadron bombarded the forts from about 15:30 on 3 October 1911 until 17:15 and fired again on 4 October. On 5 October a naval landing force under Captain Umberto Cagni came ashore: sailors occupied Fort Sultaniye and raised the Italian flag at noon, sappers took Fort Hamidiye, and by 16:30 the second regiment had reached the marketplace. The Ottoman garrison of about 2,000 withdrew to 'Aziziya, about ten kilometres away. On the night of 9–10 October Ottoman troops and Libyan irregulars attacked Italian positions at the Bu Meliana wells, the city's main water source, and naval gunfire repelled them. By mid-October about 35,000 Italian troops were in Tripoli. The article gives no casualty figures. The marker is the Red Castle and Martyrs' Square area.",
    sources: [{ t: "Battle of Tripoli (1911), Wikipedia", u: "https://en.wikipedia.org/wiki/Battle_of_Tripoli_(1911)" }]
  },
  {
    id: "bt-1911-ainzara", layer: "battle", level: "documented", y0: 1911, y1: 1912,
    name: "Battle of Ain Zara, 4 December 1911", ar: "معركة عين زارة، 4 ديسمبر 1911",
    lat: 32.81983, lon: 13.26331, r: 0.8, period: "4 December 1911; 28 January 1912",
    relevance: "Italy broke the Ottoman and Arab line south of the city.",
    text: "About 12,000 Italians in three columns, supported by naval guns, attacked roughly 8,000 Ottoman and allied Arab troops with eight Krupp guns in a fortified position about 8 km south of Tripoli. Wikipedia says the Ottoman side withdrew in the afternoon and left its guns; Italian losses were 17 killed and 171 wounded, Ottoman losses more than 50 killed, and Arab losses more than 100 killed. The Italians fortified the oasis and built a railway to Tripoli. On 28 January 1912 about 4,000 Ottoman and Arab fighters tried to retake it and were repelled, with Italian losses of 3 killed and 15 wounded. The marker is the battlefield memorial recorded in OpenStreetMap.",
    sources: [{ t: "Battle of Ain Zara, Wikipedia", u: "https://en.wikipedia.org/wiki/Battle_of_Ain_Zara" }]
  },
  {
    id: "bt-1912-zanzur", layer: "battle", level: "documented", y0: 1912, y1: 1912,
    name: "Battles of Zanzur, 8 June and 20 September 1912", ar: "معارك جنزور، 8 يونيو و20 سبتمبر 1912",
    lat: 32.81722, lon: 13.01111, r: 2, period: "8 June and 20 September 1912",
    relevance: "The Italian push west of Tripoli, which ended the war on the coast.",
    text: "Wikipedia says Zanzur oasis lay about twelve miles from the Italian lines. Italian attacks from December 1911 to March 1912 failed. On 8 June 1912 about 13,500 Italian infantry took the heights of Abd-el-Gilil on the east side of the oasis and held them against a flank attack from Bu Meliana, but the defenders kept the oasis; Italian losses were 43 killed and 279 wounded, and the article gives Turkish-Arab dead as 1,000–1,400 in the text and 1,000–2,000 in the infobox, which are estimates. On 20 September, after about twelve hours of fighting at Sidi Bilal, the Italians defeated the Turkish-Arab force and took Zanzur. The Italians extended their railway to Zanzur by 8 October, and the Treaty of Ouchy was signed on 18 October 1912.",
    sources: [{ t: "Battles of Zanzur (1912), Wikipedia", u: "https://en.wikipedia.org/wiki/Battles_of_Zanzur_(1912)" }]
  },
  {
    id: "bt-1911-sharshatt", layer: "battle", level: "documented", y0: 1911, y1: 1911,
    name: "Battle of Shar al-Shatt and Bu Meliana, 23 and 26 October 1911", ar: "معركتا الشط وبومليانة، 23 و26 أكتوبر 1911",
    lat: 32.8953, lon: 13.2103, r: 2, period: "23 and 26 October 1911",
    relevance: "The Ottoman and Libyan counter-attack on the Italian lines, three weeks after the landing.",
    text: "Wikipedia says that on the morning of 23 October 1911 Ottoman troops with Arab militias attacked the Italian perimeter around Tripoli, a line about 13 km long held by about 8,500 men and three batteries. Two attacks on the western defences were repelled with help from the battleship Sicilia. The main attack hit the 11th Bersaglieri regiment in the eastern oasis, between Fort Messri, Henni and Shar al-Shatt, where the ground could not be fortified without damaging inhabitants' property and where, the article says, civilians also fired on the Italians from the oasis. Two companies were cut off and the others fell back to the city under fire; the line stabilised about 5 pm when a battalion of the 82nd Infantry and naval landing parties arrived, and Shar al-Shatt was retaken at sunset after house-to-house fighting, leaving the two companies with 57 survivors. On 26 October at 5 am the Ottomans attacked the south-eastern sector again at Bu Meliana and were driven off by 8 am. The Italians then shortened their eastern line, giving up Fort Hamidie, Henni and Fort Mesri until reinforcements retook the oasis on 26–28 November. Casualty figures disagree: the Shar al-Shatt article gives 503 Italians killed, the Italo-Turkish War article gives at least 21 officers and 482 soldiers. The Italian reprisals that followed are on the Killings layer (Shar al-Shatt killings).",
    sources: [{ t: "Battle and massacre at Shar al-Shatt, Wikipedia", u: "https://en.wikipedia.org/wiki/Battle_and_massacre_at_Shar_al-Shatt" }, { t: "Italo-Turkish War, Wikipedia", u: "https://en.wikipedia.org/wiki/Italo-Turkish_War" }]
  },
  {
    id: "bt-1943-castelbenito", layer: "battle", level: "documented", y0: 1941, y1: 1943,
    name: "Castel Benito airfield: Allied air raids and the capture of Tripoli, 1941–43", ar: "مطار كاستيل بينيتو: غارات الحلفاء ودخول طرابلس، 1941–1943",
    lat: 32.6709, lon: 13.1508, r: 1.5, period: "Nov–Dec 1941; Dec 1942 – 23 Jan 1943",
    relevance: "The Italian and German airfield south of Tripoli was bombed, abandoned and taken when the Eighth Army arrived.",
    text: "Wikipedia says Allied air raids hit the Castel Benito airport (now Tripoli International Airport) in November–December 1941 and again in December 1942 – January 1943, the later series being the most destructive; the last Italian transport flew out on 7 January 1943. After Rommel's Buerat line collapsed on 15 January 1943 (Misrata fell on the 18th, Homs on the 20th), Rommel left Tripoli on the night of 22 January without making a stand. The 1st Gordons and the 51st Highland Division, riding Royal Tank Regiment vehicles, entered the city the next morning and met no resistance; the Eighth Army entered in the early hours of 23 January and took the airport, by then wrecked by the raids. The airfield became RAF Castel Benito. The article gives no casualty figures for the capture of the city. The marker is the airport as recorded in OpenStreetMap, about 34 km south of the old city.",
    sources: [{ t: "Battle of Tripoli (1943), Wikipedia", u: "https://en.wikipedia.org/wiki/Battle_of_Tripoli_(1943)" }, { t: "RAF Castel Benito, Wikipedia", u: "https://en.wikipedia.org/wiki/RAF_Castel_Benito" }, { t: "Tripoli International Airport, Wikipedia", u: "https://en.wikipedia.org/wiki/Tripoli_International_Airport" }]
  },
  {
    id: "bt-1986-bab-gunfight", layer: "battle", level: "testimony", y0: 1986, y1: 1986,
    name: "Brief gun battle outside Bab al-Aziziya after the US raid, April 1986", ar: "اشتباك قصير خارج باب العزيزية بعد الغارة الأمريكية، أبريل 1986",
    lat: 32.848, lon: 13.151, r: 0.8, period: "15–16 April 1986 (reported 16–17 April)",
    relevance: "Foreign reporters saw shooting outside Gaddafi’s headquarters days after the bombing.",
    text: "Robert Fisk wrote in The Times on 23 April 1986 (carried by FBIS and filed in the CIA reading room) that foreign journalists had witnessed a brief gun battle outside Gaddafi's headquarters at the Bab al-Aziziya barracks. He suggested that a shift in power could explain it, and that it was more likely a clash between two pro-Gaddafi groups in the vacuum before Gaddafi reappeared on television than an attempt to oppose him. The article gives no exact date, no casualties and no identity for the fighters. A CIA talking-points memo of the same weeks also mentions skirmishes between regular troops and the Revolutionary Committees right after the raid. Reports from the first days: a BBC bulletin on 16 April 1986 said there had been speculation the day before of a coup attempt, with reports of gunfire and unexplained disturbances in Tripoli, which the Libyans firmly denied. An Associated Press report, run in the Christian Science Monitor on 17 April, says about 70 reporters on a bus heading for a promised news conference at Gaddafi's compound saw small-arms fire start about 500 feet from the bus, and that journalists in Tripoli heard small-arms and mortar fire and saw apparent street skirmishes near the headquarters and a Libyan patrol boat firing cannon rounds along the waterfront; Libyan officials reacted angrily to the reports. It adds that reports from Washington, unconfirmed in Libya, claimed the Libyan Air Force joined factional fighting at Tarhuna. Western embassies said they heard small-arms fire near Gaddafi's former headquarters but could not explain it. Libyan officials said the shooting was anti-aircraft fire aimed at a US reconnaissance plane. Nobody has identified the fighters.",
    sources: [cia("cia-rdp91b00874r000200120013-4", "The Times (Fisk), Junta shares Libya power with Qadhdhafi, via FBIS, 23 Apr 1986"), cia("cia-rdp91b00874r000100160006-9", "Talking points: the Libyan domestic situation (May 1986)"), cia("cia-rdp05-01559r000400410035-2", "BBC world service report on Qadhdhafi’s 16 April 1986 address, via FBIS"), cia("cia-rdp05-01559r000400470001-3", "Associated Press and Christian Science Monitor, 16–17 Apr 1986: conflicting reports, skirmishes fuel tension in Tripoli")]
  },
  {
    id: "bt-1986-jun-bab", layer: "battle", level: "suspected", y0: 1986, y1: 1986,
    name: "Reported mutiny and shooting inside Bab al-Aziziya camp, late June 1986", ar: "تمرد وإطلاق نار مزعوم داخل معسكر باب العزيزية، أواخر يونيو 1986",
    lat: 32.848, lon: 13.151, r: 0.8, period: "Reported 30 June 1986, \"several days ago\"",
    relevance: "An Egyptian newspaper said eyewitnesses heard shots inside Gaddafi’s camp and that eight rebels were killed.",
    text: "A Middle East News Agency item datelined Tripoli on 30 June 1986, carried by FBIS, says the Cairo daily Al-Ahram reported that there had been another mutiny in the Libyan armed forces, one of several attempted revolts since the April US strike, the latest several days earlier. It says eyewitnesses stated they heard shots inside the Bab al-Aziziya camp, Gaddafi's headquarters, and that eight rebels had been killed. This is a single report from an Egyptian state-linked source at a time of hostility between Cairo and Tripoli. Libyan media did not report it, and I found no second source, so treat it as unconfirmed.",
    sources: [{ t: "FBIS Daily Report, 27 Jun 1986: Eyewitnesses to Armed Forces mutiny cited (MENA, citing Al-Ahram)", u: "https://archive.org/details/micro_IA41152803_0407" }]
  },
  {
    id: "as-1941-port", layer: "airstrike", level: "documented", y0: 1940, y1: 1943,
    name: "Allied air raids and naval bombardment of Tripoli port, 1940–43", ar: "غارات الحلفاء وقصف الميناء البحري، 1940–1943",
    lat: 32.905, lon: 13.195, r: 0.8, period: "Nov 1940 – Jan 1943 (main bombardment 21 April 1941)",
    relevance: "The Axis supply port for North Africa was attacked from the air and the sea for two and a half years.",
    text: "A WW2DB timeline of Tripoli lists Fleet Air Arm Swordfish from HMS Eagle striking the harbour on 24 and 26 November 1940, Malta-based Swordfish torpedo-bombers bombing it on 18 March 1941 (one shot down, its two-man crew captured), and a failed attempt on 18 January 1943 to send two Chariot manned torpedoes into the harbour, which was found empty of ships. The largest action was the bombardment on 21 April 1941: a diary published by the Naval Historical Society of Australia says the battleships Warspite, Valiant and Barham, the cruiser Gloucester and nine destroyers fired on the port for 45 minutes from 05:10, each battleship given its own part of the port, calling it the only fully equipped supply port for German and Italian forces in Africa, with carrier HMS Formidable's aircraft spotting and an RAF bombing attack planned beforehand. The diarist gives no damage assessment and reports no British casualties; his estimate of about 600 tons of shell fired per ship is his own guess. No Libyan civilian toll appears in these sources. The marker is the harbour; the airfield raids of 1941–43 are under Castel Benito.",
    sources: [{ t: "Naval Historical Society of Australia: HMAS Perth, bombardment of Tripoli (diary, April 1941)", u: "https://navyhistory.au/hmas-perth-bombardment-of-tripoli/" }, { t: "WW2DB: Tripoli, Libya timeline", u: "https://m.ww2db.com/event/timeline/place/Libya/_Tripoli" }]
  },
  {
    id: "mk-fakheri-2009", layer: "massacre", level: "documented", y0: 2009, y1: 2009,
    name: "Ibn al-Sheikh al-Libi found dead in his cell at Abu Salim, May 2009", ar: "العثور على ابن الشيخ الليبي ميتاً في زنزانته بأبو سليم، مايو 2009",
    lat: 32.8333, lon: 13.1739, r: 1, period: "9–10 May 2009",
    relevance: "A man returned from US custody died in a Tripoli prison; the authorities called it suicide and gave no access to the evidence.",
    text: "Amnesty's 2010 report says Abdelaziz Al-Fakheri, also known as Ibn Al Sheikh Al Libi, who had been returned from US custody and held since, was reported to have died by suicide in Abu Salim on 9 May 2009; the authorities opened an investigation and later said he killed himself but gave no details. The US State Department's report for the same year says he was found dead in his cell from an apparent suicide, that Amnesty was denied access to his guards, forensic doctors and the autopsy report, and that no results of the Libyan investigation were public by the end of the year. The two reports spell his name differently. Nobody outside the prison has shown whether it was suicide. Human Rights Watch, in its report on renditions, says Libyan authorities called his death a suicide and that photographs it saw show bruising on parts of his body; the report does not name the prison.",
    sources: [{ t: "Amnesty International Annual Report 2010: Libya", u: "https://www.amnestyusa.org/reports/annual-report-libya-2010/" }, { t: "US State Department, 2010 Country Reports on Human Rights Practices: Libya (via Refworld)", u: "https://www.refworld.org/node/78703" }, { t: "Human Rights Watch, Delivered into Enemy Hands (2012)", u: "https://www.hrw.org/report/2012/09/05/delivered-enemy-hands/us-led-abuse-and-rendition-opponents-gaddafis-libya" }]
  },
  {
    id: "mk-abusalim-2006", layer: "massacre", level: "testimony", y0: 2006, y1: 2006,
    name: "Clashes between prisoners and guards at Abu Salim, 4 October 2006", ar: "اشتباكات بين السجناء والحراس في أبو سليم، 4 أكتوبر 2006",
    lat: 32.8333, lon: 13.1739, r: 1, period: "4 October 2006",
    relevance: "One prisoner was reported killed and others injured in a disturbance ten years after the 1996 killings.",
    text: "The US State Department's report for 2006 says, citing press accounts, that clashes between prisoners and guards at Abu Salim on 4 October 2006 killed one prisoner, Hafed Mansour Al-Zwai, and injured 17. The Abu Salim pin carries an earlier account of the same day that says security forces reportedly killed at least one prisoner and wounded at least nine, so the injury count differs between sources. The State Department gives no further details, and I found no independent report of the cause.",
    sources: [{ t: "US State Department, Country Reports on Human Rights Practices for 2006: Libya", u: "https://jewishvirtuallibrary.org/report-on-human-rights-practices-for-2006-libya" }]
  },
  {
    id: "mk-stadium-1996", layer: "massacre", level: "suspected", y0: 1996, y1: 1996,
    name: "Shooting at a Tripoli football match, July 1996", ar: "إطلاق نار في مباراة كرة قدم بطرابلس، يوليو 1996",
    lat: 32.874, lon: 13.15, r: 2.5, period: "9–14 July 1996 (reports differ)",
    relevance: "Spectators were shot at after a crowd chanted against the government; the stadium is not named in the 1996 reports.",
    text: "A compilation of the contemporary press reports says a match between the Tripoli rivals Al-Ittihad and Al-Ahli ended in a brawl and shooting, with spectators fleeing or stampeding. The Independent says supporters invaded the pitch after a controversial goal, chanting anti-government slogans; the Washington Post quotes diplomats saying bodyguards loyal to Gaddafi's sons fired at spectators and that some in the crowd shot back. Libyan state television put the toll at 8 killed and 39 injured on 14 July; unofficial estimates range from about 20 (an exile source in the Post) to up to 50 (The Independent). The date varies between reports (the Guardian says 9 July, AP points to Friday 12 July), and the 1996 reports do not name the stadium. Later sources say it was the June 11 Stadium, which that compilation could not verify, so the marker sits between the June 11 Stadium and the 7 October Stadium with a wide radius. The justice minister announced an investigation; I found no outcome.",
    sources: [{ t: "Working With Crowds: Tripoli football match crowd incident, July 1996 (compiling Washington Post, AP, The Independent, The Guardian)", u: "https://www.workingwithcrowds.com/?p=38163" }]
  },
  {
    id: "dt-gurji-2003", layer: "detention", level: "testimony", y0: 2003, y1: 2003,
    name: "Police raid on Ethiopian and Eritrean migrants in Gurji, September 2003", ar: "مداهمة الشرطة لمهاجرين إثيوبيين وإريتريين في قرجي، سبتمبر 2003",
    lat: 32.8762, lon: 13.1562, r: 0.8, period: "September 2003",
    relevance: "More than 100 migrants, including women and children, were arrested and beaten in a residential district.",
    text: "Human Rights Watch's 2006 report on migrants says police arrested more than 100 Ethiopians and Eritreans, including women and children, in the Gurgee suburb of Tripoli in September 2003, that the men were beaten with sticks and a plastic pipe, that detainees' savings were taken without a receipt, and that guards later called them “spies for Israel”. It places this in a wider August 2003 police campaign of broad sweeps that included raids on four migrant areas. The report does not give the street or the place where they were held, so the marker is the district.",
    sources: [{ t: "Human Rights Watch, Stemming the Flow (September 2006)", u: "https://www.hrw.org/report/2006/09/12/stemming-flow/abuses-against-migrants-asylum-seekers-and-refugees" }]
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
  { name: 'Ministers and officers arrested over the December 1969 plot', when: 'December 1969', text: 'The CIA reported that Defence Minister Adam al-Hawwaz and Interior Minister Musa Ahmad were arrested for plotting against the Revolutionary Command Council, and that about 100 army and police officers were arrested shortly afterwards. Where they were held is not stated.', src: cia('0005977189', "President's Daily Brief, 11 December 1969") },
  { name: 'Killings of army personnel around Tripoli', when: 'November 1969', text: 'A CIA brief reported dissension in the army and some assassinations of army personnel in the Tripoli area, weeks after the coup. No names or places are given.', src: cia('0006146480', "President's Daily Brief, 24 November 1969") },
  { name: 'Engineer Mahmoud Bannoun dies under torture', when: 'April 1980', text: 'An engineer arrested in early April 1980 in Tripoli died a few days later as a result of torture; his body was returned to his family in a sealed coffin. Where he was held is not stated.', src: { t: 'Human rights violations under Gaddafi, Arabic Wikipedia (list of executions)', u: 'https://ar.wikipedia.org/wiki/%D8%A7%D9%86%D8%AA%D9%87%D8%A7%D9%83%D8%A7%D8%AA_%D8%AD%D9%82%D9%88%D9%82_%D8%A7%D9%84%D8%A5%D9%86%D8%B3%D8%A7%D9%86_%D9%81%D9%8A_%D8%B9%D9%87%D8%AF_%D8%A7%D9%84%D9%82%D8%B0%D8%A7%D9%81%D9%8A' } },
  { name: 'Student Abdulaziz al-Gharabli dies in custody', when: 'Arrested April 1983, died January 1984', text: 'A Tripoli student suspected of belonging to a political party died in January 1984 from torture and lack of medical care.', src: { t: 'Human rights violations under Gaddafi, Arabic Wikipedia (list of executions)', u: 'https://ar.wikipedia.org/wiki/%D8%A7%D9%86%D8%AA%D9%87%D8%A7%D9%83%D8%A7%D8%AA_%D8%AD%D9%82%D9%88%D9%82_%D8%A7%D9%84%D8%A5%D9%86%D8%B3%D8%A7%D9%86_%D9%81%D9%8A_%D8%B9%D9%87%D8%AF_%D8%A7%D9%84%D9%82%D8%B0%D8%A7%D9%81%D9%8A' } },
  { name: 'Abdullah al-Muslati executed in Tripoli Central Prison', when: 'April 1984', text: 'A student arrested on 16 April 1973 and sentenced to prison was retried before the revolutionary courts, sentenced to death and executed in Tripoli Central Prison. The prison\'s location is not yet known for this map.', src: { t: 'Human rights violations under Gaddafi, Arabic Wikipedia (list of executions)', u: 'https://ar.wikipedia.org/wiki/%D8%A7%D9%86%D8%AA%D9%87%D8%A7%D9%83%D8%A7%D8%AA_%D8%AD%D9%82%D9%88%D9%82_%D8%A7%D9%84%D8%A5%D9%86%D8%B3%D8%A7%D9%86_%D9%81%D9%8A_%D8%B9%D9%87%D8%AF_%D8%A7%D9%84%D9%82%D8%B0%D8%A7%D9%81%D9%8A' } },
  { name: 'Hassan al-Kurdi executed in prison without trial', when: 'April 1984', text: 'Arrested with hundreds of others in the spring of 1973 and accused with nine others of belonging to the Islamic Liberation Party, he was released by order of the Revolutionary Council in December 1973, re-arrested the same day, held without trial until 1977, sentenced to 15 years and then to life, and executed in prison without trial in April 1984.', src: { t: 'Human rights violations under Gaddafi, Arabic Wikipedia (list of executions)', u: 'https://ar.wikipedia.org/wiki/%D8%A7%D9%86%D8%AA%D9%87%D8%A7%D9%83%D8%A7%D8%AA_%D8%AD%D9%82%D9%88%D9%82_%D8%A7%D9%84%D8%A5%D9%86%D8%B3%D8%A7%D9%86_%D9%81%D9%8A_%D8%B9%D9%87%D8%AF_%D8%A7%D9%84%D9%82%D8%B0%D8%A7%D9%81%D9%8A' } },
  { name: 'Unrest at the Faculty of Engineering', when: 'November 1980', text: 'Unrest at the Faculty of Engineering of the University of Tripoli led to arrests; one student detained then, Hafez al-Madani, was hanged on campus in 1984.', src: { t: 'Human rights violations under Gaddafi, Arabic Wikipedia (list of executions)', u: 'https://ar.wikipedia.org/wiki/%D8%A7%D9%86%D8%AA%D9%87%D8%A7%D9%83%D8%A7%D8%AA_%D8%AD%D9%82%D9%88%D9%82_%D8%A7%D9%84%D8%A5%D9%86%D8%B3%D8%A7%D9%86_%D9%81%D9%8A_%D8%B9%D9%87%D8%AF_%D8%A7%D9%84%D9%82%D8%B0%D8%A7%D9%81%D9%8A' } },
  { name: 'Arrests over the 1973 royalist plot', when: 'March 1973', text: 'The government said it had crushed a plot led by a nephew of the deposed King Idris. Eleven men were arrested in Tripoli, including two former prime ministers, and Gaddafi said they would be tried without mercy. Where they were held is not stated.', src: cia('cia-rdp80-01601r000700090001-8', 'press clipping on the 1973 plot') },
  { name: 'Arrests after the August 1975 coup attempt', when: 'August 1975', text: 'After the failed coup by Revolutionary Command Council members, the CIA reported that Bashir Hawadi was under arrest in Tripoli while Umar al-Muhayshi escaped to Tunisia. The place of detention is not named.', src: cia('cia-rdp86t00608r000300020037-8', 'Weekly Summary, 22 August 1975') },
  { name: 'Iraqi embassy employee shot dead', when: '17 August 1978', text: 'Husayn Muhammad Ali, an Iraqi embassy employee, was shot three times outside the Iraqi embassy in Tripoli as he arrived for work and died in hospital. Libyan authorities arrested a young Palestinian Fatah member; the CIA says his real target was the Iraqi ambassador. The embassy\'s 1978 address is not known.', src: cia('cia-rdp79-01209a001000040001-4', 'Weekly Situation Report on International Terrorism, 23 August 1978') },
  { name: 'Food riots in Tripoli shops', when: 'Late 1985 – January 1986', text: 'A US magazine article kept in CIA files describes shoppers in one of Tripoli\'s large state supermarkets rioting over a shipment of bananas, and says two women were trampled to death in a similar riot about two months earlier. The shops are not named.', src: cia('cia-rdp92b00478r000800130002-8', 'press article, January 1986') },
  { name: 'Libyan government claims of NATO strikes in Tripoli', when: 'May–June 2011', text: 'Libyan state television said NATO strikes killed 19 civilians in Tripoli on 24 May 2011 and seven on 19 June, and fifteen at Sorman near Tripoli on 20 June. These are government claims reported by Wikipedia and were not independently confirmed here; no sites are given.', src: SRC.wpNato },
  { name: 'Revolutionary Guard Corps', when: '1980s', text: 'Grew out of the Revolutionary Committees. It watched soldiers inside barracks, reportedly controlled ammunition at the main bases, and fought regular army units in Tripoli’s streets during a May 1985 coup attempt. No source gives its bases.', src: SRC.rgc },
  { name: 'Police stations and checkpoints', when: '1969–2011', text: 'No published source maps Tripoli’s police posts or checkpoints for this period.' },
  { name: 'Military intelligence prison, Tripoli', when: '1984', text: 'A former detainee describes being held there after the May 1984 arrests. Its location is not given.', src: SRC.shareef },
  { name: 'Tripoli Central Prison', when: '1982–1984', text: 'An old prison, said to date from the Fascist period, where 21 people arrested in February 1982 were held without trial until 1984 and then moved to Abu Salim (Amnesty International, 1991; a 1980 JPRS translation of an exile appeal also names it). Arabic Wikipedia lists a student, Abdullah al-Maslati, as executed in the Central Prison in April 1984 after a retrial before the revolutionary courts. No source gives its address.', src: A91 },
  { name: 'Tripoli military prison', when: 'Late 1980', text: 'Amnesty International names it as the place a prisoner of conscience was moved to in late 1980, with family visits allowed once every three months. No source gives its address.', src: A91 },
  { name: 'Al-Ataba prison, Tripoli', when: 'June–July 1996', text: 'Amnesty International says Sudanese and other African workers were held here in 1996. No source gives its address.', src: A97 },
  { name: 'Tobacco-factory prison, Tripoli', when: '2011', text: 'Wikipedia says one of the most notorious hidden prisons of 2011 was set up in a tobacco factory in Tripoli, where inmates were reportedly given half a loaf of bread and a bottle of water a day. The Red Cross was denied access. No source gives its location.', src: { t: 'Libyan civil war (2011), Wikipedia', u: 'https://en.wikipedia.org/wiki/Libyan_civil_war_(2011)' } },
  { name: 'Al-Ruwaimi prison', when: 'After 2011', text: 'A Tripoli prison where 12 prisoners released by court order in June 2016 were found dead a day later (UNSMIL). It was among the sites the 444th Brigade took in May 2025. No source seen gives its coordinates or when it opened.', src: { t: '2025 Tripoli clashes, Wikipedia', u: 'https://en.wikipedia.org/wiki/2025_Tripoli_clashes' } },
  { name: '7 April, the “Day of Judgement”', when: '1976–1980s', text: 'English Wikipedia says Gaddafi called the anniversary of the 7 April 1976 student protests the “Day of Judgement”. On 7 April 1977 students Omar Dabboub and Mohamed Ben Saoud were hanged in public in Benghazi after a military tribunal in Tripoli; the broadcast was shown on television. Some sources say executions were repeated every 7 April until the late 1980s; that is disputed and no Tripoli venue is named. The University of Tripoli, where students were attacked in 1976 and a student was hanged in April 1984, is on the map.', src: { t: 'Human rights in Libya under Muammar Gaddafi, Wikipedia', u: 'https://en.wikipedia.org/wiki/Human_rights_in_Libya_under_Muammar_Gaddafi' } },
  { name: 'Firing-squad executions', when: '30 May 2010', text: 'Eighteen people were shot by firing squad: 14 in Tripoli and 4 in Benghazi, many of them foreign nationals. The Tripoli venue is not named. State media reported the numbers; Amnesty says a Libyan newspaper, Cerene, reported the 18 were convicted of premeditated murder and were from Chad, Egypt and Nigeria, and that the authorities had not named them. Amnesty said it feared the trials did not meet international fair-trial standards and that foreign nationals often lacked interpreters and consular access. Amnesty and the European Parliament condemned the executions.', src: [{ t: 'Human rights violations during the Gaddafi regime, Wikipedia', u: 'https://en.wikipedia.org/wiki/Human_rights_violations_during_the_Gaddafi_regime' }, { t: 'Amnesty International: Libya executes 18 by firing squad (June 2010)', u: 'https://www.amnesty.org/en/latest/press-release/2010/06/libya-executes-18-firing-squad/' }, { t: 'Executed Today: 2010, 18 in Libya', u: 'https://www.executedtoday.com/2011/05/30/2010-18-in-libya/' }] },
  { name: 'Public executions', when: 'Late 1970s–1980s', text: 'Public hangings were staged around 7 April anniversaries, including at universities and a sports arena. The documented cases with places are in Benghazi, outside this map, except the April 1984 hanging at the University of Tripoli.', src: { t: 'Human rights violations during the Gaddafi regime, Wikipedia', u: 'https://en.wikipedia.org/wiki/Human_rights_violations_during_the_Gaddafi_regime' } },
  { name: "Hanging of Muhammad ash-Shabani and other executions after the May 1984 raid", when: "4 June 1984", text: "Tripoli radio announced that a Basic People's Congress, after reading his confession, ratified a death sentence and hanged Muhammad Sa'id ash-Shabani, described as a Muslim Brotherhood member recruited by American intelligence; the place name in the transcript is garbled. Survivors' accounts on tarikhi.org say eight men were executed in June 1984 in different towns, from Tobruk in the east to Nalut in the west, and that some hangings were shown live on television during Ramadan. No Tripoli location is given for this one.", src: { t: 'FBIS, 5 Jun 1984: “Traitor recruited by US intelligence hanged”', u: 'https://archive.org/details/micro_IA1176909_0432' } },
  { name: "Palestinian arrested in Tripoli over an alleged plot against Gaddafi", when: "May 1983", text: "Libyan media said a Palestinian, named as Abd al-Qadir Musa al-Khatib, was arrested in Tripoli for planning to assassinate Gaddafi on behalf of the CIA. In his televised “confession” he said he had killed a guard at a Palestinian camp close to the command camp in Tripoli. This is the regime's account only; where he was held is not stated.", src: { t: 'FBIS, 11 May 1983: Tripoli Domestic Service on the alleged plot', u: 'https://archive.org/details/micro_IA1176909_0151' } },
  { name: "Reported attempt on Gaddafi and executions of officers", when: "Late December 1981", text: "The Washington Post reported on 28 February 1982 that the CIA had concluded an attempt on Gaddafi's life was made in the last two weeks of December 1981, probably by army officers back from Chad, and that he may have been grazed by a bullet. Reports of the number of Libyans executed afterwards ranged from four to 640; US officials believed some had been. The place of the attack and of any executions is not given, and Libyan media denied a coup attempt on 10 January 1982.", src: cia('cia-rdp90-00965r000807600034-7', 'Washington Post, 28 Feb 1982: CIA has found evidence of attack on Qaddafi') },
  { name: "Six officers executed on corruption charges", when: "July 1980", text: "An exile commentary reprinted by the US JPRS service says six officers were executed by Gaddafi in July 1980 “allegedly in order to combat corruption” and claims they were really planning a revolt. Their names and where they were executed are not given, and the claim comes from a source hostile to the government.", src: { t: 'JPRS Near East/North Africa Report No. 2160 (6 Aug 1980)', u: 'https://archive.org/details/jprs-report_jprs-76172' } },
  { name: "French family arrested in Tripoli for “spying”", when: "April 1980 – March 1982", text: "Denise Dupont, 58, and her sons Alain, 25, and Jean-Claude, 21, were arrested in Tripoli in April 1980, convicted of spying “for American imperialism and Zionism” and sentenced to life in prison on 20 February 1982. Gaddafi pardoned them in March 1982. Where they were held is not stated.", src: { t: 'FBIS, 18 Mar 1982: French family convicted of spying pardoned (AFP)', u: 'https://archive.org/details/micro_IA1176908_1132' } },
  { name: "Iraqi-aligned Ba'th party members imprisoned or executed", when: "Reported April 1982", text: "A British trade magazine summarised in JPRS says the small but influential Iraqi-oriented Ba'th party in Tripoli had been “smashed” and many of its leaders imprisoned or executed. No names, dates or places are given.", src: { t: 'JPRS Near East/North Africa Report No. 2533 (28 Apr 1982)', u: 'https://archive.org/details/ufiche-test-document_jprs-80690' } },
  { name: "British hostages arrested in Tripoli after the London embassy siege", when: "April 1984 – February 1985", text: "After the shooting of a policewoman at the Libyan People's Bureau in London on 17 April 1984, Douglas Ledingham, head of the British Caledonian office in Tripoli, was arrested (FBIS says at Tripoli airport; Wikipedia says by soldiers on the evening of 17 April), and a businessman, John Campbell, was also held. Wikipedia says Ledingham and two other Britons were held at a building called the “Italian Mansion”, about 400 yards from the Italian embassy, and that four British hostages were freed after 294 days in February 1985. The embassy's position in 1984 is not given, so the place is not mapped.", src: { t: 'FBIS, 15 May 1984: arrests of two Britons in Tripoli', u: 'https://archive.org/details/micro_IA1176909_0417' } },
  { name: "Campaign of “physical liquidation” announced against opponents", when: "February–June 1980", text: "Gaddafi told Libyans abroad to return by 11 June 1980 or be “liquidated”, and said in a Der Spiegel interview that the revolutionary committees could decide this without a trial. Exile groups link the campaign to the arrest and death in custody of people inside Libya, such as the lawyer Amir al-Daghis. A CIA paper of February 1982 says the main killing campaign ran from March to June 1981 before he ordered a pause. Most of the killings listed in these sources took place in Europe, not Tripoli.", src: { t: 'FBIS, 18 Jun 1980: Der Spiegel interview on the liquidation policy', u: 'https://archive.org/details/micro_IA1176908_0675' } },
  { name: "Reported 4,000 detainees in detention camps", when: "November 1981", text: "An exile report published in the JPRS “Libya: Human Rights Violations” series says about 4,000 people were held in detention camps simply for not applauding the regime, and that an April 1980 wave of killings began under the slogan of “fighting bribery”. These are unverified exile figures, with no camp names or places.", src: { t: 'JPRS Near East/North Africa Report No. 2441 (25 Nov 1981)', u: 'https://archive.org/details/ufiche-test-document_jprs-79522' } },
  { name: "Naval officers reported executed after an alleged plot", when: "Reported June 1982", text: "An opposition article reprinted by JPRS lists four alleged attempts on Gaddafi's life and says that in the fourth, 21 Libyan naval officers were executed. No date, place or names are given, and it is not confirmed elsewhere in our files.", src: { t: 'JPRS Near East/North Africa Report No. 2568 (23 Jun 1982)', u: 'https://archive.org/details/ufiche-test-document_jprs-81111' } },
  { name: "Arrests in Tripoli in May 1984 and a televised “confession”", when: "May 1984", text: "Amnesty International's 1992 report says 'Abd al-Mun'im Qasem al-Najjar was arrested in Tripoli in May 1984, reportedly tortured at the time of his arrest, and that Libyan television broadcast his “confession”; it lists him among 1984 detainees believed to be held at Abu Salim. The place of arrest is not given more closely than Tripoli.", src: { t: 'Amnesty International, Libya: further information on political detention (1992)', u: 'https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190031992en.pdf' } },
  { name: "Arrest at Tripoli airport and later death sentence", when: "October 1982", text: "Amnesty says 'Abd al-Hadi Shahin was arrested on arrival at Tripoli airport from Egypt in October 1982, was reportedly tortured during interrogation, was tried in 1987, sentenced to death and was held at Abu Salim. Where he was interrogated is not stated.", src: { t: 'Amnesty International, Libya: further information on political detention (1992)', u: 'https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190031992en.pdf' } },
  { name: "Aftermath of the 8 May 1984 attack: shootout, captures and searches", when: "12–14 May 1984", text: "On 12 May 1984 security forces killed the man they named as the attack's leader in a shootout somewhere in Tripoli; on 14 May the news agency announced the capture of a 24-year-old said to belong to the Muslim Brotherhood, whose photo a Tripoli newspaper published; a week after the attack roadblocks and house searches continued and diplomats needed permission to travel to border areas and the south. No streets are named.", src: { t: '1984 Libyan coup attempt, Wikipedia', u: 'https://en.wikipedia.org/wiki/1984_Libyan_coup_attempt' } },
  { name: "Two Italian engineers arrested on charges of plotting against Libya", when: "August 1980", text: "Ali Akermi says Enzo Castelli and Edoardo Seliciato were arrested in August 1980 after Libyan agents were caught in European countries. Akermi shared a cell with Castelli, and both Italians were freed in October 1986 in an exchange. The prison is not named in the interview, so it is not mapped.", src: { t: 'Ali Akermi interview, Tarikhi', u: 'https://tarikhi.org/interview/ali-akermi/' } },
  { name: "Gaddafi speech threatening opponents at Bab al-Azizia", when: "1980", text: "Akermi says that in 1980 Gaddafi told an audience at Bab al-Azizia that he would “kill the men and capture the women and orphan the children” of oppositionists. This is a single recollection and I found no transcript, so it is kept as testimony only.", src: { t: 'Ali Akermi interview, Tarikhi', u: 'https://tarikhi.org/interview/ali-akermi/' } },
  { name: "Shots fired into a football-match protest", when: "January 1989 (second half)", text: "Amnesty says a demonstration in Tripoli against giving a World Cup qualifier to Algeria ended when security forces fired into the crowd, killing at least one demonstrator; its fuller 1991 paper says a medical student, Taha Jalul, was allegedly killed. No street, stadium or square is named, so the place is not mapped.", src: [{ t: "Amnesty International, MDE 19/001/1991", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190011991en.pdf" }, { t: "Amnesty International, MDE 19/002/1991", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190021991en.pdf" }] },
  { name: "Mass arrests in Tripoli and nearby towns after the January 1989 protests", when: "January – April 1989", text: "Amnesty reports at least 211 people arrested in Tripoli and surrounding towns between January and April 1989, most of them apparently not involved in any violence; across Libya it counts at least 394 arrests from January 1989 to April 1990, one of whom is believed held at Abu Salim. Named cases include Dr 'Abdul-Naser al-Bashir Abu-Lseyen (arrested 19–20 January) and Fathi Mahmud 'Atiya al-'Abbar and Muhammad 'Ali Mamash, held without trial.", src: [{ t: "Amnesty International, MDE 19/002/1991", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190021991en.pdf" }, { t: "Amnesty International, MDE 19/001/1991", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190011991en.pdf" }] },
  { name: "Televised hangings of six Islamists, February 1987 (Benghazi stadium)", when: "February 1987", text: "Amnesty lists nine people executed in February 1987 for politically motivated offences. Fathi Terbil, in an interview with Tarikhi, says the executions were broadcast live: six civilians were hanged in a sports stadium he does not name, and three military men were shot by firing squad. The US State Department's report for 1987 also says six civilians were hanged in public and three soldiers shot, all televised, and that the group of nine was described as an “enemies of God” clique arrested in October 1986; it names no site. Jamestown's history of political Islam in Libya says the six were hanged in the sports stadium in Benghazi, after the arrest of nine alleged Muslim Brotherhood members in 1986 for the murder of a senior security official, so this was not in Tripoli; it is listed because it was shown to the whole country and Amnesty counts it among the 1987 executions.", src: [{ t: "Amnesty International, MDE 19/005/1992", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190051992en.pdf" }, { t: "Fathi Terbil interview, Tarikhi", u: "https://tarikhi.org/interview/fathi-terbil/" }, { t: "US State Department, Country Report on Human Rights Practices for 1987", u: "https://www.ecoi.net/de/dokument/240320" }, { t: "Jamestown Foundation, Political Islam in Libya (part 2)", u: "https://jamestown.org/political-islam-in-libya-2/" }] },
  { name: "Death sentences handed down by revolutionary courts, later commuted", when: "February 1985 – June 1988", text: "Amnesty says Fathi al-Sha'iri and Mahmud al-Shaltat were reportedly sentenced to death in February 1985 after four years in detention; Hassan 'Ali Yahya Mu'ammar was summarily tried and sentenced in 1987; and in June 1988 the sentences of four soldiers, including these three and Usama al-Sanussi Shalluf, were commuted. All were believed held at Abu Salim.", src: { t: "Amnesty International, MDE 19/002/1991", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190021991en.pdf" } },
  { name: "Ahmad Tholthy arrested, April 1986", when: "April 1986", text: "Ahmad Tholthy was arrested about twenty days after his family returned to Libya from London. His wife, Widad, told Tarikhi she heard nothing of him for a year. He was later held at Abu Salim; he says the intelligence chief Abdallah Senussi once asked him to take the blame for the Lockerbie bombing in return for release, which he refused. This is his own account. The place of arrest is not given.", src: { t: "Abdelkader Tholthy interview, Tarikhi", u: "https://tarikhi.org/interview/abdelkader-tholthy/" } },
  { name: "Death of a prisoner of conscience, late 1988", when: "Late 1988", text: "Amnesty reports that 'Abd al-Qadir Muhammad Al Ya'qoubi, a prisoner of conscience, reportedly died in prison in late 1988. The prison is not named.", src: { t: "Amnesty International, MDE 19/002/1991", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190021991en.pdf" } },
    { name: "Gaddafi tells a Youth Camp to “cut his head”", when: "19 July 1990", text: "Amnesty quotes Gaddafi telling members of a Youth Camp on 19 July 1990 that religious groups should be dealt with by cutting off the head of the person involved. The location is not stated, so the place is not mapped.", src: { t: "Amnesty International, MDE 19/002/1991", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190021991en.pdf" } },
  { name: "Reported coup attempts and mass executions of officers", when: "March – April 1985", text: "The Washington Post reported on 12 April 1985, citing intelligence reports that US officials called reliable, that conservative officers tried a coup at a presidential villa outside Tripoli in early March 1985, that as many as 15 officers were executed, and that a second attempt on a convoy in early April led to the reported execution of at least 60 more. The paper says both were kept secret inside Libya, and I found no second source. The villa is not identified, so the place is not mapped. Wikipedia's history of Libya under Gaddafi separately says a coup attempt in May 1985 was blocked mainly by the Revolutionary Guard, which fought regular army units in a series of street battles; it names no place or casualties and the month differs from the Post's March and April, so these may be the same events or different ones.", src: [cia("cia-rdp90-00965r000201500003-4", "Libyan officers try to murder Qaddafi, U.S. sources say (Washington Post, 12 Apr 1985)"), { t: "History of Libya under Muammar Gaddafi, Wikipedia", u: "https://en.wikipedia.org/wiki/History_of_Libya_under_Muammar_Gaddafi" }] },
  { name: "Two men who took part in the 1984 hangings found killed", when: "Reported April 1985", text: "The same Washington Post report of 12 April 1985 says the public hanging of two Tripoli University students in 1984 had fuelled open dissent among the thousands of students made to watch, and that two people who took part in those executions were later found slain. No names or places are given and the claim is unconfirmed.", src: cia("cia-rdp90-00965r000201500003-4", "Libyan officers try to murder Qaddafi, U.S. sources say (Washington Post, 12 Apr 1985)") },
  { name: "Two Tripoli arrests in January 1989: at a home and near a mosque", when: "January 1989", text: "Amnesty says Ibrahim Saleh Marseet, a Tripoli Agricultural Bank employee, was seized by security forces at his Tripoli home, and that Muftah 'Ali Salem al-Gazwi was arrested at a mosque near his home in Tripoli. Both were held incommunicado and their whereabouts were unknown; neither address is given. 'Aqoub Yusuf Abu-Hatiya was arrested in Sabha by Revolutionary Committee members and taken to an unknown place in Tripoli.", src: { t: "Amnesty International, MDE 19/003/1992", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190031992en.pdf" } },
  { name: "Political science student arrested in Tripoli", when: "September or October 1991", text: "Amnesty lists Tareq al-Sharef, a political science student, as arrested in Tripoli in September or October 1991 and believed held incommunicado. No place of arrest is given.", src: { t: "Amnesty International, MDE 19/003/1992", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190031992en.pdf" } },
  { name: "Chadian leader Goukouni Oueddei shot during his arrest", when: "August – October 1985", text: "Wikipedia says Goukouni Oueddei, the exiled former Chadian president, was placed under house arrest in Tripoli in August 1985 after Libya disapproved of his plans to negotiate with Hissène Habré, and that in October 1985 Libyan police arrested him and shot him in the stomach. He later left for Algiers in February 1987. The address is not given.", src: { t: "Goukouni Oueddei, Wikipedia", u: "https://en.wikipedia.org/wiki/Goukouni_Oueddei" } },
  { name: "Alleged arrest of a Tunisian with a suitcase bomb", when: "1987", text: "Wikipedia's article on the National Front for the Salvation of Libya says Libyan intelligence later claimed it had stopped an NFSL bombing campaign in 1987 and that a Tunisian was arrested in Tripoli carrying a suitcase bomb. This is a claim made by Libyan intelligence, with no place or name given.", src: { t: "National Front for the Salvation of Libya, Wikipedia", u: "https://en.wikipedia.org/wiki/National_Front_for_the_Salvation_of_Libya" } },
  { name: "Gaddafi on the prisoners freed in 1988", when: "May – June 1988", text: "In a television interview broadcast on 3 May 1988 (FBIS), Gaddafi said men sentenced after the two earlier attempts on the revolution had faced execution or life terms “without investigation”, that he had delayed the beheading of those who tried to “steal the revolution”, and that at times of transformation many innocent people are sacrificed. On 12 June 1988, speaking at a hall he called Freedom Hall, he presented the Green Document, saying the death penalty would apply only to someone whose life endangers society. The hall's location is not stated in the translation.", src: [cia("cia-rdp05-01559r000400430033-2", "Al-Qadhdhafi recalls pre-revolution days (FBIS, 6 May 1988)"), cia("cia-rdp05-01559r000400430034-1", "Al-Qadhdhafi speech (FBIS, 13 June 1988)")] },
  { name: "Six men executed after a television announcement", when: "10 November 1992", text: "Libyan television announced on 10 November 1992 that six men had been sentenced to death and executed that morning for offences including rape and murder, and showed pictures of them before execution the next day. Amnesty did not know their names and, citing the code of criminal procedure, says executions generally take place in prisons without naming the prison. These were the first officially announced executions in more than five years, according to Amnesty's 1993 paper. No place is given, so this is not mapped.", src: [{ t: "Amnesty International, MDE 19/005/1992", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190051992en.pdf" }, { t: "Amnesty International, MDE 19/003/1993", u: "https://www.amnesty.org/es/wp-content/uploads/2021/06/mde190031993en.pdf" }] },
  { name: "Foreign special forces and CIA help for the 2011 rebels (reported)", when: "March – August 2011", text: "Reuters reported on 31 March 2011, citing government sources, that President Obama had signed a secret “finding” authorising covert US support for the rebels; the White House said no decision had been made on arming them. The New York Times, as quoted by the Atlantic Council, said CIA officers were in Libya, including former staff of the Tripoli station, and that dozens of British special forces and MI6 officers were reportedly operating there, with US officials saying the Western operatives were not directing the rebels. A Washington Post report dated 22 August 2011 says British, French and Qatari special forces were on the ground advising the rebels, that the US shared satellite and drone imagery and intercepts, and that CIA operatives inside Libya contributed; it describes the plan as a pincer from the south and west. Wikipedia's article on the battle adds that British and Qatari authorities supplied communications equipment to rebel cells in Tripoli, and one Russian-language report says Qatari special forces took part in the assault on the compound, which I could not confirm. None of these sources names a Tripoli address.", src: [{ t: "Atlantic Council: US and Britain have deployed clandestine forces in Libya (Reuters and NYT, March 2011)", u: "https://www.atlanticcouncil.org/blogs/natosource/us-and-britain-have-deployed-clandestine-forces-in-libya/" }, { t: "Atlantic Council: intelligence and special forces from allies helped rebels take Tripoli (Washington Post, 22 Aug 2011)", u: "https://www.atlanticcouncil.org/?p=63267" }, { t: "Battle of Tripoli (2011), Wikipedia", u: "https://en.wikipedia.org/wiki/Battle_of_Tripoli_(2011)" }] },
  { name: "Tripoli militia clashes, October 2017", when: "1–17 October 2017", text: "Wikipedia's list of western Libya clashes gives several: on 1 October the Tripoli Revolutionaries Brigade fought the Nawasi Brigade in Gurji (Massara) and near the Brigade's headquarters in Shara al-Shatt, leaving three dead; on 4 October the Brigade and others took camps at Qasr Bin Ghashir, Sayah and Wadi Rabea from Gaddafi loyalists, with two killed; on 6 October two brigades fought in Arada and Ain Zara, leaving four dead and 17 injured; and on 16–17 October Rada fought armed youths in Ghararat near Mitiga airport and the Nawasi Brigade fought Brigade 50 at the port. I read these only in Wikipedia's table and did not open the original reports.", src: [{ t: "Western Libya clashes (2016–2018), Wikipedia", u: "https://en.wikipedia.org/wiki/Western_Libya_clashes_(2016%E2%80%932018)" }] },
  { name: "Bashagha's government enters Tripoli and fighting follows", when: "17 May 2022", text: "Wikipedia says the parliament-appointed government of Fathi Bashagha arrived in Tripoli on 17 May 2022, that this led to several hours of fighting between armed groups, and that the government team had to withdraw. The article names no neighbourhoods or casualties for this day.", src: [{ t: "2022 Tripoli clashes, Wikipedia", u: "https://en.wikipedia.org/wiki/2022_Tripoli_clashes" }] },
  { name: "Heavy fighting across Tripoli, 26–27 August 2022", when: "26–27 August 2022", text: "The unity government's health ministry reported 32 killed and 159 injured. Libya Security Monitor says the fighting began between Haithem Tajouri's 777 Brigade and groups tied to the Internal Security Agency and spread through more than a dozen armed groups, with pro-Bashagha forces trying to use it to remove Prime Minister Dbeibah and failing. NBC reported an earlier toll of 23 dead, including the comedian Mustafa Baraka, with 64 families evacuated, hospitals shelled and ambulances barred from reaching civilians, and the UN mission describing indiscriminate medium and heavy shelling of civilian neighbourhoods. The International Rescue Committee described the dead as civilians. None of these sources names the districts hit, so it is not mapped.", src: [{ t: "Libya Security Monitor: Pro-Bashaagha forces move on Tripoli (August 2022)", u: "https://libyasecuritymonitor.com/?p=7366" }, { t: "NBC News: At least 23 killed, 140 wounded after clashes in Libya’s capital", u: "https://www.nbcnews.com/news/world/23-killed-140-wounded-clashes-break-libyas-capital-rcna45136" }, { t: "International Rescue Committee: Deadly clashes in Libya’s capital result in civilian casualties", u: "https://www.rescue.org/eu/press-release/deadly-clashes-libyas-capital-result-civilian-casualties" }] },
  { name: "Coup seizures in Tripoli, 1 September 1969", when: "1 September 1969", text: "Wikipedia says the Free Officers' coup was launched at Benghazi and finished within two hours, and that military control of Tripoli was established within a few days. In Tripoli, Umar Muhayshi took over the Tripoli barracks, Abdessalam Jalloud seized the city's anti-aircraft batteries, and Khweldi Hameidi took the Tripoli radio station and was sent to arrest Crown Prince Hasan ar-Rida. Airports, police depots, radio stations and government offices in Tripoli and Benghazi were occupied. The article names no street or address and gives no casualty figures, so it is not mapped.", src: [{ t: "1969 Libyan revolution, Wikipedia", u: "https://en.wikipedia.org/wiki/1969_Libyan_revolution" }] },
  { name: "Mutiny reported against orders to invade Tunisia, 31 August 1985", when: "31 August 1985", text: "An FBIS report of 3 September 1985, citing Egypt's Al-Ahram via the Middle East News Agency, says army and air force units mutinied on 31 August, refusing orders to invade Tunisia; that Gaddafi's special forces put it down and arrested 43 senior officers; and that the air force mutineer, a base commander near the Tunisian border, tried to send aircraft against Gaddafi's headquarters. It adds that Libyan media had not reported any rebellion. A Washington Post column of 6 November 1985 says the loyal guards, including East Germans, halted the planes and tanks the mutineers had ordered to attack Tripoli, and that at least 13 senior air force officers and 30 army officers were arrested. The two accounts differ on the numbers, and both rest on unnamed sources. The headquarters is not named, so this is not mapped.", src: [cia("cia-rdp05-01559r000400400055-1", "FBIS Middle East and South Asia Review, 3 Sep 1985"), cia("cia-rdp90-00965r000706950015-2", "Washington Post: Libya’s Qaddafi is heading for a fall, 6 Nov 1985")] },
  { name: "Battalion mutiny at Tarhuna after the US raid, 16 April 1986", when: "16 April 1986", text: "A CIA talking-points memo from May 1986 says a battalion of troops apparently mutinied at Tarhuna, outside Tripoli, on 16 April and was put down by loyal air force units, and that there were also skirmishes between regular troops and the Revolutionary Committees in the immediate aftermath of the raids. Tarhuna is a town some 60 km from the city, so it is not mapped; the gun battle seen at Bab al-Aziziya in the same days is on the map.", src: [cia("cia-rdp91b00874r000100160006-9", "Talking points: the Libyan domestic situation (May 1986)")] },
  { name: "First aerial reconnaissance and first bombing, October–November 1911", when: "23 October and 1 November 1911", text: "The Italo-Turkish War article says the first aerial reconnaissance flight took place on 23 October 1911 and the first aerial bombing on 1 November 1911 near Tajura and Ain Zara. The Shar al-Shatt article names the 23 October pilots as Captain Carlo Maria Piazza and Captain Riccardo Moizo, and adds that their flights were not real reconnaissance. The exact spots bombed are not given.", src: [{ t: "Italo-Turkish War, Wikipedia", u: "https://en.wikipedia.org/wiki/Italo-Turkish_War" }, { t: "Battle and massacre at Shar al-Shatt, Wikipedia", u: "https://en.wikipedia.org/wiki/Battle_and_massacre_at_Shar_al-Shatt" }] },
  { name: "Attacks on fuel stations in Tripoli, claimed for September 1979", when: "September 1979", text: "A Cairo magazine, Akhir Sa'a, quoted by the Middle East News Agency and translated by JPRS in December 1979, said opposition forces made a surprise attack on six fuel stations in Tripoli and one in Zuwarah on a night in September, and that the plan was made in Tripoli, Zuwarah and Sabha. The same report claims a bombing at Surt that killed 80 people. It is an Egyptian press claim during a hostile period, the date is garbled in the translation, and I found no second source, so treat it as unconfirmed. The stations are not named.", src: [{ t: "JPRS Near East/North Africa Report 2054, 5 Dec 1979 (citing Akhir Sa’ah)", u: "https://archive.org/details/jprs-report_jprs-74716" }] },
  { name: "Eight men executed after a military trial, announced 2 January 1997", when: "1 and 2 January 1997", text: "Amnesty says eight men were executed on 2 January 1997: Colonel Miftah Qarrum al-Wirfalli, Major Ramadhan al-'Ayhuri, Major Khalil Salam Mohammad al-Jidiq, Colonel Mostafa Abu al-Qassim Mas'ud al-Kikli, Lieutenant-Colonel Sa'ad Saleh Farag, Major Mostafa Ihbayl al-Firjani, Dr Sa'ad Misbah al-'Amin al-Zubaydi and Sulayman Ghayth Miftah, six of them senior officers and two civilians. Libyan television said the Supreme Military Court had upheld the sentences for passing defence secrets to a foreign state (the United States) and belonging to the banned National Front for the Salvation of Libya. Six other officers and two civilians were acquitted. Amnesty says three of the eight had appeared on television in March 1994 confessing to spying for the US and were allegedly tortured into confessing; they had been arrested after the October 1993 rebellion by army units around Misrata. Executed Today adds that the National Front said the real offence was the failed 1993 revolt. Neither source names the court, the prison or the place of execution, so it is not mapped.", src: [{ t: "Amnesty International, Libya: eight men executed (MDE 19/002/1997)", u: "https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190021997en.pdf" }, { t: "Executed Today: 1997, eight foes of Qaddafi", u: "https://www.executedtoday.com/2014/01/02/1997-eight-foes-of-qaddafi/" }] },
  { name: "People's Court in Tripoli sentences two to death in the Islamic Group trial", when: "16 February 2002", text: "Amnesty says 152 professionals and students arrested in 1998 on suspicion of backing the banned Libyan Islamic Group, which it says was not known to have used or advocated violence, were held in secret detention for over two years, and that on 16 February 2002 a People's Court in Tripoli sentenced Abdullah Ahmed Izzedin and Salem Abu Hanak to death. Amnesty reports 73 others got life, 11 got ten years and 66 were acquitted. Some defendants alleged torture and no thorough investigation is known. The appeal opened in summer 2002 and was repeatedly adjourned; Amnesty believed the 86 men still held were at Abu Salim. A Jamestown article reports an appeal court upheld the two death sentences and the ten-year terms on 2 December, with the year not stated clearly in the page I read. The State Department says the government released 86 Muslim Brotherhood prisoners from Abu Salim on 2 March 2006, which matches the number Amnesty said were still held. The court building is not named.", src: [{ t: "Amnesty International Report 2003: Libya (via Refworld)", u: "https://www.refworld.org/node/30583" }, { t: "Amnesty International, Libya: trial of the Islamic Group (MDE 19/020/2003)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/06/mde190202003en.pdf" }, { t: "Jamestown: Hasty prosecutions of the Libyan Muslim Brotherhood", u: "https://jamestown.org/?p=63378" }, { t: "US State Department, Country Reports on Human Rights Practices for 2006: Libya", u: "https://jewishvirtuallibrary.org/report-on-human-rights-practices-for-2006-libya" }] },
  { name: "Trial of the Bulgarian nurses and Palestinian doctor in Tripoli", when: "February 2000 – July 2007", text: "RFE/RL's timeline says five Bulgarian nurses, a Bulgarian doctor, a Palestinian doctor and nine Libyans went on trial in Tripoli in February 2000 on charges of deliberately infecting hundreds of children with HIV, with the trial postponed repeatedly amid allegations of torture. The medics were sentenced to death in May 2004; the Supreme Court overturned the verdicts on 25 December 2005 and ordered a retrial, which began on 11 May 2006; a court sentenced the six to death again in December 2006 and the Supreme Court upheld the sentences on 11 July 2007. Amnesty says a Tripoli court acquitted police officers and a doctor of torturing them in June 2005, and describes electric shocks, beatings and suspension by the arms. The hospital involved, al-Fateh Children's Hospital, is in Benghazi, and neither source names the Tripoli court building or the prison.", src: [{ t: "RFE/RL: Libya foreign medics timeline", u: "https://www.rferl.org/a/1077564.html" }, { t: "Amnesty International, Libya: the Bulgarian and Palestinian health professionals (MDE 19/005/2006)", u: "https://www.amnesty.org/en/wp-content/uploads/2021/08/mde190052006en.pdf" }] },
  { name: "Dissident Fathi al-Jahmi held in Tripoli, 2002–2009", when: "19 October 2002 – May 2009", text: "Human Rights Watch says internal security forces arrested Fathi al-Jahmi on 19 October 2002 after he criticised Gaddafi, a court sentenced him to five years, an appeals court ordered his release in March 2004, and agents arrested him again on 26 March 2004 with his wife and eldest son. A secret trial began in late 2005 and in May 2006 a court found him mentally unfit and sent him to a psychiatric hospital; in July 2007 he was moved to the Tripoli Medical Center, where Human Rights Watch and Physicians for Human Rights visited him in March 2008 and found state security officers controlling access. Amnesty's report for 2009 says he was released from jail in a coma in May 2009. A medical journal article says he was flown to Jordan on 5 May 2009 and died there on 20 May 2009, aged 68. Amnesty's 2004 report puts him at Ain Zara at one point (see the Ain Zara prison pin). The location of his first detention is not given.", src: [{ t: "Human Rights Watch: Libya, free hospitalised political prisoner (28 Mar 2008)", u: "https://www.hrw.org/news/2008/03/28/libya-free-hospitalized-political-prisoner" }, { t: "Health and Human Rights Journal: Two Libyan prisoners, two paradoxical fates (2009)", u: "https://www.hhrjournal.org/2009/11/04/two-libyan-prisoners-two-paradoxical-fates/" }, { t: "US State Department, 2010 Country Reports on Human Rights Practices: Libya (via Refworld)", u: "https://www.refworld.org/node/78703" }] },
  { name: "Ismail al-Khazmi dies in custody in a Tripoli prison", when: "2006 (acknowledged about a year later)", text: "The US State Department's 2010 country report says Ismail al-Khazmi was taken from his workplace, reportedly tortured in a Tripoli prison and died in custody, and that the government held no transparent inquiry into the death. It does not name the prison or give the exact date.", src: [{ t: "US State Department, 2010 Country Reports on Human Rights Practices: Libya (via Refworld)", u: "https://www.refworld.org/node/78703" }] },
  { name: "Arrests before a planned Tripoli demonstration, and sentences for eleven men", when: "16–17 February 2007; sentences 10 June 2008", text: "The World Organisation Against Torture says eleven men were arrested on 16 and 17 February 2007 over a planned peaceful demonstration in Tripoli against the authorities, to mark the first anniversary of a Benghazi demonstration in which at least 12 people were killed. On 10 June 2008 a state security court in Tripoli, reportedly inside Abu Salim prison, sentenced them to between six and 25 years: writer Jamal al-Hajji, Dr Idris Bufayed, writer Fareed Azway, lawyer Almahdi Hmeed and Assadiq, Faraj and Ali Hmeed, Ala Adrisi, Assadiq Gashoot, Bashir Alharis and Ahmad Alabeedi; Adel Hmeed was reportedly released the same day. Before trial some were held at Jdeida or Ain Zara. Dr Bufayed was treated for cancer at a hospital in Sabratha. The State Department's report for 2006 adds that Idrees Mohammed Boufayed (the same man, spelled differently) was ordered to report to the Internal Security Agency's main office in Tripoli after returning from Switzerland on 30 September 2006, was detained on 5 November and released on 29 December. Amnesty says al-Hajji was released in March 2009 and arrested again on 9 December 2009 (see the Jdeida prison pin). The planned demonstration site is not named, so this is not mapped.", src: [{ t: "OMCT: eleven demonstration organisers sentenced in Libya (2008)", u: "https://www.omct.org/en/resources/urgent-interventions/follow-up-of-case-lby-031207-two-released-and-eleven-demonstration-organisers-sentenced" }, { t: "US State Department, Country Reports on Human Rights Practices for 2006: Libya", u: "https://jewishvirtuallibrary.org/report-on-human-rights-practices-for-2006-libya" }] },
  { name: "Migrants pushed back by Italy to Tripoli, May–July 2009", when: "6 May – 1 July 2009", text: "Human Rights Watch says that on 6 May 2009 an Italian patrol boat intercepted about 80 migrants whose boat had drifted for at least 48 hours and landed them at a dock in Tripoli, where Libyan authorities immediately detained them; that on 18 June 2009 about 75 migrants were handed to a Libyan patrol boat, taken to Tripoli and handed to a Libyan military unit; and that on 1 July 2009 UNHCR interviewed 82 people, 76 of them Eritreans, returned by the Italian navy, who said they were given no food during a 12-hour operation, had their papers confiscated and were all detained on arrival. Migrants told Human Rights Watch that police and thugs entered their homes in Tripoli and Benghazi to attack, extort and arrest them, and that smugglers held some as virtual prisoners in those cities. Libya did not let Human Rights Watch visit migrant detention centres in April 2009. The dock and the detention sites in Tripoli are not named.", src: [{ t: "Human Rights Watch, Pushed Back, Pushed Around (Sept 2009)", u: "https://www.hrw.org/reports/italy0909webwcover.pdf" }] },
  { name: "Opponents returned to Libya by the US and UK, 2004", when: "March – August 2004; releases 2010–11", text: "Human Rights Watch says Abdul Hakim Belhadj, seized in Malaysia with British help and held briefly by the CIA in Thailand, was sent to Libya around 9 March 2004 and received by Musa Kusa; that Sami al-Saadi was rendered from Hong Kong days after Tony Blair's visit of 25 March 2004; and that Khalid al-Sharif, after about two years in US custody, was abused again in Libya and sentenced to death by firing squad. All three were released on 23 March 2010. Mohammed Shoroeiya, Saleh Di'iki and Majid al-Maghrebi were returned around 22 August 2004; Shoroeiya was sentenced to life and released on 16 February 2011. The visible part of the report does not say where in Libya they were held, so none of this is mapped.", src: [{ t: "Human Rights Watch, Delivered into Enemy Hands (2012)", u: "https://www.hrw.org/report/2012/09/05/delivered-enemy-hands/us-led-abuse-and-rendition-opponents-gaddafis-libya" }] },
  { name: "Police sweeps against migrants in Tripoli, 2002–2005", when: "2002 – May 2005", text: "Human Rights Watch says police ran sweeps in the Tajura market on Tuesdays and Thursdays in 2002, where a Darfur man was held five days with more than 100 people and then about two months without charge; that in mid-2004 street sweeps and house-to-house raids in Tripoli sent detainees to a facility a Liberian witness called “Janzur”, a small open building without food or healthcare, where he claimed some died of suffocation, trauma and hunger; that in September 2004 police arrested 31 refugees and asylum seekers holding UNHCR letters, most held at the al-Fellah deportation facility until African Union ambassadors intervened; that in October 2004 the government prepared to deport hundreds after Italy returned migrants and refused UNHCR access; and that in April–May 2005 Human Rights Watch visited al-Fellah and interviewed nine people awaiting deportation. The report says the earlier violence in Zawiya in September 2000 killed up to fifty according to press reports and seven according to the government. The al-Fellah and Janzur sites are not located, and the Gurji raid of September 2003 is on the map.", src: [{ t: "Human Rights Watch, Stemming the Flow (September 2006)", u: "https://www.hrw.org/report/2006/09/12/stemming-flow/abuses-against-migrants-asylum-seekers-and-refugees" }] },
  { name: "Two Swiss businessmen barred from leaving Libya, 2008–2010", when: "July 2008 – June 2010", text: "Swissinfo says Max Göldi and Rachid Hamdani were arrested in July 2008 and prevented from leaving Libya after the arrest of one of Muammar Gaddafi's sons in Geneva; on 30 November 2009 Göldi was sentenced to 16 months and fined for visa violations, which was cut on appeal to four months plus a fine for illegally doing business. Hamdani was acquitted on appeal, got an exit visa on 22 February 2010 and returned to Switzerland. Göldi gave himself up in February 2010 and was taken to prison in handcuffs in Tripoli; his lawyer said he was released on 10 June 2010. The article does not name the prison, and the earlier detention was in effect a travel ban.", src: [{ t: "Swissinfo: Swiss hostage in Libya freed (June 2010)", u: "https://www.swissinfo.ch/eng/swiss-hostage-in-libya-freed/9074240" }] },
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
