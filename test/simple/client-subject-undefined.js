
var test = require('tap').test;

var setup = require('../setup.js')();
var DailyClient = require('../../daily.js').Client;

setup.open();

test('subject can not be undefined', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');
  var error = null;

  try {
    client.log(1, undefined);
  } catch (e) { error = e; }

  t.equal(error.message, 'subject can not be undefined');
  client.close(t.end.bind(t));
});

setup.close();
