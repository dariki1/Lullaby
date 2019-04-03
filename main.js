console.log('Starting Lullaby');

// Load dependencies
const Discord = require('discord.js');
const private = require('./JSON/private.json');
const config = require('./JSON/config.json');
const inputHandler = require('./JS/inputHandler.js');
const redditHandler = require('./JS/redditHandler.js');
const { log, readJSON, writeJSON, sendMessage, initialiseUtility } = require('./JS/utility.js');
const redditBoards = readJSON('./JSON/subreddits.json');
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

// Information about the commands
const commandsJSON = require('./JSON/commands.json');

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

   redditBoards[para[0]] = newCommand;

   // Used to wrap the object in another object because that's what cacheRedditImages expects
   /**
	* @todo Figure out a better way to do this
    */
   let testObject = {};
   testObject[para[0]] = newCommand;

   // If no images could be found, inform the user
   if (!redditHandler.cacheRedditImages(testObject)) {
	   message.reply("Sorry, that subreddit doesn't exist or has no images in a valid format");
	   // Remove the bad board
	   delete redditBoards[para[0]];
	   return;
   }

   // Modify the base postFromSubreddit command name to suit the new command
   // Stringify then parse to make a shallow copy, so values aren't by reference
   let commandJSON = JSON.parse(JSON.stringify(commandsJSON.postFromSubreddit));
   commandJSON.command = para[1];

   // Add a command handler to post an image from the sub specified
   inputHandler.addCommand(para[0], async function() {
	   const url = await redditHandler.getFromRedditCache(redditBoards[para[0]]);
	   if(url) {
		   sendMessage(url);
	   }
   }, commandJSON);

   // Update the subreddits.json
   writeJSON('./JSON/subreddits.json', redditBoards);

   message.reply(`Added the subreddit ${para[1]} under the command name /${para[0]}`);
}, commandsJSON.addSubreddit);

for (let board in redditBoards) {
	// Modify the base postFromSubreddit command name to suit the new command
	// Stringify then parse to make a shallow copy, so values aren't by reference
	let commandJSON = JSON.parse(JSON.stringify(commandsJSON.postFromSubreddit));
	commandJSON.command = board;
	// Add the command to post an image from the specified subreddit
	inputHandler.addCommand(board, async function() {
		const url = await redditHandler.getFromRedditCache(redditBoards[board]);
		if(url) {
			sendMessage(url);
		}
	}, commandJSON);
}

// Add a message listener that will attempt to run the message as a command if it is not from a bot, and is from the regestered channel
client.on('message', message => {
	if (!message.guild || message.channel.id !== CHANNEL || message.author.bot) {
		return;
	}

	inputHandler.runCommand(message);
});

// Login
client.login(PRIVATE_KEY).then(() => {
	initialiseUtility(client);

	// Self-calling function that runs on the time specified in config.json
	dailyPost(messageToSend);

	// Cache reddit images
	redditHandler.cacheRedditImages(redditBoards);
	// Update the cache every 5 minutes
	setInterval(() => redditHandler.cacheRedditImages(redditBoards), 1000 * 60 * 5);

	// Inform user the bot is running
	log("Bot startup complete");
	sendMessage("Good Morning! I am awake");
});