
var test = require('tap').test;
var endpoint = require('endpoint');

var setup = require('../setup.js')();
var DailyClient = require('../../daily.js').Client;

setup.open();

test('write then read', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  var now = Date.now();

  client.log(1, 'simple message', function (err) {
    t.equal(err, null);

    client.reader().pipe(endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.equal(logs.length, 1);
      t.ok(Math.abs(logs[0].time - now) < 5, 'time less than 5ms off');
      t.equal(logs[0].level, 1);
      t.equal(logs[0].message, 'simple message');

      client.close(t.end.bind(t));
    }));
  });
});

setup.close();
