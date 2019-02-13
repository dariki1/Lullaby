console.log("Starting Lullaby");

//Discord module
const Discord = require('discord.js');
const client = new Discord.Client();

const PRIVATE_KEY;
const GUILD;
const CHANNEL;

//What time of day to run at (24 hour time)
const hourToRun = 22;
const minuteToRun = 0;
const secondToRun = 0;
const milliToRun = 0;

//The message to be sent at the above time
const messageToSend = "Good night Oxy";

//Login 
client.login(PRIVATE_KEY).then(() => {
	//Get the guild (server) from it's id (needs to be invited)
	let guild = client.guilds.get(GUILD);

	//Self-calling function that runs on the time specified above
	timeUp(guild);

	//Inform user the bot is running
	console.log("Bot startup complete");
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