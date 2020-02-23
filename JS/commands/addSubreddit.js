const inputHandler = require('./../inputHandler.js');
const { readJSON, writeJSON, sendMessage } = require('./../utility.js');
const { cacheSize } = require('./../../JSON/config.json');
const redditHandler = require('./../redditHandler.js');

exports.info = {
	"command": "addSubreddit",
	"parameters": "<commandName> <subreddit> [sortBy(hot|new|controversial|top|rising)] [cacheSize]",
	"needsAdmin": true,
	"caseSensitive": false,
	"runsFromDM": false,
	"help": "Creates a new command; <commandName>, that will post an image randomly from the last <cacheSize> posts in the <subreddit> subreddit, sorted by <sortBy>"
}

exports.command = addSubreddit;
async function addSubreddit(para, message) {
	let redditBoards = require('./../../JSON/subreddits.json');
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
 
	// Used to wrap the object in another object because that's what cacheRedditImages expects
	/**
	 * @todo Figure out a better way to do this
	 */
	let testObject = {};
	testObject[para[0]] = newCommand;
	// If no images could be found, inform the user
	if (!(await redditHandler.cacheRedditImages(testObject))) {
		message.reply("Sorry, that subreddit doesn't exist or has no images in a valid format");
		return;
	}
	redditBoards[para[0]] = newCommand;
 
	// Modify the base postFromSubreddit command name to suit the new command
	// Stringify then parse to make a shallow copy, so values aren't by reference
	let commandJSON = {
		"command": "",
		"parameters": "",
		"needsAdmin": false,
		"caseSensitive": false,
		"help": "Posts images from a designated subreddit"
	};
	commandJSON.command = para[0];
 
	// Add a command handler to post an image from the sub specified
	inputHandler.addCommand(para[0], async function() {
		const url = await redditHandler.getFromRedditCache(redditBoards[para[0]]);
		if(url) {
			sendMessage(url);
		}
	}, commandJSON);
 
	// Update the subreddits.json
	// I do not know why this goes from the directory main.js is in, while require goes by the directory it is used in, but this works, so I am happy
	writeJSON('./JSON/subreddits.json', redditBoards);
 
	message.reply(`Added the subreddit ${para[1]} under the command name /${para[0]}`);
 }