module.exports = async function (req, res, proceed) {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/login');
    const user = await User.findOne({ id: userId });
    if (user.role === 'admin') return proceed();
    return res.redirect('/login');
}
