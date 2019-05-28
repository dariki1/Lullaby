const inputHandler = require('./../inputHandler.js');
const config = require('./../../JSON/config.json');
//commandInformation

exports.info = {
	"command": "help",
	"parameters": "<commandName>",
	"needsAdmin": false,
	"caseSensitive": false,
	"help": "When used by itself, it lists all commands, when given a <commandName>, it lists the help for <commandName>"
}

exports.command = help;
function help(para, message) {
	//If no command is specified, list all registered commands
	if (para.length === 0) {
		let ret = "here's a list of commands";
		for (let command of inputHandler.listCommands()) {
			ret += `\n${config.commandPrefix}${command.commandJSON.command}`;
		}
		message.reply(ret);
	} else {
		//If a command if specified, make sure it exists
		let helpCommand = inputHandler.checkCommand(para[0]);
		if (!helpCommand) {
			message.reply("sorry, that command doesn't exist. Did you use the right casing?");
		} else {
			//If it exists, format the information and reply with it
			message.reply(`${config.commandPrefix}${helpCommand.commandJSON.command} ${helpCommand.commandJSON.parameters}\n\t${helpCommand.commandJSON.help}\n\tNeeds admin? ${helpCommand.commandJSON.needsAdmin}\n\tCase sensitive? ${helpCommand.commandJSON.caseSensitive}`);
		}
	}

}