
var test = require('tap').test;
var async = require('async');
var endpoint = require('endpoint');

var setup = require('../setup.js')(); /* will simply remove the database */
var DailyServer = require('../../daily.js').Server;
var DailyClient = require('../../daily.js').Client;

var DEFAULT_PORT = require('../default-port.js');

test('failing initial connection', function (t) {
  var server = new DailyServer(setup.DB_PATH);
  var client = new DailyClient(DEFAULT_PORT, '127.0.0.1');
      client.log(1, 'message - A');

  setTimeout(function () {
    server.listen(DEFAULT_PORT, '127.0.0.1');
  }, 900);

  client.once('connect', function (socket) {
    client.reader().pipe(endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.equal(logs[0].message, 'message - A');

      client.close();
      client.once('close', function (isError) {
        t.equal(isError, false);
        server.close(t.end.bind(t));
      });
    }));
  });
});

test('failing all connection attemps', function (t) {
  var client = new DailyClient(DEFAULT_PORT, '127.0.0.1');
  client.log(1, 'message - B', function (err) {
    t.equal(err.message, 'socket closed, this log did not get saved');
    client.once('error', function (err) {
      t.equal(err.message, 'socket closed unintentionally and reconnection failed');
      client.once('close', function (isError) {
        t.equal(isError, true);
        t.end();
      });
    });
  });
});

test('client can make a reconnection', function (t) {
  var serverA = new DailyServer(setup.DB_PATH);
      serverA.listen(DEFAULT_PORT, '127.0.0.1');

  var client = new DailyClient(DEFAULT_PORT, '127.0.0.1');
  client.log(1, 'message - C', function () {
    serverA.close(function () {
      var serverB = new DailyServer(setup.DB_PATH);
          serverB.listen(DEFAULT_PORT, '127.0.0.1');

      async.parallel([
        function (done) {
          client.log(1, 'message - D', done);
        },
        function (done) {
          client.once('reconnect', done);
        }
      ], function (err) {
        t.equal(err, null);

        client.reader().pipe(endpoint({ objectMode: true }, function (err, logs) {
          t.equal(err, null);
          t.equal(logs[0].message, 'message - D');
          t.equal(logs[1].message, 'message - C');

          client.close();
          client.once('close', function (isError) {
            t.equal(isError, false);
            serverB.close(t.end.bind(t));
          });
        }));
      });
    });
  });
});

test('client failling all reconnection attempts', function (t) {
  var serverA = new DailyServer(setup.DB_PATH);
      serverA.listen(DEFAULT_PORT, '127.0.0.1');

  var client = new DailyClient(DEFAULT_PORT, '127.0.0.1');
  client.log(1, 'message - E', function (err) {
    t.equal(err, null);
    serverA.close(function () {
      client.log(1, 'message - F', function (err) {
        t.equal(err.message, 'socket closed, this log did not get saved');
        client.once('error', function (err) {
          t.equal(err.message, 'socket closed unintentionally and reconnection failed');
          client.once('close', function (isError) {
            t.equal(isError, true);
            t.end();
          });
        });
      });
    });
  });
});
