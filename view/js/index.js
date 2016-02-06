var mongoose = require('mongoose');
var Tag = require('my_modules/stream').Tag;
var Tweet = require('my_modules/stream').Tweet;
var ipc = require('ipc');
var async = require('async');
var DB_NAME = 'kirokutron';

function updateTags(callback) {
  async.waterfall(
    [
      function (callback) {
        Tag.find({}, function(err, docs) {})
          .exec(function (err, res) {
            var tag_names = [];
            res.forEach(function(obj){
              tag_names.push(obj.name);
            });
            callback(null, tag_names);
          });
      },
      function (tag_names, callback) {
        console.log(tag_names);
        $('#tags').find('option').remove();
        for(var i=0; i<tag_names.length; i++){
          $('#tags')
            .append(
              $('<option></option>')
                .addClass("tag")
                .val(tag_names[i])
                .text(tag_names[i])
            );
        }
        callback(null);
      }
    ], function (err) {
      if (err) { throw err; }
      callback();
    }
  );
}

function getTweets(tag_name, callback) {
  async.waterfall(
    [
      function (callback) {
        Tweet
          .find({'tags.name' : tag_name}, function(err, docs) {})
          .exec(function (err, docs) { callback(null, docs); });
      },
      function (tweets, callback) {
        $('.tweet').remove();
        tweets.forEach(function(tweet){
          $('#tweet_table').append(
            $("<tr></tr>")
              .addClass("tweet")
              .append(
                $('<td></td>')
                  .addClass("tweet_text")
                  .text(tweet.body.text))
              .append(
                $('<td></td>')
                  .addClass("tweeted_at")
                  .text(tweet.body.tweeted_at)));
        });
      }
    ], function (err) {
      if (err) { throw err; }
      callback();
    }
  );
}

// 画面描画時
async.waterfall(
  [
    function (callback) {
      mongoose.connect('mongodb://localhost/' + DB_NAME);
          var db = mongoose.connection;
      db.on('error', console.error.bind(console, 'connection error:'));
      db.once('open', function() {
        console.log("Connect database successfully! : side renderer");
        ipc.send('connection', 'ping');
        callback(null);
      });
    },
    function (callback) {
      updateTags(callback);
    },
    function (callback) {
      var first_tag = $('select#tags option:first').text();
      getTweets(first_tag, callback);
    }
  ], function(err) {
    if (err) { throw err; }
  }
);

// タグ選択時
$("#tags").change(function() {
  var selected_tag = $('select#tags option:selected').text();
  getTweets(selected_tag, null);
});

// DB更新時(tweet時)
ipc.on('db-updated', function(arg) {
  async.waterfall(
    [
      function (callback) {
        updateTags(callback);
      },
      function (callback) {
        var selected_tag = $('select#tags option:selected').text();
        getTweets(selected_tag, callback);
      }
    ],
    function (err) {
      if (err) { throw err; }
    }
  );
});
