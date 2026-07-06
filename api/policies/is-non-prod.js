module.exports = function (req, res, proceed) {
  if (process.env.NODE_ENV !== 'production') {
    return proceed();
  }
  return res.notFound();
};
