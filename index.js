const
	site = require('./core/site'),
    bot = require('./core/bot'),
    config = require('./config')

site.listen(config.port, function() {
    console.log(`App started on port ${config.port}`)  
})

site.timeout = 200

bot.login('')