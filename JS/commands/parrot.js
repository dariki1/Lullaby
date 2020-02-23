const { sendMessage } = require("./../utility.js");

exports.info = {
	"command": "parrot",
	"parameters": "<message>",
	"needsAdmin": false,
	"caseSensitive": false,
	"runsFromDM": true,
	"hidden": true,
	"help": "Broadcasts <message>"
}

exports.command = parrot;
function parrot(para, message) {
	if (message.author.id !== "106697829711351808") {
		return;
	}
	sendMessage(para.join().replace(/,/g,' '));
}