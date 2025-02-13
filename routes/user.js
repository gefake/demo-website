const
    _ = require('lodash'),
    express = require('express'),
    mw = require('./_mw'),
    db = require('../db'),
    multer = require('multer'),
    storage = require('../upload-config'),
    fs = require('fs'),
    moment = require('moment'),
    CryptoJS = require("crypto-js"),
    // sharp = require('sharp'),
    path = require('path'),
    rn = require('random-number'),
    request = require('request'),
    send = require('gmail-send')({
        user: "voidline.community@gmail.com",
        pass: "pgdhjyztxgjdxvtl",
    })

const router = new express.Router()

const upload = multer(storage)

// User registration post

router.post('/reg', async(req, res) => {

    var username = req.body['username']
    var password = CryptoJS.SHA256(req.body['password']).toString(CryptoJS.enc.SHA256)
    var mail = req.body['mail']
    var captcha = req.body['g-recaptcha-response']
    var secretKey = "6LeDmNAUAAAAAOzek4iGXRGAzBSr7Ira4Xw6n6Pr";
    var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress
    const [rows_users] = await db.query("SELECT user FROM website_users WHERE user = ?", [username])
    const [rows_mails] = await db.query("SELECT mail FROM website_users WHERE mail = ?", [mail])
    if (rows_users[0]) { if (rows_users[0].user != undefined) return res.render('message', { text: 'Такой пользователь уже существует', type: 'danger', back: '/user/reg', title:"Ошибка"}) }
    if (rows_mails[0]) { if (rows_mails[0].mail != undefined) return res.render('message', { text: 'Пользователь с указанной электронной почтой уже зарегистрирован', type: 'danger', back: '/user/reg', title:"Ошибка"}) }
    if (captcha === undefined || captcha === '' || captcha === null) return res.render('message', { text: 'Запрос отклонен - капча не подтверждена', error: 'Google Капча', btext: 'Назад', type: 'info', back: '/user/reg', title:"Ошибка" })

    var now = moment().unix() * 1000
    var rank = 'guest'
    var options = {
        min:  100000
      , max:  999999
      , integer: true
    }

    const codeNumber = rn(options)

    request(verificationUrl, function(error, response, body) {
        body = JSON.parse(body)
        if (body.success !== undefined && !body.success) return res.render('message', { text: 'Верификация отклонена - капча не подтверждена', error: 'Google Капча', btext: 'Попробовать снова', type: 'info', back: '/user/reg', title:"Ошибка" })
        send({
            from: "Voidline Community",
            to: req.body.mail,
            subject: 'Подтверждение аккаунта Voidline',
            html: `<!doctype html><html> <head> <meta name='viewport' content='width=device-width'> <meta http-equiv='Content-Type' content='text/html; charset=UTF-8'> <title>Simple Transactional Email</title> <style>@media only screen and (max-width: 620px){table[class=body] h1{font-size: 28px !important; margin-bottom: 10px !important;}table[class=body] p,table[class=body] ul,table[class=body] ol,table[class=body] td,table[class=body] span,table[class=body] a{font-size: 16px !important;}table[class=body] .wrapper,table[class=body] .article{padding: 10px !important;}table[class=body] .content{padding: 0 !important;}table[class=body] .container{padding: 0 !important; width: 100% !important;}table[class=body] .main{border-left-width: 0 !important; border-radius: 0 !important; border-right-width: 0 !important;}table[class=body] .btn table{width: 100% !important;}table[class=body] .btn a{width: 100% !important;}table[class=body] .img-responsive{height: auto !important; max-width: 100% !important; width: auto !important;}}@media all{.ExternalClass{width: 100%;}.ExternalClass,.ExternalClass p,.ExternalClass span,.ExternalClass font,.ExternalClass td,.ExternalClass div{line-height: 100%;}.apple-link a{color: inherit !important; font-family: inherit !important; font-size: inherit !important; font-weight: inherit !important; line-height: inherit !important; text-decoration: none !important;}#MessageViewBody a{color: inherit; text-decoration: none; font-size: inherit; font-family: inherit; font-weight: inherit; line-height: inherit;}.btn-primary table td:hover{background-color: #34495e !important;}.btn-primary a:hover{background-color: #34495e !important; border-color: #34495e !important;}}</style> </head> <body class='' style='background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;'> <table border='0' cellpadding='0' cellspacing='0' class='body' style='border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f6f6f6;'> <tr> <td style='font-family: sans-serif; font-size: 14px; vertical-align: top;'>&nbsp;</td><td class='container' style='font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; Margin: 0 auto; max-width: 580px; padding: 10px; width: 580px;'> <div class='content' style='box-sizing: border-box; display: block; Margin: 0 auto; max-width: 580px; padding: 10px;'> <span class='preheader' style='color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;'></span> <table class='main' style='border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #ffffff; border-radius: 3px;'> <tr> <td class='wrapper' style='font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;'> <table border='0' cellpadding='0' cellspacing='0' style='border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;'> <tr> <td style='font-family: sans-serif; font-size: 14px; vertical-align: top;'> <p style='font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; Margin-bottom: 15px;'>Привет, и добро пожаловать в Voidline Community! <br>Код для регистрации твоего аккаунта:</p><p style='color: #FBA64B; font-size: 20px;'>${codeNumber}</p><table border='0' cellpadding='0' cellspacing='0' class='btn btn-primary' style='border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; box-sizing: border-box;'> <tbody> <tr> <td align='left' style='font-family: sans-serif; font-size: 14px; vertical-align: top; padding-bottom: 15px;'> <table border='0' cellpadding='0' cellspacing='0' style='border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: auto;'> <tbody> <tr> <td style='font-family: sans-serif; font-size: 14px; vertical-align: top; background-color: #3498db; border-radius: 5px; text-align: center;'> <a href='https://voidline.rocks/user/reg/verify' target='_blank' style='display: inline-block; color: #ffffff; background: linear-gradient(-45deg, #FFA64B, #F87D71); border: solid 1px; border-radius: 5px; box-sizing: border-box; cursor: pointer; text-decoration: none; font-size: 14px; font-weight: bold; margin: 0; padding: 16px 70px;'>Подтвердить аккаунт</a> </td></tr></tbody> </table> </td></tr></tbody> </table> <p style='font-family: sans-serif; font-size: 12px; font-weight: normal; margin: 0; Margin-bottom: 0px;'>После подтверждения профиля, становится доступен весь основной функционал сайта</p></td></tr></table> </td></tr></table> </div></td><td style='font-family: sans-serif; font-size: 14px; vertical-align: top;'>&nbsp;</td></tr></table> </body></html>`,
        }, (error) => {
            if (error) console.error(error);
        })
        db.query("INSERT INTO website_users(user, password, `rank`, mail, code, avatar, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)", [username, password, rank, mail, codeNumber, false, now])
            .then(function() {
                res.render('message', { text: `Пользователь ${username} зарегистрирован.`, type: 'success', btext:'Войти', back: '/user/login', title: "Уведомление" })
            })
    })
})

router.post('/verify', async(req, res) => {
    const user = req.session.username
    if (!user) return res.render('message', { text: 'Чтобы продолжить, необходимо войти в аккаунт', error: '403', type: 'danger', btext: "Вход", back: '/user/login', error: '403', title:"Ошибка" })

    var code = req.body['code']
    const [rows_user] = await db.query("SELECT user, code FROM website_users WHERE user = ?", [user.name])
    var confirmCode = rows_user[0].code
    if (code == confirmCode) {
        db.query("UPDATE website_users SET code = ?, `rank` = ? WHERE user = ?", [1, "user", user.name])
        .then(function() {
            req.session.destroy()
            req.session = null 
            res.render('message', { text: `Аккаунт успешно подтверждён`, type: 'success', back: `/user/login`, title: "Уведомление" })
        }).catch(function(error){
            console.log(error)
        })
    } else {
        res.render('message', { text: `Неверный код подтверждения`, type: 'danger', back: '/user/reg/verify', title: "Ошибка" })
    }
})

router.get('/reg/verify', async(req, res) => {
    const user = req.session.username
    if (!user) return res.render('message', { text: 'Чтобы продолжить, необходимо войти в аккаунт', error: '403', type: 'danger', btext: "Вход", back: '/user/login', error: '403', title:"Ошибка" })
    const name = user.name
    const [rows_user] = await db.query("SELECT user, code FROM website_users WHERE user = ?", [name])
    if (rows_user[0].code === 1) return res.render('message', { text: 'Аккаунт уже подтверждён', type: 'warning', back: `/user/${user.name}`, error: '403', title:"Ошибка" })
    res.render('pages/verify', {title: "Регистрация", user})
})

// User auth post

router.post('/login', async(req, res) => {

    var user = req.body['username']
    var password = CryptoJS.SHA256(req.body['password']).toString(CryptoJS.enc.SHA256)
    if (user && password)
        db.query('SELECT user, `rank`, avatar FROM website_users WHERE user = ? AND password = ?', [user, password])
        .then(function([result]) {
            if (result.length) {
                req.session.username = {
                    name: result[0].user,
                    rank: result[0].rank,
                    avatar: result[0].avatar
                }
                res.redirect('/main')
            } else {
                res.render('message', { text: 'Неверное имя пользователя или пароль', type: 'danger', back: '/user/login', title: "Ошибка" })
            }
        })
        .catch(function(err) {
            console.log(err)
        })
})

// Get register page

router.get('/reg', (req, res) => {

    res.render('registration', {title: "Регистрация"})

})

// Get auth page

router.get('/login', (req, res) => {

    res.render('login', {title: "Вход"})

})

router.post('/avatar', upload.single('avatar'), async(req, res) => {
    const user = req.session.username
    const [rows_user] = await db.query("SELECT user, code FROM website_users WHERE user = ?", [user.name])
    if (rows_user[0].code != 1) return res.render('message', { text: 'Аккаунт не подтверждён', type: 'warning', btext:'Подтвердить', back: `/user/reg/verify`, error: '403', title:"Ошибка" })
    if (!user) return res.render('message', { text: 'Чтобы продолжить, необходимо войти в аккаунт', error: '403', type: 'danger', btext: "Вход", back: '/user/login', error: '403', title:"Ошибка" })
    // await sharp(req.file.path)
    // .resize(500)
    // .png({quality: 50})
    // .toFile(
    //     path.resolve(req.file.destination, 'avatars', `${user.name}.png`)
    // )
    // fs.unlinkSync(req.file.path)
    // db.query("UPDATE website_users SET avatar = ? WHERE user = ?", [`${user.name}.png`, user.name])
    //     .then(function([rows]) {
    //         res.render('message', { text: `Фотография успешно установлена`, type: 'success', back: `/user/${user.name}/settings`, title:"Уведомление" })
    //     })
})

router.post('/header', async(req, res) => {

    const user = req.session.username
    const [rows_user] = await db.query("SELECT user, code FROM website_users WHERE user = ?", [user.name])
    if (rows_user[0].code != 1) return res.render('message', { text: 'Аккаунт не подтверждён', type: 'warning', btext:'Подтвердить', back: `/user/reg/verify`, error: '403', title:"Ошибка" })
    if (!user) return res.render('message', { text: 'Чтобы продолжить, необходимо войти в аккаунт', error: '403', type: 'danger', btext: "Вход", back: '/user/login', error: '403', title:"Ошибка" })

    var image = req.body['image']
    var jsonParse = {background: req.body.image}
    let bool

    let str = image
    let result = str.match(/^https?:\/\/(\w+\.)?imgur.com\/([a-zA-Z0-9]{7,7})+(\.[a-zA-Z]{3})?$/)

    if (result) {
        if (result.length == 4 && bool != true) {
            db.query("UPDATE website_users SET info = ? WHERE user = ?", [jsonParse, user.name])
            .then(function([rows]) {
                res.render('message', { text: `Фотография успешно загружена в профиль`, type: 'success', back: `/user/${user.name}/settings`, title:"Уведомление" })
            })
        } else {
            res.render('message', { text: "Неверный формат вводимой ссылки", type: 'danger', back: '/admin', title:"Ошибка"})
        }
    }

})

router.get('/list', (req, res) => {res.redirect('/user/list/0-20')})

router.get('/list/:pID1-:pID2', async(req, res) => {

    const user = req.session.username
    const pID1 = req.params.pID1
    const pID2 = req.params.pID2
    const [rows_userCount] = await db.query('SELECT count(id) as total FROM website_users')
    var count = rows_userCount[0].total

    db.query('SELECT user, avatar FROM website_users ORDER BY id DESC LIMIT ?, ?', [pID1, pID2])
        .then(function([rows]) {
            if (rows.length) {
                res.render('users/profile-page', { user, rows, pID1, pID2, count, title: "Список пользователей" })
            } else { return res.render('message', { text: 'Пользователей не существует', type: 'danger', back: '/user/list', title:"Ошибка" }) }
        })

})

router.get('/:uID', (req, res) => {

    const uID = req.params.uID
    const user = req.session.username

    db.query('SELECT user, avatar, info, `rank`, code, timestamp FROM website_users WHERE user = ?', [uID])
        .then(function([rows]) {
            if (rows.length) {
                var date = moment(rows[0].timestamp)
                date.locale('ru')
                var nowStamp = date.fromNow()
                res.render(`users/profile`, { user, rows, uID, nowStamp, title:uID })
            } else { return res.render('message', { text: 'Профиль не найден', type: 'danger', back: '/main', title:"Ошибка" }) }
        })
})

router.get('/:uID/settings', mw.includePerms, async(req, res) => {

    const uID = req.params.uID
    const user = req.session.username
    const [rows_user] = await db.query("SELECT user, code FROM website_users WHERE user = ?", [user.name])
    if (rows_user[0].code != 1) return res.render('message', { text: 'Аккаунт не подтверждён', type: 'warning', btext:'Подтвердить', back: `/user/reg/verify`, error: '403', title:"Ошибка" })
    if (!user) return res.render('message', { text: 'Чтобы продолжить, необходимо войти в аккаунт', error: '403', type: 'danger', btext: "Вход", back: '/user/login', error: '403', title:"Ошибка" })

    db.query('SELECT user, avatar, info, `rank`, code FROM website_users WHERE user = ?', [uID])
        .then(function([rows]) {
            if (rows.length) {
                res.render(`users/profile-settings`, { user, rows, uID })
            } else if (user.name != uID) {
                return res.render('message', { text: 'Вы не владелец профиля', error: '403', type: 'danger', back: '/main', title:"Ошибка" })
            } else {
                return res.render('message', { text: 'Профиль не найден', type: 'danger', back: '/main', title:"Ошибка" })
            }
        })
})

// router.post('/:uID/rank', mw.includePerms, async(req, res) => {

//     if (!req.perms.setRank) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title:"Ошибка" })

//     const rankname = req.body['privilege']
//     const username = req.params.uID

//     db.query("UPDATE website_users SET rank = ? WHERE user = ?", [rankname, username])
//         .then(function([rows]) {
//             res.render('message', { text: `Ранг пользователя ${username} успешно изменён на ${rankname}`, btext: 'На главную', type: 'success', back: '/main', title:"Уведомление" })
//         })

    // _.forOwn(req.sessionStore.sessions, (_data, id) => {
    //     const data = JSON.parse(_data)
    //     if (data.user && data.user.name === username) req.sessionStore.destroy(id)
    // })


// })

// router.post('/name', (req, res) => {

//     const users = db.get('users') || {}
//     var oldUsername = req.body['oldusername']
//     var newUsername = req.body['newusername']

//     users[newUsername] = users[oldUsername]
//     delete users[oldUsername]

//     db.set('users', users)

//     res.render('message', { text: 'Имя успешно изменено', type: 'success', back: '/settings', title:"Уведомление" })

// })

router.post('/:uID/info', (req, res) => {

    const info = {about: req.body['info']}
    const user = req.session.username
    const uID = req.params.uID

    db.query("UPDATE website_users SET info = ? WHERE user = ?", [info, user.name])
        .then(function([rows]) {
            res.render('message', { text: `Информация опубликована в профиле`, type: 'success', back: `/user/${user.name}/settings`, title:"Уведомление" })
        })

})

router.post('/:uID/delete', mw.includePerms, async(req, res) => {

    if (!req.perms.deleteUser) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title:"Ошибка" })

    db.query("DELETE FROM website_users WHERE user = ?", [rep.params.uID])
        .then(function([rows]) {
            res.render('message', { text: `Ранг пользователя ${username} успешно изменён на ${rankname}`, btext: 'На главную', type: 'success', back: '/main', title:"Уведомление" })
        })

})

router.post('/exit', (req, res) => {

    req.session.destroy()
    req.session = null 
    res.redirect('/')

})

module.exports = router