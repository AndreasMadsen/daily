
var net = require('net');
var test = require('tap').test;
var setup = require('../setup.js')();

setup.open();

test('connection event emits on new socket', function (t) {
  var socket = net.connect(setup.port, '127.0.0.1');

  setup.server.once('connection', function (socket) {
    socket.destroy();
  });

  socket.once('close', t.end.bind(t));
});

setup.close();
