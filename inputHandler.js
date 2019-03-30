const config = require('./config.json');

let commandList = [];
let prefix = config.commandPrefix;

exports.addCommand = addCommand;
function addCommand(commandName, callback) {
	commandList.push({name:commandName,effect:callback});
}

exports.runCommand = runCommand;
function runCommand(message) {
	let command = message.content;
	if (!command.startsWith(prefix)) {
		return;
	}

	console.log("Running command; " + command);

	command = command.substr(prefix.length).split(" ");

	let commandToRun = commandList.find((e) => e.name === command[0]);

	if (commandToRun) {
		commandToRun.effect(command.slice(1), message);
	}
}