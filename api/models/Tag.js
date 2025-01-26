module.exports = {
    attributes: {
        name: {
            type: 'string',
            required: true,
            unique: true
        },
        // association
        owners: {
            collection: 'tagmap',
            via: 'tags'
        }
    }
}
