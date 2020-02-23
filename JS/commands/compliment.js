const { sendMessage } = require('../utility.js');

exports.info = {
	"command": "compliment",
	"parameters": "<name>",
	"needsAdmin": false,
	"caseSensitive": false,
	"runsFromDM": true,
	"help": "Compliments <name>"
}

// Compliment modifiers
let modifiers = [
	"beautiful",
	"adorable",
	"delightful",
	"praiseworthy",
	"good",
	"above average"
];
// Body parts that can be complimented
let objects = [
	"face",
	"elbow",
	"knee",
	"arm",
	"leg",
	"heart"
];
// Ways to refer to a person
let nouns = [
	"person",
	"human",
	"organic",
	"non-robot"
];

exports.command = compliment;
/**
 * Generates and returns a random compliment string
 */
function compliment(para, message) {
	if (para[0] === undefined) {
		message.reply("Please specify a person to compliment");
	}

	let start = "";
	let modifier = "";
	let object = "";

	switch (Math.floor(Math.random()*3)) {
		case 0:
			start = "you have a";
			modifier = modifiers[Math.floor(Math.random()*modifiers.length)];
			// If the modifier starts with a vowel, change the 'a' to 'an'
			start += modifier.substr(0,1).match(/[aeiou]/) !== null ? "n" : "";

			object = objects[Math.floor(Math.random()*objects.length)];
			break;
		case 1:
			start = "you are a";
			modifier = modifiers[Math.floor(Math.random()*modifiers.length)];
			// If the modifier starts with a vowel, change the 'a' to 'an'
			start += modifier.substr(0,1).match(/[aeiou]/) !== null ? "n" : "";

			object = nouns[Math.floor(Math.random()*nouns.length)];
			break;
		case 2:
			start = "you are";
			modifier = modifiers[Math.floor(Math.random()*modifiers.length)];
			obejct = "";
			break;
	}
	
	sendMessage(`${para[0] === "me" ? message.author.username : para[0]}, ${start} ${modifier} ${object}`);
}