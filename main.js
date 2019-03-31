log('Starting Lullaby');

// Load dependencies
const Discord = require('discord.js');
const private = require('./private.json');
const config = require('./config.json');
const inputHandler = require('./inputHandler.js');
const request = require('request');

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

// Cache images for these boards.
const redditBoards = [
	{subreddit: "EverythingFoxes", level: "new", number: cacheSize},
	{subreddit: "Eyebleach", level: "new", number: cacheSize},
	{subreddit: "Pandas", level: "new", number: cacheSize}
];
const redditImageCache = new Map();

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
				reject();
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

// Register commands

// Posts an image from r/Eyebleach
inputHandler.addCommand("eyebleach", async function() {
	const url = await getFromRedditCache("Eyebleach");
	if(url) {
		sendMessage(url);
	}
});

// Posts an image from r/EverythingFoxes
inputHandler.addCommand("fox", async function() {
	const url = await getFromRedditCache("EverythingFoxes");
	if(url) {
		sendMessage(url);
	}
});

inputHandler.addCommand("panda", async function() {
	const url = await getFromRedditCache("Pandas");
	if(url) {
		sendMessage(url);
	}
});

// Add a message listener that will attempt to run the message as a command if it is not from a bot, and is from the regestered channel
client.on('message', message => {
	if (!message.guild || message.channel.id !== CHANNEL || message.author.bot) {
		return;
	}

	inputHandler.runCommand(message);
});