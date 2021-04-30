import { exit } from 'node:process';
import * as dotenv from 'dotenv';
import Lastfm, { LastFmArtist, LastFmTimePeriod } from 'lastfm-njs';
import Twitter from 'twitter-lite';

dotenv.config();

const LASTFM_TIME_PERIODS: readonly LastFmTimePeriod[] = [
  'overall',
  '7day',
  '1month',
  '3month',
  '6month',
  '12month',
];

const getFriendlyTimePeriod = (lastFmTime: LastFmTimePeriod): string => {
  switch (lastFmTime) {
    case 'overall':
      return 'overall';
    case '7day':
      return 'this week';
    case '1month':
      return 'this month';
    case '3month':
      return 'past 3 months';
    case '6month':
      return 'past 6 months';
    case '12month':
      return 'past year';
  }
};

// defaults
const userName = process.env.LASTFM_USER_NAME;
const initialArtistNum: string | undefined = process.argv[2];
const defaultTimePeriod: string | undefined = process.argv[3];

const lastfm = new Lastfm({
  apiKey: process.env.LASTFM_TOKEN,
  apiSecret: process.env.LASTFM_SECRET,
});

const twitter = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_TOKEN_SECRET,
});

// pulls the top artists of user in the past period as an array of size limit
const getTopArtists = (user: string, limit: number, period: LastFmTimePeriod) =>
  lastfm.user_getTopArtists({ user, limit, period });

const getUrlLen = async (): Promise<number | undefined> => {
  let responseLength = undefined;
  try {
    const response = await twitter.get<{
      errors?: string[];
      short_url_length_https: number;
    }>('help/configuration');
    if (!response.errors || !response.errors.length) {
      responseLength = response.short_url_length_https;
    } else {
      throw new Error(response.errors?.join(','));
    }
  } catch (e) {
    console.error(e);
  }
  return responseLength;
};

// sends a tweet comprised of 'text'
const sendTweet = (text: string) => twitter.post('statuses/update', { status: text });

const getPunc = (i: number, artistLength: number) => (i !== artistLength - 1 ? ',' : '');

const getJoiner = (i: number, artistLength: number) =>
  i !== artistLength - 2 ? getPunc(i, artistLength) : ', and';

// create a string of artists with playcounts
const createArtistString = (topArtists: LastFmArtist[]): string =>
  topArtists.reduce(
    (acc, artist, i) =>
      `${acc} ${artist.name} (${artist.playcount})${getJoiner(i, topArtists.length)}`,
    '',
  );

const setupTweet = async (
  artistArray: LastFmArtist[],
  urlLength: number,
  period: LastFmTimePeriod,
) => {
  const tweetString = `Top artists ${getFriendlyTimePeriod(period)}:${createArtistString(
    artistArray,
  )}

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

      Trying with ${artistArray.length - 1} artists`,
    );
    await setupTweet(artistArray.splice(0, artistArray.length - 1), urlLength, period);
  } else {
    console.info(`The top artist, ${createArtistString(artistArray)}, has too long a name`);
  }
};

// gets last.fm artists and prepares them for tweeting
const main = async (
  name: string | undefined,
  numArtists: string | undefined,
  period: string | undefined,
) => {
  if (!name) {
    console.error('A last.fm username is required');
    exit(1);
  }
  if (!period || !LASTFM_TIME_PERIODS.includes(period as LastFmTimePeriod)) {
    console.error(`Invalid time period ${
      period ?? 'undefined'
    }! Time period must be one of ${LASTFM_TIME_PERIODS.join(', ')}
   `);
    exit(1);
  }
  if (!numArtists || +numArtists < 1) {
    console.error('Number of artists must be greater than 0');
    exit(1);
  }
  try {
    const topArtists = await getTopArtists(name, +numArtists, period as LastFmTimePeriod);
    const urlLength = await getUrlLen();
    if (urlLength) {
      await setupTweet(topArtists.artist, urlLength, period as LastFmTimePeriod);
    }
  } catch (e) {
    console.error(e);
  }
};

void main(userName, initialArtistNum, defaultTimePeriod);
