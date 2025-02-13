'use strict';
const
    express = require('express'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    requestIp = require('request-ip'),
    config = require('../../config'),
    timeout = require('connect-timeout'),
    routes = require('../../routes')

const app = express()
const sessionMW = session({
    secret: 'testsecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 7 * 24 * 60 * 1000,
    },
})

app.set('view engine', 'pug')
app.use(sessionMW)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(requestIp.mw())
app.use(routes)
app.use(timeout('1s'));
app.use(haltOnTimedout)
app.use('/static', express.static(__dirname + '/../../static'))

function haltOnTimedout (req, res, next) {
    if (!req.timedout) next()
}

module.exports = app