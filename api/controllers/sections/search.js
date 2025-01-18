module.exports = {
    
    friendlyName: 'Search',
  
    description: 'Search',

    inputs: {
        text: {
            description: 'text',
            type: 'string'
        }
    },
  
    exits: {
      success: {
        responseType: 'inertia'
      }
    },
  
    // receives data from subtitle.jsx
    fn: async function ({text}) {
        let searchResult = {
            results: {},
            rows: 0,
            message: ''
        };
        const queryText = text;
        if (text) {
            const { processRawResult } = require('../../../utils/utils');
            const { MAX_ROW_LIMIT } = require('../../../utils/constants');
            
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
        return { page: 'sections/search', props: { searchResult, queryText } }
    }
  }
  