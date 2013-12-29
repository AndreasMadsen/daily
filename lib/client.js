
var net = require('net');
var util = require('util');
var async = require('async');
var events = require('events');
var DailyInterface = require('daily-interface');

var DailyReader = require('./reader.js');

function DailyClient() {
  events.EventEmitter.call(this);

  this._port = 10200;
  this._address = '127.0.0.1';
  var callback;
  var args = Array.prototype.slice.call(arguments, 0);

  // Extract arguments by type
  if ((args.length > 0 && typeof args[args.length - 1] === 'function') || args.length === 3) {
    callback = args.pop();
  }
  if ((args.length > 0 && typeof args[args.length - 1] === 'string') || args.length === 2) {
    this._address = args.pop();
  }
  if ((args.length > 0 && typeof args[args.length - 1] === 'number') || args.length === 1) {
    this._port = args.pop();
  }

  // Attach callback
  if (callback) this.once('connect', callback);

  // Create writer client
  this._writer = new DailyInterface.Client(
    net.connect(this._port, this._address, this.emit.bind(this, 'connect'))
  );
  this._writer.once('error', this.emit.bind(this, 'error'));
  this._writer.once('close', this._writerClosed.bind(this));

  // Store reader clients
  this._readers = [];

  // Flag is true when .close was actually called
  this._closeing = false;
}
util.inherits(DailyClient, events.EventEmitter);
module.exports = DailyClient;

function nope() {}

DailyClient.prototype.log = function (level, subject, when, callback) {
  // Manage optional arguments and defaults
  if (typeof when === 'function' || when === undefined) {
    callback = when;
    when = Date.now();
  }

  if (callback === undefined) {
    callback = nope;
  }

  // Create details object
  var details = {
    'level': level,
    'message': new Buffer(JSON.stringify(subject)),
    'seconds': Math.floor(when / 1000),
    'milliseconds': when % 1000
  };

  // Execute writer
  this._writer.log(details, callback);
};

function splitTime(time) {
  if (time === null) {
    return {
      seconds: null,
      milliseconds: null
    };
  } else {
    return {
      seconds: Math.floor(time / 1000),
      milliseconds: time % 1000
    };
  }
}

DailyClient.prototype.reader = function () {
  var self = this;

  var start = null, end = null, levels = [1,9];
  var args = Array.prototype.slice.call(arguments, 0);

  if (args.length > 0 && Array.isArray(args[args.length - 1]) === true) {
    levels = args.pop();
  }

  // Set start and end, depending on the amount of arguments
  switch (args.length) {
    case 1:
      start = args[0];
      break;
    case 2:
      start = args[0];
      end = args[1];
      break;
  }

  // Create reader socket
  var client = new DailyInterface.Client(net.connect(this._port, this._address));
  this._readers.push(client);

  // Cleanup socket when it closes
  client.once('close', function () {
    var index = self._readers.indexOf(client);
    if (index !== -1) {
      self._readers.splice(index, 1);
    }
  });


  // Constrct details object
  var splitStart = splitTime(start);
  var splitEnd = splitTime(end);

  var details = {
    'startSeconds': splitStart.seconds,
    'startMilliseconds': splitStart.milliseconds,
    'endSeconds': splitEnd.seconds,
    'endMilliseconds': splitEnd.milliseconds,
    'levels': levels
  };

  // Create reader stream
  var reader = client.reader(details);

  // When reader is done close client
  reader.once('close', function () {
    client.close();
  });

  // Done, return reader object now
  return new DailyReader(reader);
};

DailyClient.prototype._writerClosed = function () {
  if (!this._closeing) this.emit('close');
};

function closeSocket(socket, done) {
  socket.once('close', done);
  socket.close();
}

DailyClient.prototype.close = function (callback) {
  if (this._closeing) return;
  this._closeing = true;

  if (callback) this.once('close', callback);
  var self = this;

  async.parallel([
    function (done) {
      closeSocket(self._writer, done);
    },
    function (done) {
      // the readers list will mutate so a copy is required
      async.forEach(self._readers.slice(0), closeSocket, done);
    }
  ], function () {
    self.emit('close');
  });
};
