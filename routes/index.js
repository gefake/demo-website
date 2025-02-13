const
	Discord = require('discord.js'),
    express = require('express'),
    _ = require('lodash'),
    mw = require('./_mw'),
    config = require('../config'),
    jsStringify = require('js-stringify'),
    path = require('path'),
    db = require('../db'),
    fs = require('fs'),
    // donations_db = require('../donations_db'),
    moment = require('moment'),
    Gamedig = require("gamedig"),
    bot = require("../core/bot"),
    bodyParser = require('body-parser'),
    { VK } = require("vk-io")

const vk = new VK({
    token: config.vkToken,
    pollingGroupId: config.vkId
})

vk.updates.on('new_wall_post', (result) => {
    if (result && result.isRepost) return 
    if (result.wall && result.wall.postType && result.wall.postType === "suggest") return 
    var post_id = result.wall.id
    var post_text = result.wall.text
    var post_link = `https://vk.com/public187821968?w=wall${result.wall.ownerId}_${result.wall.id}`
    if (result.wall.attachments && result.wall.attachments[0] && result.wall.attachments[0].mediumPhoto) {
        config.sendVkToDiscord(post_text, post_link, "https://i.imgur.com/0nKu3Eb.png", result.wall.attachments[0].mediumPhoto)
    } else {
        config.sendVkToDiscord(post_text, post_link, "https://i.imgur.com/0nKu3Eb.png")
    }

    var dbPostText = post_link.substring(0, 100) + '...'
    db.query("UPDATE website_main SET text = ? WHERE mode = 'vk'", [dbPostText])
})

vk.updates.start().catch(console.error)

const vkMetro = new VK({
    token: config.vkMetroToken,
    pollingGroupId: config.vkMetroId
})

vkMetro.updates.on('new_wall_post', (result) => {
    if (result && result.isRepost) return 
    if (result.wall && result.wall.postType && result.wall.postType === "suggest") return
    var post_id = result.wall.id
    var post_text = result.wall.text
    var post_link = `https://vk.com/public200660799?w=wall${result.wall.ownerId}_${result.wall.id}`
    if (result.wall.attachments && result.wall.attachments[0] && result.wall.attachments[0].mediumPhoto) {
        config.sendVkToDiscord(post_text, post_link, "https://i.imgur.com/QQCV1nR.jpg", result.wall.attachments[0].mediumPhoto)
    } else {
        config.sendVkToDiscord(post_text, post_link, "https://i.imgur.com/QQCV1nR.jpg")
    }
})

vkMetro.updates.start().catch(console.error)

const vkCyber = new VK({
    token: config.vkCyberToken,
    pollingGroupId: config.vkCyberId
})

vkCyber.updates.on('new_wall_post', (result) => {
    if (result && result.isRepost) return 
    if (result.wall && result.wall.postType && result.wall.postType === "suggest") return
    var post_id = result.wall.id
    var post_text = result.wall.text
    var post_link = `https://vk.com/public206049492?w=wall${result.wall.ownerId}_${result.wall.id}`
    if (result.wall.attachments && result.wall.attachments[0] && result.wall.attachments[0].mediumPhoto) {
        config.sendVkToDiscordCyber(post_text, post_link, "https://i.imgur.com/aM3dCz1.png", result.wall.attachments[0].mediumPhoto)
    } else {
        config.sendVkToDiscordCyber(post_text, post_link, "https://i.imgur.com/aM3dCz1.png")
    }
})

vkCyber.updates.start().catch(console.error)

// next things

const router = new express.Router()

var cache

router.use('/user', require('./user'))
router.use('/gallery', require('./gallery'))
router.use('/server', require('./server'))

// Get admin page

// 
// 
// 
// 
// 
// 
// TODOOD
// router.get('/donations', mw.includePerms, async(req, res) => { 
//     if (!req.perms.seeAdmin) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title:"Ошибка" })
    
//     const user = req.session.username

//     const [rows_evac_total] = await donations_db.query('SELECT SUM(amount) as total FROM donations_payments WHERE serverID = "evac"')
//     const evac_total = rows_evac_total[0].total

//     const [rows_cobalt_total] = await donations_db.query('SELECT SUM(amount) as total FROM donations_payments WHERE serverID = "cobalt"')
//     const cobalt_total = rows_cobalt_total[0].total
    
//     const [evac_lastdons] = await donations_db.query(`SELECT donations_payments.steamID, donations_payments.amount, donations_payments.timeCompleted
//     FROM donations_payments WHERE serverID = "evac"`)
    
//     evac_lastdons.forEach(element => {
//         var nowStamp = moment.unix(element.timeCompleted).locale('ru').fromNow()
//         element.niceTime = nowStamp
//     })

//     const [cobalt_lastdons] = await donations_db.query(`SELECT donations_payments.steamID, donations_payments.amount, donations_payments.timeCompleted
//     FROM donations_payments WHERE serverID = "cobalt"`)

//     cobalt_lastdons.forEach(element => {
//         var nowStamp = moment.unix(element.timeCompleted).locale('ru').fromNow()
//         element.timeCompleted = nowStamp
//     })

//     const [evac_rows_purchases] = await donations_db.query('SELECT itemClass, price FROM donations_purchases WHERE serverID = "evac"')

//     let evac_purchases = []
//     let evac_shopList = []
// 	for (const purchase of evac_rows_purchases) {
//         if (!evac_shopList.includes(purchase.itemClass)) {
//             const [evac_purchase_count] = await donations_db.query('SELECT count(id) as total FROM donations_purchases WHERE itemClass = ? AND serverID = "evac"', [purchase.itemClass])
//             evac_purchases.push({class : purchase.itemClass, price : purchase.price, count : evac_purchase_count[0].total})
//             evac_shopList.push(purchase.itemClass)
//         }
//     }

//     evac_purchases.sort(function(a, b){
//         return b.count - a.count
//     })

//     const [cobalt_rows_purchases] = await donations_db.query('SELECT itemClass, price FROM donations_purchases WHERE serverID = "cobalt"')

//     let cobalt_purchases = []
//     let cobalt_shopList = []
// 	for (const purchase of cobalt_rows_purchases) {
//         if (!cobalt_shopList.includes(purchase.itemClass)) {
//             const [metro_purchase_count] = await donations_db.query('SELECT count(id) as total FROM donations_purchases WHERE itemClass = ? AND serverID = "cobalt"', [purchase.itemClass])
//             console.log(metro_purchase_count)
//             cobalt_purchases.push({class : purchase.itemClass, price : purchase.price, count : metro_purchase_count[0].total})
//             cobalt_shopList.push(purchase.itemClass)
//         }
//     }

//     cobalt_purchases.sort(function(a, b){
//         return b.count - a.count
//     })

//     res.render('donations', {
//         user,
//         evac_purchases,
//         evac_total,
//         evac_lastdons,
//         cobalt_purchases,
//         cobalt_total,
//         cobalt_lastdons,
//         title: "Панель управления"
//     })
// })

router.get('/admin', mw.includePerms, async(req, res) => {

    if (!req.perms.seeAdmin) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title:"Ошибка" })
    
    const user = req.session.username
    const [rows_main] = await db.query('SELECT text, type FROM website_main WHERE mode = ? ORDER BY id DESC LIMIT 1', ["notify"])
    const [rows_users] = await db.query('SELECT user, avatar, timestamp FROM website_users ORDER BY id DESC LIMIT 1')
    const [rows_galCount] = await db.query('SELECT count(id) as total FROM website_gallery')

    const [rows_purchases] = await db.query('SELECT itemClass, price FROM octoshop_purchases')
    const [rows_paymentSum] = await db.query('SELECT SUM(amount) as total FROM octoshop_payments')
    const paymentSum = rows_paymentSum[0].total
    
    const [rows_lastDons] = await db.query(`SELECT octoshop_payments.userID, octoshop_users.id, octoshop_users.steamID, octoshop_payments.amount, octoshop_payments.timeCompleted
    FROM octoshop_payments
    INNER JOIN octoshop_users ON octoshop_payments.userID=octoshop_users.id ORDER BY octoshop_payments.id DESC LIMIT 5`)

    const [rows_lastDonators] = await db.query('SELECT steamID, totalTopup, totalSpent, totalPurchases FROM octoshop_users ORDER BY totalTopup DESC LIMIT 5')

    rows_lastDons.forEach(element => {
        var nowStamp = moment.unix(element.timeCompleted).locale('ru').fromNow()
        element.timeCompleted = nowStamp
    })

    let shopPurchases = []
    let shopList = []
	for (const purchase of rows_purchases) {
        if (!shopList.includes(purchase.itemClass)) {
            const [purchase_count] = await db.query('SELECT count(id) as total FROM octoshop_purchases WHERE itemClass = ?', [purchase.itemClass])
            shopPurchases.push({class : purchase.itemClass, price : purchase.price, count : purchase_count[0].total})
            shopList.push(purchase.itemClass)
        }
    }

    shopPurchases.sort(function(a, b){
        return b.count - a.count
    })

    var MetroPlayersCount
    var MetroPlayers

    if (cache === false)
        MetroPlayersCount = "Выключен"
    else if (typeof(cache) === 'object')
        MetroPlayersCount = cache.raw.numplayers
        else
        try {
            const state = await Gamedig.query({
                type: 'garrysmod',
                host: '46.174.54.94',
                port: '27120',
            })
            cache = state
            MetroPlayersCount = cache.raw.numplayers
            MetroPlayers = cache.players
            setTimeout(() => delete cache, 60 * 1000)
        } catch {
            MetroPlayersCount = 'Выключен'
            cache = false
            setTimeout(() => delete cache, 60 * 1000)
        }

    res.render('admin', { user, rows_main, rows_users, rows_galCount, paymentSum, shopPurchases, rows_lastDons, rows_lastDonators, MetroPlayersCount, MetroPlayers, title: "Панель управления" })

})

// Post text and type for main page notification

router.post('/main_notify', mw.includePerms, async(req, res) => {

    if (!req.perms.updateNews) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title: "Ошибка" })

    const user = req.session.username
    const text = req.body.text
    const type = req.body.type

    db.query("UPDATE website_main SET text = ?, type = ? WHERE mode = 'notify'", [text, type])
        .then(res.render('message', { text: `Текст успешно опубликован на главной странице`, type: 'success', back: '/admin', title: "Успешно" }))
        .catch(console.error)
})

// Get orgs page

router.get('/orgs', (req, res) => {

    const user = req.session.username

    res.render('orgs', { user, title: "Организации" })
})

router.get('/server_loader/:serverID', (req, res) => {
    fs.readFile(path.join(__dirname, '..', `views/loaders/${req.params.serverID}.html`), 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Ошибка чтения файла');
        } else {
            res.send(data);
        }
    });
});

// Get politics page

// router.get('/politics', (req, res) => {res.render('politics'), {title: "Политика конфедициальности"}})

// Redirect to main page

router.get('/', (req, res) => res.redirect('/main'))

// Get main page

router.get('/main', async(req, res) => {

    const user = req.session.username
    const status = "1"

    const [rows_notify] = await db.query('SELECT text, type, mode FROM website_main WHERE mode = "notify"')
    const [rows_vknews] = await db.query('SELECT text, type, mode FROM website_main WHERE mode = "vk"')
    
    const [rows_gallery] = await db.query('SELECT title, image, description, user, link, timestamp FROM website_gallery WHERE status = ? ORDER BY id DESC LIMIT 1', [status])
    const [rows_userCount] = await db.query('SELECT count(user) as total FROM website_users')
    const [rows_users] = await db.query('SELECT user, avatar, timestamp, `rank` FROM website_users ORDER BY id DESC LIMIT 1')

    var MetroPlayersCount = 'Dev'

    var date1 = moment(rows_users[0].timestamp).locale('ru')
    var date2 = moment(rows_gallery[0].timestamp).locale('ru')
    var nowUserStamp = date1.fromNow()
    var nowGalStamp = date2.fromNow()

    if (cache === false)
        MetroPlayersCount = "Выключен"
    else if (typeof(cache) === 'object')
        MetroPlayersCount = cache.raw.numplayers
    else
        try {
            const state = await Gamedig.query({
                type: 'garrysmod',
                host: '46.174.54.94',
                port: '27120'
            })
            cache = state
            MetroPlayersCount = `${cache.raw.numplayers}`
            setTimeout(() => delete cache, 10 * 1000)
        } catch {
            MetroPlayersCount = 'Выключен'
            cache = false
            setTimeout(() => delete cache, 10 * 1000)
        }

    res.render('main', { user, rows_notify, rows_vknews, rows_gallery, rows_users, rows_userCount, MetroPlayersCount, nowUserStamp, nowGalStamp, title: "Главная" })

})

router.get('/hello', async(req, res) => {
    res.render('hello', {title: "Привет"})
})

// Get Discord page

router.get('/discord', (req, res) => { 
    
    const user = req.session.username

    res.render('pages/discord', { user, title: 'Discord | Voidline Community' }) 
})


// ROADMAP

router.get('/roadmap', async(req, res) => { 
    
    const [rows_targets] = await db.query('SELECT id, type, target, status FROM website_roadmap ORDER BY id DESC')
    const user = req.session.username

    res.render('pages/roadmap', { user, rows_targets, title: 'Цели | Voidline Community' }) 
})

router.post('/add_target', mw.includePerms, async(req, res) => {

    if (!req.perms.sendTarget) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title: "Ошибка" })

    const type = req.body.type
    const text = req.body.text

    db.query("INSERT INTO website_roadmap(type, target) VALUES (?, ?)", [type, text])
        .then(function() {
            res.redirect("roadmap")
            config.sendTargetPublic(req.body)
        })
})

router.post('/target_status', mw.includePerms, async(req, res) => {

    if (!req.perms.sendTarget) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title: "Ошибка" })

    const id = req.body.id
    const bool = true

    db.query("UPDATE website_roadmap SET status = ? WHERE id = ?", [bool, id])
        .then(res.redirect("/roadmap"))
})

router.post('/target_remove', mw.includePerms, async(req, res) => {

    if (!req.perms.sendTarget) return res.render('message', { text: 'Ошибка доступа', error: '403', type: 'danger', back: '/main', title: "Ошибка" })

    const id = req.body.id

    db.query("DELETE FROM website_roadmap WHERE id = ?", [id])
        .then(res.redirect("/roadmap"))
})

router.get('/opendiscord', (req, res) => {res.render('opendiscord'), {title: "Discord | Voidline"}})

router.get('/help', (req, res) => {res.redirect('https://voidline.notion.site/28ba9fa5e9a4410babf59a07e319610d')})
router.get('/team', (req, res) => {res.redirect('https://tally.so/r/mKD5M3')})

// join to metro link
router.get('/serverconnect/:serverIP/:serverPORT/:serverNAME', (req, res) => {
    res.render('serverjoin', {jsStringify, data: req.params})
})

// heart post

const heartKey = "C0UT1Be.uI]mCu+W(rm62$-jJk%D6l"

router.post('/heart', async(req, res) => {
    if (req.headers.authorization !== heartKey) return res.status(403).send('Access denied.')
    if (!req.headers.discord) return res.status(403).send('Invalid Discord ID.')
    if (!req.headers.role) return res.status(403).send('Invalid Role.')
    res.send(`Success! Activation subscription for ${req.headers.discord}`)

    const discordID = req.headers.discord
    const guild = bot.guilds.cache.get("634833167424946188")
    if (!guild) return
    const role = guild.roles.cache.find(role => role.id === req.headers.role)
    if (!role) return
    var user = await guild.members.fetch(discordID)
    if (!user) return

    user.send('`✅` Подписка была успешно синхронизирована с твоим аккаунтом.')
    user.send(`Ты получил роль ${role.name}`)
    user.roles.add(role)

    console.log(`[GMOD POST] Activation subscription for ${discordID}`)
})

router.post('/heartremove', async(req, res) => {
    if (req.headers.authorization !== heartKey) return res.status(403).send('Access denied.')
    if (!req.headers.discord) return res.status(403).send('Invalid Discord ID.')
    if (!req.headers.role) return res.status(403).send('Invalid Role.')
    res.send(`Success! Removing subscription for ${req.headers.discord}`)

    const discordID = req.headers.discord
    const guild = bot.guilds.cache.get("634833167424946188")
    if (!guild) return
    const role = guild.roles.cache.find(role => role.id === req.headers.role)
    if (!role) return
    var user = await guild.members.fetch(discordID)
    if (!user) return
    
    user.send('`❌` Роль ' + role.name + ' была удалена с твоего аккаунта, потому что ты использовал другой айди привязки')
    user.roles.remove(role)

    console.log(`[GMOD POST] Removing subscription from ${discordID}`)
})

// discord wrapper

const wrapperKey = 'MovLHRF6neDS72ewZ3wwKrST'
router.post('/discordmsg', async(req, res) => {
    req.setTimeout(0)
    
    if (req.headers.authorization !== wrapperKey) return res.status(403).send('Access denied.')
    let data = req.body
    if (!data) return console.log("Invalid /discordmsg data!")

    const guild = bot.guilds.cache.get(data.guild)
    if (!guild) return console.log("Invalid /discordmsg guild!")
    
    const channel = guild.channels.cache.find(channel => channel.name === (data.channel || 'тикеты'))
    if (!channel) return console.log("Invalid /discordmsg channel!")

    if (data.embeds) {
        const embed = new Discord.MessageEmbed()
            .setColor(data.color || '#FBA64B')
            .setTitle(data.embeds.title || '')
            .setDescription(data.embeds.description || '')
            .setThumbnail(data.embeds.thumbnail || '')
            .setImage(data.embeds.image || '')

            if (data.embeds.footer) {
                embed.setFooter({text: data.embeds.footer.title || 'Undefined title', iconURL: data.embeds.footer.image || 'https://cdn.discordapp.com/embed/avatars/0.png'})
            }

            if (data.embeds.fields) {
                embed.addFields(data.embeds.fields)
            }

            if (data.embeds.url) {
                embed.setURL(data.embeds.url)
            }

            if (data.embeds.author) {
                embed.setAuthor({name: data.embeds.author.name || "Undefined name", iconURL: data.embeds.author.avatar || "https://cdn.discordapp.com/embed/avatars/0.png", url: data.embeds.author.url || "https://voidline.rocks/"})
            }

            if (data.embeds.timestamp) {
                embed.setTimestamp()
            }

        channel.send(embed ? {embeds: [embed]} : "`❌` Undefined embed")
    } else {
        channel.send(data.message || "`❌` Undefined message")
    }
})

module.exports = router
