
var net = require('net');
var test = require('tap').test;
var setup = require('../setup.js')();

setup.open();

test('address returns port and ip', function (t) {
  var addr = setup.server.address();

  t.equal(addr.address, '127.0.0.1');
  t.equal(addr.family, 'IPv4');
  t.ok(addr.port > 0);
  t.end();
});

setup.close();
