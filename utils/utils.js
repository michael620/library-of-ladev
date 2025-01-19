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
    if (text === '') return;
    subtitles.push({startTime, endTime, text, speaker, owner: id});
    speakers.add(speaker);
};

const onCloseTSV = async (fd, subtitles, speakers) => {
    await Subtitle.createEach(subtitles);
    for (const speaker of speakers) {
        if (speaker === '') continue;
        await Tag.findOrCreate({ name: speaker }, { name: speaker });
    }
    await sails.rm(fd);
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
    const message = rawResult.rows.length > MAX_ROW_LIMIT ? 'More than 100 results found. Only displaying the first 100. Try a more specific search.' : '';
    return {
        results,
        rows: rawResult.rows.length > MAX_ROW_LIMIT ? MAX_ROW_LIMIT : rawResult.rows.length,
        message
    };
}

module.exports = {
    processTSVLine,
    onCloseTSV,
    formatSeconds,
    processRawResult
};
