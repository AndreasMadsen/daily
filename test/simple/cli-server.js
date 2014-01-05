
var path = require('path');
var test = require('tap').test;
var async = require('async');
var wrench = require('wrench');
var endpoint = require('endpoint');

var exec = require('../exec.js');
var setup = require('../setup.js')();
var DailyClient = require('../../daily.js').Client;

var DEFAULT_PORT = require('../default-port.js');

setup.open();

var LOG_TIME = Date.now();
var HOUR = 3600 * 1000;
var writes = [
  { time: LOG_TIME + 2 * HOUR, level: 1, message: 'message - A' },
  { time: LOG_TIME + 1 * HOUR, level: 1, message: 'message - B' },
  { time: LOG_TIME + 0 * HOUR, level: 2, message: 'message - C' }
];

test('write 3 messages', function (t) {
  var client = new DailyClient(setup.port, '127.0.0.1');

  function log(item, done) {
    client.log(item.level, item.message, item.time, done);
  }

  async.each(writes, log, function () {
    client.once('close', t.end.bind(t));
    client.close();
  });
});

setup.close();

test('run cli server (long), database set, no address', function (t) {
  var child = exec('{node} {daily} server --database ./temp.db/');
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(),
      'daily server ready\n' +
      '  address  : 0.0.0.0:' + DEFAULT_PORT + '\n' +
      '  pid      : ' + child.pid + '\n' +
      '  database : ' + path.resolve(__dirname, '../temp.db') + '\n' +
      'got SIGINT closeing daily server now\n'
    );
    t.end();
  }));

  var client = new DailyClient(DEFAULT_PORT, '127.0.0.1', function () {
    client.reader().pipe(endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.deepEqual(logs, writes);
      client.close(function () {
        child.kill('SIGINT');
      });
    }));
  });
});

test('run cli server (short), database set, no address', function (t) {
  var child = exec('{node} {daily} server -d ./temp.db/');
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(),
      'daily server ready\n' +
      '  address  : 0.0.0.0:' + DEFAULT_PORT + '\n' +
      '  pid      : ' + child.pid + '\n' +
      '  database : ' + path.resolve(__dirname, '../temp.db') + '\n' +
      'got SIGINT closeing daily server now\n'
    );
    t.end();
  }));

  var client = new DailyClient(DEFAULT_PORT, '127.0.0.1', function () {
    client.reader().pipe(endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.deepEqual(logs, writes);
      client.close(function () {
        child.kill('SIGINT');
      });
    }));
  });
});

test('run cli server (short), no database, no address', function (t) {
  var child = exec('{node} {daily} server');
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(),
      'daily server ready\n' +
      '  address  : 0.0.0.0:' + DEFAULT_PORT + '\n' +
      '  pid      : ' + child.pid + '\n' +
      '  database : ' + path.resolve(__dirname, '../daily.db') + '\n' +
      'got SIGINT closeing daily server now\n'
    );
    wrench.rmdirRecursive(path.resolve(__dirname, '../daily.db'), function () {
      t.end();
    });
  }));

  setTimeout(function () {
    child.kill('SIGINT');
  }, 200);
});

test('run cli server (long), database set, address set', function (t) {
  var child = exec('{node} {daily} server --database ./temp.db/ --address 127.0.0.1:10207');
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(),
      'daily server ready\n' +
      '  address  : 127.0.0.1:10207\n' +
      '  pid      : ' + child.pid + '\n' +
      '  database : ' + path.resolve(__dirname, '../temp.db') + '\n' +
      'got SIGINT closeing daily server now\n'
    );
    t.end();
  }));

  var client = new DailyClient(10207, '127.0.0.1', function () {
    client.reader().pipe(endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.deepEqual(logs, writes);
      client.close(function () {
        child.kill('SIGINT');
      });
    }));
  });
});

test('run cli server (short), database set, no address', function (t) {
  var child = exec('{node} {daily} server -d ./temp.db/ -a 127.0.0.1:10207');
  child.stdout.pipe(endpoint(function (err, output) {
    t.equal(output.toString(),
      'daily server ready\n' +
      '  address  : 127.0.0.1:10207\n' +
      '  pid      : ' + child.pid + '\n' +
      '  database : ' + path.resolve(__dirname, '../temp.db') + '\n' +
      'got SIGINT closeing daily server now\n'
    );
    t.end();
  }));

  var client = new DailyClient(10207, '127.0.0.1', function () {
    client.reader().pipe(endpoint({ objectMode: true }, function (err, logs) {
      t.equal(err, null);
      t.deepEqual(logs, writes);
      client.close(function () {
        child.kill('SIGINT');
      });
    }));
  });
});
