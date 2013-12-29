
var test = require('tap').test;
var async = require('async');
var endpoint = require('endpoint');

var setup = require('../setup.js')();
var DailyClient = require('../../daily.js').Client;

setup.open();

var LOG_TIME = Date.now();

test('simultaniuse writes then read', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  async.parallel({
    A: function (done) {
      client.log(1, 'message - A', LOG_TIME, done);
    },
    B: function (done) {
      client.log(1, 'message - B', LOG_TIME, done);
    }
  }, function (err) {
    client.reader().pipe(endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.deepEqual(logs, [
        { time: LOG_TIME, level: 1, message: 'message - A' },
        { time: LOG_TIME, level: 1, message: 'message - B' }
      ]);

      client.close(t.end.bind(t));
    }));
  });
});

test('simultaniuse writes and single read', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  async.parallel({
    C: function (done) {
      client.log(1, 'message - C', LOG_TIME, done);
    },
    D: function (done) {
      client.log(1, 'message - D', LOG_TIME, done);
    },
    logs: function (done) {
      client.reader().pipe(endpoint({ objectMode: true }, done));
    }
  }, function (err, result) {
    t.equal(err, null);

    // The reason beind the read output contaning all logs, is properly
    // the fact that the read connection needs to be established first and
    // that is enogth time for the logs to be stored.
    t.deepEqual(result.logs, [
      { time: LOG_TIME, level: 1, message: 'message - A' },
      { time: LOG_TIME, level: 1, message: 'message - B' },
      { time: LOG_TIME, level: 1, message: 'message - C' },
      { time: LOG_TIME, level: 1, message: 'message - D' }
    ]);

    client.close(t.end.bind(t));
  });
});

test('simultaniuse writes and multiply read', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  async.parallel({
    C: function (done) {
      client.log(1, 'message - E', LOG_TIME, done);
    },
    D: function (done) {
      client.log(1, 'message - F', LOG_TIME, done);
    },
    logsA: function (done) {
      client.reader().pipe(endpoint({ objectMode: true }, done));
    },
    logsB: function (done) {
      client.reader().pipe(endpoint({ objectMode: true }, done));
    }
  }, function (err, result) {
    t.equal(err, null);

    // The reason beind the read output contaning all logs, is properly
    // the fact that the read connection needs to be established first and
    // that is enogth time for the logs to be stored.
    t.deepEqual(result.logsA, [
      { time: LOG_TIME, level: 1, message: 'message - A' },
      { time: LOG_TIME, level: 1, message: 'message - B' },
      { time: LOG_TIME, level: 1, message: 'message - C' },
      { time: LOG_TIME, level: 1, message: 'message - D' },
      { time: LOG_TIME, level: 1, message: 'message - E' },
      { time: LOG_TIME, level: 1, message: 'message - F' }
    ]);
    t.deepEqual(result.logsB, [
      { time: LOG_TIME, level: 1, message: 'message - A' },
      { time: LOG_TIME, level: 1, message: 'message - B' },
      { time: LOG_TIME, level: 1, message: 'message - C' },
      { time: LOG_TIME, level: 1, message: 'message - D' },
      { time: LOG_TIME, level: 1, message: 'message - E' },
      { time: LOG_TIME, level: 1, message: 'message - F' }
    ]);
    client.close(t.end.bind(t));
  });
});

setup.close();
