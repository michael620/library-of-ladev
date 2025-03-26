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
const TAGS = {
    // Stream Content
    'Chill': STREAM_CONTENT,
    'Collab': STREAM_CONTENT,
    'Dev': STREAM_CONTENT,
    'Gaming': STREAM_CONTENT,
    'IRL': STREAM_CONTENT,
    'Karaoke': STREAM_CONTENT,
    'Subathon': STREAM_CONTENT,
    'Themed': STREAM_CONTENT,

    // Appearances
    'AlettaSky': APPEARANCES,
    'Anny': APPEARANCES,
    'Bao': APPEARANCES,
    'BTMC': APPEARANCES,
    'Cabbage': APPEARANCES,
    'Camila': APPEARANCES,
    'Cerber': APPEARANCES,
    'chrchie': APPEARANCES,
    'CodeMiko': APPEARANCES,
    'CottontailVA': APPEARANCES,
    'Daph': APPEARANCES,
    'DougDoug': APPEARANCES,
    'Ellie_Minibot': APPEARANCES,
    'Evil': APPEARANCES,
    'FallenShadow': APPEARANCES,
    'Filian': APPEARANCES,
    'GX_Aura': APPEARANCES,
    'HannahHyrule': APPEARANCES,
    'KokoNuts': APPEARANCES,
    'LaynaLazar': APPEARANCES,
    'Lia': APPEARANCES,
    'LucyPyre': APPEARANCES,
    'MageMimi': APPEARANCES,
    'MinikoMew': APPEARANCES,
    'Miwo': APPEARANCES,
    'Miyune': APPEARANCES,
    'MoniiBagel': APPEARANCES,
    'MOTHERv3': APPEARANCES,
    'Neuro': APPEARANCES,
    'Numi': APPEARANCES,
    'OniGiri': APPEARANCES,
    'QueenPB': APPEARANCES,
    'Saruei': APPEARANCES,
    'Shylily': APPEARANCES,
    'Sinder': APPEARANCES,
    'Snuffy': APPEARANCES,
    'TakanashiKiara': APPEARANCES,
    'TenmaMaemi': APPEARANCES,
    'Toma': APPEARANCES,
    'Tomyomy': APPEARANCES,
    'Vedal': APPEARANCES,
    'Zentreya': APPEARANCES,

    // Cameos
    'Alex (cameo)': CAMEOS,
    'Anny (cameo)': CAMEOS,
    'Bao (cameo)': CAMEOS,
    'BTMC (cameo)': CAMEOS,
    'Camila (cameo)': CAMEOS,
    'Cerber (cameo)': CAMEOS,
    'chrchie (cameo)': CAMEOS,
    'Ellie_Minibot (cameo)': CAMEOS,
    'Evil (cameo)': CAMEOS,
    'Filian (cameo)': CAMEOS,
    'HannahHyrule (cameo)': CAMEOS,
    'KokoNuts (cameo)': CAMEOS,
    'LaynaLazar (cameo)': CAMEOS,
    'MageMimi (cameo)': CAMEOS,
    'MinikoMew (cameo)': CAMEOS,
    'Neuro (cameo)': CAMEOS,
    'Numi (cameo)': CAMEOS,
    'QueenPB (cameo)': CAMEOS,
    'Toma (cameo)': CAMEOS,
    'Vedal (cameo)': CAMEOS,
    'Zentreya (cameo)': CAMEOS
};

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
