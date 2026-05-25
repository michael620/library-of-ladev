const { MAX_BOOKMARKS, MAX_BOOKMARK_FALLBACK_PAIRS } = require('../../shared/constants');

const badRequest = (res, error) => res.badRequest({ success: false, error });

const serverError = (res, friendlyName) =>
    res.serverError(`Library of Ladev ${friendlyName} API encountered an unexpected error.`);

const parseSubtitleIds = (subtitleIds) => {
    const ids = Array.isArray(subtitleIds) ? subtitleIds.filter(Number.isInteger) : [];
    if (ids.length > MAX_BOOKMARKS) {
        return { ids: null, error: `Too many bookmarks (max ${MAX_BOOKMARKS}).` };
    }
    return { ids, error: null };
};

const isValidCollectionMetadata = (collection) =>
    !!collection && typeof collection === 'object' && typeof collection.name === 'string';

const parseFallbackPairs = (pairs) => {
    if (!Array.isArray(pairs)) {
        return { urls: null, startTimes: null, error: 'pairs must be an array' };
    }
    if (pairs.length > MAX_BOOKMARK_FALLBACK_PAIRS) {
        return { urls: null, startTimes: null, error: `Too many pairs (max ${MAX_BOOKMARK_FALLBACK_PAIRS}).` };
    }
    const urls = [];
    const startTimes = [];
    for (const p of pairs) {
        if (!p || typeof p.videoUrl !== 'string' || !Number.isFinite(p.startTime)) {
            return { urls: null, startTimes: null, error: 'Invalid pair' };
        }
        urls.push(p.videoUrl);
        startTimes.push(Math.floor(p.startTime));
    }
    return { urls, startTimes, error: null };
};

module.exports = {
    badRequest,
    serverError,
    parseSubtitleIds,
    isValidCollectionMetadata,
    parseFallbackPairs
};
