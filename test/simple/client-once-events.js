
var test = require('tap').test;
var endpoint = require('endpoint');

var setup = require('../setup.js')();
var DailyClient = require('../../daily.js').Client;

setup.open();

test('connect and close by event', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  client.once('connect', function () {
    client.once('close', function () {
      t.end();
    });
    client.close();
  });
});

test('connect and close by callback', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1', function () {
    client.close(function () {
      t.end();
    });
  });
});

setup.close();
