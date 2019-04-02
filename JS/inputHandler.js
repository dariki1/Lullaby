const config = require('./../JSON/config.json');

let commandList = [];
let prefix = config.commandPrefix;

exports.addCommand = addCommand;
/**
 * Adds a function that can be run later with runCommand
 * @param {String} commandName The string that will be matched against user input
 * @callback callback The function that will be run if user input matches commandName
 * @param {Boolean} [caseSensitive=false] Whether the command should be checked with case sensitivity
 */
function addCommand(commandName, callback, caseSensitive = false) {
	commandList.push({name:commandName,effect:callback, caseSensitive:caseSensitive});
}

exports.checkCommand = checkCommand
/**
 * Returns if the entered command exists yet
 * @param {String} commandName The name of the command being checked
 */
function checkCommand(commandName) {
	return commandList.includes(commandName);
}

exports.runCommand = runCommand;
/**
 * Attempts to run a function associated with a command
 * Message must start with the prefix found in config.json
 * Message must be registered as a command with addCommand
 * @param {String} message The message to be looked for in the command list
 */
async function runCommand(message) {
	let command = message.content;
	if (!command.startsWith(prefix)) {
		return;
	}

	command = command.substr(prefix.length).split(" ");

	let commandToRun = commandList.find((e) => e.caseSensitive ? e.name === command[0] : e.name.toLowerCase() === command[0].toLowerCase());

	if (commandToRun) {
		commandToRun.effect(command.slice(1), message);
	}
}