module.exports = async function (req, res, proceed) {
    if (process.env.NODE_ENV !== 'production') {
        return proceed();
    }
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (apiKey === sails.config.custom.uploadApiKey) {
        return proceed();
    }
    return res.forbidden();
}
