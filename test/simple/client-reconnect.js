
var test = require('tap').test;
var endpoint = require('endpoint');

var setup = require('../setup.js')(); /* will simply remove the database */
var DailyServer = require('../../daily.js').Server;
var DailyClient = require('../../daily.js').Client;

test('failing initial connection', function (t) {
  var server = new DailyServer(setup.DB_PATH);
  var client = new DailyClient(10200, '127.0.0.1');
      client.log(1, 'message - A');

  setTimeout(function () {
    server.listen(10200, '127.0.0.1');
  }, 900);

  client.once('connect', function (socket) {
    client.reader().pipe(endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.equal(logs[0].message, 'message - A');

      client.close(function () {
        server.close(t.end.bind(t));
      });
    }));
  });
});

test('failing all connection attemps', function (t) {
  var client = new DailyClient(10200, '127.0.0.1');
  client.log(1, 'message - B', function (err) {
    t.equal(err.message, 'socket closed, this log did not get saved');
    client.once('error', function (err) {
      t.equal(err.message, 'socket closed unintentionally and reconnection failed');
      t.end();
    });
  });
});
