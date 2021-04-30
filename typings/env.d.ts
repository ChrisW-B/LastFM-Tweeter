declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TWITTER_CONSUMER_KEY: string;
      TWITTER_CONSUMER_SECRET: string;
      TWITTER_TOKEN_KEY: string;
      TWITTER_TOKEN_SECRET: string;
      LASTFM_TOKEN: string;
      LASTFM_SECRET: string;
      LASTFM_USER_NAME: string;
    }
  }
}

export {};
