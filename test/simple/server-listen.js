
var path = require('path');
var test = require('tap').test;
var DailyServer = require('../../daily.js').Server;

var DB_PATH = path.resolve(__dirname, '../temp.db');

test('no port, no address, no callback', function (t) {
  var server = new DailyServer(DB_PATH);
      server.listen();

  server.once('listening', function () {
    t.deepEqual(server.address(), {
      address: '0.0.0.0',
      family: 'IPv4',
      port: 10200
    });

    server.close(t.end.bind(t));
  });
});

test('a port, no address, no callback', function (t) {
  var server = new DailyServer(DB_PATH);
      server.listen(10205);

  server.once('listening', function () {
    t.deepEqual(server.address(), {
      address: '0.0.0.0',
      family: 'IPv4',
      port: 10205
    });

    server.close(t.end.bind(t));
  });
});

test('a port, a address, no callback', function (t) {
  var server = new DailyServer(DB_PATH);
      server.listen(10205, '127.0.0.1');

  server.once('listening', function () {
    t.deepEqual(server.address(), {
      address: '127.0.0.1',
      family: 'IPv4',
      port: 10205
    });

    server.close(t.end.bind(t));
  });
});

test('a port, a address, a callback', function (t) {
  var server = new DailyServer(DB_PATH);

  server.listen(10205, '127.0.0.1', function () {
    t.deepEqual(server.address(), {
      address: '127.0.0.1',
      family: 'IPv4',
      port: 10205
    });

    server.close(t.end.bind(t));
  });
});

test('no port, a address, a callback', function (t) {
  var server = new DailyServer(DB_PATH);

  server.listen('127.0.0.1', function () {
    t.deepEqual(server.address(), {
      address: '127.0.0.1',
      family: 'IPv4',
      port: 10200
    });

    server.close(t.end.bind(t));
  });
});

test('no port, no address, a callback', function (t) {
  var server = new DailyServer(DB_PATH);

  server.listen(function () {
    t.deepEqual(server.address(), {
      address: '0.0.0.0',
      family: 'IPv4',
      port: 10200
    });

    server.close(t.end.bind(t));
  });
});
