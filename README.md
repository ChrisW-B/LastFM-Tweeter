# Last.fm Tweeter by Chris Barry

Very simple node.js app that queries Last.FM for a user's top artists and posts them in the form

```
Top artists this week: ArtistA (90), ArtistB (31), ArtistC (27), and ArtistD (18)

(via http://last.fm/user/[username])
```
Starts with 5 artists by default, then eliminates artists until its under 140 characters

### config.js setup:
```javascript

var config = {};
config.twitter = {};
config.lastfm = {};

//account you want to tweet to
config.twitter = {
    consumerKey: 'XXX',
    consumerSecret: 'XXX',
    access_token: 'XXX-XXX',
    access_token_secret: 'XXX',
}

//config and token from last.fm/api
config.lastfm = {
    token: 'ZZZ',
    secret: 'ZZZ',
    username: 'lastfmuser' //username you want data from
}

module.exports = config;
```