module.exports = {
  friendlyName: 'View admin',
  description: 'Admin dashboard entry point — search page in edit mode',
  inputs: {
    text: { type: 'string' },
    isFullTextSearch: { type: 'boolean' },
    title: { type: 'string' },
    isAscending: { type: 'boolean' },
    startDate: { type: 'string' },
    endDate: { type: 'string' },
    includeTags: { type: 'ref' },
    excludeTags: { type: 'ref' },
    fetchType: { type: 'string' },
    videoUrl: { type: 'string' },
    lastUrl: { type: 'string' },
    lastFtsIndex: { type: 'number' },
    fetchAll: { type: 'boolean' },
  },
  exits: {
    success: { responseType: 'inertia' },
  },
  fn: async function (inputs) {
    const searchAction = require('../sections/search');
    const result = await searchAction.fn.call(this, inputs);
    result.props = result.props || {};
    result.props.isAdmin = true;
    return result;
  },
};
