
var net = require('net');
var path = require('path');
var test = require('tap').test;
var async = require('async');
var DailyServer = require('../../daily.js').Server;
var DailyClient = require('../../daily.js').Client;

var DB_PATH = path.resolve(__dirname, '../temp.db');

test('close all connections then server', function (t) {
  var server = new DailyServer(DB_PATH);

  server.listen(0, '127.0.0.1', function () {

    async.parallel({
      A: function (done) {
        var client = new DailyClient(server.address().port, '127.0.0.1', function () {
          done(null, client);
        });
      },
      B: function (done) {
        var client = new DailyClient(server.address().port, '127.0.0.1', function () {
          done(null, client);
        });
      }
    }, function (err, clients) {
      t.equal(err, null);

      async.parallel({
        A: function (done) { clients.A.close(done); },
        B: function (done) { clients.B.close(done); }
      }, function (err) {
        t.equal(err, null);

        server.close(t.end.bind(t));
      });
    });
  });
});

function closeWithErrorCatch(socket, callback) {
  var error = null;

  socket.once('error', function (err) {
    error = err;
  });

  socket.once('close', function () {
    callback(null, error);
  });
}

test('close server with active connections', function (t) {
  var server = new DailyServer(DB_PATH);

  server.listen(0, '127.0.0.1', function () {

    async.parallel({
      A: function (done) {
        var client = new DailyClient(server.address().port, '127.0.0.1', function () {
          done(null, client);
        });
      },
      B: function (done) {
        var client = new DailyClient(server.address().port, '127.0.0.1', function () {
          done(null, client);
        });
      }
    }, function (err, clients) {
      t.equal(err, null);

      setTimeout(function() {
        async.parallel({
          A: function (done) { closeWithErrorCatch(clients.A, done); },
          B: function (done) { closeWithErrorCatch(clients.B, done); },
          server: function (done) { server.close(done); }
        }, function (err, result) {
          t.equal(err, null);
          t.equal(result.A.message, 'socket closed unintentionally and reconnection failed');
          t.equal(result.B.message, 'socket closed unintentionally and reconnection failed');
          t.end();
        });
      }, 100);
    });
  });
});
