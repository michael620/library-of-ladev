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
        lastUrl: {
            description: 'lastUrl',
            type: 'string'
        },
        numResults: {
            description: 'numResults',
            type: 'number'
        }
    },
  
    exits: {
      success: {
        responseType: 'inertia'
      }
    },
  
    fn: async function ({text, isFullTextSearch, title, startDate, endDate, lastUrl, numResults }) {
        const props = {
            searchResult: [],
            searchParams: {
                text,
                isFullTextSearch,
                title,
                startDate,
                endDate
            }
        };
        if (text) {
            const { processRawResult, processRawResultFTS } = require('../../utils/utils');
            const { MAX_ROW_LIMIT, FETCH_SIZE } = require('../../../shared/constants');
            if (isFullTextSearch) {
                const RAW_SQL = `
                SELECT ts_headline(
                'english',
                text,
                websearch_to_tsquery('english', $1),
                'MinWords=25, MaxWords=50, MaxFragments=3, FragmentDelimiter=" || "'
                ) AS snippets,
                ts_rank(search_vector, websearch_to_tsquery('english', $1)) AS rank,
                video.url, video.title, video.date
                FROM transcript
                JOIN video ON transcript.owner = video.id
                WHERE search_vector @@ websearch_to_tsquery($1)
                AND (video.title ILIKE $3 OR COALESCE(NULLIF($3, ''), '') = '')
                AND (
                    (video.date BETWEEN NULLIF($4, '') AND NULLIF($5, ''))
                    OR (NULLIF($4, '') IS NOT NULL AND NULLIF($5, '') IS NULL AND video.date >= NULLIF($4, ''))
                    OR (NULLIF($4, '') IS NULL AND NULLIF($5, '') IS NOT NULL AND video.date <= NULLIF($5, ''))
                    OR (NULLIF($4, '') IS NULL AND NULLIF($5, '') IS NULL)
                )
                ORDER BY rank DESC
                LIMIT $2
                OFFSET $6;`;
                const rawResult = await sails.sendNativeQuery(RAW_SQL, [`${text}`, `${FETCH_SIZE}`, (title ? `%${title}%` : null), startDate, endDate, numResults || 0]);
                props.searchResult = processRawResultFTS(rawResult);
            } else {
                // const RAW_SQL = `
                // SELECT subtitle."startTime", subtitle.text, subtitle.speaker, video.url, video.title, video.date, video.id
                // FROM subtitle
                // JOIN video ON subtitle.owner = video.id
                // WHERE subtitle.text ILIKE $1
                // AND (video.title ILIKE $3 OR COALESCE(NULLIF($3, ''), '') = '')
                // AND (
                //     (video.date BETWEEN NULLIF($4, '') AND NULLIF($5, ''))
                //     OR (NULLIF($4, '') IS NOT NULL AND NULLIF($5, '') IS NULL AND video.date >= NULLIF($4, ''))
                //     OR (NULLIF($4, '') IS NULL AND NULLIF($5, '') IS NOT NULL AND video.date <= NULLIF($5, ''))
                //     OR (NULLIF($4, '') IS NULL AND NULLIF($5, '') IS NULL)
                // )
                // AND ((COALESCE($6, '') = '' OR COALESCE($7, '') = '') OR (video.date, video.id) < ($6, $7::INTEGER))
                // ORDER BY video.date DESC, video.id DESC, subtitle.owner, subtitle."startTime"
                // LIMIT $2;`;
                const lastVideo = lastUrl ? await Video.findOne({ url: lastUrl }) : undefined;
                const RAW_SQL = `
                WITH RankedSubtitles AS (
                    SELECT subtitle.text, subtitle."startTime", video.url, video.title, video.id AS video_id, video.date,
                        ROW_NUMBER() OVER (PARTITION BY video.id ORDER BY subtitle."startTime" ASC) AS row_num
                    FROM subtitle
                    JOIN video ON subtitle.owner = video.id
                    WHERE subtitle.text ILIKE $1
                    AND (video.title ILIKE $3 OR COALESCE(NULLIF($3, ''), '') = '')
                    AND (
                        (video.date BETWEEN NULLIF($4, '') AND NULLIF($5, ''))
                        OR (NULLIF($4, '') IS NOT NULL AND NULLIF($5, '') IS NULL AND video.date >= NULLIF($4, ''))
                        OR (NULLIF($4, '') IS NULL AND NULLIF($5, '') IS NOT NULL AND video.date <= NULLIF($5, ''))
                        OR (NULLIF($4, '') IS NULL AND NULLIF($5, '') IS NULL)
                    )
                    AND ((COALESCE($6, '') = '' OR COALESCE($7, '') = '') OR (video.date, video.id) < ($6, $7::INTEGER))
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
                )
                SELECT s.text, s.url, s."startTime", s.title, s.date, t.total_count
                FROM RankedSubtitles s
                JOIN LimitedVideos lv ON s.video_id = lv.id
                JOIN TotalCount t ON lv.id = t.video_id
                WHERE s.row_num <= $2
                ORDER BY s.date DESC, s.video_id, s."startTime";
                `;
                const rawResult = await sails.sendNativeQuery(RAW_SQL, [`%${text}%`, MAX_ROW_LIMIT, (title ? `%${title}%` : null), startDate, endDate, lastVideo?.date, lastVideo?.id, FETCH_SIZE]);
                props.searchResult = processRawResult(rawResult);
            }
            if (props.searchResult.length < FETCH_SIZE) {
                props.noMoreResultsToFetch = true;
            }
        }
        return { page: 'sections/search', props }
    }
  }
  