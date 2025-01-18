module.exports = {
    attributes: {
        // association
        owner: {
            model: 'video'
        },
        tags: {
            collection: 'tag',
            via: 'owner'
        }
    }
}
