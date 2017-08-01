const Lastfm = require('lastfm-njs'),
  config = require('./config'),
  winston = require('winston'),
  Twitter = require('twitter');

const lastfm = new Lastfm({
    apiKey: config.lastfm.token,
    apiSecret: config.lastfm.secret
  }),
  twitter = new Twitter({
    consumer_key: config.twitter.consumerKey,
    consumer_secret: config.twitter.consumerSecret,
    access_token_key: config.twitter.tokenKey,
    access_token_secret: config.twitter.tokenSecret
  });
const userName = config.lastfm.username;
const initialArtistNum = 6;
const timePeriod = '7day';

// pulls the top artists of user in the past period as an array of size limit
const getTopArtists = async(user, limit, period) =>
  await lastfm.user_getTopArtists({
    user,
    limit,
    period
  });

const getUrlLen = () =>
  new Promise((resolve, reject) =>
    twitter.get('help/configuration', (e, res) => e
      ? reject(e) : resolve(res.short_url_length_https)))

// sends a tweet comprised of 'text'
const sendTweet = text =>
  new Promise((resolve, reject) =>
    twitter.post('statuses/update', {
      status: text
    }, (e, res) => e ? reject(e) : resolve(res))
  );

// create a string of artists with playcounts
const createArtistString = topArtists =>
  topArtists.reduce((acc, artist, i) =>
    `${acc} ${artist.name} (${artist.playcount})${(i !== topArtists.length - 2) ? i!==topArtists.length-1 ? ',' : '' : ', and'}`, '');

// gets last.fm artists and prepares them for tweeting
const main = async(name, numArtists, period) => {
  const topArtists = await getTopArtists(name, numArtists, period);
  setupTweet(topArtists, name, numArtists, period);
};

const setupTweet = async(res, name, numArtists, period) => {
  const tweetString = `Top artists this week:${createArtistString(res.artist)}\n\n(via `;
  const urlLength = await getUrlLen();
  if (tweetString.length + urlLength + 1 <= 140) {
    try {
      await sendTweet(`${tweetString}https://last.fm/user/${config.lastfm.username})`);
      winston.info(`Successfully Tweeted!\n ${tweetString}https://last.fm/user/${config.lastfm.username})`)
    } catch (e) {
      winston.warn(`Couldn't tweet ${tweetString}https://last.fm/user/${config.lastfm.username})`);
      winston.warn(e, null, 2);
    }
  } else {
    winston.info(`Too long ${tweetString}https://last.fm/user/${config.lastfm.username})\n\nTrying with ${numArtists - 1} artists`);
    main(userName, --numArtists, timePeriod);
  }

};

main(userName, initialArtistNum, timePeriod);