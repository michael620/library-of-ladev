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
        }
    },
  
    exits: {
      success: {
        responseType: 'inertia'
      }
    },
  
    // receives data from subtitle.jsx
    fn: async function ({text, isFullTextSearch}) {
        let searchResult = {
            results: {},
            rows: 0,
            message: ''
        };
        const queryText = text;
        if (text) {
            const { processRawResult, processRawResultFTS } = require('../../../utils/utils');
            const { MAX_ROW_LIMIT, MAX_ROW_LIMIT_FTS } = require('../../../utils/constants');
            if (isFullTextSearch) {
                // only keep alphanumeric and space
                let sanitizedText = text.replace(/[^a-zA-Z0-9\s]/g, '').split(' ');
                sanitizedText = sanitizedText.reduce((result, curr) => {
                    if (!curr || !curr.length) {
                        return result;
                    }
                    result.push(curr.trim());
                    return result;
                }, []);
                sanitizedText = sanitizedText.join(' & ');
                const RAW_SQL = `
                SELECT ts_headline(
                'english',
                text,
                to_tsquery('english', $1),
                'MinWords=25, MaxWords=50, MaxFragments=3, FragmentDelimiter=" || "'
                ) AS snippets,
                ts_rank(to_tsvector('english', text), to_tsquery('english', $1)) AS rank,
                video.url, video.title, video.date
                FROM transcript
                JOIN video ON transcript.owner = video.id
                WHERE search_vector @@ to_tsquery($1)
                ORDER BY rank DESC
                LIMIT $2;`;
                const rawResult = await sails.sendNativeQuery(RAW_SQL, [`%${sanitizedText}%`, `${MAX_ROW_LIMIT_FTS+1}`]);
                searchResult = processRawResultFTS(rawResult);
            } else {
                const RAW_SQL = `
                SELECT subtitle."startTime", subtitle.text, subtitle.speaker, video.url, video.title, video.date
                FROM subtitle
                JOIN video ON subtitle.owner = video.id
                WHERE subtitle.text ILIKE $1
                ORDER BY subtitle.owner, subtitle."startTime"
                LIMIT $2;`;
                const rawResult = await sails.sendNativeQuery(RAW_SQL, [`%${text}%`, `${MAX_ROW_LIMIT+1}`]);
                searchResult = processRawResult(rawResult);
            }
        }
        return { page: 'sections/search', props: { searchResult, queryText, isFullTextSearch } }
    }
  }
  