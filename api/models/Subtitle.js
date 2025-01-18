module.exports = {
    attributes: {
      startTime: {
        type: 'number',
        defaultsTo: 0
      },
      endTime: {
        type: 'number',
        defaultsTo: 0
      },
      text: {
        type: 'string',
        defaultsTo: ''
      },
      speaker: {
        type: 'string',
        defaultsTo: 'SPEAKER'
      },
      // association
      owner: {
        model: 'video'
      }
    }
}
