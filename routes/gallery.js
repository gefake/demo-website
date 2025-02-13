const
    express = require('express'),
    _ = require('lodash'),
    mw = require('./_mw'),
    db = require('../db'),
    config = require('../config'),
    moment = require('moment'),
    cyrillicToTranslitJs = require("cyrillic-to-translit-js"),
    request = require('request')

const router = new express.Router()

// site 6LdBltAUAAAAAGX8_HuryVO-RCyO6jVAojYCBuBO
// secret '6LdBltAUAAAAAGg0TTSVDRTOp42yqE9Kep9v2iof

// Get gallery page

router.get('/', async(req, res) => {
    const user = req.session.username
    const [rows] = await db.query('SELECT user, image, title, description, link, status, timestamp FROM website_gallery ORDER BY id DESC')
    var date = moment(rows[0].timestamp)
    date.locale('ru')
    var nowStamp = date.fromNow()
    res.render('gallery/gallery', { user, nowStamp, rows, title:"Галерея" })
})

router.post('/image-:iID/like', mw.includePerms, async(req, res) => {

    if (!req.perms.sendGallery) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title:"Ошибка" })

    const user = req.session.username
    const id = req.params.iID
    const [getID] = await db.query("SELECT id from website_gallery WHERE link = ?", [id])
    const [getUser] = await db.query("SELECT user from website_rating WHERE user = ? AND typeID = ?", [user.name, getID[0].id])
    const _tableUser = getUser[0]

    if (_tableUser && _tableUser.user == user.name) {
        db.query("DELETE FROM website_rating WHERE user = ? AND typeID = ?", [user.name, getID[0].id])
    } else {
        db.query("INSERT INTO website_rating(type, user, typeID) VALUES (?, ?, ?)", ["image", user.name, getID[0].id])
    }

})

// Gallery post

router.post('/', mw.includePerms, async(req, res) => {

    if (!req.perms.sendGallery) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title:"Ошибка" })
    
    const user = req.session.username
    const author = user.name
    var image = req.body['image']
    var title = req.body['title']
    var desc = req.body['desc']
    var now = moment().unix() * 1000
    var cooldown = moment().unix() * 1000 + 3565999
    let tr = cyrillicToTranslitJs().transform(`${author}_${title}`, "-")
    let lower = tr.toLowerCase();
    let str = image
    let result = str.match(/^https?:\/\/(\w+\.)?imgur.com\/([a-zA-Z0-9]{7,7})+(\.[a-zA-Z]{3})?$/)

    if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
        return res.render('message', { text: 'Запрос отклонен - капча не подтверждена', error: 'Google Капча', btext: 'Назад', type: 'danger', back: '/gallery', title:"Ошибка" })
    }

    var secretKey = "6LeDmNAUAAAAAOzek4iGXRGAzBSr7Ira4Xw6n6Pr";
    var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress
    request(verificationUrl, function(error, response, body) {
        body = JSON.parse(body);
        if (body.success !== undefined && !body.success) {
            return res.render('message', { text: 'Верификация отклонена - капча не подтверждена', error: 'Google Капча', btext: 'Попробовать снова', type: 'warning', back: '/gallery', title:"Ошибка" })
        }
        if (result) {
            if (result.length == 4) {
                db.query("INSERT INTO website_gallery(user, image, title, description, link, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)", [author, image, title, desc, lower, false, now])
                    .then(function() {
                        res.render('message', { text: `Фотография отправлена на проверку модерацией`, type: 'success', back: '/gallery', title:"Уведомление" })
                        config.sendGalleryTicket(req.body, author, tr)
                    })
                }
        } else {
            res.render('message', { text: "Неверный формат вводимой ссылки", type: 'danger', back: '/admin', title:"Ошибка"})
        }
    })

})

// Video post

router.post('/video', mw.includePerms, async(req, res) => {

    if (!req.perms.sendGallery) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title:"Ошибка" })
    const user = req.session.username
    res.render('message', { text: 'Видео успешно опубликовано', type: 'success', back: '/admin', title:"Уведомление" })

})

// Get gallery image | iID

router.get('/image-:iID', async(req, res) => {

    const user = req.session.username
    const iID = req.params.iID
    var bool = false
    const [rows_gallery] = await db.query('SELECT id, user, image, title, description, link, status, timestamp FROM website_gallery WHERE link = ?', [iID])
    const row = rows_gallery[0]
    const [rows_comments] = await db.query('SELECT id, type, typeID, user, text, date FROM website_comments WHERE typeID = ?', [row.id])
    const [likeCount] = await db.query('SELECT count(typeID) as total FROM website_rating WHERE typeID = ?', [rows_gallery[0].id])
    const [curImage] = await db.query('SELECT image FROM website_gallery WHERE link = ?', [iID])
    
    if (user) {
        const [checkUser] = await db.query('SELECT user FROM website_rating WHERE user = ? AND typeID = ?', [user.name, rows_gallery[0].id])
        if (checkUser[0]) {
            if (checkUser[0].user == user.name) {
                bool = true
            } else {
                bool = false
            }
        }
    }

    var likes = likeCount[0].total
    var date = moment(rows_gallery[0].timestamp)
    date.locale('ru')
    var nowStamp = date.fromNow()
    if (!row) return res.render('message', { text: 'Фотографии с таким ID не существует', type: 'danger', back: '/gallery', title:"Уведомление" })
    res.render('gallery/gallery-photo', { row, user, bool, curImage, likes, iID, rows_comments, imageURL: rows_gallery[0].image, nowStamp, title:"Фотография" })
})

router.get('/list', mw.includePerms, (req, res) => {

    if (!req.perms.moderateGallery) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title:"Ошибка" })
    const user = req.session.username
    const iID = req.params.iID

    db.query('SELECT id, user, image, title, description, link, status FROM website_gallery')
        .then(function([rows]) {
            res.render(`admin/gallerylist.pug`, { user, rows, iID, title: 'Модерация галереи'})
        })

})

router.post('/setstatus', mw.includePerms, async(req, res) => {

    if (!req.perms.moderateGallery) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title:"Ошибка" })
    var status = req.body['status']
    var id = req.body['imageId']

    if (status == true) {
        db.query("SELECT user, image, title, description, link FROM website_gallery WHERE id = ?", [id])
            .then(function([rows]) {
                config.sendGalleryPublic(rows)
            })
        db.query("UPDATE website_gallery SET status = ? WHERE id = ?", [status, id])
            .then(function() {
                res.redirect(`/gallery/list`)
            })
    } else {
        db.query("DELETE FROM website_gallery WHERE id = ?", [id])
            .then(function() {
                res.redirect(`/gallery/list`)
            })
    }
})

router.post('/image-:iID/delete', mw.includePerms, async(req, res) => {

    if (!req.perms.deleteGallery) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title:"Ошибка" })
    const user = req.session.username
    const id = req.params.iID

    db.query("DELETE FROM website_gallery WHERE link = ?", [id])
        .then(function() {
            res.redirect("/gallery")
        })
})

router.post('/image-:iID/hide', mw.includePerms, async(req, res) => {

    if (!req.perms.moderateGallery) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title:"Ошибка" })
    const status = false
    const id = req.params.iID

    db.query("UPDATE website_gallery SET status = ? WHERE link = ?", [status, id])
        .then(function() {
            res.redirect("/gallery")
        })
})

router.post('/image-:iID/comment', mw.includePerms, async(req, res) => {

    if (!req.perms.sendGallery) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title:"Ошибка" })

    const user = req.session.username
    const id = req.body.id
    const text = req.body.text
    const type = "image"

    var time = moment()
    time.locale('ru')
    var date = time.format('DD MMMM YYYY, в h:mm')

    // const [rows_user] = await db.query('SELECT avatar FROM website_users WHERE user = ?', [user.name])
    // console.log(rows_user[0].avatar)

    db.query("INSERT INTO website_comments(type, typeID, user, text, date) VALUES (?, ?, ?, ?, ?)", [type, id, user.name, text, date])
        .then(function() {
            res.redirect(`/gallery/image-${req.params.iID}`)
        })
})

router.post('/image-:iID/delcomment', mw.includePerms, async(req, res) => {

    if (!req.perms.moderateGallery) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title:"Ошибка" })
    const id = req.body.id

    db.query("DELETE FROM website_comments WHERE id = ?", [id])
        .then(function() {
            res.redirect(`/gallery/image-${req.params.iID}`)
        })
})

module.exports = router