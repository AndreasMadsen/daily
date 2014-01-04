
var util = require('util');
var test = require('tap').test;
var async = require('async');
var endpoint = require('endpoint');

var exec = require('../exec.js');
var setup = require('../setup.js')();
var DailyClient = require('../../daily.js').Client;

var DEFAULT_PORT = require('../default-port.js');

setup.open();

var LOG_TIME = Math.floor(Date.now() / 1000);
var HOUR = 3600;
var writes = [
  { time: (LOG_TIME + 1 * HOUR) * 1000 + 250, level: 1, message: 'message - A' },
  { time: (LOG_TIME + 0 * HOUR) * 1000 + 250, level: 2, message: 'message - B' },
  { time: (LOG_TIME + 0 * HOUR) * 1000 + 250, level: 3, message: 'message - C' },
  { time: (LOG_TIME - 2 * HOUR) * 1000 + 250, level: 1, message: 'message - D' },
  { time: (LOG_TIME - 2 * HOUR) * 1000 + 250, level: 1, message: 'message - E' },
  { time: (LOG_TIME - 3 * HOUR) * 1000 + 250, level: 1, message: 'message - F' }
];

var EXPECTED_NO_COLOR = writes.map(function (item) {
  return (new Date(item.time)).toJSON().replace(/[A-Z]/, ' ').slice(0, -1) + '   ' +
         item.level + '\n' +
         util.inspect(item.message);
});

var EXPECTED_COLOR = writes.map(function (item) {
  return '\u001b[37m' + (new Date(item.time)).toJSON().replace(/[A-Z]/, ' ').slice(0, -1) + '\u001b[39m   ' +
         '\u001b[37m' + item.level + '\u001b[39m\n' +
         '\u001b[32m' + util.inspect(item.message) + '\u001b[39m';
});

test('write 5 messages', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  function log(item, done) {
    client.log(item.level, item.message, item.time, done);
  }

  async.each(writes, log, function () {
    client.once('close', t.end.bind(t));
    client.close();
  });
});

test('run cli read (long) no time, no color, address set', function (t) {
  var child = exec('{node} {daily} read --address 127.0.0.1:' + setup.port);
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(), EXPECTED_NO_COLOR.slice(0, 3).join('\n') + '\n');
    t.end();
  }));
});

test('run cli read (short) no time, no color, address set', function (t) {
  var child = exec('{node} {daily} read --a 127.0.0.1:' + setup.port);
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(), EXPECTED_NO_COLOR.slice(0, 3).join('\n') + '\n');
    t.end();
  }));
});

test('run cli read (long) no time, some color, address set', function (t) {
  var child = exec('{node} {daily} read --colors --address 127.0.0.1:' + setup.port);
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(), EXPECTED_COLOR.slice(0, 3).join('\n') + '\n');
    t.end();
  }));
});

test('run cli read (short) no time, some color, address set', function (t) {
  var child = exec('{node} {daily} read --c --a 127.0.0.1:' + setup.port);
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(), EXPECTED_COLOR.slice(0, 3).join('\n') + '\n');
    t.end();
  }));
});

setup.close();
setup.open(DEFAULT_PORT);

test('run cli read no time, no color, no address', function (t) {
  var child = exec('{node} {daily} read');
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(), EXPECTED_NO_COLOR.slice(0, 3).join('\n') + '\n');
    t.end();
  }));
});

test('run cli read (long) start time no end, no color, no address', function (t) {
  var child = exec('{node} {daily} read --start ' + (LOG_TIME + HOUR));
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(), EXPECTED_NO_COLOR.slice(0, 1).join('\n') + '\n');
    t.end();
  }));
});

test('run cli read (short) start time no end, no color, no address', function (t) {
  var child = exec('{node} {daily} read -s ' + (LOG_TIME + HOUR));
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(), EXPECTED_NO_COLOR.slice(0, 1).join('\n') + '\n');
    t.end();
  }));
});

test('run cli read (long) end time no start, no color, no address', function (t) {
  var child = exec('{node} {daily} read --end ' + (LOG_TIME + HOUR));
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(), EXPECTED_NO_COLOR.slice(1, 6).join('\n') + '\n');
    t.end();
  }));
});

test('run cli read (short) end time no start, no color, no address', function (t) {
  var child = exec('{node} {daily} read -e ' + (LOG_TIME + HOUR));
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(), EXPECTED_NO_COLOR.slice(1, 6).join('\n') + '\n');
    t.end();
  }));
});

test('run cli read (long) past set, no color, no address', function (t) {
  var child = exec('{node} {daily} read --past 7300');
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(), EXPECTED_NO_COLOR.slice(0, 5).join('\n') + '\n');
    t.end();
  }));
});

test('run cli read (short) past set, no color, no address', function (t) {
  var child = exec('{node} {daily} read -p 7300');
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(), EXPECTED_NO_COLOR.slice(0, 5).join('\n') + '\n');
    t.end();
  }));
});

setup.close();
