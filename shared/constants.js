const STREAM_CONTENT = {
    text: 'Stream Content',
    color: 'secondary',
    order: 1
};
const APPEARANCES = {
    text: 'Appearances',
    color: 'info',
    order: 2
};
const CAMEOS = {
    text: 'Cameos',
    color: 'primary',
    order: 3
};
const NAMES = [
    'AlettaSky',
    'Anny',
    'Bao',
    'BTMC',
    'Cabbage',
    'Camila',
    'Cerber',
    'chrchie',
    'CodeMiko',
    'CottontailVA',
    'Daph',
    'DougDoug',
    'Ellie_Minibot',
    'Evil',
    'FallenShadow',
    'Filian',
    'GX_Aura',
    'HannahHyrule',
    'KokoNuts',
    'Laimu',
    'LaynaLazar',
    'Lia',
    'LucyPyre',
    'MageMimi',
    'Michi Mochievee',
    'MinikoMew',
    'Miwo',
    'Miyune',
    'MoniiBagel',
    'MOTHERv3',
    'Neuro',
    'Numi',
    'OniGiri',
    'QueenPB',
    'Saruei',
    'Shylily',
    'Sinder',
    'Snuffy',
    'TakanashiKiara',
    'TenmaMaemi',
    'Toma',
    'Tomyomy',
    'Vedal',
    'Zentreya'
];
const TAGS = {
    'Chill': STREAM_CONTENT,
    'Collab': STREAM_CONTENT,
    'Dev': STREAM_CONTENT,
    'Gaming': STREAM_CONTENT,
    'IRL': STREAM_CONTENT,
    'Karaoke': STREAM_CONTENT,
    'Subathon': STREAM_CONTENT,
    'Themed': STREAM_CONTENT,
};

for (name of NAMES) {
    TAGS[name] = APPEARANCES;
    TAGS[`${name} (cameo)`] = CAMEOS;    
}

const FETCH_TYPE = {
    PAGE: 'PAGE',
    PAGE_FTS: 'PAGE_FTS',
    SUBTITLE: 'SUBTITLE'
};

module.exports = {
    FETCH_SIZE: 25,
    FETCH_TYPE,
    TAGS
};
