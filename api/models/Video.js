module.exports = {
  attributes: {
    url: {
      type: 'string',
      required: true,
      unique: true,
    },
    title: {
      type: 'string',
    },
    date: {
      type: 'string',
    },
    // associations
    subtitles: {
      collection: 'subtitle',
      via: 'owner',
    },
    group: {
      model: 'streamgroup',
      columnName: 'group_id',
    },
  },
};
