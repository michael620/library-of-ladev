module.exports = {
  attributes: {
    maintainerKey: {
      type: 'string',
      columnName: 'maintainer_key',
      allowNull: true,
    },
    // association
    defaultVideo: {
      model: 'video',
      columnName: 'default_video_id',
    },
  },
};
