module.exports = {
    friendlyName: 'Bookmarks',
    description: 'Retrieves searchResult based on bookmarked subtitle ids.',
    inputs: {
        subtitleIds: {
            type: 'ref'
        },
        sort: {
            type: 'string',
            isIn: ['recency', 'dateAsc', 'dateDesc'],
            defaultsTo: 'recency'
        }
    },
    exits: {
        success: {
            responseType: 'inertia'
        }
    },

    fn: async function ({ subtitleIds, sort }) {
        const { formatSeconds } = require('../../../shared/constants');
        const { getBookmarkBackupMetadata } = require('../../utils/dbUtils');
        const { parseSubtitleIds } = require('../../utils/bookmarkValidators');
        const props = {
            tags: sails.hooks['db-refresh'].getTags(),
            sort,
            unresolvedIds: [],
            searchResult: []
        };

        const { ids, error } = parseSubtitleIds(subtitleIds);
        if (error) {
            props.fatalError = error;
            return { page: 'sections/bookmarks', props };
        }
        if (ids.length === 0) {
            return { page: 'sections/bookmarks', props };
        }

        try {
            const { rowById, tagsByVideoId } = await getBookmarkBackupMetadata(ids);
            props.unresolvedIds = ids.filter(id => !rowById.has(id));

            const TAGS = sails.hooks['db-refresh'].getTags();
            const sortVideoTags = (names) => names
                .filter(name => {
                    if (!TAGS[name]) {
                        sails.log(`Missing tag ${name}`);
                        return false;
                    }
                    return true;
                })
                .sort((a, b) => {
                    if (TAGS[a].order !== TAGS[b].order) return TAGS[a].order - TAGS[b].order;
                    return a.localeCompare(b);
                });

            const orderIndexById = new Map();
            ids.forEach((id, i) => { orderIndexById.set(id, i); });

            const videoMap = new Map();
            for (const id of ids) {
                const row = rowById.get(id);
                if (!row) continue;
                let entry = videoMap.get(row.video_id);
                if (!entry) {
                    entry = {
                        url: row.url,
                        title: row.title,
                        date: row.date,
                        tags: sortVideoTags(tagsByVideoId.get(row.video_id) || []),
                        subtitles: [],
                        firstOrderIndex: orderIndexById.get(id)
                    };
                    videoMap.set(row.video_id, entry);
                }
                entry.subtitles.push({
                    subtitleId: row.subtitleId,
                    startTime: row.startTime,
                    timestamp: formatSeconds(row.startTime),
                    text: row.text
                });
            }

            for (const entry of videoMap.values()) {
                entry.subtitles.sort((a, b) => a.startTime - b.startTime);
                entry.total = entry.subtitles.length;
            }

            const results = Array.from(videoMap.values());
            if (sort === 'dateAsc') {
                results.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
            } else if (sort === 'dateDesc') {
                results.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));
            } else {
                results.sort((a, b) => a.firstOrderIndex - b.firstOrderIndex);
            }
            for (const entry of results) delete entry.firstOrderIndex;

            props.searchResult = results;
            props.noMoreResultsToFetch = true;
            return { page: 'sections/bookmarks', props };
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : err;
            sails.log.error(errorMsg);
            props.fatalError = errorMsg;
            return { page: 'sections/bookmarks', props };
        }
    }
};
