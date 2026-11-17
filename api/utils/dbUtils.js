const SQL_FILTERS = (isAscending) => `
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
    WHERE t.name = ANY($10::text[])  -- Only consider required tags
    GROUP BY tm.video_id
    HAVING COUNT(DISTINCT t.name) = array_length($10::text[], 1)  -- Ensure ALL required tags exist
),
FilteredVideosWithMeta AS (  -- Step 3: Filter on video.date, video.title, and pagination
    SELECT v.id AS video_id
    FROM video v
    WHERE ($9::text[] IS NULL OR NOT EXISTS (SELECT 1 FROM ExcludedVideos e WHERE e.video_id = v.id))  -- Exclude unwanted videos
    AND ($10::text[] IS NULL OR v.id IN (SELECT video_id FROM FilteredVideos))  -- Ensure required tags
    AND ($4::text IS NULL OR v.date >= $4)  -- Start date filter (if provided)
    AND ($5::text IS NULL OR v.date <= $5)  -- End date filter (if provided)
    AND ($3::text IS NULL OR v.title ILIKE $3)  -- Title filter (if provided)
    AND ( -- Keyset pagination (comparison direction must match the sort direction)
        $7::INTEGER IS NULL  -- assume if $7 (lastVideo.id) exists, then $6 and $11 are also set
        OR (
            v.date ${isAscending ? '>' : '<'} $6
            OR (v.date = $6 AND v.updated_at ${isAscending ? '>' : '<'} $11::BIGINT)
            OR (v.date = $6 AND v.updated_at = $11::BIGINT AND v.id ${isAscending ? '>' : '<'} $7)
        )
    )
)
`;
const SQL_FILTERS_NO_KEYSET = () => `
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
    WHERE t.name = ANY($10::text[])  -- Only consider required tags
    GROUP BY tm.video_id
    HAVING COUNT(DISTINCT t.name) = array_length($10::text[], 1)  -- Ensure ALL required tags exist
),
FilteredVideosWithMeta AS (  -- Step 3: Filter on video.date, video.title only
    SELECT v.id AS video_id
    FROM video v
    WHERE ($9::text[] IS NULL OR NOT EXISTS (SELECT 1 FROM ExcludedVideos e WHERE e.video_id = v.id))  -- Exclude unwanted videos
    AND ($10::text[] IS NULL OR v.id IN (SELECT video_id FROM FilteredVideos))  -- Ensure required tags
    AND ($4::text IS NULL OR v.date >= $4)  -- Start date filter (if provided)
    AND ($5::text IS NULL OR v.date <= $5)  -- End date filter (if provided)
    AND ($3::text IS NULL OR v.title ILIKE $3)  -- Title filter (if provided)
    -- Keyset pagination is applied in LimitedGroups
)
`;
const SQL_VIDEO_TAGS = `
VideoTags AS (
    SELECT 
        tm.video_id,
        STRING_AGG(t.name, ', ' ORDER BY t.name) AS tags
    FROM tagmap tm
    JOIN tag t ON tm.tag_id = t.id
    WHERE tm.video_id IN (SELECT video_id FROM FilteredVideosWithMeta)
    GROUP BY tm.video_id
)
`;
const SUBTITLE_SEARCH_RAW_SQL = `
SELECT subtitle.id AS "subtitleId", subtitle.text, subtitle."startTime", subtitle."endTime"
FROM subtitle
JOIN video ON subtitle.owner = video.id
WHERE video.url = $2
AND ($1::text IS NULL OR subtitle.text ILIKE $1)
ORDER BY subtitle."startTime";
`;
const FTS_RAW_SQL = `
${SQL_FILTERS()},
${SQL_VIDEO_TAGS},
SourceRanks AS (
    -- Compute ts_rank per source row that matches the search vector
    SELECT
        video.id AS video_id,
        video.group_id,
        ts_rank(search_vector, websearch_to_tsquery('english', $1)) AS rank
    FROM transcript
    JOIN video ON transcript.owner = video.id
    WHERE search_vector @@ websearch_to_tsquery('english', $1)
    AND video.id IN (SELECT video_id FROM FilteredVideosWithMeta)
),
GroupRanks AS (
    -- Roll up to per-group rank using MAX so the best source drives the group order
    SELECT group_id, MAX(rank) AS group_rank
    FROM SourceRanks
    GROUP BY group_id
),
LimitedGroups AS (
    -- Paginate over groups, not individual video rows
    SELECT group_id
    FROM GroupRanks
    ORDER BY group_rank DESC
    LIMIT $2
    OFFSET $8
)
SELECT
    ts_headline(
        'english',
        t.text,
        websearch_to_tsquery('english', $1),
        'MinWords=25, MaxWords=50, MaxFragments=3, FragmentDelimiter=" || "'
    ) AS snippets,
    ts_rank(t.search_vector, websearch_to_tsquery('english', $1)) AS rank,
    video.id,
    video.group_id,
    sg.default_video_id,
    video.url, video.title, video.date, vt.tags
FROM video
LEFT JOIN transcript t ON t.owner = video.id
LEFT JOIN VideoTags vt ON video.id = vt.video_id
LEFT JOIN stream_group sg ON sg.id = video.group_id
WHERE video.group_id IN (SELECT group_id FROM LimitedGroups)
AND video.id IN (SELECT video_id FROM FilteredVideosWithMeta)
ORDER BY rank DESC NULLS LAST;`;
const TEXT_SEARCH_RAW_SQL = (isAscending) => `
${SQL_FILTERS_NO_KEYSET()},
RankedSubtitles AS (
    SELECT subtitle.id AS "subtitleId", subtitle.text, subtitle."startTime", video.url, video.title, video.id AS video_id, video.group_id, video.date, video.updated_at as video_updated_at,
        ROW_NUMBER() OVER (PARTITION BY video.id ORDER BY subtitle."startTime" ASC) AS row_num
    FROM subtitle
    JOIN video ON subtitle.owner = video.id
    WHERE video.id IN (SELECT video_id FROM FilteredVideosWithMeta)
    AND subtitle.text ILIKE $1
),
LimitedGroups AS (
    -- Paginate by group: aggregate matching videos per group, apply group-level keyset, order by keyset
    SELECT group_id
    FROM (
        SELECT v.group_id,
               MAX(v.date) AS max_date,
               MAX(v.updated_at) AS max_updated_at
        FROM video v
        WHERE v.id IN (SELECT DISTINCT video_id FROM RankedSubtitles)
        GROUP BY v.group_id
    ) g
    WHERE $7::INTEGER IS NULL  -- group-level keyset: mirrors SQL_FILTERS direction logic but over MAX aggregates
        OR (
            g.max_date ${isAscending ? '>' : '<'} $6
            OR (g.max_date = $6 AND g.max_updated_at ${isAscending ? '>' : '<'} $11::BIGINT)
            OR (g.max_date = $6 AND g.max_updated_at = $11::BIGINT AND g.group_id ${isAscending ? '>' : '<'} $7)
        )
    ORDER BY g.max_date ${isAscending ? 'ASC' : 'DESC'},
             g.max_updated_at ${isAscending ? 'ASC' : 'DESC'},
             g.group_id ${isAscending ? 'ASC' : 'DESC'}
    LIMIT $8
),
TotalCount AS (
    SELECT video_id, COUNT(*) AS total_count
    FROM RankedSubtitles
    GROUP BY video_id
),
${SQL_VIDEO_TAGS}
SELECT s."subtitleId", s.text, s.url, s."startTime", s.title, s.date, tc.total_count, vt.tags,
       s.video_id AS id, s.group_id, sg.default_video_id
FROM RankedSubtitles s
JOIN LimitedGroups lg ON s.group_id = lg.group_id
JOIN TotalCount tc ON s.video_id = tc.video_id
LEFT JOIN VideoTags vt ON s.video_id = vt.video_id
LEFT JOIN stream_group sg ON sg.id = s.group_id
WHERE s.row_num <= $2
ORDER BY s.date ${isAscending ? 'ASC' : 'DESC'}, s.video_updated_at ${
  isAscending ? 'ASC' : 'DESC'
}, s.video_id ${isAscending ? 'ASC' : 'DESC'}, s."startTime";
`;
const VIDEO_SEARCH_RAW_SQL = (isAscending) => `
${SQL_FILTERS_NO_KEYSET()},
${SQL_VIDEO_TAGS},
LimitedGroups AS (
    -- Paginate by group: aggregate matching video rows per group, apply group-level keyset, ordered by keyset
    -- $1 (text) and $8 (offset) are unused here but kept in the param list so the
    -- positional bindings stay aligned with the other queries that share SQL_FILTERS.
    SELECT group_id
    FROM (
        SELECT v.group_id,
               MAX(v.date) AS max_date,
               MAX(v.updated_at) AS max_updated_at
        FROM video v
        JOIN FilteredVideosWithMeta fv ON v.id = fv.video_id
        GROUP BY v.group_id
    ) g
    WHERE $7::INTEGER IS NULL  -- group-level keyset: mirrors SQL_FILTERS direction logic but over MAX aggregates
        OR (
            g.max_date ${isAscending ? '>' : '<'} $6
            OR (g.max_date = $6 AND g.max_updated_at ${isAscending ? '>' : '<'} $11::BIGINT)
            OR (g.max_date = $6 AND g.max_updated_at = $11::BIGINT AND g.group_id ${isAscending ? '>' : '<'} $7)
        )
    ORDER BY g.max_date ${isAscending ? 'ASC' : 'DESC'},
             g.max_updated_at ${isAscending ? 'ASC' : 'DESC'},
             g.group_id ${isAscending ? 'ASC' : 'DESC'}
    LIMIT $2
)
SELECT v.url, v.title, v.id, v.date, vt.tags, v.group_id, sg.default_video_id
FROM video v
JOIN FilteredVideosWithMeta fv ON v.id = fv.video_id
JOIN LimitedGroups lg ON v.group_id = lg.group_id
LEFT JOIN VideoTags vt ON v.id = vt.video_id
LEFT JOIN stream_group sg ON sg.id = v.group_id
WHERE true
    OR $1::text IS NULL
    OR $8::int IS NULL
ORDER BY v.date ${isAscending ? 'ASC' : 'DESC'}, v.updated_at ${
  isAscending ? 'ASC' : 'DESC'
}, v.id ${isAscending ? 'ASC' : 'DESC'};
`;
const BOOKMARKS_BACKUP_RAW_SQL = `
SELECT s.id AS "subtitleId", s."startTime", s.text,
       v.id AS video_id, v.url, v.title, v.date
FROM subtitle s
JOIN video v ON s.owner = v.id
WHERE s.id = ANY($1::int[])
`;
const BOOKMARKS_VIDEO_TAGS_RAW_SQL = `
SELECT tm.video_id, t.name
FROM tagmap tm
JOIN tag t ON tm.tag_id = t.id
WHERE tm.video_id = ANY($1::int[])
`;
const BOOKMARKS_FALLBACK_RAW_SQL = `
SELECT s.id AS "subtitleId", s."startTime", s.text,
       v.url AS "videoUrl", v.title, v.date
FROM subtitle s
JOIN video v ON s.owner = v.id
WHERE (v.url, s."startTime") IN (
    SELECT * FROM unnest($1::text[], $2::int[])
)
ORDER BY v.url, s."startTime", s.id;
`;
const sanitizeInput = async (params) => {
  const { FETCH_SIZE } = require('../../shared/constants');
  const { text, title, fetchSize, startDate, endDate, videoUrl, lastUrl } = params;
  let error = '';
  const dayjs = require('dayjs');
  if (startDate !== undefined && !dayjs(startDate, 'YYYY-MM-DD', true).isValid()) {
    error += `Invalid date format for startDate: ${startDate}. Expected YYYY-MM-DD.\n`;
  }
  if (endDate !== undefined && !dayjs(endDate, 'YYYY-MM-DD', true).isValid()) {
    error += `Invalid date format for endDate: ${endDate}. Expected YYYY-MM-DD.\n`;
  }
  if (videoUrl && !(await Video.findOne({ url: videoUrl }))) {
    error += `No video found for videoUrl: ${videoUrl}.\n`;
  }
  const lastVideo = lastUrl ? await Video.findOne({ url: lastUrl }) : undefined;
  if (lastUrl && !lastVideo) {
    error += `No video found for lastUrl: ${lastUrl}.\n`;
  }
  const sanitizedText = text?.replace(/\*/g, '%').replace(/\?/g, '_');
  const sanitizedTitle = title?.replace(/\*/g, '%').replace(/\?/g, '_');
  if (error) throw new Error(error);
  // Resolve the last group's keyset aggregates so non-FTS queries can advance
  // the group-level cursor ($6=maxDate, $7=groupId, $11=maxUpdatedAt).
  let lastGroup = undefined;
  if (lastVideo && lastVideo.group != null) {
    const groupAgg = await sails.sendNativeQuery(
      'SELECT MAX(date) AS max_date, MAX(updated_at) AS max_updated_at, $1::int AS group_id FROM video WHERE group_id = $1',
      [lastVideo.group]
    );
    const row = groupAgg.rows[0];
    if (row) {
      lastGroup = {
        id: lastVideo.group,
        maxDate: row.max_date,
        maxUpdatedAt: row.max_updated_at,
      };
    }
  }
  return {
    ...params,
    fetchSize: fetchSize || FETCH_SIZE,
    text: sanitizedText,
    title: sanitizedTitle,
    lastVideo,
    lastGroup,
  };
};
const getSubtitleSearchResults = async (params) => {
  const { processRawResultSubtitle } = require('./utils');
  const { text, fetchAll, videoUrl } = params;
  const rawResult = await sails.sendNativeQuery(SUBTITLE_SEARCH_RAW_SQL, [
    text && !fetchAll ? `%${text}%` : null,
    videoUrl,
  ]);
  return processRawResultSubtitle(rawResult);
};
const getOneVideo = async (videoUrl) => {
  const { title, url, date } = await Video.findOne({ url: videoUrl });
  return { title, url, date };
};
const getFTSSearchResults = async (params) => {
  const { processRawResultFTS } = require('./utils');
  const { text, title, startDate, endDate, includeTags, excludeTags, fetchSize, lastFtsIndex } =
    params;
  const rawResult = await sails.sendNativeQuery(FTS_RAW_SQL, [
    `${text}`, // $1
    `${fetchSize}`, // $2
    title ? `%${title}%` : null, // $3
    startDate, // $4
    endDate, // $5
    null, // $6
    null, // $7
    lastFtsIndex || 0, // $8
    excludeTags, // $9
    includeTags, // $10
    null, // $11
  ]);
  return processRawResultFTS(rawResult);
};
const getTextSearchResults = async (params) => {
  const { processRawResult } = require('./utils');
  const {
    text,
    title,
    startDate,
    endDate,
    includeTags,
    excludeTags,
    lastGroup,
    fetchSize,
    isAscending,
  } = params;
  const rawResult = await sails.sendNativeQuery(TEXT_SEARCH_RAW_SQL(isAscending), [
    `%${text}%`, // $1
    fetchSize, // $2
    title ? `%${title}%` : null, // $3
    startDate, // $4
    endDate, // $5
    lastGroup?.maxDate ?? null, // $6 — last group's MAX(date)
    lastGroup?.id ?? null, // $7 — last group's group_id (INTEGER keyset guard)
    fetchSize, // $8
    excludeTags, // $9
    includeTags, // $10
    lastGroup?.maxUpdatedAt?.toString() ?? null, // $11 — last group's MAX(updated_at) as BIGINT string
  ]);
  return processRawResult(rawResult);
};
const getVideoSearchResults = async (params) => {
  const { processRawResult } = require('./utils');
  const { title, startDate, endDate, includeTags, excludeTags, lastGroup, fetchSize, isAscending } =
    params;
  const rawResult = await sails.sendNativeQuery(VIDEO_SEARCH_RAW_SQL(isAscending), [
    null, // $1
    fetchSize, // $2
    title ? `%${title}%` : null, // $3
    startDate, // $4
    endDate, // $5
    lastGroup?.maxDate ?? null, // $6 — last group's MAX(date)
    lastGroup?.id ?? null, // $7 — last group's group_id (INTEGER keyset guard)
    null, // $8
    excludeTags, // $9
    includeTags, // $10
    lastGroup?.maxUpdatedAt?.toString() ?? null, // $11 — last group's MAX(updated_at) as BIGINT string
  ]);
  return processRawResult(rawResult);
};
const getBookmarkBackupMetadata = async (subtitleIds) => {
  if (!Array.isArray(subtitleIds) || subtitleIds.length === 0) {
    return { rowById: new Map(), tagsByVideoId: new Map() };
  }
  const subtitleResult = await sails.sendNativeQuery(BOOKMARKS_BACKUP_RAW_SQL, [subtitleIds]);
  const rowById = new Map();
  for (const row of subtitleResult.rows) {
    rowById.set(row.subtitleId, row);
  }
  const videoIds = Array.from(new Set(Array.from(rowById.values()).map((r) => r.video_id)));
  const tagsByVideoId = new Map();
  if (videoIds.length) {
    const tagResult = await sails.sendNativeQuery(BOOKMARKS_VIDEO_TAGS_RAW_SQL, [videoIds]);
    for (const tr of tagResult.rows) {
      const existing = tagsByVideoId.get(tr.video_id) || [];
      existing.push(tr.name);
      tagsByVideoId.set(tr.video_id, existing);
    }
  }
  return { rowById, tagsByVideoId };
};
const getBookmarkFallbackCandidates = async (urls, startTimes) => {
  const result = await sails.sendNativeQuery(BOOKMARKS_FALLBACK_RAW_SQL, [urls, startTimes]);
  return result.rows;
};
module.exports = {
  sanitizeInput,
  getOneVideo,
  getSubtitleSearchResults,
  getFTSSearchResults,
  getTextSearchResults,
  getVideoSearchResults,
  getBookmarkBackupMetadata,
  getBookmarkFallbackCandidates,
};
