module.exports = {
    friendlyName: 'Bookmarks Fallback',
    description: 'Resolve unresolved bookmarks by (videoUrl, startTime) into candidate subtitles.',
    inputs: {
        pairs: {
            type: 'ref'
        }
    },
    exits: {
        json: {
            responseType: 'json'
        }
    },
    fn: async function ({ pairs }) {
        const { formatSeconds } = require('../../../shared/constants');
        const { getBookmarkFallbackCandidates } = require('../../utils/dbUtils');
        const { badRequest, serverError, parseFallbackPairs } = require('../../utils/bookmarkValidators');
        try {
            if (Array.isArray(pairs) && pairs.length === 0) {
                return this.res.json({ success: true, data: { candidates: [] } });
            }
            const { urls, startTimes, error } = parseFallbackPairs(pairs);
            if (error) return badRequest(this.res, error);
            const rows = await getBookmarkFallbackCandidates(urls, startTimes);
            const candidates = rows.map(r => ({
                subtitleId: r.subtitleId,
                videoUrl: r.videoUrl,
                title: r.title,
                date: r.date,
                startTime: r.startTime,
                timestamp: formatSeconds(r.startTime),
                text: r.text
            }));
            return this.res.json({ success: true, data: { candidates } });
        } catch (err) {
            sails.log.error(err instanceof Error ? err.message : err);
            return serverError(this.res, 'Bookmarks Fallback');
        }
    }
};
