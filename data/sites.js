/*
  Historical sites, 1969–1989.
  level: documented | testimony | suspected | context
  r: position uncertainty in km
*/
window.ATLAS_LAYERS = {
  detention: { label: 'Prisons & detention', code: 'P', color: '#ff5d52' },
  military:  { label: 'Military installations', code: 'M', color: '#ffb224' },
  power:     { label: "Gaddafi's residences & seats of power", code: 'G', color: '#c792ff' },
  landmark:  { label: 'Landmarks & events', code: 'L', color: '#4cc9f0' }
};

window.ATLAS_LEVELS = {
  documented: 'Documented for 1969–1989',
  testimony:  'Named in testimony · area only',
  suspected:  'Existed · period unverified',
  context:    'Context site'
};

window.ATLAS_SITES = [
  {
    id: 'abusalim', layer: 'detention', level: 'documented',
    name: 'Abu Salim prison', ar: 'سجن أبو سليم',
    lat: 32.8333, lon: 13.1739, r: 1, period: 'Completed 1984',
    relevance: "The main prison for political prisoners under Gaddafi. People arrested for opposing the government, or only suspected of it, were held here, often for years without trial.",
    text: "Built inside the Military Police Command compound in the Abu Salim district to replace the colonial-era Black Horse prison. The first political prisoners arrived after the arrests that followed the May 1984 attack on Bab al-Aziziya. In March 1988, 426 of its 530 political prisoners were released in an amnesty, but many others stayed. More arrests of religious activists and suspected opponents followed in 1989 and 1990. In June 1996, after the period on this map, more than 1,000 prisoners were killed here.",
    sources: [
      { t: 'Abu Salim prison, Wikipedia', u: 'https://en.wikipedia.org/wiki/Abu_Salim_prison' },
      { t: 'Human Rights Solidarity Organization, Abu Salim annex', u: 'https://hrsly.com/en/annex-1-the-abu-salim-prison-massacre/' },
      { t: 'Amnesty International (1992)', u: 'https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190031992en.pdf' }
    ]
  },
  {
    id: 'jdeida', layer: 'detention', level: 'testimony',
    name: 'Jdeida prison', ar: 'سجن الجديدة',
    lat: 32.73, lon: 13.10, r: 3.5, period: 'Named for the 1980s',
    relevance: "A civilian prison where political detainees were sent after interrogation elsewhere, including people brought from Benghazi.",
    text: "A former detainee describes three months of interrogation at the 7 April prison in Benghazi before transfer to the civilian prison of Jdeida in Tripoli. Human Rights Watch also lists Jdeida among possible detention sites in Tripoli in 2011. The marker shows the Jdeida area only; the exact building is not documented in these sources.",
    sources: [
      { t: 'Abubaker Shareef interview, Tarikhi', u: 'https://tarikhi.org/interview/abubaker-shareef/' },
      { t: 'Human Rights Watch (2011)', u: 'https://www.hrw.org/node/97287' }
    ]
  },
  {
    id: 'maktab', layer: 'detention', level: 'suspected',
    name: 'Maktab al-Nasser',
    lat: 32.840, lon: 13.179, r: 2, period: 'Dates unverified',
    relevance: "An internal security office that also held prisoners, many of whom were later moved to Abu Salim.",
    text: "Described as a prison and internal security office in the Abu Salim district before 2011. Sources give no start date, so use during 1969–1989 is unconfirmed. Placed by district only.",
    sources: [ { t: 'Maktab al-Nasser prison, Wikipedia', u: 'https://en.wikipedia.org/wiki/Maktab_al-Nasser_prison' } ]
  },
  {
    id: 'hadba', layer: 'detention', level: 'suspected',
    name: 'Hadba al-Khadra prison', ar: 'سجن الهضبة الخضراء',
    lat: 32.8444, lon: 13.191, r: 1.8, period: 'Dates unverified',
    relevance: "Best known after 2011, when senior officials of the former government were held here.",
    text: "A Ministry of Defence facility in the Hadba al-Khadra area. No source found shows it in use during 1969–1989. Reported locations differ by a kilometre or more.",
    sources: [ { t: 'Reuters (2017)', u: 'https://reuters.screenocean.com/record/877072' } ]
  },
  {
    id: 'ainzara', layer: 'detention', level: 'suspected',
    name: 'Ain Zara prison', ar: 'سجن عين زارة',
    lat: 32.79, lon: 13.27, r: 3, period: 'Dates unverified',
    relevance: "A long-running state prison on the southeast edge of Tripoli.",
    text: "A Ministry of Justice prison in the Ain Zara suburb. Human Rights Watch lists it among possible detention sites in 2011. No source found confirms political detention here between 1969 and 1989. Placed by suburb only.",
    sources: [
      { t: 'USIP, Prisons and Detention in Libya', u: 'https://www.usip.org/sites/default/files/PW119-Prisons-and-Detention-in-Libya.pdf' },
      { t: 'Human Rights Watch (2011)', u: 'https://www.hrw.org/node/97287' }
    ]
  },

  {
    id: 'wheelus', layer: 'military', level: 'documented',
    name: 'Okba Ben Nafi Air Base (former Wheelus)', ar: 'قاعدة عقبة بن نافع الجوية',
    lat: 32.8941, lon: 13.2760, r: 0.8, period: 'Handed over 1970',
    relevance: "Removing this large American air base was one of the new government's first big moves after the 1969 coup, and a point of national pride in Gaddafi's speeches.",
    text: "Wheelus Air Base was a major US Air Force base on Tripoli's eastern coast. The United States withdrew in 1970 and the base was renamed Okba Ben Nafi Air Base. Today it is Mitiga airport.",
    sources: [ { t: 'Mitiga International Airport, Wikipedia', u: 'https://en.wikipedia.org/wiki/Mitiga' } ]
  },
  {
    id: 'tip', layer: 'military', level: 'documented',
    name: 'Tripoli military airport', ar: 'مطار طرابلس الدولي',
    lat: 32.6635, lon: 13.159, r: 1.5, period: 'Struck April 1986',
    relevance: "One of the targets of the April 1986 US air strikes on Libya.",
    text: "The military side of Tripoli's international airport, south of the city, was hit by US F-111 aircraft during the April 1986 strikes, along with Bab al-Aziziya and the Sidi Bilal camp.",
    sources: [ { t: 'US Air Force Historical Support Division, Operation El Dorado Canyon', u: 'https://www.afhistory.af.mil/FAQs/Fact-Sheets/Article/458950/operation-el-dorado-canyon' } ]
  },
  {
    id: 'sidibilal', layer: 'military', level: 'documented',
    name: 'Murat Sidi Bilal camp', ar: 'مرسى سيدي بلال',
    lat: 32.830, lon: 13.000, r: 4, period: 'Struck April 1986',
    relevance: "A coastal training camp west of Tripoli that the United States struck in April 1986, describing it as a training camp for attacks abroad.",
    text: "Listed by the US Air Force among the Tripoli targets of the April 1986 strikes. Its exact position is not given in these sources; the marker shows the Janzour coast area.",
    sources: [ { t: 'US Air Force Historical Support Division, Operation El Dorado Canyon', u: 'https://www.afhistory.af.mil/FAQs/Fact-Sheets/Article/458950/operation-el-dorado-canyon' } ]
  },

  {
    id: 'bab', layer: 'power', level: 'documented',
    name: 'Bab al-Aziziya compound', ar: 'باب العزيزية',
    lat: 32.848, lon: 13.151, r: 0.8, period: 'Throughout 1969–1989',
    relevance: "Gaddafi's home and command headquarters, the centre of power in Libya. Both the 1984 attack and the 1986 US bombing were aimed here.",
    text: "A fortified barracks in southern Tripoli that Gaddafi expanded in the 1980s. On 8 May 1984 an armed opposition group attacked it; mass arrests across Libya followed, and many of those detained ended up in Abu Salim. On 15 April 1986, US aircraft bombed the compound while Gaddafi's family was inside their residence. The compound was demolished after 2011.",
    sources: [
      { t: 'Bab al-Azizia, Wikipedia', u: 'https://en.wikipedia.org/wiki/Bab_al-Azizia' },
      { t: 'Amnesty International (1992)', u: 'https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190031992en.pdf' }
    ]
  },
  {
    id: 'palace', layer: 'power', level: 'context',
    name: "Royal Palace (People's Palace)", ar: 'قصر الشعب',
    lat: 32.8876, lon: 13.1899, r: 1, period: 'Taken over 1969',
    relevance: "The Tripoli palace of King Idris. After the 1969 coup ended the monarchy it was renamed the People's Palace.",
    text: "A symbol of the old monarchy in central Tripoli. Its renaming marked the new government's break with the king. Position is approximate.",
    sources: [ { t: 'Idris of Libya, Wikipedia', u: 'https://en.wikipedia.org/wiki/Idris_of_Libya' } ]
  },

  {
    id: 'green', layer: 'landmark', level: 'context',
    name: 'Green Square (Martyrs’ Square)', ar: 'الساحة الخضراء',
    lat: 32.8963, lon: 13.1806, r: 0.3, period: 'Renamed after 1969',
    relevance: "Tripoli's main square, renamed Green Square under Gaddafi and used for his rallies and speeches. It is now Martyrs' Square.",
    text: "Beside the Red Castle and the old city walls. The name followed the green of Gaddafi's flag and his Green Book.",
    sources: [ { t: "Martyrs' Square, Tripoli, Wikipedia", u: 'https://en.wikipedia.org/wiki/Martyrs%27_Square,_Tripoli' } ]
  },
  {
    id: 'fateh', layer: 'landmark', level: 'context',
    name: 'Al-Fateh University', ar: 'جامعة الفاتح',
    lat: 32.8565, lon: 13.2257, r: 1, period: '1970s–1980s',
    relevance: "Universities were closely watched by Revolutionary Committees, and students were among those arrested for political or religious activity.",
    text: "Tripoli's main university, now the University of Tripoli. Amnesty International reports that security forces arrested religious students at al-Fateh University in 1989. Position is approximate.",
    sources: [ { t: 'Amnesty International (1992)', u: 'https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190031992en.pdf' } ]
  }
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
