const FETCH_TYPE = {
    PAGE: 'PAGE',
    PAGE_FTS: 'PAGE_FTS',
    SUBTITLE: 'SUBTITLE'
};

const TAG_TYPES = {
    STREAM_CONTENT: {
        text: 'Stream Content',
        color: 'secondary',
        order: 1
    },
    APPEARANCES: {
        text: 'Appearances',
        color: 'info',
        order: 2
    },
    CAMEOS: {
        text: 'Cameos',
        color: 'primary',
        order: 3
    }
};

module.exports = {
    FETCH_SIZE: 25,
    FETCH_TYPE,
    TAG_TYPES
};
