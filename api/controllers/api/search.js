module.exports = {
    friendlyName: 'API Search',
    description: 'API Search',
    inputs: {
        text: {
            type: 'string'
        },
        isFullTextSearch: {
            type: 'boolean'
        },
        title: {
            type: 'string'
        },
        startDate: {
            type: 'string'
        },
        endDate: {
            type: 'string'
        },
        includeTags: {
            type: 'ref'
        },
        excludeTags: {
            type: 'ref'
        },
        fetchSize: {
            type: 'number',
            min: 1,
            max: 100,
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
    },
    exits: {
        json: {
            responseType: 'json'
        }
    },
    fn: async function (inputParams) {
        try {
            const { FETCH_SIZE } = require('../../../shared/constants');
            const { processRawResult, processRawResultFTS, processRawResultSubtitle } = require('../../utils/utils');
            const {
                SUBTITLE_SEARCH_RAW_SQL,
                FTS_RAW_SQL,
                TEXT_SEARCH_RAW_SQL,
                VIDEO_SEARCH_RAW_SQL,
                sanitizeInput,
                getSubtitleSearchResults,
                getTextSearchResults,
                getVideoSearchResults
            } = require('../../utils/dbUtils');
            let params;
            try {
                params = await sanitizeInput(inputParams);
            } catch (err) {
                return this.res.badRequest({ success: false, error: err instanceof Error ? err.message : err });
            }
            const {text, isFullTextSearch, title, startDate, endDate, includeTags, excludeTags, fetchSize, videoUrl, lastUrl} = params;
            let result;
            if (videoUrl) {
                result = await getSubtitleSearchResults(params);
            } else if (text) {
                result = await getTextSearchResults(params);
            } else {
                result = await getVideoSearchResults(params);
            }
            const data = { result };
            if (!videoUrl) {
                if (!result.length || result.length < fetchSize) {
                    data.noMoreResultsToFetch = true;
                } else {
                    data.lastUrl = result[result.length-1].url;
                }
            }
            return this.res.json({
                success: true,
                data,
            });
        } catch (err) {
            sails.log.error(err);
            return this.res.serverError('Library of Ladev API encountered an unexpected error.');
        }
    }
}
