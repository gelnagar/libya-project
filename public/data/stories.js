/* Guided stories: short walks across the map. Each stop is a mapped place; the card text comes from that place's own
   "why it matters" line, so a story never says more than the place panel and its sources. `lead` is the opening card. */
window.ATLAS_STORIES = [
  {
    id: 'road', title: 'The road to Abu Salim', ar: 'الطريق إلى أبو سليم', years: '1984–1996',
    lead: 'How an attack on Gaddafi’s compound in 1984 filled a new prison, and what happened there in 1996.',
    stops: ['bab', 'bt-1984-bab', 'maktab', 'abusalim', 'mk-abusalim']
  },
  {
    id: 'raid1986', title: '15 April 1986', ar: '15 أبريل 1986', years: '1986',
    lead: 'The night US aircraft bombed Tripoli: the targets, and the neighbourhood that was hit by mistake.',
    stops: ['as-bab', 'as-benashour', 'as-sidibilal', 'as-tip']
  },
  {
    id: 'students', title: '7 April: the students', ar: '7 أبريل: الطلاب', years: '1976–1984',
    lead: 'How the university became a stage for protest, and for punishment.',
    stops: ['fateh', 'mk-april1976', 'mk-hang-1984']
  },
  {
    id: 'fall2011', title: '2011: Tripoli rises', ar: '2011: طرابلس تنتفض', years: 'February–August 2011',
    lead: 'From the February shootings to the fall of Bab al-Aziziya in August.',
    stops: ['mk-feb2011', 'bt-2011-feb21', 'bt-2011-uprising', 'bt-2011-tajoura', 'bt-2011-green', 'bt-2011-bab', 'mk-yarmuk-2011', 'bt-2011-abusalim']
  }
];
