const processTSVLine = (data, id, subtitles, speakers) => {
    let [startTime, endTime, speakerText] = data.split('\t');
    if (startTime === 'start' || endTime === 'end') return;
    startTime = Math.floor(Number.parseInt(startTime)/1000);
    endTime = Math.floor(Number.parseInt(endTime)/1000);
    let speaker = 'SPEAKER';
    let text = speakerText;
    if (speakerText.indexOf('[')>-1 && speakerText.indexOf(']')>-1) {
        speaker = speakerText.substring(speakerText.indexOf('[') + 1, speakerText.indexOf(']'));
        text = speakerText.substring(speakerText.indexOf(']') + 3);
    }
    if (text === '' || Number.isNaN(startTime) || Number.isNaN(endTime)) {
        sails.log('Invalid line:', data);
        return;
    }
    subtitles.push({startTime, endTime, text, speaker, owner: id});
    speakers.add(speaker);
};

const onCloseTSV = async (fd, subtitles, speakers, resolve) => {
    if (subtitles.length !== 0) {
        //split subtitles into chunks of 1000
        const chunks = [];
        for (let i = 0; i < subtitles.length; i += 1000) {
            chunks.push(subtitles.slice(i, i + 1000));
        }
        for (const chunk of chunks) {
            await Subtitle.createEach(chunk);
        }
        for (const speaker of speakers) {
            if (speaker === '') continue;
            await Tag.findOrCreate({ name: speaker }, { name: speaker });
        }
    }
    resolve();
};

const createVideoAndSubtitle = async (fd, url, title, date) => {
    const { createInterface } = require('readline');
    const { createReadStream } = require('fs');
    const video = await Video.findOrCreate({ url }, { url, title, date });
    await Tagmap.findOrCreate({ owner: video.id }, { owner: video.id });
    return new Promise(function(resolve,reject){
        const subtitles = [];
        const speakers = new Set();
        createInterface({input: createReadStream(fd)})
        .on('line', (data) => processTSVLine(data, video.id, subtitles, speakers))
        .on('close', () => onCloseTSV(fd, subtitles, speakers, resolve));
    });
};

const buildVideoMetadata = async (fd, subtitles, speakers) => {
    const { createInterface } = require('readline');
    const { createReadStream } = require('fs');
    return new Promise(function(resolve,reject){
        const metadata = {};
        createInterface({input: createReadStream(fd)})
            .on('line', (data) => {
                const [url, date, title] = data.split('\t');
                if (url === 'url') return;
                metadata[url] = { date, title };
            })
            .on('close', () => {
                resolve(metadata);
            });
    });
};

const formatSeconds = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

const processRawResult = (rawResult) => {
    const { MAX_ROW_LIMIT } = require('./constants');
    const results = rawResult.rows.reduce((result, curr, i) => {
        if (i >= MAX_ROW_LIMIT) {
            return result;
        }
        if (result[curr.url]) {
            result[curr.url].subtitles.push({
                startTime: curr.startTime,
                timestamp: formatSeconds(curr.startTime),
                text: curr.text
            });
        } else {
            result[curr.url] = {
                url: curr.url,
                title: curr.title,
                date: curr.date,
                subtitles: [{
                    startTime: curr.startTime,
                    timestamp: formatSeconds(curr.startTime),
                    text: curr.text
                }]
            }
        }
        return result;
    }, {});
    const message = rawResult.rows.length > MAX_ROW_LIMIT ? `More than ${MAX_ROW_LIMIT} results found. Only displaying the first ${MAX_ROW_LIMIT}. Try a more specific search.` : '';
    return {
        results,
        rows: rawResult.rows.length > MAX_ROW_LIMIT ? MAX_ROW_LIMIT : rawResult.rows.length,
        message
    };
}

const processRawResultFTS = (rawResult) => {
    const { MAX_ROW_LIMIT_FTS } = require('./constants');
    let rows = 0;
    const results = rawResult.rows.reduce((result, curr, i) => {
        if (i >= MAX_ROW_LIMIT_FTS) {
            return result;
        }
        const matches = curr.snippets.split(' || ').map((snippet) => {
            return { text: snippet };
        });
        rows += matches.length;
        if (result[curr.url]) {
            result[curr.url].matches.push(...matches);
        } else {
            const { url, title, date } = curr;
            result[curr.url] = {
                url,
                title,
                date,
                matches
            }
        }
        return result;
    }, {});
    const message = rawResult.rows.length > MAX_ROW_LIMIT_FTS ? `More than ${rows} results found in ${MAX_ROW_LIMIT_FTS} videos. Only displaying results from the first ${MAX_ROW_LIMIT_FTS} videos. Try a more specific search.` : '';
    return {
        results,
        rows,
        message
    };
}

module.exports = {
    processTSVLine,
    onCloseTSV,
    formatSeconds,
    processRawResult,
    processRawResultFTS,
    createVideoAndSubtitle,
    buildVideoMetadata
};
