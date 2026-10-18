"""Names that refer to places already on the map, shared by auto-links.py and build-unknown.py."""
# Names Haiku used for mapped places, checked against Wikipedia (Mitiga airport page lists Mellaha, Wheelus, Okba Ben Nafi, Mitiga;
# CIA imagery calls the same airfield "Umm Aitiqah"). Ambiguous names (bare "Bin Ghashir", "Tripoli Prison", "Foreign Secretariat") are left out.
ALIAS = {}
for ident, names in {
    'wheelus': ['wheelus', 'wheelus air base', 'wheelus field', 'wheelus air force base', 'wheelus base', 'okba ben nafi air base (former wheelus)', 'okba ben nafi air base',
                'okba ibn nafa airfield', "'uqbah ibn nafi airbase", 'uqbah ibn nafi airbase', 'umm aitiqah airfield', 'wheelus air base, west tripoli', 'mellaha air base', 'mitiga', 'mitiga airport', 'mitiga international airport', 'mellaha'],
    'tip': ['tripoli international airport', 'tripoli airport', 'tripoli military airport', 'tripoli airfield'],
    'tajura': ['tajura', 'tajoura', 'tajurah'], 'tajura-camp': ['tajura barracks'],
    'lb-us-embassy-tripoli': ['us embassy, tripoli', 'u.s. embassy, tripoli', 'american embassy, tripoli', 'us embassy in tripoli', 'american embassy in tripoli'],
    'palace': ["ash-sha'b palace", 'al-chaab palace', "al-sha'b palace","people's palace", "people's palace, tripoli", "royal palace (people's palace)", 'qasr al-shaab'],
    'green': ['martyrs square, tripoli', 'green square', 'al-khadra square', "martyrs' square", 'martyrs square', 'green square, tripoli'],
    'abusalim': ['abu salim prison', 'abu salim', 'abu slim prison'], 'hadba': ['al-hadba prison', 'hadba prison'],
    'bab': ['bab ziziah compound', 'aziziyah barracks', 'azizia barracks', 'bab al-aziziya barracks, tripoli', 'tripoli barracks (bab al-aziziya area, as described)', 'bab al-aziziya compound', 'bab al-aziziya', 'bab al-aziziyah', 'bab aziziya barracks', 'bab al-azizia', "qadhafi's headquarters", 'aziziya barracks'],
    'janzour': ['janzur', 'janzour', 'zanzur'], 'fateh': ['university of tripoli', 'al-fatih university', 'al fateh university', 'al-fateh university', 'tripoli university'],
    'port': ['tripoli port facilities', 'port of tripoli', 'tripoli port', 'tripoli harbor', 'tripoli harbour', 'tarabulus port facilities'],
    'mk-sharshatt': ['shar al-shatt'], 'zawiyat-dahmani': ['zawiyat al-dahmani'], 'fashloum': ['fashloom', 'fashloum', 'fashlum'], 'bab-ben-ghashir': ['bab ben gashier', 'bab bin ghashir'],
    'tajoura-nuclear': ['tajura nuclear research center', 'tajoura nuclear research centre', 'tajoura nuclear research center'], 'lh-al-waddan-hotel': ['hotel uaddan', 'uaddan hotel', 'al waddan hotel'], 'qasr-ben-ghashir': ['qasr bin ghashir'], 'sidibilal': ['sidi bilal'], 'hay-andalus': ['hay al-andalus'],
    'ain-zara': ['ain zara'], 'lm-7-october-stadium': ['7 october stadium'], 'lb-tripoli-international-stadium': ['june 11 stadium', 'tripoli stadium', '11 june stadium'],
    'lm-radisson-blu-al-mahary': ['radisson blu al mahary hotel tripoli', 'al mahary hotel'], 'military-college': ['military college'],
    'islamic-call': ['islamic call society', 'world islamic call society'], 'bt-1984-bab': ['may 1984 uprising', 'may 1984 attack on bab al-aziziya']
}.items():
    for n in names: ALIAS[n.lower().replace('\u2019', "'")] = ident
