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

interface RequiredProps {
  username: string;
  lastFM: {
    apiKey: string;
    apiSecret: string;
  };
  twitter: {
    consumer_key: string;
    consumer_secret: string;
    access_token_key: string;
    access_token_secret: string;
  };
}
class Tweeter {
  private lastfmClient: Lastfm;
  private twitterClient: Twitter;
  private username: string;

  constructor(props: RequiredProps) {
    this.lastfmClient = new Lastfm(props.lastFM);
    this.twitterClient = new Twitter(props.twitter);
    this.username = props.username;
  }

  // pulls the top artists of user in the past period as an array of size limit
  private getTopArtists = (limit: number, period: LastFmTimePeriod) =>
    this.lastfmClient.user_getTopArtists({ user: this.username, limit, period });

  private getUrlLen = async (): Promise<number | undefined> => {
    let responseLength: number | undefined = undefined;
    try {
      const response = await this.twitterClient.get<{
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
  private sendTweet = (text: string) => {
    if (process.env['DEBUG']) {
      console.info('Created Tweet!');
      console.info(text);
      return;
    }
    return this.twitterClient.post('statuses/update', { status: text });
  };

  private setupTweet = async (
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
        await this.sendTweet(`${tweetString}https://last.fm/user/${this.username})`);
        console.info(`Successfully Tweeted!
         ${tweetString}https://last.fm/user/${this.username})`);
      } catch (e) {
        console.warn(`Couldn't tweet ${tweetString}https://last.fm/user/${this.username})`);
        console.warn(e, null, 2);
      }
    } else if (artistArray.length > 1) {
      console.info(
        `Too long ${tweetString}https://last.fm/user/${this.username})
  
        Trying with ${artistArray.length - 1} artists`,
      );
      await this.setupTweet(artistArray.splice(0, artistArray.length - 1), urlLength, period);
    } else {
      console.info(`The top artist, ${createArtistString(artistArray)}, has too long a name`);
    }
  };

  public run = async (
    numArtists: number | undefined,
    period: string | undefined,
  ): Promise<void> => {
    if (!this.username) {
      console.error('A last.fm username is required');
      process.exit(1);
    }
    if (!period || !LASTFM_TIME_PERIODS.includes(period as LastFmTimePeriod)) {
      console.error(`Invalid time period ${
        period ?? 'undefined'
      }! Time period must be one of ${LASTFM_TIME_PERIODS.join(', ')}
     `);
      process.exit(1);
    }
    if (!numArtists || +numArtists < 1) {
      console.error('Number of artists must be greater than 0');
      process.exit(1);
    }
    try {
      const topArtists = await this.getTopArtists(+numArtists, period as LastFmTimePeriod);
      const urlLength = await this.getUrlLen();
      if (urlLength) {
        await this.setupTweet(topArtists.artist, urlLength, period as LastFmTimePeriod);
      }
    } catch (e) {
      console.error(e);
    }
  };
}

export default Tweeter;
