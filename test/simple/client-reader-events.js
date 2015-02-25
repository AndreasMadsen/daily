
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
  'C': { time: LOG_TIME + 0 * HOUR, level: 2, message: 'message - C' }
};

test('write 3 messages', function (t) {
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

  var reader = client.reader();

  var data = [];
  var error = new Error('no endpoint');
  var ended = false;

  reader.pipe(endpoint({ objectMode: true }, function (err, logs) {
    data = logs;
    error = err;
  }));

  reader.once('end', function () {
    ended = true;
  });

  reader.once('close', function () {
    t.equal(ended, true);
    t.equal(error, null);
    t.deepEqual(data, [ writes.A, writes.B, writes.C ]);

    client.close(t.end.bind(t));
  });
});

setup.close();
