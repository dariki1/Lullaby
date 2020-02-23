const { sendMessage } = require("./../utility.js");

exports.info = {
	"command": "clem",
	"parameters": "",
	"needsAdmin": false,
	"caseSensitive": false,
	"runsFromDM": false,
	"help": "Clem."
}

const quotes = [
	"Clem?",
	"Mm-hmm, clem",
	"Grakata? Grakata?!",
	"Grakata...",
	"Clem, clem, clem",
	"Chh-chh. Clem; Grakata.",
	"Clem.",
	"Hmm, clem.",
	"Grakata!",
	"Twooo Grakata!"
];

exports.command = clem;
function clem(para, message) {
	sendMessage(quotes[Math.floor(Math.random()*quotes.length)]);
}