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

const formatSeconds = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

const timeStrToDayJs = (timeStr) => {
    const dayjs = require('dayjs');
    const [h, m, s] = timeStr.split(':').map(Number);
    return dayjs().hour(h).minute(m).second(s);
}

const dayJsToSeconds = (time) => {
    const dayjs = require('dayjs');
    return time.hour() * 3600 + time.minute() * 60 + time.second();
}

module.exports = {
    FETCH_SIZE: 25,
    FETCH_TYPE,
    TAG_TYPES,
    formatSeconds,
    timeStrToDayJs,
    dayJsToSeconds
};
