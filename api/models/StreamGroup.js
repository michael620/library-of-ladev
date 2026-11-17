module.exports = {
  tableName: 'stream_group',
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
