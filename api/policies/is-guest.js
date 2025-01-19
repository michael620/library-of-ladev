module.exports = async function (req, res, proceed) {
    if (process.env.NODE_ENV === 'production') {
        return res.sendStatus(403)
    }
    if (!req.session.userId) {
        return proceed()
    }
    return res.redirect('/')
}
