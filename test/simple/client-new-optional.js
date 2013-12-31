
var test = require('tap').test;

var setup = require('../setup.js')();
var DailyClient = require('../../daily.js').Client;

setup.open();

test('new keyword is optional', function (t) {
  var client = DailyClient(setup.port, '127.0.0.1');

  client.log(1, 'simple message', function (err) {
    t.equal(err, null);
    client.close(t.end.bind(t));
  });
});

setup.close();
