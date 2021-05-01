import * as dotenv from 'dotenv';

import Tweeter from './src/functions/tweet';

dotenv.config();

export async function tweetMostPlayedArtists(): Promise<void> {
  console.log({ process: process.env });
  const Tweet = new Tweeter({
    username: process.env.LASTFM_USER_NAME,
    lastFM: {
      apiKey: process.env.LASTFM_TOKEN,
      apiSecret: process.env.LASTFM_SECRET,
    },
    twitter: {
      access_token_key: process.env.TWITTER_TOKEN_KEY,
      access_token_secret: process.env.TWITTER_TOKEN_SECRET,
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    },
  });

  return await Tweet.run(6, '7day');
}
