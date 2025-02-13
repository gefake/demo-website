const
    express = require('express'),
    _ = require('lodash'),
    mw = require('./_mw'),
    config = require('../config'),
    db = require('../db'),
    moment = require('moment'),
    CryptoJS = require("crypto-js"),
    Gamedig = require("gamedig")

const router = new express.Router()

var cache

router.get('/metro', async(req, res) => {

    var MetroPlayers

    if (cache === false)
        MetroPlayers = "Выключен"
    else if (typeof(cache) === 'object')
        MetroPlayers = cache.raw.numplayers
        else
        try {
            const state = await Gamedig.query({
                type: 'garrysmod',
                host: '46.174.54.94',
                port: '27120',
            })
            cache = state
            MetroPlayers = `${cache.raw.numplayers}`
            setTimeout(() => delete cache, 60 * 1000)
        } catch {
            MetroPlayers = 'Выключен'
            cache = false
            setTimeout(() => delete cache, 60 * 1000)
        }

    res.render('server/metro.pug', {MetroPlayers, title: "Метро 2033"})

})

module.exports = router