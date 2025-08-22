module.exports = async function (req, res, proceed) {
    if (process.env.NODE_ENV !== 'production') {
        return proceed();
    }
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (apiKey === sails.config.custom.uploadApiKey) {
        return proceed();
    }
    const userId = req.session.userId;
    if (!userId) return res.redirect('/login');
    const user = await User.findOne({ id: userId });
    if (user.role === 'admin') {
        return proceed();
    }
    return res.redirect('/login');
}
