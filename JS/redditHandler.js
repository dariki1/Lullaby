const request = require('request');
const inputHandler = require('./inputHandler.js');
const { log } = require('./utility.js');

let redditImageCache = new Map();

exports.cacheRedditImages = cacheRedditImages;
/**
 * Cache images from the provided reddit boards.
 * @param {Array<Object>} boards The boards to cache images from
 */
async function cacheRedditImages(boards) {
	log(`Caching ${Object.keys(boards).length} boards`);
	let hadFailure = false;
	// Go through each given board
	let dataSets = [];
	for (let key in boards) {
		const subData = boards[key];
		// Download the data for the current board from reddit
		const data = await getFromReddit(subData.subreddit, subData.level, subData.cacheSize);
		// If there is no data, don't store it
		if (!data) {
			hadFailure = true;
			continue;
		}
		// Put the data into the cache
		redditImageCache.set(`${subData.subreddit}/${subData.level}`, data);
	}
	log(`Caching done`);
	return hadFailure;
}

exports.getFromRedditCache = getFromRedditCache;
/**
 * Get an image from the reddit image cache.
 * If images are cached, then a request to reddit will be made for the latest images.
 * @param {Object} board The subreddit to get images for
 */
async function getFromRedditCache(board) {
	// Load the data for the board from the cache
	let data = redditImageCache.get(`${board.subreddit}/${board.level}`);
	// If there is no data, download it from reddit and add it to the cache
	if(!data || data.length === 0) {
		data = await getFromReddit(board.subreddit, board.level, board.cacheSize);
		redditImageCache.set(`${board.subreddit}/${board.level}`, data);
	}
	// Return an image from the cache at random
	return data[Math.floor(data.length * Math.random())];
}

/**
 * Gets all JPEG, JPG, PNG and GIF format files from a number of posts in a subreddit
 * @param {String} [subreddit="Eyebleach"] The subreddit to check
 * @param {String} [level="new"] The order to sort the posts by, options are hot, new, controversial, top and rising
 * @param {Number} [number=25] The number of post to check in descending order
 */
function getFromReddit(subreddit, level, number) {
	return new Promise(function (resolve, reject) {
		// Get all posts from the reddit API
		request("https://www.reddit.com/r/"+subreddit+"/"+level+".json?limit="+number, function (error, response, body) {
			if (!error && response.statusCode === 200) {
				// Pull only the URLs in the posts that end in jpeg, jpg, png or gif
				let data = JSON.parse(body).data.children.filter((str) => str.data.url).filter((str) => str.data.url.endsWith('jpeg') || str.data.url.endsWith('jpg') || str.data.url.endsWith('png') || str.data.url.endsWith('gif')).map(dat => dat.data.url);
				// Return the data
				resolve(data);
			} else {
				reject("getFromReddit Failed");
			}
		})
	})
}