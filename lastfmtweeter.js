var Lastfm = require('simple-lastfm'),
	config = require('./config'),
	Twitter = require('twitter');

var lastfm = new Lastfm({
		api_key: config.lastfm.token,
		api_secret: config.lastfm.secret
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

function getTopArtists(user, limit, period, callback) {
	// pulls the top artists of user in the past period as an array of size limit
	lastfm.getTopArtists({
		user: user,
		limit: limit,
		period: period,
		callback: function(result) {
			if (result.success) {
				callback(false, result.topArtists);
			} else {
				console.log("error getting lastfm", result);
				callback(true, null);
			}
		}
	});
}

function sendTweet(text) {
	// sends a tweet comprised of 'text'
	twitter.post('statuses/update', {
		status: text
	}, function(error, tweet, response) {
		if (error) {
			console.log("error sending tweet", error);
			throw error;
		}
	});
}

function getUrlLength(callback) {
	// checks the current length of t.co links for future proofing
	twitter.get('help/configuration', function(error, response) {
		if (error) {
			console.log("error getting url length", error);
			callback(true, null)
		} else {
			callback(false, response.short_url_length);
		}
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
		return false;
	}
}

function main(name, numArtists, period) {
	// gets last.fm artists and prepares them for tweeting
	getTopArtists(name, numArtists, period, function(error, topArtists) {
		if (!error) {
			var tweetString = "Top artists this week: " + createArtistString(topArtists) + "\n\n(via ";
			getUrlLength(function(error, len) {
				if (!error) {
					if (!prepareTweet(tweetString, len)) {
						// not tweetable, try again with less artists
						main(name, numArtists - 1, period);
					}
				}
			});
		}
	});
}

main(userName, initialArtistNum, timePeriod);