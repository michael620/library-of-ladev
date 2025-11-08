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
        videoUrl: {
            type: 'string'
        },
        lastUrl: {
            type: 'string'
        },
        lastFtsIndex: {
            type: 'number'
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
  
    fn: async function ({ text, isFullTextSearch, title, startDate, endDate, includeTags, excludeTags, fetchType, videoUrl, lastUrl, lastFtsIndex, fetchAll }) {
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
        const {
            sanitizeInput,
            getSubtitleSearchResults,
            getFTSSearchResults,
            getTextSearchResults,
            getVideoSearchResults
        } = require('../../utils/dbUtils');
        const { FETCH_SIZE, FETCH_TYPE } = require('../../../shared/constants');
        try {
            const params = await sanitizeInput({text, isFullTextSearch, title, startDate, endDate, includeTags, excludeTags, fetchSize: FETCH_SIZE, fetchAll, lastUrl, videoUrl, lastFtsIndex});
            if (fetchType === FETCH_TYPE.SUBTITLE) {
                props.subtitleResult = await getSubtitleSearchResults(params);
                if (fetchAll) props.allSubtitlesFetched = true;
            } else if (text) {
                if (isFullTextSearch) {
                    props.searchResult = await getFTSSearchResults(params);
                } else {
                    props.searchResult = await getTextSearchResults(params);
                }
                if (props.searchResult.length < FETCH_SIZE) {
                    props.noMoreResultsToFetch = true;
                }
            } else if (text !== undefined) {
                props.searchResult = await getVideoSearchResults(params);
                if (props.searchResult.length < FETCH_SIZE) {
                    props.noMoreResultsToFetch = true;
                }
            }
            return { page: 'sections/search', props };
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : err;
            sails.log.error(errorMsg);
            props.fatalError = errorMsg;
            return { page: 'sections/search', props };
        }
    }
  }
  