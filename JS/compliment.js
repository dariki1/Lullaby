const { sendMessage } = require('./utility.js');

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

/**
 * Generates and returns a random compliment string
 */
function compliment() {
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
	return `${start} ${modifier} ${object}`;
}

exports.init = init;
/**
 * Compliments a random non-bot online member in the guild
 * @param {Guild} guild The guild to send a compliment to
 */
function init(guild) {
	// Choose an amount of time from 1 to 60 minutes
	setTimeout(() => {
		// Get all members of guild
		guild.fetchMembers().then((dat) => {
			let keyArray = Array.from(dat.members.keys());
			let member;
			// Attempt to find a non-bot online member at random up to 20 times and send them a compliment
			for (let i = 0; i < 20; i++) {
				// Get a random member
				member = dat.members.get(keyArray[ Math.floor( Math.random()*keyArray.length ) ] );
				if (!member.user.bot && member.presence.status == "online") {
					// Send a compliment to a non-bot online member
					sendMessage("<@" + member.user.id + ">, " + compliment());
					break;
				}
			}
		});
		init(guild);
	}, 1000*60*(Math.random()*59+1));
}