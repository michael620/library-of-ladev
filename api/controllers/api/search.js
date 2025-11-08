module.exports = {
    friendlyName: 'API Search',
    description: 'API Search',
    exits: {
        json: {
            responseType: 'json'
        }
    },
    fn: async function () {
        try {
            const { FETCH_SIZE } = require('../../../shared/constants');
            const { processRawResult, processRawResultFTS, processRawResultSubtitle } = require('../../utils/utils');
            const {
                SUBTITLE_SEARCH_RAW_SQL,
                FTS_RAW_SQL,
                TEXT_SEARCH_RAW_SQL,
                VIDEO_SEARCH_RAW_SQL,
                sanitizeInput,
                getTextSearchResults
            } = require('../../utils/dbUtils');
            const req = this.req;
            const text = req.body?.text ?? req.query?.text ?? null;
            const isFullTextSearch = req.body?.isFullTextSearch ?? req.query?.isFullTextSearch ?? false;
            const title = req.body?.title ?? req.query?.title ?? null;
            const startDate = req.body?.startDate ?? req.query?.startDate ?? null;
            const endDate = req.body?.endDate ?? req.query?.endDate ?? null;
            const includeTags = req.body?.includeTags ?? req.query?.includeTags ?? [];
            const excludeTags = req.body?.excludeTags ?? req.query?.excludeTags ?? [];
            const fetchSize = req.body?.fetchSize ?? req.query?.fetchSize ?? FETCH_SIZE;
            const lastUrl = req.body?.lastUrl ?? req.query?.lastUrl ?? null;
            const params = sanitizeInput({text, isFullTextSearch, title, startDate, endDate, includeTags, excludeTags, fetchSize, lastUrl});
            const result = await getTextSearchResults(params);
            const newLastUrl = result.length ? result[result.length-1].url : null;
            return this.res.json({
                success: true,
                data: { result, lastUrl: newLastUrl },
            });
        } catch (err) {
            sails.log.error(err);
            return this.res.serverError('API Search encountered an error.');
        }
    }
}
