const SQL_FILTERS = `
WITH ExcludedVideos AS (  -- Step 1: Exclude videos that contain unwanted tags
    SELECT DISTINCT tm.video_id
    FROM tagmap tm
    JOIN tag t ON tm.tag_id = t.id
    WHERE ($9::text[] IS NOT NULL AND t.name = ANY($9::text[]))  -- Videos with excluded tags
),
FilteredVideos AS (  -- Step 2: Apply required tags, filtering only valid videos
    SELECT tm.video_id
    FROM tagmap tm
    JOIN tag t ON tm.tag_id = t.id
    WHERE ($9::text[] IS NULL OR tm.video_id NOT IN (SELECT video_id FROM ExcludedVideos)) -- Exclude unwanted videos
    AND ($10::text[] IS NULL OR t.name = ANY($10::text[]))  -- Ensure required tags exist
    GROUP BY tm.video_id
    HAVING 
        ($10::text[] IS NULL OR COUNT(DISTINCT t.name) FILTER (WHERE t.name = ANY($10::text[])) = array_length($10::text[], 1)) -- Ensure all required tags exist
),
FilteredVideosWithMeta AS (  -- Step 3: Filter on video.date, video.title, and pagination
    SELECT v.id AS video_id
    FROM video v
    WHERE ($9::text[] IS NULL OR v.id NOT IN (SELECT video_id FROM ExcludedVideos))  -- Reapply exclusion for safety
    AND ($10::text[] IS NULL OR v.id IN (SELECT video_id FROM FilteredVideos))  -- Ensure required tags
    AND ($4::text IS NULL OR v.date >= $4)  -- Start date filter (if provided)
    AND ($5::text IS NULL OR v.date <= $5)  -- End date filter (if provided)
    AND ($3::text IS NULL OR v.title ILIKE $3)  -- Title filter (if provided)
    AND (($6::text IS NULL OR $7::INTEGER IS NULL) OR (v.date, v.id) < ($6, $7::INTEGER)) -- Pagination
)
`;
const SQL_VIDEO_TAGS = `
VideoTags AS (
    SELECT 
        tm.video_id, 
        STRING_AGG(t.name, ', ') AS tags
    FROM tagmap tm
    JOIN tag t ON tm.tag_id = t.id
    WHERE tm.video_id IN (SELECT video_id FROM FilteredVideosWithMeta)
    GROUP BY tm.video_id
)
`;
const SUBTITLE_SEARCH_RAW_SQL = `
SELECT subtitle.text, subtitle."startTime"
FROM subtitle
JOIN video ON subtitle.owner = video.id
WHERE video.url = $2
AND ($1::text IS NULL OR subtitle.text ILIKE $1)
ORDER BY subtitle."startTime";
`;
const FTS_RAW_SQL = `
${SQL_FILTERS},
${SQL_VIDEO_TAGS}
SELECT ts_headline(
'english',
text,
websearch_to_tsquery('english', $1),
'MinWords=25, MaxWords=50, MaxFragments=3, FragmentDelimiter=" || "'
) AS snippets,
ts_rank(search_vector, websearch_to_tsquery('english', $1)) AS rank,
video.url, video.title, video.date, vt.tags
FROM transcript
JOIN video ON transcript.owner = video.id
LEFT JOIN VideoTags vt ON video.id = vt.video_id
WHERE search_vector @@ websearch_to_tsquery($1)
AND video.id IN (SELECT video_id FROM FilteredVideosWithMeta)
ORDER BY rank DESC
LIMIT $2
OFFSET $8;`;
const TEXT_SEARCH_RAW_SQL = `
${SQL_FILTERS},
RankedSubtitles AS (
    SELECT subtitle.text, subtitle."startTime", video.url, video.title, video.id AS video_id, video.date,
        ROW_NUMBER() OVER (PARTITION BY video.id ORDER BY subtitle."startTime" ASC) AS row_num
    FROM subtitle
    JOIN video ON subtitle.owner = video.id
    WHERE video.id IN (SELECT video_id FROM FilteredVideosWithMeta)
    AND subtitle.text ILIKE $1
),
LimitedVideos AS (
    SELECT video.id
    FROM video
    WHERE id IN (SELECT DISTINCT video_id FROM RankedSubtitles)
    ORDER BY video.date DESC, video.id
    LIMIT $8
),
TotalCount AS (
    SELECT video_id, COUNT(*) AS total_count
    FROM RankedSubtitles
    GROUP BY video_id
),
${SQL_VIDEO_TAGS}
SELECT s.text, s.url, s."startTime", s.title, s.date, tc.total_count, vt.tags
FROM RankedSubtitles s
JOIN LimitedVideos lv ON s.video_id = lv.id
JOIN TotalCount tc ON lv.id = tc.video_id
LEFT JOIN VideoTags vt ON lv.id = vt.video_id
WHERE s.row_num <= $2
ORDER BY s.date DESC, s.video_id DESC, s."startTime";
`;
const VIDEO_SEARCH_RAW_SQL = `
${SQL_FILTERS},
${SQL_VIDEO_TAGS}
SELECT v.url, v.title, v.id, v.date, vt.tags
FROM video v
JOIN FilteredVideosWithMeta fv ON v.id = fv.video_id
LEFT JOIN VideoTags vt ON v.id = vt.video_id
WHERE true -- unused params
    OR $1::text IS NULL
    OR $8::int IS NULL
ORDER BY v.date DESC, v.id
LIMIT $2;
`;
const sanitizeInput = async (params) => {
    const { FETCH_SIZE } = require('../../shared/constants');
    const {text, title, fetchSize, startDate, endDate, videoUrl, lastUrl} = params;
    let error = '';
    const dayjs = require('dayjs');
    if (startDate !== undefined && !dayjs(startDate, 'YYYY-MM-DD', true).isValid()) {
        error += `Invalid date format for startDate: ${startDate}. Expected YYYY-MM-DD.\n`;
    }
    if (endDate !== undefined && !dayjs(endDate, 'YYYY-MM-DD', true).isValid()) {
        error += `Invalid date format for endDate: ${endDate}. Expected YYYY-MM-DD.\n`;
    }
    if (videoUrl && !await Video.findOne({ url: videoUrl })) {
        error += `No video found for videoUrl: ${videoUrl}.\n`;
    }
    if (lastUrl && !await Video.findOne({ url: lastUrl })) {
        error += `No video found for lastUrl: ${lastUrl}.\n`;
    }
    const sanitizedText = text?.replace(/\*/g, '%').replace(/\?/g, '_');
    const sanitizedTitle = title?.replace(/\*/g, '%').replace(/\?/g, '_');
    if (error) throw new Error(error);
    return {
        ...params,
        fetchSize: fetchSize || FETCH_SIZE,
        text: sanitizedText,
        title: sanitizedTitle
    }
};
const getSubtitleSearchResults = async (params) => {
    const { processRawResultSubtitle } = require('./utils');
    const {text, fetchAll, videoUrl} = params;
    const rawResult = await sails.sendNativeQuery(SUBTITLE_SEARCH_RAW_SQL, [text && !fetchAll ? `%${text}%` : null, videoUrl]);
    return processRawResultSubtitle(rawResult);
};
const getOneVideo = async (videoUrl) => {
    const {title, url, date} = await Video.findOne({ url: videoUrl });
    return {title, url, date};
};
const getFTSSearchResults = async (params) => {
    const { processRawResultFTS } = require('./utils');
    const {text, title, startDate, endDate, includeTags, excludeTags, fetchSize, lastFtsIndex} = params;
    const rawResult = await sails.sendNativeQuery(FTS_RAW_SQL, [
        `${text}`, // $1
        `${fetchSize}`, // $2
        (title ? `%${title}%` : null), // $3
        startDate, // $4
        endDate, // $5
        null, // $6
        null, // $7
        lastFtsIndex || 0, // $8
        excludeTags, // $9
        includeTags // $10
    ]);
    return processRawResultFTS(rawResult);
    
};
const getTextSearchResults = async (params) => {
    const { processRawResult } = require('./utils');
    const {text, title, startDate, endDate, includeTags, excludeTags, lastUrl, fetchSize} = params;
    const lastVideo = lastUrl ? await Video.findOne({ url: lastUrl }) : undefined;
    const rawResult = await sails.sendNativeQuery(TEXT_SEARCH_RAW_SQL, [
        `%${text}%`, // $1
        fetchSize, // $2
        (title ? `%${title}%` : null), // $3
        startDate, // $4
        endDate, // $5
        lastVideo?.date, // $6
        lastVideo?.id, // $7
        fetchSize, // $8
        excludeTags, // $9
        includeTags // $10
    ]);
    return processRawResult(rawResult);
};
const getVideoSearchResults = async (params) => {
    const { processRawResult } = require('./utils');
    const {title, startDate, endDate, includeTags, excludeTags, lastUrl, fetchSize} = params;
    const lastVideo = lastUrl ? await Video.findOne({ url: lastUrl }) : undefined;
    const rawResult = await sails.sendNativeQuery(VIDEO_SEARCH_RAW_SQL, [
        null, // $1
        fetchSize, // $2
        (title ? `%${title}%` : null), // $3
        startDate, // $4
        endDate, // $5
        lastVideo?.date, // $6
        lastVideo?.id, // $7
        null, // $8
        excludeTags, // $9
        includeTags // $10
    ]);
    return processRawResult(rawResult);
};
module.exports = {
    sanitizeInput,
    getOneVideo,
    getSubtitleSearchResults,
    getFTSSearchResults,
    getTextSearchResults,
    getVideoSearchResults
};
