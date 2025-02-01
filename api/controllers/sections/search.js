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
        }
    },
  
    exits: {
      success: {
        responseType: 'inertia'
      }
    },
  
    fn: async function ({text, isFullTextSearch, title, startDate, endDate }) {
        const props = {
            searchResult: {
                results: {},
                rows: 0,
                message: ''
            },
            text,
            isFullTextSearch,
            title,
            startDate,
            endDate
        };
        if (text) {
            const { processRawResult, processRawResultFTS } = require('../../../utils/utils');
            const { MAX_ROW_LIMIT, MAX_ROW_LIMIT_FTS } = require('../../../utils/constants');
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
                LIMIT $2;`;
                const rawResult = await sails.sendNativeQuery(RAW_SQL, [`${text}`, `${MAX_ROW_LIMIT_FTS+1}`, (title ? `%${title}%` : null), startDate, endDate]);
                props.searchResult = processRawResultFTS(rawResult);
            } else {
                const RAW_SQL = `
                SELECT subtitle."startTime", subtitle.text, subtitle.speaker, video.url, video.title, video.date
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
                ORDER BY video.date DESC, subtitle.owner, subtitle."startTime"
                LIMIT $2;`;
                const rawResult = await sails.sendNativeQuery(RAW_SQL, [`%${text}%`, `${MAX_ROW_LIMIT+1}`, (title ? `%${title}%` : null), startDate, endDate]);
                props.searchResult = processRawResult(rawResult);
            }
        }
        return { page: 'sections/search', props }
    }
  }
  