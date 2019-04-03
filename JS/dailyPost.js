const config = require('./../JSON/config.json');
const private = require('./../JSON/private.json');

const GUILD = private.guild;
const CHANNEL = private.channel;

// What time of day to run at (24 hour time)
const hourToRun = config.hourToRun;
const minuteToRun = config.minuteToRun;
const secondToRun = config.secondToRun;
const milliToRun = config.milliToRun;

exports.dailyPost = dailyPost;
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