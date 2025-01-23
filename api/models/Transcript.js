module.exports = {
    attributes: {
      text: {
        type: 'string',
        required: true
      },
      search_vector: {
        type: 'ref', // Raw SQL type for tsvector
        columnType: 'tsvector', // PostgreSQL-specific
      },
      // association
      owner: {
        model: 'video'
      }
    }
}
