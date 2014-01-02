
var test = require('tap').test;
var endpoint = require('endpoint');

var setup = require('../setup.js')();
var DailyClient = require('../../daily.js').Client;

setup.open();

test('write log close and check', function (t) {
  var clientA = new DailyClient(setup.port, '127.0.0.1');

  // By default the log-levels range from 1 to 5, where log level 1 will live
  // the longest so this should be used for the most critical errors.
  clientA.log(1, 'message - A');

  // Close the connection
  clientA.close(function (isError) {
    t.equal(isError, false);

    var clientB = new DailyClient(setup.port, '127.0.0.1');

    clientB.reader().pipe(endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.equal(logs[0].message, 'message - A');
      clientB.close(t.end.bind(t));
    }));
  });
});

setup.close();
