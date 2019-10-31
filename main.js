console.log('Starting Lullaby');

// Load dependencies
const Discord = require('discord.js');
const fs = require('fs');
const private = require('./JSON/private.json');
const config = require('./JSON/config.json');
const inputHandler = require('./JS/inputHandler.js');
const redditHandler = require('./JS/redditHandler.js');
const { log, writeJSON, sendMessage, initialiseUtility } = require('./JS/utility.js');
const redditBoards = require('./JSON/subreddits.json');
const { dailyPost } = require('./JS/dailyPost');

// Discord module
const client = new Discord.Client();

// How many images should be cached from a subreddit
const cacheSize = config.cacheSize;

// Load information from Private.json
const PRIVATE_KEY = private.privateKey;
const GUILD = private.guild;
const CHANNEL = private.channel;

// The message to be sent at the above time
const messageToSend = config.message;

// Which role can run all commands
const adminRole = config.adminRole;

/**
 * Shows the help information for the given command
 */
fs.readdirSync("./JS/commands").forEach((file) => {
	const command = require("./JS/commands/" + file);
	if (!command.info) {
		log("Attempt to add command with no info! Aborting command", 1);
		return;
	}
	if (!command.command) {
		log("Attempt to add command with no command! Aborting command", 1);
		return;
	}
	if (!command.info.command) {
		log("Attempting to add command with no command name! Aborting command", 1);
		return;
	}
	inputHandler.addCommand(command.info.command, command.command, command.info);
	log("Loaded command; " + command.info.command);
});

for (let board in redditBoards) {
	// Modify the base postFromSubreddit command name to suit the new command
	// Stringify then parse to make a shallow copy, so values aren't by reference
	let commandJSON = {
		"command": "",
		"parameters": "",
		"needsAdmin": false,
		"caseSensitive": false,
		"help": "Posts images from a designated subreddit"
	};
	commandJSON.command = board;
	// Add the command to post an image from the specified subreddit
	inputHandler.addCommand(board, async function() {
		const url = await redditHandler.getFromRedditCache(redditBoards[board]);
		if(url) {
			sendMessage(url);
		} else {
			sendMessage("Request failed, please try again");
		}
	}, commandJSON);
}

// Add a message listener that will attempt to run the message as a command if it is not from a bot, and is from the regestered channel
client.on('message', message => {
	if (!message.guild || message.channel.id !== CHANNEL || message.author.bot) {
		return;
	}	

	inputHandler.runCommand(message);

	let lowerContent = message.content.toLowerCase();

	if (lowerContent.includes("bad bot")) {
		message.reply("bad human");
	} else if (lowerContent.includes("good bot")) {
		message.reply("good human");
	} else if (lowerContent.includes("looks at bot")) {
		sendMessage("Looks at human");
	}
});

// Login
client.login(PRIVATE_KEY).then(async () => {
	initialiseUtility(client);

	// Self-calling function that runs on the time specified in config.json
	dailyPost(messageToSend);

	// Cache reddit images
	await redditHandler.cacheRedditImages(redditBoards);
	// Update the cache every 5 minutes
	setInterval(() => redditHandler.cacheRedditImages(), 1000 * 60 * 5);

	// Inform user the bot is running
	log("Bot startup complete");
	sendMessage("Good Morning! I am awake");
});