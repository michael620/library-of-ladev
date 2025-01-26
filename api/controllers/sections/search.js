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
  
    // receives data from subtitle.jsx
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
            const videoTitleFilter = title ? `AND video.title ILIKE '%${title}%'` : '';
            let dateFilter = '';
            if (startDate && endDate) {
                dateFilter = `AND video.date BETWEEN '${startDate}' AND '${endDate}'`;
            } else if (startDate) {
                dateFilter = `AND video.date >= '${startDate}'`;
            } else if (endDate) {
                dateFilter = `AND video.date <= '${endDate}'`;
            }
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
                ${videoTitleFilter}
                ${dateFilter}
                ORDER BY rank DESC
                LIMIT $2;`;
                const rawResult = await sails.sendNativeQuery(RAW_SQL, [`%${sanitizedText}%`, `${MAX_ROW_LIMIT_FTS+1}`]);
                props.searchResult = processRawResultFTS(rawResult);
            } else {
                const RAW_SQL = `
                SELECT subtitle."startTime", subtitle.text, subtitle.speaker, video.url, video.title, video.date
                FROM subtitle
                JOIN video ON subtitle.owner = video.id
                WHERE subtitle.text ILIKE $1
                ${videoTitleFilter}
                ${dateFilter}
                ORDER BY subtitle.owner, subtitle."startTime"
                LIMIT $2;`;
                const rawResult = await sails.sendNativeQuery(RAW_SQL, [`%${text}%`, `${MAX_ROW_LIMIT+1}`]);
                props.searchResult = processRawResult(rawResult);
            }
        }
        return { page: 'sections/search', props }
    }
  }
  