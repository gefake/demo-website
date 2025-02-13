const
    mysql = require('mysql2'),
    config = require('./config').db

const db = module.exports

var conn
db.reconnect = function() {
    conn = mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.pass,
        database: config.name,
        port: config.port,
    }).promise()

    conn.connect()
        .then(() => this.migrate())
        .catch(err => setTimeout(reconnect, 10000))

    conn.on('error', err => {
        if (err.code == 'PROTOCOL_CONNECTION_LOST') {
            this.reconnect()
        } else if (err.code == 'ER_DATA_TOO_LONG') {
            this.reconnect()
        } else {
            throw err
        }
    })
}
db.reconnect()

db.migrate = function() {

    this.query(`CREATE TABLE IF NOT EXISTS website_main (
        id int(10) PRIMARY KEY AUTO_INCREMENT,
        text varchar(255) NOT NULL,
        type varchar(255) NOT NULL
    )`)

    // this.query(`DROP TABLE website_users`)

    this.query(`CREATE TABLE IF NOT EXISTS website_users (
        id int(10) PRIMARY KEY AUTO_INCREMENT,
        user varchar(255) NOT NULL,
        avatar varchar(255),
        password varchar(255) NOT NULL,
        \`rank\` varchar(255) NOT NULL,
        mail varchar(255) NOT NULL,
        code int(50),
        info json,
        timestamp BIGINT NOT NULL
    )`)

    this.query(`CREATE TABLE IF NOT EXISTS website_gallery (
        id int(10) PRIMARY KEY AUTO_INCREMENT,
        user varchar(255) NOT NULL,
        image varchar(255) NOT NULL,
        title varchar(255) NOT NULL,
        description varchar(255) NOT NULL,
        link varchar(255) NOT NULL,
        status varchar(255) NOT NULL,
        timestamp BIGINT NOT NULL
    )`)

    this.query(`CREATE TABLE IF NOT EXISTS website_comments (
        id int(10) PRIMARY KEY AUTO_INCREMENT,
        type varchar(255) NOT NULL,
        typeID int(10) NOT NULL,
        user varchar(255) NOT NULL,
        text TEXT NOT NULL,
        date varchar(255),
        CONSTRAINT imageCommId FOREIGN KEY (typeID) REFERENCES website_gallery(id) ON DELETE CASCADE
    )`)

    this.query(`CREATE TABLE IF NOT EXISTS website_rating (
        type varchar(255) NOT NULL,
        user varchar(255) NOT NULL,
        typeID int(10),
        CONSTRAINT imageRateId FOREIGN KEY (typeID) REFERENCES website_gallery(id) ON DELETE CASCADE
    )`)

    this.query(`CREATE TABLE IF NOT EXISTS website_roadmap (
        id int(10) PRIMARY KEY AUTO_INCREMENT,
        type varchar(255) NOT NULL,
        target text NOT NULL,
        status boolean
    )`)

    this.query(`CREATE TABLE IF NOT EXISTS website_bot_subs (
        id int(10) PRIMARY KEY AUTO_INCREMENT,
        discordID varchar(255) NOT NULL,
        role varchar(255) NOT NULL,
        timestamp BIGINT NOT NULL
    )`)

}

db.query = function(sql, vals) {
    return conn.execute(sql, vals)
}