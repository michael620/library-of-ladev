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
            SUBTITLE_SEARCH_RAW_SQL,
            FTS_RAW_SQL,
            VIDEO_SEARCH_RAW_SQL,
            sanitizeInput,
            getTextSearchResults
        } = require('../../utils/dbUtils');
        const { FETCH_SIZE, FETCH_TYPE } = require('../../../shared/constants');
        const { processRawResult, processRawResultFTS, processRawResultSubtitle } = require('../../utils/utils');
        const sanitizedText = text?.replace(/\*/g, '%').replace(/\?/g, '_');
        const sanitizedTitle = title?.replace(/\*/g, '%').replace(/\?/g, '_');
        if (fetchType === FETCH_TYPE.SUBTITLE) {
            const rawResult = await sails.sendNativeQuery(SUBTITLE_SEARCH_RAW_SQL, [text && !fetchAll ? `%${sanitizedText}%` : null, fetchMetadata]);
            props.subtitleResult = processRawResultSubtitle(rawResult);
            if (fetchAll) props.allSubtitlesFetched = true;
        } else if (text) {
            if (isFullTextSearch) {
                const rawResult = await sails.sendNativeQuery(FTS_RAW_SQL, [
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
                const params = sanitizeInput({text, isFullTextSearch, title, startDate, endDate, includeTags, excludeTags, fetchSize: FETCH_SIZE, lastUrl: fetchMetadata});
                props.searchResult = await getTextSearchResults(params);
            }
            if (props.searchResult.length < FETCH_SIZE) {
                props.noMoreResultsToFetch = true;
            }
        } else if (text !== undefined) {
            const lastVideo = fetchMetadata ? await Video.findOne({ url: fetchMetadata }) : undefined;
            const rawResult = await sails.sendNativeQuery(VIDEO_SEARCH_RAW_SQL, [
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
  