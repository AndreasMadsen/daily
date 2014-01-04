
var path = require('path');
var test = require('tap').test;
var DailyServer = require('../../daily.js').Server;

var DEFAULT_PORT = require('../default-port.js');
var DB_PATH = path.resolve(__dirname, '../temp.db');

test('new keyword is optional', function (t) {
  var server = DailyServer(DB_PATH);
      server.listen();

  server.once('listening', function () {
    t.deepEqual(server.address(), {
      address: '0.0.0.0',
      family: 'IPv4',
      port: DEFAULT_PORT
    });

    server.close(t.end.bind(t));
  });
});
