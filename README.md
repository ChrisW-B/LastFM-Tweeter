# Last.fm Tweeter by Chris Barry

Very simple node.js app that queries Last.FM for a user's top artists and posts them in the form

```
Top artists this week: ArtistA (90), ArtistB (31), ArtistC (27), and ArtistD (18)

(via http://last.fm/user/[username])
```

Run the app with `npm run start -- [initialArtistCount] [lastFmTimePeriod]`.
e.g `npm run start -- 6 7day`

### .env setup:

```
TWITTER_CONSUMER_KEY=XXX
TWITTER_CONSUMER_SECRET=YYY
TWITTER_TOKEN_KEY=ZZ-ZZZ
TWITTER_TOKEN_SECRET=AAA

LASTFM_TOKEN=BBB
LASTFM_SECRET=CCC
LASTFM_USER_NAME=DDD
module.exports = config;
```
