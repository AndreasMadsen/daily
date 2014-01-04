
var path = require('path');
var test = require('tap').test;
var DailyServer = require('../../daily.js').Server;

var DB_PATH = path.resolve(__dirname, '../temp.db');

test('new keyword is optional', function (t) {
  var server = DailyServer(DB_PATH);
      server.listen(0, '127.0.0.1');

  server.once('listening', function () {
    t.deepEqual(server.address(), {
      address: '127.0.0.1',
      family: 'IPv4',
      port: server.address().port // flexible
    });

    server.close(t.end.bind(t));
  });
});
