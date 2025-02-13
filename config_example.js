const
    axios = require('axios'),
    Gamedig = require("gamedig"),
    path = require("path"),
    multer = require("multer")
    

module.exports = {

    port: process.env.PORT || 3000,

    vkToken: "",
    vkId: "",

    gmodDiscord: "",

    webhook: '',
    webhook_tickets: '',
    webhook_news: '',
    webhook_gallery: '',
    webhook_targets: '',
    appURL: '',

    db: {
        host: '',
        user: '',
        pass: '',
        name: '',
        port: '',
    },

    async uploadOpt() {
        storage : new multer.diskStorage({
            destination : path.resolve(__dirname, ".","uploads"),
            filename : function(req, file, callback) {
                callback(null, file.originalname)
            }
        })
    },

    async sendGalleryTicket(data, author, tr) {

        const link = this.appURL
        await axios.post(this.webhook_tickets, {
            embeds: [{
                image: {
                    url: data["image"],
                },
                color: 0xFBA64B,
                title: `${link}/gallery/list`,
                description: `**Новая фотография ждёт подтверждения вердикта**\nАвтор: ${author}\nURL: ${tr}`,
            }]
        })

    },

    async sendVkToDiscord(post_text, post_link) {
        await axios.post(this.webhook_news, {
            username: `Новости`,
            content: '<@&699548969294102618>',
            embeds: [{
                author: {
                    name: "Новый пост ВКонтакте",
                    icon_url: "https://i.imgur.com/0nKu3Eb.png"
                },
                title: post_link,
                description: post_text,
                color: 0xFFA64B,
            }]
        })

    },

    async sendGalleryPublic(data) {

        const link = `${this.appURL}/gallery/image-${data[0].link}`
        await axios.post(this.webhook_gallery, {
            embeds: [{
                image: {
                    url: data[0].image,
                },
                color: 0xFBA64B,
                description: `**${data[0].title}**\n${data[0].description}\n\nБольше фотографий в [галерее сообщества](${link})`,
                footer: {
                    icon_url: "https://i.imgur.com/kEwEczW.png",
                    text: `Автор фотографии: ${data[0].user}`
                },
            }]
        })

    },

    async sendTargetPublic(data) {

        var col = 0xFBA64B
        var type = "Garry's Mod"
        var img = "https://i.imgur.com/pOEMhGL.png"

        if (data["type"]) {
            if (data["type"] == "gmod") {
                type = "Garry's Mod"
                col = 0x3bc278
                img = "https://i.imgur.com/pOEMhGL.png"
            } else if (data["type"] == "web") {
                type = "Веб-ресурсы"
                col = 0xffdb4a
                img = "https://i.imgur.com/8Ynoj3h.png"
            } else if (data["type"] == "comm") {
                type = "Сообщество"
                col = 0x26A69A
                img = "https://i.imgur.com/784A72p.png"
            }
        }

        await axios.post(this.webhook_targets, {
            embeds: [{
                author: {
                    name: type,
                    icon_url: img,
                    url: `${this.appURL}/roadmap`
                },
                color: col,
                description: `${data["text"]}`
            }]
        })

    },

}