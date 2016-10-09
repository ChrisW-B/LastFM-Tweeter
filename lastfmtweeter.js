var Lastfm = require('lastfm-njs'),
	config = require('./config'),
	Twitter = require('twitter'),
	winston = require('winston');
winston.add(winston.transports.File, {
	level: 'info',
	timestamp: true,
	filename: "log.txt",
	json: false
});
winston.remove(winston.transports.Console);
winston.cli();
var lastfm = new Lastfm({
		apiKey: config.lastfm.token,
		apiSecret: config.lastfm.secret
	}),
	twitter = new Twitter({
		consumer_key: config.twitter.consumerKey,
		consumer_secret: config.twitter.consumerSecret,
		access_token_key: config.twitter.tokenKey,
		access_token_secret: config.twitter.tokenSecret,
	});
var userName = config.lastfm.username;
var initialArtistNum = 5;
var timePeriod = '7day';

function getTopArtists(user, limit, period) {
	// pulls the top artists of user in the past period as an array of size limit
	return lastfm.user_getTopArtists({
		user: user,
		limit: limit,
		period: period,
	});
}

function sendTweet(text) {
	// sends a tweet comprised of 'text'
	twitter.post('statuses/update', {
		status: text
	}, function(error, tweet, response) {
		if (error) {
			winston('error', "error sending tweet", error);
			throw error;
		} else {
			winston.info("Tweeted: \"" + text + "\"");
		}
	});
}

function getUrlLength() {
	// checks the current length of t.co links for future proofing
	return new Promise(function(resolve, reject) {
		twitter.get('help/configuration', function(error, response) {
			if (error) {
				reject(error)
			} else {
				resolve(response.short_url_length);
			}
		});
	});
}

function createArtistString(topArtists) {
	// create a string of artists with playcounts
	var artistString = ""
	for (var i = 0; i < topArtists.length; i++) {
		if (i != topArtists.length - 1) {
			artistString += topArtists[i].name + " (" + topArtists[i].playcount + "), ";
		} else {
			artistString += "and " + topArtists[i].name + " (" + topArtists[i].playcount + ")";
		}
	}
	return artistString;
}

function prepareTweet(tweetString, len) {
	// ensure string is tweetable, returning true if it is
	tweetLength = tweetString.length + len + 1; // 1 for the last paren
	if (tweetLength <= 140) {
		// make sure tweet is short enough
		sendTweet(tweetString + "http://last.fm/user/" + config.lastfm.username + ")");
		return true;
	} else {
		// otherwise try again with less artists
		winston.info("too many artists");
		return false;
	}
}

function main(name, numArtists, period) {
	// gets last.fm artists and prepares them for tweeting
	getTopArtists(name, numArtists, period)
		.then(res => setupTweet(res, name, numArtists, period))
		.catch(logError);
}

function setupTweet(res, name, numArtists, period) {
	var tweetString = "Top artists this week: " + createArtistString(res.artist) + "\n\n(via ";
	getUrlLength()
		.then(function(len) {
			if (!prepareTweet(tweetString, len)) {
				// not tweetable, try again with less artists
				main(name, numArtists - 1, period);
			}
		})
		.catch(logError);
}

function logError(err) {
	winston.error(err);
}

main(userName, initialArtistNum, timePeriod);