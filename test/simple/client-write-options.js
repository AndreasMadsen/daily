
var test = require('tap').test;
var endpoint = require('endpoint');

var setup = require('../setup.js')();
var DailyClient = require('../../daily.js').Client;

setup.open();

var NOW = [0, 0];
var PAST = Date.now() - 3600 * 1000;

test('do some diffrent writes', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');


  t.test('automatic time without callback', function (t) {
    NOW[0] = Date.now();

    client.log(1, 'automatic time without callback');
    setTimeout(t.end.bind(t), 100);
  });

  t.test('automatic time with callback', function (t) {
    NOW[1] = Date.now();

    client.log(1, 'automatic time with callback', function (err) {
      t.equal(err, null);
      t.end();
    });
  });

  t.test('when option without callback', function (t) {
    client.log(1, 'when option without callback', PAST);
    setTimeout(t.end.bind(t), 100);
  });

  t.test('when option with callback', function (t) {
    client.log(1, 'when option with callback', PAST, function (err) {
      t.equal(err, null);
      t.end();
    });
  });

  t.test('close', function (t) {
    client.close(t.end.bind(t));
  });
});

test('check logs', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  client.reader().pipe(endpoint({ objectMode: true }, function (err, logs) {
    t.equal(err, null);

    // with callback will be the newest and so it will be first
    t.equal(logs[0].level, 1);
    t.equal(logs[0].message, 'automatic time with callback');
    t.ok(Math.abs(logs[0].time - NOW[1]) < 5, 'now less than 5ms off');

    // without callback will then follow
    t.equal(logs[1].level, 1);
    t.equal(logs[1].message, 'automatic time without callback');
    t.ok(Math.abs(logs[1].time - NOW[0]) < 5, 'now less than 5ms off');

    t.deepEqual(logs[2], {
      time: PAST,
      level: 1,
      message: 'when option without callback'
    });

    t.deepEqual(logs[3], {
      time: PAST,
      level: 1,
      message: 'when option with callback'
    });

    client.close(t.end.bind(t));
  }));
});

setup.close();

/*
 * write without callback
 * write auto time
 * write when option
 * write when option and callback
**/
