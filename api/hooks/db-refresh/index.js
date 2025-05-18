module.exports = function dbRefreshHook(sails) {
    const TAGS = {};
    return {
        defaults: {},
        fetchAndUpdate: async function () {
            try {
                const { TAG_TYPES } = require('../../../shared/constants');
                const tags = await sails.sendNativeQuery(`SELECT name, tag_type from Tag;`);
                for (row of tags.rows) {
                    switch (row.tag_type) {
                        case TAG_TYPES.APPEARANCES.text:
                            TAGS[row.name] = TAG_TYPES.APPEARANCES;
                            break;
                        case TAG_TYPES.CAMEOS.text:
                            TAGS[row.name] = TAG_TYPES.CAMEOS;
                            break;
                        case TAG_TYPES.STREAM_CONTENT.text:
                            TAGS[row.name] = TAG_TYPES.STREAM_CONTENT;
                            break;
                        default:
                            TAGS[row.name] = TAG_TYPES.APPEARANCES;
                    }
                }
            } catch (err) {
                sails.log.error('Error in dbRefreshHook.fetchAndUpdate:', err);
            }
        },
        initialize: async function (cb) {
            sails.after('hook:orm:loaded', async () => {
                await this.fetchAndUpdate();
            });
            return cb();
        },
        getTags: function () {
            return TAGS;
        },
    };
};
