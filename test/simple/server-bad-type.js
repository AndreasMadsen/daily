
var net = require('net');
var test = require('tap').test;
var setup = require('../setup.js')();

setup.open();

test('sockets sending invalid types should be droped', function (t) {
  var socket = net.connect(setup.port, '127.0.0.1');

  socket.once('close', function () { t.end(); });
  socket.write(new Buffer([0x00, 0x01, 0x04]));
});

setup.close();
