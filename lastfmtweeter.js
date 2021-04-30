require('dotenv').config();

const Lastfm = require('lastfm-njs');
const Twitter = require('twitter-lite');

const lastfm = new Lastfm({
  apiKey: process.env.LASTFM_TOKEN,
  apiSecret: process.env.LASTFM_SECRET
});

const twitter = new Twitter({
  consumer_key: process.env.consumerKey,
  consumer_secret: process.env.consumerSecret,
  access_token_key: process.env.tokenKey,
  access_token_secret: process.env.tokenSecret
});

const userName = process.env.LASTFM_USER_NAME;
const initialArtistNum = 6;
const defaultTimePeriod = '7day';

// pulls the top artists of user in the past period as an array of size limit
const getTopArtists = (user, limit, period) => lastfm.user_getTopArtists({ user, limit, period });

const getUrlLen = async () => {
  try {
    const response = await twitter.get('help/configuration');
    if (!response.errors || !response.errors.length) {
      return response.short_url_length_https;
    } else {
      throw new Error(response);
    }
  } catch (e) {
    console.error(e);
  }
};

// sends a tweet comprised of 'text'
const sendTweet = (text) => twitter.post('statuses/update', { status: text });

const getPunc = (i, artistLength) => (i !== artistLength - 1 ? ',' : '');

const getJoiner = (i, artistLength) => (i !== artistLength - 2 ? getPunc(i, artistLength) : ', and');

// create a string of artists with playcounts
const createArtistString = (topArtists) =>
  topArtists.reduce(
    (acc, artist, i) => `${acc} ${artist.name} (${artist.playcount})${getJoiner(i, topArtists.length)}`,
    ''
  );

const setupTweet = async (artistArray, urlLength) => {
  const tweetString = `Top artists this week:${createArtistString(artistArray)}

  (via `; // include the via because we need to count it

  if (tweetString.length + urlLength + 1 <= 280) {
    try {
      await sendTweet(`${tweetString}https://last.fm/user/${userName})`);
      console.info(`Successfully Tweeted!
       ${tweetString}https://last.fm/user/${userName})`);
    } catch (e) {
      console.warn(`Couldn't tweet ${tweetString}https://last.fm/user/${userName})`);
      console.warn(e, null, 2);
    }
  } else if (artistArray.length > 1) {
    console.info(
      `Too long ${tweetString}https://last.fm/user/${userName})

      Trying with ${artistArray.length - 1} artists`
    );
    setupTweet(artistArray.splice(0, artistArray.length - 1), urlLength);
  } else {
    console.info(`The top artist, ${createArtistString(artistArray)}, has too long a name`);
  }
};

// gets last.fm artists and prepares them for tweeting
const main = async (name, numArtists, period) => {
  try {
    const topArtists = await getTopArtists(name, numArtists, period);
    const urlLength = await getUrlLen();
    setupTweet(topArtists.artist, urlLength);
  } catch (e) {
    console.error(e);
  }
};

main(userName, initialArtistNum, defaultTimePeriod);
