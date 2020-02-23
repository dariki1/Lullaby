exports.info = {
	"command": "adventure",
	"parameters": "",
	"needsAdmin": false,
	"caseSensitive": false,
	"runsFromDM": false,
	"help": "A text based adventure game"
}

const biomes = [
	"forest",
	"desert",
	"jungle",
	"beach",
	"valley"
];

const animals = [
	"pigs",
	"sheep",
	"chickens",
	"pandas",
	"foxes",
	"polar bears"
];

exports.command = adventure;
function adventure(para, message) {
	message.reply("You are standing in a " + biomes[Math.floor(Math.random()*biomes.length)] + ", there are some " + animals[Math.floor(Math.random()*animals.length)] + " nearby.");
}