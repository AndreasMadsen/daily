
var test = require('tap').test;
var async = require('async');
var endpoint = require('endpoint');
var startpoint = require('startpoint');
var binarypoint = require('./binarypoint.js');
var PassThrough = require('stream').PassThrough;

function sizeBuffer(size) {
  var buf = new Buffer(2);
      buf.writeUInt16BE(size, 0);
  return buf;
}

test('one message', function (t) {
  var socket = new PassThrough();
  var spliter = binarypoint(socket);

  spliter.pipe(endpoint({objectMode: true}, function (err, messages) {
    t.equal(err, null);
    t.equal(messages.length, 1);
    t.ok(Buffer.isBuffer(messages[0]), 'is buffer');
    t.equal(messages[0].toString(), 'hallo');
    t.end();
  }));

  socket.end(sizeBuffer(5) + 'hallo');
});

test('no message at all', function (t) {
  var socket = new PassThrough();
  var spliter = binarypoint(socket);

  spliter.pipe(endpoint({objectMode: true}, function (err, messages) {
    t.equal(err, null);
    t.equal(messages.length, 0);
    t.end();
  }));

  socket.end();
});

test('empty messages can exists', function (t) {
  var socket = new PassThrough();
  var spliter = binarypoint(socket);

  spliter.pipe(endpoint({objectMode: true}, function (err, messages) {
    t.equal(err, null);
    t.equal(messages.length, 1);
    t.ok(Buffer.isBuffer(messages[0]), 'is buffer');
    t.equal(messages[0].toString(), '');
    t.end();
  }));

  socket.end(sizeBuffer(0) + '');
});

test('two messages', function (t) {
  var socket = new PassThrough();
  var spliter = binarypoint(socket);

  spliter.pipe(endpoint({objectMode: true}, function (err, messages) {
    t.equal(err, null);
    t.equal(messages.length, 2);
    t.equal(messages[0].toString(), 'Hallo');
    t.equal(messages[1].toString(), 'World');
    t.end();
  }));

  socket.end(sizeBuffer(5) + 'Hallo' + sizeBuffer(5) + 'World');
});

test('write call gets relayed to socket', function (t) {
  var socket = new PassThrough();
  var spliter = binarypoint(socket);

  // Since PassThrough is not just a duplex stream but a transform stream
  // the writes will get back to the binarypoint.
  async.parallel({
    bytes: function (done) {
      socket.pipe(endpoint({objectMode: false}, done));
    },
    messages: function (done) {
      spliter.pipe(endpoint({objectMode: true}, done));
    }
  }, function (err, result) {
    t.equal(err, null);
    t.equal(result.bytes.toString(), sizeBuffer(5) + 'Hallo' + sizeBuffer(5) + 'World');
    t.equal(result.messages[0].toString(), 'Hallo');
    t.equal(result.messages[1].toString(), 'World');
    t.end();
  });

  startpoint([new Buffer('Hallo'), new Buffer('World')], {objectMode: true})
    .pipe(spliter);
});

test('.end call relays to socket', function (t) {
  var socket = new PassThrough();
  var spliter = binarypoint(socket);

  socket.once('finish', function () {
    t.ok(true, 'end called');
    t.end();
  });

  spliter.end();
});

test('close event relays to binarypoint', function (t) {
  var socket = new PassThrough();
  var spliter = binarypoint(socket);

  spliter.once('close', function () {
    t.ok(true, 'close emitted');
    t.end();
  });
  socket.emit('close');
});

test('error event relays to binarypoint', function (t) {
  var socket = new PassThrough();
  var spliter = binarypoint(socket);

  spliter.once('error', function (err) {
    t.equal(err.message, 'test');
    t.end();
  });
  socket.emit('error', new Error('test'));
});
