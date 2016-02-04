'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var twitterAPI = require('node-twitter-api');
var reporter = require('crash-reporter');
var stream = require('my_modules/stream');
var key = require('my_modules/key');
var ipc = require('ipc');

reporter.start();

var mainWindow = null;

var TWITTER_CONSUMER_KEY = key.CONSUMER_KEY;
var TWITTER_CONSUMER_SECRET = key.CONSUMER_SECRET;
var ACCESS_TOKEN_KEY = '';
var ACCESS_TOKEN_SECRET = '';

app
  .on('ready', getRequest)
  .on('window-all-closed', function() { if (process.platform != 'darwin') app.quit();});

function getRequest() {
  var twitter = new twitterAPI({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callback: 'https://www.google.co.jp/'
  });

  twitter.getRequestToken(function(error, requestToken, requestTokenSecret) {
    var url = twitter.getAuthUrl(requestToken);
    var loginWindow = new BrowserWindow({width: 800, height: 600});

    // TODO : 認証失敗時の処理の追加
    loginWindow.webContents.on('will-navigate', function (preventDefault, url) {
      var matched;
      if(matched = url.match(/\?oauth_token=([^&]*)&oauth_verifier=([^&]*)/)) {
        twitter.getAccessToken(
          requestToken, requestTokenSecret, matched[2],
          function(error, accessToken, accessTokenSecret){
            console.log('OAuth succeeded!');
            ACCESS_TOKEN_KEY = accessToken;
            ACCESS_TOKEN_SECRET = accessTokenSecret;
            getMainWindow();
          });
      }

      setTimeout(function () {
        loginWindow.close();
      }, 0);
    });

    loginWindow.loadUrl(url);
  });
}

function getMainWindow() {
  mainWindow = new BrowserWindow({ 'width': 1024, 'height': 600 });
  mainWindow.loadUrl('file://' + __dirname + '/view/index.html');
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

ipc.on('connection', function(event, arg) {
  console.log(arg);

  // TODO : DB状況を非同期にアップデートして view に表示する
  stream.streaming(
    TWITTER_CONSUMER_KEY,
    TWITTER_CONSUMER_SECRET,
    ACCESS_TOKEN_KEY,
    ACCESS_TOKEN_SECRET,
    mainWindow
  );
});
