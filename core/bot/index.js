'use strict';
const
	Discord = require('discord.js'),
	{MessageActionRow, MessageButton, Modal, TextInputComponent, WebhookClient} = require('discord.js'),
	notionhq = require('@notionhq/client'),
	dig = require('gamedig'),
    site = require("../site/index.js"),
	config = require("../../config.js"),
	config_syncroles = require("../../config_syncroles.json"),
    moment = require('moment'),
	db = require("../../db.js"),
	TempChannels = require("discord-temp-channels"),
	{Youtrack} = require("youtrack-rest-client"),
	cron = require('node-cron'),
	nodeactyl = require('nodeactyl-beta');
const { NULL } = require('mysql2/lib/constants/types');

const notion = new notionhq.Client({ auth: config.notionToken })

const bot = new Discord.Client({
    intents: new Discord.Intents(32767)
})

let clientNodeactyl = new nodeactyl.NodeactylClient("", "")

const tempChannels = new TempChannels(bot)

bot.on('guildMemberAdd', async member => {
    await progressiveSearch(member.id);
});

cron.schedule(config_syncroles.cron_time, () => {
    console.log(`Running cron`)
    syncRoles();
});

async function progressiveSearch(member_id) {
    try {
        for(i = 0; i < config_syncroles.roles.length; i++){
            let base_guild = bot.guilds.cache.get(config_syncroles.roles[i].base_guild);
            let base_member = base_guild.members.cache.find(member => member.id === member_id);

            let base_role = base_guild.roles.cache.find(role => role.id === config_syncroles.roles[i].base_role_id);

            if (base_member) {
                let target_guild = bot.guilds.cache.get(config_syncroles.roles[i].extending_guild);
                let target_role = target_guild.roles.cache.find(role => role.id === config_syncroles.roles[i].extending_role_id);
                let target_member = target_guild.members.cache.find(member => member.id === member_id);
                if (target_member && base_member.roles.cache.has(base_role.id)) {
                    target_member.roles.add(target_role);
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function syncRoles() {
    try {
        for (let i = 0; i < config_syncroles.roles.length; i++){
            let base_guild = bot.guilds.cache.get(config_syncroles.roles[i].base_guild);
            let base_role = base_guild.roles.cache.find(role => role.id === config_syncroles.roles[i].base_role_id);

            let target_guild = bot.guilds.cache.get(config_syncroles.roles[i].extending_guild);
            let target_role = target_guild.roles.cache.find(role => role.id === config_syncroles.roles[i].extending_role_id);
        
            let base_members = await base_guild.members.fetch();
            let target_members = await target_guild.members.fetch();
            
            base_members = Array.from(base_members.values());
            target_members = Array.from(target_members.values());

            for (let j = 0; j < base_members.length; j++){
                let base_member = base_members[j];
                let target_member = target_members.find(member => member.id === base_member.id);
                if (target_member && base_member.roles.cache.has(base_role.id)) {
					console.log(target_member.user.username)
                    target_member.roles.add(target_role);
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
}

bot.on("ready", async () => {
	console.log("Pterodactyl defines here!")
	console.log(`Bot started: ${bot.user.tag}`)

	bot.user.setActivity(`войд, помоги`, {type: 'WATCHING'})

	// find users that we need to delete
	var curTime = moment().unix()
	const [subCheck] = await db.query('SELECT id, discordID, role, timestamp FROM website_bot_subs')

	for (const element of subCheck) {
		if (element) {
			if (element.timestamp && element.timestamp <= curTime) {
				const guild = bot.guilds.cache.get("634833167424946188")
				if (!guild) return

				const role = guild.roles.cache.find(role => role.id === element.role)
				if (!role) return

				try {
					guild.members.fetch(element.discordID || "")
						.then((user) => {
							const channel = guild.channels.cache.find(channel => channel.name === 'донаты')
							channel.send(`\`⌚\` Подписка пользователя ${user.user.username} **закончилась**`)
							user.send(`Твоя подиска с ролью ${role.name} **закончилась**, активировать новую ты можешь как всегда, на сервере!\nМы очень благодарны тебе за поддержку! 😎`).catch(error => {
								console.log("Error sending message")
							}) 

							user.roles.remove(role)
			
							db.query("DELETE FROM website_bot_subs WHERE discordID = ? AND role = ?", [element.discordID, element.role])
							console.log(`Deactivating subscription for ${element.discordID}`)
						})
						.catch((err) => {
							console.log(`Error check subs: ${err}`)
						})
				} catch (e) {
					console.log(e)
				}
			}
		}
	}

	await syncRoles();
})

tempChannels.registerChannel("945268151438954496", {
	childCategory: "692758172770893854",
	childAutoDeleteIfEmpty: true,
	childMaxUsers: 20,
	childFormat: (member, count) => `🔸 Линия ${member.user.username}`
})

tempChannels.on("childCreate", (member, channel, parentChannel) => {
    channel.permissionOverwrites.edit(member.id, {
		MANAGE_CHANNELS: true,
		CONNECT: true,
		SPEAK: true,
		VIEW_CHANNEL: true,
		MANAGE_ROLES: true,
	}).catch(console.error);
})

function random(min, max) {
	return Math.floor(min + Math.random() * (max - min))
}

const adminRoles = [
	'635549735545208883', // voidline
	'635550688780353566', // developer
	'763379457539964941', // senior
	'763375447999905823', // superior
	'887393459273605239', // superior cyberline
	'763379457539964941', // senior operator
]

function getAdminRole(roles) {
	for (let i in adminRoles) {
		let row = adminRoles[i]

		if (roles.has(row)) {
			return true
		} else {
			return false
		}
	}
}

const cmds = []
cmds['помоги'] = msg => {
	// if (msg.channel.type == "dm") return msg.channel.send("Эта команда может быть запущена только на сервере Voidline 🤧")

	let fields = []

	// if (getAdminRole(msg)) {
	// 	fields = [	
	// 		{ name: 'Войд, шанс', value: 'Говорю шанс от 1 до 100, который является беспрекословно точным'},
	// 		{ name: 'Войд, онлайн', value: 'Путем использования сложнейших математических формул, вычисляю онлайн на нашем сервере в Garry\'\s Mod'},
	// 		{ name: 'Войд, новости', value: 'Добавляю тебе роль, которая позволит узнавать о самых свежих новостях сообщества'},
	// 		{ name: 'Войд, ивенты', value: 'Добавляю тебе роль, которая позволит узнавать о ближайших ивентах на сервере Метро Кобальт'},
	// 		{ name: 'Войд, обыватель', value: 'Подписка на инсайд-обновления и секретные разработки 🤨'},
	// 		{ name: 'Войд, включи метро', value: 'Запускает сервер (V) Метро 2033: Кобальт'},
	// 		{ name: 'Войд, рестарт метро', value: 'Рестартает сервер (V) Метро 2033: Кобальт'},
	// 	]
	// } else {
		fields = [
			{ name: 'Войд, шанс', value: 'Говорю шанс от 1 до 100, который является беспрекословно точным'},
			{ name: 'Войд, онлайн', value: 'Путем использования сложнейших математических формул, вычисляю онлайн на нашем сервере в Garry\'\s Mod'},
			{ name: 'Войд, новости', value: 'Добавляю тебе роль, которая позволит узнавать о самых свежих новостях сообщества'},
			{ name: 'Войд, ивенты', value: 'Добавляю тебе роль, которая позволит узнавать о ближайших ивентах на сервере Метро Кобальт'},
			{ name: 'Войд, обыватель', value: 'Подписка на инсайд-обновления и секретные разработки 🤨'},
		]
	// }

	// const newsButton = new discord_buttons.MessageButton()
	// 	.setStyle('green')
	// 	.setLabel('⠀Новости')
	// 	.setID('news_subscribe')
	// 	.setEmoji('👍')

	// const helpButton = new discord_buttons.MessageButton()
	// 	.setStyle('url')
	// 	.setLabel('⠀Центр поддержки')
	// 	.setURL('https://voidline.rocks/help')
	// 	.setEmoji('📄')

	const embed = new Discord.MessageEmbed()
		.setColor('#FBA64B')
		.setTitle('Список моих команд')
		.setDescription('Чтобы использовать команду, нужно написать `Войд, [команда]`')
		.addFields(fields)

	msg.reply({embeds: [embed]})
	msg.react("👍")
}

cmds['шанс'] = msg => msg.reply(`шанс ${random(1, 100)}%`)

async function subscribeNews(msg, clicker) {
	if (msg.channel.type == "dm") return msg.channel.send("Эта команда может быть запущена только на сервере Voidline 🤧")
	if (!clicker) {
		if (msg.member.roles.cache.some(r => r.name === "Новости")) {
			msg.reply("ты отписался от рассылки новостей"); msg.member.roles.remove("699548969294102618")
		} else { 
			msg.react("✅"); msg.reply("ты подписался на рассылку новостей"); msg.member.roles.add("699548969294102618")
		}
	} else {
		if (clicker.roles.cache.some(r => r.name === "Новости")) {
			clicker.send("ты отписался от рассылки новостей"); clicker.roles.remove("699548969294102618")
		} else { 
			msg.react("✅"); clicker.send("ты подписался на рассылку новостей"); clicker.roles.add("699548969294102618")
		}
	}
}

cmds['новости'] = msg => {
	if (msg.channel.type == "dm") return msg.channel.send("Эта команда может быть запущена только на сервере Voidline 🤧")
	subscribeNews(msg)
}

cmds['ивенты'] = msg => {
	if (msg.channel.type == "dm") return msg.channel.send("Эта команда может быть запущена только на сервере Voidline 🤧")
	if (msg.member.roles.cache.some(r => r.name === "Ивенты")) {
		msg.reply("ты отписался от рассылки ивентов на Метро Кобальт"); msg.member.roles.remove("879800177534332989")
	} else { 
		msg.react("✅"); msg.reply("ты подписался на рассылку ивентов на Метро Кобальт"); msg.member.roles.add("879800177534332989")
	}
}

cmds['включи метро'] = msg => {
	if (msg.channel.type == "dm") return msg.channel.send("Эта команда может быть запущена только на сервере Voidline 🤧")
	if (!getAdminRole(msg.member.roles.cache)) return msg.channel.send("У тебя нет доступа к этой команде")

	function getServerStatus() {
		return clientNodeactyl.getServerUsages('200e9b17').then((res) => {
			return res.current_state
		})
	}

	getServerStatus()
		.then(function(status) {
			if (status && status === 'offline' || status === 'stopping') {
				clientNodeactyl.startServer('200e9b17').then((res) => {
					msg.react('✅')
				})
			} else {
				msg.reply(`невозможно включить сервер, так как он **уже запущен**!`)
				msg.react('👺')
			}
		})
}

cmds['рестарт метро'] = msg => {
	if (msg.channel.type == "dm") return msg.channel.send("Эта команда может быть запущена только на сервере Voidline 🤧")
	if (!getAdminRole(msg.member.roles.cache)) return msg.channel.send("У тебя нет доступа к этой команде")

	function getServerStatus() {
		return clientNodeactyl.getServerUsages('200e9b17').then((res) => {
			return res.current_state
		})
	}

	getServerStatus()
		.then(function(status) {
			if (status && status === 'running') {
				clientNodeactyl.restartServer('200e9b17').then((res) => {
					msg.react('✅')
				})
			} else {
				msg.reply(`невозможно рестартнуть сервер, так как он **выключен**!`)
				msg.react('👺')
			}
		})
}

function secondsToHms(d) {
    d = Number(d);

    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);

    return (h !== 0 ? h + " ч. " : "") + ('0' + m).slice(-2) + " мин."
}

async function checkOnline(msg, isEdit, clicker) {
	if (isEdit && (bot.lastOnlineUpdate || 0) > moment().unix()) {
		return
	}
	
	bot.lastOnlineUpdate = moment().unix() + 5
	
	var metroPlayers = []
	var evacPlayers = []

	try {
		var metro = null
		try {
			metro = await dig.query({
				type: 'garrysmod',
				host: '46.174.54.94',
				port: '27015'
			}).catch((error) => {
				console.log("Server is offline");
			});
		} catch (error) {
			console.error(error)
		}

		// var evac = null
		// try {
		// 	evac = await dig.query({
		// 		type: 'garrysmod',
		// 		host: '46.174.54.94',
		// 		port: '27020'
		// 	}).catch((error) => {
		// 		console.log("Server is offline");
		// 	});
		// } catch(error) {
		// 	console.error(error)
		// }

		if (!isEdit) {
			msg.react('✋')
			msg.react('😎')
			msg.react('👍')
		}

		var metroPlayerList

		if (metro) {
			for (var player in metro.players) {
				if (metro.players[player].name !== undefined) {
					let time = Math.floor(metro.players[player].time / 60)
					if (time >= 120 && time < 480) {
						metroPlayers.push(`😎 ${metro.players[player].name} :: ${secondsToHms(metro.players[player].time)}`)
					} else if (time >= 480) {
						metroPlayers.push(`🤯 ${metro.players[player].name} :: ${secondsToHms(metro.players[player].time)}`)
					} else {
						metroPlayers.push(`🤨 ${metro.players[player].name} :: ${secondsToHms(metro.players[player].time)}`)
					}
				}
			}

			metroPlayerList = metroPlayers.join('\n') || ""
			if (metroPlayerList !== "" && metroPlayerList.length > 599) {
				metroPlayerList = metroPlayerList.substring(0, 600) + "...\n... и другие игроки сейчас играют на сервере"
			}
		}

		// var evacPlayerList

		// if (evac) {
		// 	for (var player in evac.players) {
		// 		if (evac.players[player].name !== undefined) {
		// 			let time = Math.floor(evac.players[player].time / 60)
		// 			if (time >= 120 && time < 480) {
		// 				evacPlayers.push(`😎 ${evac.players[player].name} :: ${secondsToHms(evac.players[player].time)}`)
		// 			} else if (time >= 480) {
		// 				evacPlayers.push(`🤯 ${evac.players[player].name} :: ${secondsToHms(evac.players[player].time)}`)
		// 			} else {
		// 				evacPlayers.push(`🤨 ${evac.players[player].name} :: ${secondsToHms(evac.players[player].time)}`)
		// 			}
		// 		}
		// 	}

		// 	evacPlayerList = evacPlayers.join('\n') || ""
		// 	if (evacPlayerList !== "" && evacPlayerList.length > 599) {
		// 		evacPlayerList = evacPlayerList.substring(0, 600) + "...\n... и другие игроки сейчас играют на сервере"
		// 	}
		// }

		var fields = []

		if (metro) {
			fields.push({ name: '`🪖` Метро Кобальт - ролевой сервер по вселенной Метро 2033', "inline": true, value: `IP: \`46.174.54.94:27015\`\nКарта:\`${metro.map}\`\n\n${metro.raw.numplayers > 0 && `\`\`\`fix\nТекущий онлайн: ${metro.raw.numplayers}/64\`\`\`` || "\`\`\`fix\nИгроков не обнаружено\`\`\`"}\n\`\`\`asciidoc\n${metroPlayerList !== "" ? metroPlayerList : "Кажется, здесь пока никого нет... Почему бы тебе не зайти нажав на кнопку?"}\`\`\``})
		}

		// if (evac) {
		// 	fields.push({ name: '`🌠` EVAC.Dynamic - Соревновательный шутер (ОБТ)', "inline": true, value: `IP: \`46.174.54.94:27020\`\nКарта:\`${evac.map}\`\n\n${evac.raw.numplayers > 0 && `\`\`\`fix\nТекущий онлайн: ${evac.raw.numplayers}/64\`\`\`` || "\`\`\`fix\nИгроков не обнаружено\`\`\`"}\n\`\`\`asciidoc\n${evacPlayerList !== "" ? evacPlayerList : "Кажется, здесь пока никого нет... Почему бы тебе не зайти нажав на кнопку?"}\`\`\``})
		// }

		const embed = new Discord.MessageEmbed()
			.setColor('#FBA64B')
			.setTitle('`⚡` Онлайн на сервере Метро Кобальт')
			.setDescription('**Примечание к эмодзи у игроков**\n\n\`🤯\` - играет больше 8 часов\n\`😎\` - играет больше двух часов\n \`🤨\` - играет меньше двух часов\nㅤ')

		if (fields) {
			embed.addFields(fields)
		}

		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setURL('http://voidline.rocks/serverconnect/46.174.54.94/27015/%D0%9C%D0%B5%D1%82%D1%80%D0%BE%20%D0%9A%D0%BE%D0%B1%D0%B0%D0%BB%D1%8C%D1%82')
					.setLabel('Подключиться к Метро')
					.setStyle('LINK')
					.setEmoji('781078234842267648'),
				// new MessageButton()
				// 	.setURL('http://voidline.rocks/serverconnect/46.174.54.94/27020/EVAC')
				// 	.setLabel('Подключиться к EVAC')
				// 	.setStyle('LINK')
				// 	.setEmoji('781078234842267648'),
				new MessageButton()
					.setCustomId('update_online1')
					.setLabel(`Обновить онлайн`)
					.setStyle('SECONDARY')
					.setEmoji('871116388054495252'),
				new MessageButton()
					.setCustomId('update_online2')
					.setLabel(`${moment().format('LTS')}`)
					.setStyle('SECONDARY')
					.setEmoji('1132830852204732426')
					.setDisabled(true),
				new MessageButton()
					.setCustomId('update_online3')
					.setLabel((clicker && clicker.username) ? "⠀" + clicker.username : "⠀VOID-9000")
					.setStyle('SECONDARY')
					.setEmoji('781078234842267648')
					.setDisabled(true)
			)

		const dev_discord_server = await bot.guilds.cache.get('697057907283329034')
		if (dev_discord_server) {
			const channel = await bot.channels.fetch('1208774572841631825')
			if (channel) {
				const message = await channel.messages.fetch('1208775194152411186')
				if (message && message.embeds[0] && message.embeds[0].image) {
					embed.setImage(message.embeds[0].image.url)
				}
			}
		}

		if (isEdit) {
			await msg.edit({embeds: [embed], components: [row]})
		} else {
			await msg.channel.send({embeds: [embed], components: [row]})
		}
	} catch (error) {
		console.log(error)
		if (!isEdit) {
			msg.reply("не удалось получить данные, повтори попытку!")
			msg.react('👺')
		}
	}
}

cmds['онлайн'] = async msg => {
	checkOnline(msg)
}

cmds['обыватель'] = async msg => {
	let fields = []

	fields = [
		{ name: '🤐 Секретный канал #разработка', value: 'В этом канале собраны самые последние новости из мира разработки наших серверов. Это эксклюзивный контент, который не публикуется где-либо ещё. Также, у тебя появляется возможность задать любой вопрос нашим разработчикам, и получить быстрый ответ'},
		{ name: '🤠 Собственная линия', value: 'Возможность создавать собственный голосовой канал в нашем Дискорде'},
		{ name: '😋 Красивая роль', value: 'Фиолетовая роль в нашем Дискорде, в простонародии именуемая сердечком - это отличительный знак всех ребят, которые когда-то нам помогли - материально или как-либо ещё'},
		{ name: '😎 Фичи на сервере', value: 'Активируя эту подписку, ты получаешь огромное количество дополнительных плюшек на сервере. Все их не перечислить, однако все эти вещи слегка упрощают тебе игру и некоторые даже позволяют выделяться из толпы'},
	]

	const embed = new Discord.MessageEmbed()
	.setColor('#8E72CF')
	.setTitle('Подписка обывателя 💜')
	.setDescription('Подписка Обывателя создана специально для тех ребят, которые хотят нас поддержать!\n\n**Как купить подписку?**\n1. Зайти на наш Garry\'\s Mod-сервер Metro Cobalt `46.174.54.94:27015`\n2. Нажать F1, выбрать категорию Донат\n3. Купить и активировать подписку обывателя, а затем нажать кнопку "Привязать Дискорд" в левой панели\n\nПосле того, как ты всё сделал, перед тобой открываются следующие возможности:\n\n')
	.addFields(fields)

	msg.channel.send({embeds: [embed]})
	msg.react("💜")
}

cmds['айди'] = async msg => {
	msg.reply(`твой айди: ${"`" + msg.author.id + "`"}`)
}

// YouTrack Integration

const youtrackConfig = {
    baseUrl: "", 
    token: ""
};

const youtrack = new Youtrack(youtrackConfig);
const youtrackWebhook = new WebhookClient({ url: 'https://discord.com/api/webhooks/1181532908134084629/UBMVLKvKpb_kX-Mzgv9NSymKZkQVKZqcdbPEXqgLebf2UIPhQ0ewR5tbStxSKyEy_k0X' });

cmds['эвак'] = async(msg, content) => {
	if (!getAdminRole(msg.member.roles.cache)) return msg.react('👺')
	if (!content) {
		msg.reply('содержание задачи не может быть пустым!')
		msg.react('👺')
		return
	}

	console.log(msg.author)

	youtrack.projects.all().then((projects) => {
		projects.forEach(async (project) => {
			console.log(project)
			if (project.shortName === "EVAC") {
				youtrack.issues.create({
					summary: content,
					description: `Задача из Дискорда, отправленная ${msg.author.username}`,
					project: {
						id: project.id
					}
				}).then(issue => {
					const embed = new Discord.MessageEmbed()
						.setColor('#FBA64B')
						.setTitle(`Новая задача для EVAC`)
						.setDescription(content)

					youtrackWebhook.send({
						username: msg.author.username,
						avatarURL: `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.jpeg`,
						embeds: [embed],
					});

					msg.react("🌠")
				}).catch(err => {
					msg.react("👎🏻 bad request")
				})
			}
		})
	});
}

// YouTrack Integration end

const undefinedCommands = [
	"Запрос не обработан, запускаю протокол гибернации.",
	"Не имею ни малейшего понятия, о чем идет речь.",
	"Что? Повторите запрос.",
	"Ваш запрос передан в охранную систему, оставайтесь на месте.",
	"Три икс в кубе плюс константа... Ну что там?",
	"Повторите запрос или отойдите от терминала. Спасибо.",
	"Вот результаты теста: ты ужасный человек. Тут так и написано. Странно, мы ведь даже это не тестировали",
	"Мы оба наговорили много такого, о чем ты еще пожалеешь"
]

bot.on("messageCreate", async msg => {
	if (msg.author.bot) return

	// react news 
	let channelName = msg.channel.name
	if (channelName && channelName === "новости" || channelName === "девблог") {
		msg.react("👍")
		msg.react("👎")
	}

	if (msg.content.substring(0, 4).toLowerCase() !== "войд") return

	var bool = false

	const args = msg.content.trim().split(/ +/g)
	const newArgs = args.slice()

	// MAX, TI IDIOT?
	// >>>>> !!! FIX IT WHEN YOU HAVE MORE TIME !!!
	// ALOO CHEL STOP SHITCODING

	let index = newArgs.splice(1, 1).shift()
	let index2 = newArgs.splice(2, 1).shift()

	if (cmds[`${index} ${index2}`]) {
		index = `${index} ${index2}`
	}

	let argument
	if (index === 'эвак') {
		args.splice(0, 2)
		argument = args.join(' ')
	}

	// MAX, TI IDIOT?
	// >>>>> !!! FIX IT WHEN YOU HAVE MORE TIME !!!
	// ALOO CHEL STOP SHITCODING

	if (!index) return

	const command = index.toLowerCase()

	for (var cmd in cmds) {
		if (msg && command && command === cmd) {
			bool = true
			cmds[cmd](msg, argument !== '' ? argument : undefined)
		}
	}

	if (bool === false) {
		msg.reply(undefinedCommands[Math.floor(Math.random() * undefinedCommands.length)])
	}
})

cmds['пост'] = msg => {
	if (msg.channel.type == "dm") return msg.channel.send("Эта команда может быть запущена только на сервере Voidline 🤧")
	if (!getAdminRole(msg.member.roles.cache)) return msg.channel.send("У тебя нет доступа к этой команде")

	const row = new MessageActionRow()
		.addComponents(
			new MessageButton()
				.setCustomId('embed_modal')
				.setLabel(`Создать пост`)
				.setStyle('SUCCESS')
		)

	msg.channel.send({components: [row]})
	msg.react('👍')
}

// buttons

bot.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId == 'update_online1') {
			await interaction.deferUpdate()
			await checkOnline(interaction.message, true, interaction.user)
        } else if (interaction.customId == 'embed_modal') {
			const modal = new Modal()
				.setCustomId('embed_modal_form')
				.setTitle('Embed-сообщение')

			const urlImage = new TextInputComponent()
				.setCustomId('urlImage')
				.setLabel('URL изображения')
				.setStyle('SHORT')
				.setRequired(true)
				.setValue('https://i.imgur.com/lmSN4zB.jpg')
			const mainText = new TextInputComponent()
				.setCustomId('mainText')
				.setLabel('Основной текст')
				.setStyle('PARAGRAPH')
				.setRequired(true)
				.setValue('⚡ Новый пост на Бусти')
			const mainTextURL = new TextInputComponent()
				.setCustomId('mainTextURL')
				.setLabel('URL основного текста')
				.setStyle('SHORT')
				.setRequired(true)
				.setValue('https://boosty.to/voidline')
			const descText = new TextInputComponent()
				.setCustomId('descText')
				.setLabel('Нижний текст')
				.setStyle('PARAGRAPH')
				.setRequired(true)
				.setValue('Ураааа, как же круто писать тут крутой текст который будет не менее крутым в эмбед-сообщении!')
			const channelID = new TextInputComponent()
				.setCustomId('channelID')
				.setLabel('ID канала (ПКМ - Копировать ID)')
				.setStyle('SHORT')
				.setRequired(true)
				.setValue('840622521404620800')

			const urlImageRow = new MessageActionRow().addComponents(urlImage)
			const mainTextRow = new MessageActionRow().addComponents(mainText)
			const mainTextRowURL = new MessageActionRow().addComponents(mainTextURL)
			const descTextRow = new MessageActionRow().addComponents(descText)
			const channelIDRow = new MessageActionRow().addComponents(channelID)

			modal.addComponents(urlImageRow, mainTextRow, mainTextRowURL, descTextRow, channelIDRow)
			await interaction.showModal(modal)
		}
    } else if (interaction.isModalSubmit()) {
		if (!getAdminRole(interaction.member.roles.cache)) return
		const urlImage = interaction.fields.getTextInputValue('urlImage')
		const mainText = interaction.fields.getTextInputValue('mainText')
		const mainTextURL = interaction.fields.getTextInputValue('mainTextURL')
		const descText = interaction.fields.getTextInputValue('descText')
		const channelID = interaction.fields.getTextInputValue('channelID')
		if (!urlImage || !mainText || !mainTextURL || !descText || !channelID) return
		const channel = bot.channels.cache.get(channelID)
		if (!channel) return

		const embed = new Discord.MessageEmbed()
			.setColor('#FBA64B')
			.setTitle(mainText)
			.setURL(mainTextURL)
			.setDescription(descText)
			.setImage(urlImage)
			.setTimestamp()

		channel.send({ embeds: [embed] })
			.then(response => {
				interaction.reply({ content: `Пост успешно отправлен в ${channel}` })
				console.log("Success posting message!")
			})
			.catch(console.error)
	}
});

module.exports = bot
