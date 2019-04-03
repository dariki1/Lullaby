const fs = require('fs');
const private = require('./../JSON/private.json');

let client;
const GUILD = private.guild;
const CHANNEL = private.channel;

exports.initialiseUtility = initialise;
function initialise(discordClient) {
	client = discordClient;
}

exports.log = log;
/**
 * Outputs a message with the time in front of it
 * @param {String} message The message to be outputted
 */
function log(message) {
	var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
	console.log("[" + time + "]: " + message);
}

exports.readJSON = readJSON;
function readJSON(path) {
	return JSON.parse(fs.readFileSync(path));
}

exports.writeJSON = writeJSON;
function writeJSON(path, data) {
	fs.writeFileSync(path, JSON.stringify(data));
}

exports.sendMessage = sendMessage;
/**
 * Sends a message to a specified channel in a specified guild
 * @param {String} message The message being sent
 * @param {String} [guild=GUILD] The guild to send the message to
 * @param {String} [channel=CHANNEL] The channel to send the message to
 */
function sendMessage(message, guild = GUILD, channel = CHANNEL) {
	client.guilds.get(guild).channels.get(channel).send(message);
}