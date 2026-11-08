/* Hand-added detail for the place panels, keyed by pin or area id.
   Everything here is optional; a pin without an entry still gets a full panel built from sites.js.
   Footnote numbers ("src") point into that pin's own sources list in sites.js, counting from 1.
   A line with no src shows a "source?" mark, so unsourced lines stay visible as such.

   Fields (all optional):
     kind       'site' | 'event'      override how the pin is shown (default: from its layer)
     bottom     string                bottom line; default is the pin's "relevance"
     bottomSrc  [n]
     condition  string                Site: present condition
     date       string                Event: date as it should read, e.g. '28–29 June 1996'
     toll       string                Event: shown only when set, e.g. 'Up to 1,200 (est.)' or 'Disputed'
     area       area id               Event or site: the neighbourhood / district / town it belongs to
     events     [{ y, d, t, src }]    Site: chronology by year (d = optional day, e.g. '4 Oct')
     sequence   [{ w, t, src }]       Event: sequence by day or hour (w = when, e.g. '29 Jun 10:45')
     conflicts  [{ t, src }]          Event: where sources disagree
     reporting  [{ who, t, src }]     Accounts from detainees, residents, witnesses. who = who and how close
*/
window.ATLAS_PANELS = {
  abusalim: {
    bottom: "Abu Salim was the regime's main prison for political prisoners from 1984 until 2011. People arrested for opposing the government, or only suspected of it, were held here for years, often without trial, and interrogated in underground rooms.",
    bottomSrc: [4],
    events: [
      { y: 1984, t: 'Opens inside the Military Police compound. The first political prisoners arrive after the May attack on Bab al-Aziziya.', src: [8, 3] },
      { y: 1988, t: '426 of its 530 political prisoners released in a March amnesty; many others stay.' },
      { y: 1989, t: 'At least 394 arrested between January 1989 and April 1990, many held here.', src: [11] },
      { y: 1997, t: 'Amnesty describes underground interrogation and torture rooms beneath the administration building.', src: [4] },
      { y: 2006, d: '4 Oct', t: 'Security forces reportedly kill at least one prisoner and wound at least nine.', src: [5] },
      { y: 2009, t: 'Human Rights Watch let in (April). In October the authorities announce demolition and release 88 Islamist prisoners; about 200 who had served their time stay held.', src: [17] },
      { y: 2010, t: '214 released on 24 March and 37 on 31 August.', src: [18] }
    ],
    reporting: [
      { who: 'Former detainee · firsthand', t: 'Ausama Shwehdy: the prison was new, and he was among its first inmates.', src: [8] },
      { who: 'Former detainee · firsthand', t: 'Salah Houni: brought from Benghazi in March 1990, made to stand blindfolded facing a wall for twelve hours, beaten that night, then 21 months in a damp 2 × 3 m cell.', src: [14] },
      { who: 'Detainee’s wife · firsthand', t: 'Widad Tholthy: on her first visit, after the walls came down in April 1988, she saw prisoners lined up against a wall.', src: [13] },
      { who: 'Former detainee · firsthand', t: 'Maayouf Halasa: arrested at home on 11 May 1984 and held about three years, mostly here.', src: [7] },
      { who: 'Family member', t: 'Jamila Fallag: two of her brothers, arrested after the 1984 raid, were held here for about four years.', src: [9] },
      { who: 'Family member', t: 'Dheiba Diaf Zirti: Othman Zirti handed himself in on 11 May 1984, was interrogated here for 26 days, and was hanged on 5 June.', src: [6] }
    ]
  },

  'mk-abusalim': {
    date: '28–29 June 1996',
    toll: 'Up to 1,200 (est.)',
    sequence: [
      { w: '28 Jun 16:30', t: 'Three inmates seize the keys from a guard delivering dinner; Blocks 3 to 6 are opened.', src: [3] },
      { w: '28 Jun', t: 'Seven men shot dead in the courtyards. The seven dead and 120 seriously ill prisoners are taken away on buses, presumed killed.', src: [3] },
      { w: '29 Jun dawn', t: 'Prisoners from Blocks 1 and 2 led into a walled courtyard between the political and military wings.', src: [3] },
      { w: '29 Jun 10:45', t: 'Explosions, then about two hours of automatic fire.', src: [3] },
      { w: '2010', t: 'About 800 families have received death certificates, without bodies or causes of death.', src: [6] }
    ],
    conflicts: [
      { t: 'Date: the survivor dates it 28–29 June; other sources say 29 June.', src: [3] },
      { t: 'Amnesty’s first statements (July 1996) give 5 July and “scores” killed, from unverified reports.', src: [7, 8] },
      { t: 'Toll: up to 1,200 (rights groups) vs 1,270 (former prisoner Saleh Quosmy).', src: [1, 4] }
    ]
  },

  'as-benashour': {
    toll: 'Disputed',
    area: 'ben-ashour',
    sequence: [
      { w: '15 Apr 1986', t: 'One F-111 assigned to the barracks hits a residential area near the French embassy.', src: [3] },
      { w: '15 Apr 1986', t: 'About ten apartment buildings damaged; a bomb behind the French embassy kills a family.', src: [1] },
      { w: '17 Apr 1986', t: 'Western diplomats put the dead at “at least 100” in Tripoli alone. Early estimate, unverified.', src: [6] },
      { w: 'Jun 1986', t: 'The CIA notes the funeral procession drew only several thousand marchers in a city of about 900,000.', src: [7] }
    ],
    conflicts: [
      { t: 'Toll: at least 100 in Tripoli alone (diplomats, April 1986) vs 45 military and government personnel and 15 civilians across Tripoli and Benghazi.', src: [6, 8] },
      { t: 'French embassy: “narrowly missed” in one place, hit in a footnote, in the same article.', src: [5] }
    ],
    reporting: [
      { who: 'Resident, aged 15 · recollection', t: 'Living on Ben Ashour Street, he found his parents unconscious under dust and was told neighbours had died.', src: [4] },
      { who: 'Neighbours · recollection', t: 'A bomb fell on the Meshergi family’s villa; a blast near the French embassy killed the Shirmit family’s daughter.', src: [4] },
      { who: 'Neighbour · recollection', t: 'A childhood friend of the boy’s brother was left paralysed after a wall fell on him.', src: [4] },
      { who: 'Neighbour · recollection', t: 'A Palestinian neighbour, Bassam Al Wifani, is said to have lost a daughter who died of fear.', src: [4] }
    ]
  },

  bab: {
    condition: 'Demolished after 2011',
    events: [
      { y: 1984, d: '8 May', t: 'Attacked by an armed opposition group; mass arrests follow, and many of those held end up in Abu Salim.', src: [1, 2] },
      { y: 1986, d: '15 Apr', t: 'Bombed by US aircraft.', src: [1] },
      { y: 2011, t: 'Demolished after 2011.', src: [1] }
    ]
  },

  wheelus: { condition: 'Now Mitiga airport' },
  fateh: { condition: 'Open, as the University of Tripoli' },
  'dt-gurji-2003': { kind: 'event' }
};
