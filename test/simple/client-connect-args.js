
var test = require('tap').test;

var setup = require('../setup.js')();
var DailyClient = require('../../daily.js').Client;

setup.open(10200);

test('no port, no address, no callback', function (t) {
  var client = new DailyClient();
      client.once('connect', function () {
        client.close(t.end.bind(t));
      });
});

test('no port, a address, a callback', function (t) {
  var client = new DailyClient('127.0.0.1', function () {
    client.close(t.end.bind(t));
  });
});

test('no port, no address, a callback', function (t) {
  var client = new DailyClient(function () {
    client.close(t.end.bind(t));
  });
});

setup.close();
setup.open(0);

test('a port, no address, no callback', function (t) {
  var client = new DailyClient(setup.port);
      client.once('connect', function () {
        client.close(t.end.bind(t));
      });
});

test('a port, a address, no callback', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');
      client.once('connect', function () {
        client.close(t.end.bind(t));
      });
});

test('a port, a address, a callback', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1', function () {
    client.close(t.end.bind(t));
  });
});

setup.close();
