module.exports = {
    attributes: {
        url: {
            type: 'string',
            required: true,
            unique: true
        },
        title: {
            type: 'string'
        },
        date: {
            type: 'string'
        },
        // association
        subtitles: {
            collection: 'subtitle',
            via: 'owner'
        }
    }
}
