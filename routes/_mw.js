const ranks = require('../ranks')

module.exports = {

    includePerms(req, res, next) {
        const user = req.session.username
        if (!user) return res.render('message', { text: 'Чтобы продолжить, необходимо войти в аккаунт', error: '403', type: 'danger', btext: "Вход", back: '/user/login', error: '403' })

        const rank = user.rank ? ranks[user.rank] : undefined
        if (!rank) {
            req.perms = {}
            return next()
        }

        req.perms = rank.perms
        next()
    },

}