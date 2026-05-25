module.exports = {
    friendlyName: 'Bookmarks Backup',
    description: 'Retrieves bookmark identifiers + collection metadata into a downloadable backup snapshot.',
    inputs: {
        subtitleIds: {
            type: 'ref'
        },
        collection: {
            type: 'ref'
        },
        items: {
            type: 'ref'
        }
    },
    exits: {
        json: {
            responseType: 'json'
        }
    },
    fn: async function ({ subtitleIds, collection, items }) {
        const { formatSeconds } = require('../../../shared/constants');
        const { getBookmarkBackupMetadata } = require('../../utils/dbUtils');
        const { badRequest, serverError, parseSubtitleIds, isValidCollectionMetadata } = require('../../utils/bookmarkValidators');
        try {
            const { ids, error } = parseSubtitleIds(subtitleIds);
            if (error) return badRequest(this.res, error);
            if (!isValidCollectionMetadata(collection)) {
                return badRequest(this.res, 'Invalid collection metadata');
            }
            if (!Array.isArray(items)) {
                return badRequest(this.res, 'items must be an array');
            }
            const itemsByLocalId = new Map();
            for (const it of items) {
                if (!it || typeof it !== 'object') continue;
                if (typeof it.id !== 'string') continue;
                itemsByLocalId.set(it.id, it);
            }

            const { rowById, tagsByVideoId } = await getBookmarkBackupMetadata(ids);

            const TAGS = sails.hooks['db-refresh'].getTags();
            const sortVideoTags = (names) => names
                .filter(name => !!TAGS[name])
                .sort((a, b) => {
                    if (TAGS[a].order !== TAGS[b].order) return TAGS[a].order - TAGS[b].order;
                    return a.localeCompare(b);
                });

            const exportItems = ids.map(id => {
                const localItem = itemsByLocalId.get(String(id));
                const base = {
                    id: String(id),
                    subtitleId: id,
                    videoUrl: localItem?.videoUrl ?? null,
                    startTime: localItem?.startTime ?? null,
                    savedAt: localItem?.savedAt ?? null
                };
                const row = rowById.get(id);
                if (row) {
                    base.snapshot = {
                        text: row.text,
                        timestamp: formatSeconds(row.startTime),
                        videoTitle: row.title,
                        videoDate: row.date,
                        videoTags: sortVideoTags(tagsByVideoId.get(row.video_id) || [])
                    };
                    if (base.videoUrl == null) base.videoUrl = row.url;
                    if (base.startTime == null) base.startTime = row.startTime;
                }
                return base;
            });

            const payload = {
                version: 1,
                kind: 'backup',
                collection: {
                    id: collection.id,
                    name: collection.name,
                    createdAt: collection.createdAt,
                    updatedAt: collection.updatedAt
                },
                items: exportItems
            };
            return this.res.json({ success: true, data: payload });
        } catch (err) {
            sails.log.error(err instanceof Error ? err.message : err);
            return serverError(this.res, 'Bookmarks Backup');
        }
    }
};
