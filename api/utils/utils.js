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

const createOrUpdateVideos = async (video_metadata) => {
    if (!video_metadata) return;
    for (const key of Object.keys(video_metadata)) {
        const metadata = video_metadata[key];
        const { url, title, date, tags } = metadata;
        const { createInterface } = require('readline');
        const { createReadStream } = require('fs');
        const { TAG_TYPES } = require('../../shared/constants');
        const video = await Video.findOrCreate({ url }, { url, title, date });
        await Video.updateOne({ url }, { url, title, date });
        if (tags) {
            const tagsArr = tags.split(', ');
            const sqls = [];
            for (const tag of tagsArr) {
                const tagType = tag.includes('(cameo)') ? TAG_TYPES.CAMEOS.text : TAG_TYPES.APPEARANCES.text;
                sqls.push(`
                    INSERT INTO tag (name, tag_type)
                    VALUES ('${tag}', '${tagType}')
                    ON CONFLICT (name) DO NOTHING;
                `);
            }
            const formattedTags = tagsArr.map(item => `'${item}'`).join(', ');
            sqls.push(`
                INSERT INTO tagmap (video_id, tag_id)
                SELECT v.id, t.id
                FROM tag t
                JOIN video v ON v.url = '${url}'
                WHERE t.name IN (${formattedTags})
                ON CONFLICT DO NOTHING;
            `);
            for (const sql of sqls) {
                await sails.sendNativeQuery(sql);
            }
        }
    };
    await sails.hooks['db-refresh'].fetchAndUpdate();
};

const createSubtitle = async (fd, url) => {
    const { createInterface } = require('readline');
    const { createReadStream } = require('fs');
    const video = await Video.findOne({ url });
    if (!video) {
        sails.log('Error trying to find video '+url);
        return Promise.resolve();
    }
    return new Promise(function(resolve,reject){
        const subtitles = [];
        const speakers = new Set();
        createInterface({input: createReadStream(fd)})
        .on('line', (data) => processTSVLine(data, video.id, subtitles, speakers))
        .on('close', () => onCloseTSV(fd, subtitles, speakers, resolve));
    });
};

const createTranscript = async (fd, url) => {
    const { readFileSync } = require('fs');
    const video = await Video.findOne({ url });
    if (!video) {
        sails.log('Error trying to find video '+url);
        return Promise.resolve();
    }
    const rawText = readFileSync(txtFile.fd, 'utf8');
    await Transcript.destroyOne({ owner: video.id });
    await Transcript.create({ owner: video.id, text: rawText });
};

const buildVideoMetadata = async (fd) => {
    const { createInterface } = require('readline');
    const { createReadStream } = require('fs');
    const dayjs = require('dayjs');
    const defaultDate = dayjs().format('YYYY-MM-DD');
    return new Promise(function(resolve,reject){
        const metadata = {};
        createInterface({input: createReadStream(fd)})
            .on('line', (data) => {
                const [url, title = 'Untitled Stream', date = defaultDate, tags = ''] = data.split('\t');
                if (!url || url === 'url') return;
                metadata[url] = {
                    url,
                    date,
                    title,
                    tags
                };
            })
            .on('close', () => {
                resolve(metadata);
            });
    });
};

const buildVideoMetadataFromText = (data) => {
    const metadata = {};
    const lines = data.split(/\r\n|\r|\n/);
    const dayjs = require('dayjs');
    const defaultDate = dayjs().format('YYYY-MM-DD');
    for (const line of lines) {
        const [url, title = 'Untitled Stream', date = defaultDate, tags = ''] = line.split('\t');
        metadata[url] = { url, date, title, tags };
    }
    return metadata;
};

const formatSeconds = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

const sortTags = (tags) => {
    if (!tags) return [];
    const TAGS = sails.hooks['db-refresh'].getTags();
    const filteredTags = tags.split(', ').filter(tag => {
        if (!TAGS[tag]) {
            sails.log(`Missing tag ${tag}`);
            return false;
        }
        return true;
    }).sort((a, b) => {
        if (TAGS[a].order !== TAGS[b].order) return TAGS[a].order - TAGS[b].order;
        return a.localeCompare(b);
    });
    return filteredTags;
}

const processRawResult = (rawResult) => {
    const map = new Map();
    for (const row of rawResult.rows) {
        const { url, title, date, tags } = row;
        const entry = map.get(url) || {
            url,
            title,
            date,
            tags: sortTags(tags)
        };
        if (row.text) {
            entry.total = entry.total || row.total_count;
            entry.subtitles = entry.subtitles || [];
            entry.subtitles.push({
                startTime: row.startTime,
                timestamp: formatSeconds(row.startTime),
                text: row.text
            });
        }
        map.set(url, entry);
    }
    const results = Array.from(map.values());
    return results;
}

const processRawResultFTS = (rawResult) => {
    const map = new Map();
    for (const row of rawResult.rows) {
        const { url, title, date, tags } = row;
        const matches = row.snippets.split(' || ').map((snippet) => {
            return { text: snippet };
        });
        const entry = map.get(row.url) || {
            url,
            title,
            date,
            tags: sortTags(tags),
            matches: []
        };
        entry.matches.push(...matches);
        map.set(row.url, entry);
    }
    const results = Array.from(map.values());
    return results;
}

const processRawResultSubtitle = (rawResult) => {
    const results = rawResult.rows.map(row => ({
        startTime: row.startTime,
        timestamp: formatSeconds(row.startTime),
        text: row.text
    }));
    return results;
}

module.exports = {
    processTSVLine,
    onCloseTSV,
    formatSeconds,
    processRawResult,
    processRawResultFTS,
    processRawResultSubtitle,
    createOrUpdateVideos,
    createSubtitle,
    createTranscript,
    buildVideoMetadata,
    buildVideoMetadataFromText
};
