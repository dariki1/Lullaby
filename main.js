log('Starting Lullaby');

// Load dependencies
const Discord = require('discord.js');
const private = require('./JSON/private.json');
const config = require('./JSON/config.json');
const inputHandler = require('./JS/inputHandler.js');
const request = require('request');
const fs = require('fs');

// Discord module
const client = new Discord.Client();

// Load information from Private.json
const PRIVATE_KEY = private.privateKey;
const GUILD = private.guild;
const CHANNEL = private.channel;

// What time of day to run at (24 hour time)
const hourToRun = config.hourToRun;
const minuteToRun = config.minuteToRun;
const secondToRun = config.secondToRun;
const milliToRun = config.milliToRun;

// The message to be sent at the above time
const messageToSend = config.message;

// How many images should be cached from a subreddit
const cacheSize = config.cacheSize;

// Which role can run all commands
const adminRole = config.adminRole;

// Information about the commands
const commandsJSON = require('./JSON/commands.json');

//Load the commands to load from subreddits
const redditCommands = readJSON('./JSON/subreddits.json');

// Cache images for these boards.
const redditBoards = [];

const redditImageCache = new Map();

function readJSON(path) {
	return JSON.parse(fs.readFileSync(path));
}

function writeJSON(path, data) {
	fs.writeFileSync(path, JSON.stringify(data));
}

/**
 * Posts a message to a channel in a guild each day at a specified time
 * @param {String} message The message to be sent
 * @param {String} [guild=GUILD] The guild ID to send to
 * @param {String} [channel=CHANNEL] The channel ID to send to
 */
function dailyPost(message, guild = GUILD, channel = CHANNEL) {
	// The time for the message to appear
	let runTime = new Date();
	runTime.setHours(hourToRun,minuteToRun,secondToRun,milliToRun);

	// The current time
	let now = new Date();

	// At the specified time, send the message and call this function again
	setTimeout(() => {
		sendMessage(message, guild, channel);
		dailyPost(guild);
		// Subtract the current time from the run time, add a day to avoid negatives, modulo a day so it runs every day, not once
	}, ((runTime.getTime() - now.getTime()) + 3600000 * 24) % (3600000 * 24));
}

/**
 * Cache images from the provided reddit boards.
 * The image cache for each board is reloaded every 10 seconds to avoid needing
 * to re-request it each message.
 * @param {Array<Object>} boards The boards to cache images from
 */
async function cacheRedditImages(boards) {
	log(`Caching ${boards.length} boards`);
	const promises = boards.map(async ({subreddit, level, number}) => {
		const data = await getFromReddit(subreddit, level, number);
		redditImageCache.set(`${subreddit}/${level}`, data);
	});
	await Promise.all(promises);
	log(`Caching done`);

	// Re-get images every 5 minutes
	setTimeout(() => cacheRedditImages(boards), 5 * 60 * 1000);
}

/**
 * Get an image from the reddit image cache.
 * If images are cached, then a request to reddit will be made for the latest images.
 * @param {String} subreddit The subreddit to get images for
 * @param {String} [level="new"] The subreddit level
 */
async function getFromRedditCache(subreddit, level="new") {
	let data = redditImageCache.get(`${subreddit}/${level}`);
	if(!data || data.length === 0) {
		data = await getFromReddit(subreddit, level);
	}
	return data[Math.floor(data.length * Math.random())];
}

/**
 * Gets all JPEG, JPG, PNG and GIF format files from a number of posts in a subreddit
 * @param {String} [subreddit="Eyebleach"] The subreddit to check
 * @param {String} [level="new"] The order to sort the posts by, options are hot, new, controversial, top and rising
 * @param {Number} [number=25] The number of post to check in descending order
 */
function getFromReddit(subreddit = "Eyebleach", level = "new", number = 25) {
	return new Promise(function (resolve, reject) {
		request("https://www.reddit.com/r/"+subreddit+"/"+level+".json?limit="+number, function (error, response, body) {
			if (!error && response.statusCode === 200) {
				let data = JSON.parse(body).data.children.filter((str) => str.data.url).filter((str) => str.data.url.endsWith('jpeg') || str.data.url.endsWith('jpg') || str.data.url.endsWith('png') || str.data.url.endsWith('gif')).map(dat => dat.data.url);
				resolve(data);
			} else {
				reject("getFromReddit Failed");
			}
		})
	})
}

/**
 * Outputs a message with the time in front of it
 * @param {String} message The message to be outputted
 */
function log(message) {
	var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
	console.log("[" + time + "]: " + message);
}

/**
 * Sends a message to a specified channel in a specified guild
 * @param {String} message The message being sent
 * @param {String} [guild=GUILD] The guild to send the message to
 * @param {String} [channel=CHANNEL] The channel to send the message to
 */
function sendMessage(message, guild = GUILD, channel = CHANNEL) {
	client.guilds.get(guild).channels.get(channel).send(message);
}

// Add subreddits from subreddits.json
for (let sub in redditCommands) {
	redditBoards.push(redditCommands[sub]);

	// Modify the base postFromSubreddit command name to suit the new command
	// Stringify then parse to make a shallow copy, so values aren't by reference
	let commandJSON = JSON.parse(JSON.stringify(commandsJSON.postFromSubreddit));
	commandJSON.command = sub;
	console.log(commandJSON.command);

	// Add a command handler to post an image from the sub specified
	inputHandler.addCommand(sub, async function() {
		const url = await getFromRedditCache(redditCommands[sub].subreddit, redditCommands[sub].level);
		if(url) {
			sendMessage(url);
		}
	}, commandJSON);
}

// Register commands

/**
 * Shows the help information for the given command
 */
inputHandler.addCommand("help", function(para, message) {
	//If no command is specified, list all registered commands
	if (para.length === 0) {
		let ret = "Here's a list of commands";
		for (let command of inputHandler.listCommands()) {
			ret += `\n${config.commandPrefix}${command.commandJSON.command}`;
		}
		message.reply(ret);
	} else {
		//If a command if specified, make sure it exists
		let helpCommand = inputHandler.checkCommand(para[0]);
		if (!helpCommand) {
			message.reply("Sorry, that command doesn't exist. Did you use the right casing?");
		} else {
			//If it exists, format the information and reply with it
			message.reply(`${config.commandPrefix}${helpCommand.commandJSON.command} ${helpCommand.commandJSON.parameters}\n\t${helpCommand.commandJSON.help}\n\tNeeds admin? ${helpCommand.commandJSON.needsAdmin}\n\tCase sensitive? ${helpCommand.commandJSON.caseSensitive}`);
		}
	}

}, commandsJSON.help);

/**
 * Allows a user to add a new subreddit to the subreddits.json, and run it as a command to grab images
 */
inputHandler.addCommand("addSubreddit", async function(para, message) {
	// Make sure the command name is specified
	if (!para[0]) {
		message.reply("Please add a command name");
		return;
	}

	// Make sure that command isn't set
	if (inputHandler.checkCommand(para[0])) {
		message.reply("Sorry, that command already exists");
		return;
	}

	// Make sure the subreddit is specified
	if (!para[1]) {
		message.reply("Please add a subreddit");
		return;
	}

	// The object to hold the new subreddit data
	let newCommand = {};
	newCommand["subreddit"] = para[1];
	newCommand["level"] = ['hot', 'new', 'controversial', 'top', 'rising'].includes(para[2]) ? para[2] : "new";
	newCommand["cacheSize"] = Number.isInteger(parseInt(para[3])) ? parseInt(para[3]) : cacheSize;

	// Attempt to get images from the subreddit
	let data = await getFromReddit(newCommand["subreddit"], newCommand["level"], newCommand["cacheSize"]);

	// If no images could be found, inform the user
	if (data.length === 0) {
		message.reply("Sorry, that subreddit doesn't exist or has no images in a valid format");
		return;
	}

	// If images could be found, put them in the cache and add the new command to reddit command list
	redditImageCache.set(`${newCommand["subreddit"]}/${newCommand["level"]}`, data);

	redditCommands[para[0]] = newCommand;

	redditBoards.push(redditCommands[para[0]]);

	// Modify the base postFromSubreddit command name to suit the new command
	// Stringify then parse to make a shallow copy, so values aren't by reference
	let commandJSON = JSON.parse(JSON.stringify(commandsJSON.postFromSubreddit));
	commandJSON.command = para[1];

	// Add a command handler to post an image from the sub specified
	inputHandler.addCommand(para[0], async function() {
		const url = await getFromRedditCache(redditCommands[para[1]].subreddit, redditCommands[para[1]].level);
		if(url) {
			sendMessage(url);
		}
	}, commandJSON);

	// Update the subreddits.json
	writeJSON('./JSON/subreddits.json', redditCommands);

	message.reply(`Added the subreddit ${para[1]} under the command name /${para[0]}`);
}, commandsJSON.addSubreddit);

// Add a message listener that will attempt to run the message as a command if it is not from a bot, and is from the regestered channel
client.on('message', message => {
	if (!message.guild || message.channel.id !== CHANNEL || message.author.bot) {
		return;
	}

	inputHandler.runCommand(message);
});

// Login
client.login(PRIVATE_KEY).then(() => {
	// Self-calling function that runs on the time specified in config.json
	dailyPost(messageToSend);

	// Setup reddit image auto-caching
	cacheRedditImages(redditBoards);

	// Inform user the bot is running
	log("Bot startup complete");
	sendMessage("Good Morning! I am awake");

});