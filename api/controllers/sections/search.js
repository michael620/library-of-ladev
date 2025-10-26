module.exports = {
    
    friendlyName: 'Search',
  
    description: 'Search',

    inputs: {
        text: {
            description: 'text',
            type: 'string'
        },
        isFullTextSearch: {
            description: 'isFullTextSearch',
            type: 'boolean'
        },
        title: {
            description: 'title',
            type: 'string'
        },
        startDate: {
            description: 'startDate',
            type: 'string'
        },
        endDate: {
            description: 'endDate',
            type: 'string'
        },
        includeTags: {
            description: 'includeTags',
            type: 'ref'
        },
        excludeTags: {
            description: 'excludeTags',
            type: 'ref'
        },
        fetchType: {
            type: 'string'
        },
        fetchMetadata: {
            type: 'ref'
        },
        fetchAll: {
            type: 'boolean'
        }
    },
  
    exits: {
      success: {
        responseType: 'inertia'
      }
    },
  
    fn: async function ({ text, isFullTextSearch, title, startDate, endDate, includeTags, excludeTags, fetchType, fetchMetadata, fetchAll }) {
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
        const props = {
            searchParams: {
                text,
                isFullTextSearch,
                title,
                startDate,
                endDate,
                includeTags,
                excludeTags
            },
            tags: sails.hooks['db-refresh'].getTags()
        };
        const { FETCH_SIZE, FETCH_TYPE } = require('../../../shared/constants');
        const { processRawResult, processRawResultFTS, processRawResultSubtitle } = require('../../utils/utils');
        const sanitizedText = text?.replace(/\*/g, '%').replace(/\?/g, '_');
        const sanitizedTitle = title?.replace(/\*/g, '%').replace(/\?/g, '_');
        if (fetchType === FETCH_TYPE.SUBTITLE) {
            const RAW_SQL = `
            SELECT subtitle.text, subtitle."startTime"
            FROM subtitle
            JOIN video ON subtitle.owner = video.id
            WHERE video.url = $2
            AND ($1::text IS NULL OR subtitle.text ILIKE $1)
            ORDER BY subtitle."startTime";
            `;
            const rawResult = await sails.sendNativeQuery(RAW_SQL, [text && !fetchAll ? `%${sanitizedText}%` : null, fetchMetadata]);
            props.subtitleResult = processRawResultSubtitle(rawResult);
            if (!text) props.allSubtitlesFetched = true;
        } else if (text) {
            if (isFullTextSearch) {
                const RAW_SQL = `
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
                const rawResult = await sails.sendNativeQuery(RAW_SQL, [
                    `${sanitizedText}`, // $1
                    `${FETCH_SIZE}`, // $2
                    (title ? `%${sanitizedTitle}%` : null), // $3
                    startDate, // $4
                    endDate, // $5
                    null, // $6
                    null, // $7
                    fetchMetadata || 0, // $8
                    excludeTags, // $9
                    includeTags // $10
                ]);
                props.searchResult = processRawResultFTS(rawResult);
            } else {
                const lastVideo = fetchMetadata ? await Video.findOne({ url: fetchMetadata }) : undefined;
                const RAW_SQL = `
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
                const rawResult = await sails.sendNativeQuery(RAW_SQL, [
                    `%${sanitizedText}%`, // $1
                    FETCH_SIZE, // $2
                    (title ? `%${sanitizedTitle}%` : null), // $3
                    startDate, // $4
                    endDate, // $5
                    lastVideo?.date, // $6
                    lastVideo?.id, // $7
                    FETCH_SIZE, // $8
                    excludeTags, // $9
                    includeTags // $10
                ]);
                props.searchResult = processRawResult(rawResult);
            }
            if (props.searchResult.length < FETCH_SIZE) {
                props.noMoreResultsToFetch = true;
            }
        } else if (text !== undefined) {
            const lastVideo = fetchMetadata ? await Video.findOne({ url: fetchMetadata }) : undefined;
            const RAW_SQL = `
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
            const rawResult = await sails.sendNativeQuery(RAW_SQL, [
                null, // $1
                FETCH_SIZE, // $2
                (title ? `%${sanitizedTitle}%` : null), // $3
                startDate, // $4
                endDate, // $5
                lastVideo?.date, // $6
                lastVideo?.id, // $7
                null, // $8
                excludeTags, // $9
                includeTags // $10
            ]);
            props.searchResult = processRawResult(rawResult);
            if (props.searchResult.length < FETCH_SIZE) {
                props.noMoreResultsToFetch = true;
            }
        }
        return { page: 'sections/search', props }
    }
  }
  