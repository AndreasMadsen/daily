
var net = require('net');
var path = require('path');
var test = require('tap').test;
var DailyServer = require('../../daily.js').Server;

var DB_PATH = path.resolve(__dirname, '../temp.db');

test('as event handler', function (t) {
  var server = new DailyServer(DB_PATH);

  server.listen(0, '127.0.0.1');
  server.once('listening', function () {
    server.close();
    server.once('close', t.end.bind(t));
  });
});

test('as callback handler', function (t) {
  var server = new DailyServer(DB_PATH);

  server.listen(0, '127.0.0.1', function () {
    server.close(t.end.bind(t));
  });
});
