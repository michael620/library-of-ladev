module.exports = {
    attributes: {
        name: {
            type: 'string',
            required: true,
            unique: true
        },
        // association
        owner: {
            model: 'tagmap'
        }
    }
}
