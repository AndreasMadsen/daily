
var test = require('tap').test;
var endpoint = require('endpoint');

var setup = require('../setup.js')();
var DailyClient = require('../../daily.js').Client;

setup.open();

test('write error without callback', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  setup.server.once('connection', function (socket) {
    client.log(1, 'message A');
    socket.once('data', function () {
      socket.destroy();
    });
  });

  client.once('error', function (err) {
    t.equal(err.message, 'socket closed prematurely the result is unkown');

    client.close(t.end.bind(t));
  });
});

test('write error with callback', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  setup.server.once('connection', function (socket) {
    client.log(1, 'message A', function (err) {
      t.equal(err.message, 'socket closed prematurely the result is unkown');

      client.close(t.end.bind(t));
    });

    socket.once('data', function () {
      socket.destroy();
    });
  });
});

setup.close();
