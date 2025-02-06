const processTSVLine = (data, id, subtitles, speakers) => {
    try {
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
    } catch (e) {
        console.log(`Error encountered while processing ${id} ${data}`);
        console.log(e);
    }
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
    }
    resolve();
};

const createVideoAndSubtitle = async (fd, url, title, date) => {
    const { createInterface } = require('readline');
    const { createReadStream } = require('fs');
    const video = await Video.findOrCreate({ url }, { url, title, date });
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
    const map = new Map();
    for (const row of rawResult.rows) {
        const entry = map.get(row.url) || {
            url: row.url,
            title: row.title,
            date: row.date,
            total: row.total_count,
            subtitles: []
        };
        entry.subtitles.push({
            startTime: row.startTime,
            timestamp: formatSeconds(row.startTime),
            text: row.text
        });
        map.set(row.url, entry);
    }
    const results = Array.from(map.values());
    return results;
}

const processRawResultFTS = (rawResult) => {
    const map = new Map();
    for (const row of rawResult.rows) {
        const { url, title, date } = row;
        const matches = row.snippets.split(' || ').map((snippet) => {
            return { text: snippet };
        });
        const entry = map.get(row.url) || {
            url,
            title,
            date,
            matches: []
        };
        entry.matches.push(...matches);
        map.set(row.url, entry);
    }
    const results = Array.from(map.values());
    return results;
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
