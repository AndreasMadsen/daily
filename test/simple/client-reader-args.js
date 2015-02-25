
var test = require('tap').test;
var async = require('async');
var endpoint = require('endpoint');

var setup = require('../setup.js')();
var DailyClient = require('../../daily.js').Client;

setup.open();

var LOG_TIME = Date.now();
var HOUR = 3600 * 1000;
var writes = {
  'A': { time: LOG_TIME + 2 * HOUR, level: 1, message: 'message - A' },
  'B': { time: LOG_TIME + 1 * HOUR, level: 1, message: 'message - B' },
  'C': { time: LOG_TIME + 0 * HOUR, level: 2, message: 'message - C' },
  'D': { time: LOG_TIME + 0 * HOUR, level: 3, message: 'message - D' },
  'E': { time: LOG_TIME + 0 * HOUR, level: 4, message: 'message - E' },
  'F': { time: LOG_TIME + 0 * HOUR, level: 5, message: 'message - F' },
  'G': { time: LOG_TIME - 1 * HOUR, level: 1, message: 'message - G' },
  'H': { time: LOG_TIME - 2 * HOUR, level: 1, message: 'message - H' },
  'I': { time: LOG_TIME - 3 * HOUR, level: 1, message: 'message - I' },
  'J': { time: LOG_TIME - 4 * HOUR, level: 1, message: 'message - J' }
};

test('write 10 messages', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  function log(letter, done) {
    client.log(
      writes[letter].level,
      writes[letter].message,
      writes[letter].time,
      done
    );
  }

  LOG_TIME = Date.now();

  async.each(Object.keys(writes), log, function (err) {
    t.ifError(err);
    client.once('close', t.end.bind(t));
    client.close();
  });
});

test('read all', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  client.reader().pipe(
    endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.deepEqual(logs, [
        writes.A,
        writes.B,
        writes.C,
        writes.D,
        writes.E,
        writes.F,
        writes.G,
        writes.H,
        writes.I,
        writes.J
      ]);

      client.close(t.end.bind(t));
    })
  );
});

test('read start -0.5h', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  client.reader(LOG_TIME - 0.5 * HOUR).pipe(
    endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.deepEqual(logs, [
        writes.A,
        writes.B,
        writes.C,
        writes.D,
        writes.E,
        writes.F
      ]);

      client.close(t.end.bind(t));
    })
  );
});

test('read end -0.5h', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  client.reader(null, LOG_TIME - 0.5 * HOUR).pipe(
    endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.deepEqual(logs, [
        writes.G,
        writes.H,
        writes.I,
        writes.J
      ]);

      client.close(t.end.bind(t));
    })
  );
});

test('read start -2.5h and end +0.5h', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  client.reader(LOG_TIME - 2.5 * HOUR, LOG_TIME + 0.5 * HOUR).pipe(
    endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.deepEqual(logs, [
        writes.C,
        writes.D,
        writes.E,
        writes.F,
        writes.G,
        writes.H
      ]);

      client.close(t.end.bind(t));
    })
  );
});

test('read level 2 to 3', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  client.reader([2, 3]).pipe(
    endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.deepEqual(logs, [
        writes.C,
        writes.D
      ]);

      client.close(t.end.bind(t));
    })
  );
});

test('read start -2.5h and end +0.5h and read 1 to 3', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  client.reader(LOG_TIME - 2.5 * HOUR, LOG_TIME + 0.5 * HOUR, [1, 3]).pipe(
    endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.deepEqual(logs, [
        writes.C,
        writes.D,
        writes.G,
        writes.H
      ]);

      client.close(t.end.bind(t));
    })
  );
});

setup.close();
