console.log("Starting Lullaby");

//Load Dependencies
const Discord = require('discord.js');
const private = require('./private.json');
const config = require('./config.json');
const inputHandler = require('./inputHandler.js');
const request = require('request');

//Discord module
const client = new Discord.Client();

const PRIVATE_KEY = private.privateKey;
const GUILD = private.guild;
const CHANNEL = private.channel;

//What time of day to run at (24 hour time)
const hourToRun = config.hourToRun;
const minuteToRun = config.minuteToRun;
const secondToRun = config.secondToRun;
const milliToRun = config.milliToRun;

//The message to be sent at the above time
const messageToSend = config.message;

// Cache images for these boards.
const redditBoards = [
	{subreddit: "EverythingFoxes", level: "new", number: 100},
	{subreddit: "Eyebleach", level: "new", number: 100}
];
const redditImageCache = new Map();

//Login 
client.login(PRIVATE_KEY).then(() => {
	//Get the guild (server) from it's id (needs to be invited)
	let guild = client.guilds.get(GUILD);

	//Self-calling function that runs on the time specified above
	timeUp(guild);

	// Setup reddit image auto-caching
	cacheRedditImages(redditBoards);

	//Inform user the bot is running
	console.log("Bot startup complete");
});

inputHandler.addCommand("eyebleach", async function(slicedContent, message) {
	const url = await getFromRedditCache("Eyebleach");
	if(url) {
		message.channel.send(url);
	}
});

inputHandler.addCommand("fox", async function(slicedContent, message) {
	const url = await getFromRedditCache("EverythingFoxes");
	if(url) {
		message.channel.send(url);
	}
});

client.on('message', message => {
	if (!message.guild || message.channel.id !== CHANNEL || message.author.bot) {
		return;
	}

	inputHandler.runCommand(message);
});

function timeUp(guild) {
	//The time for the message to appear
	let runTime = new Date();
	runTime.setHours(hourToRun,minuteToRun,secondToRun,milliToRun);

	//The current time
	let now = new Date();

	//At the specified time, send the message and call this function again
	setTimeout(() => {
		guild.channels.get(CHANNEL).send(messageToSend);
		timeUp(guild);
		//Subtract the current time from the run time, add a day to avoid negatives, modulo a day so it runs every day, not once
	}, ((runTime.getTime() - now.getTime()) + 3600000 * 24) % (3600000 * 24));
}

/**
 * Cache images from the provided reddit boards.
 * The image cache for each board is reloaded every 10 seconds to avoid needing
 * to re-request it each message.
 * @param {Array<Object>} boards The boards to cache images from
 */
async function cacheRedditImages(boards) {
	console.log(`Caching ${boards.length} boards`);
	const promises = boards.map(async ({subreddit, level, number}) => {
		const data = await getFromReddit(subreddit, level, number);
		redditImageCache.set(`${subreddit}/${level}`, data);
	});
	await Promise.all(promises);
	console.log(`Caching done`);

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

//Gets all images from the last 25 posts in a subreddit
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