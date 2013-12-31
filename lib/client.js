
var net = require('net');
var util = require('util');
var async = require('async');
var events = require('events');
var DailyInterface = require('daily-interface');

var DailyReader = require('./reader.js');

// Takes 3 arguments and creates an array with no trailing undefined items
function createArgs(arg1, arg2, arg3) {
  var args = [arg1, arg2, arg3];
  while (args.length) {
    var val = args.pop();
    if (val !== undefined) {
      args.push(val); break;
    }
  }
  return args;
}

function DailyClient(arg1, arg2, arg3) {
  if (!(this instanceof DailyClient)) return new DailyClient(arg1, arg2, arg3);
  events.EventEmitter.call(this);
  var self = this;

  this._port = 10200;
  this._address = '127.0.0.1';
  var callback;
  var args = createArgs(arg1, arg2, arg3);

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

  // Simply checks and emits an error
  this._emitIfError = function (err) {
    if (err) return self.emit('error', err);
  };

  // Flag is true when .close was actually called
  this._closeing = false;

  // Properties for reconnecting logic
  this._logBuffer = [];
  this._connecting = true;

  // Store reader clients
  this._readers = [];

  // Create writer client
  this._writer = null;
  this._makeWriterConnection(true);
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
    callback = this._emitIfError;
  }

  // Create details object
  var details = {
    'level': level,
    'message': new Buffer(JSON.stringify(subject)),
    'seconds': Math.floor(when / 1000),
    'milliseconds': when % 1000
  };

  // Execute writer
  if (this._connecting === true) {
    this._logBuffer.push({ 'details': details, 'callback': callback });
  } else {
    this._writer.log(details, callback);
  }
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

// Attempt to connect to daily server, when either failed to sucessed call
// the callback
DailyClient.prototype._attemtConnect = function (callback) {
  var socket = net.connect(this._port, this._address);
  var error = null;

  socket.once('connect', onConnect);
  socket.once('error', onError);
  socket.once('close', onClose);

  function onConnect() {
    cleanup();
    callback(error === null, socket);
  }

  function onError(err) {
    error = err;
  }

  function onClose() {
    cleanup();
    callback(false, socket);
  }

  function cleanup() {
    socket.removeListener('connect', onConnect);
    socket.removeListener('error', onError);
    socket.removeListener('close', onClose);
  }
};

var RECONNECT_WAIT_TIME = [50, 100, 250, 600]; // 1 sec total

DailyClient.prototype._makeWriterConnection = function (emitConnect) {
  // socket.close() was callled, the logic will be handled elsewhere
  if (this._closeing) return;

  var self = this;

  // use internal buffer for socket.log() calls
  this._connecting = true;

  (function reconnect(previuseTrys) {
    // Attemt to create a connection, if sucess `connected` will be true
    self._attemtConnect(function (connected, socket) {
      // use the socket
      if (connected) {
        self._useConnection(socket);
        if (emitConnect) self.emit('connect');
      }
      // close for real
      else if (previuseTrys === RECONNECT_WAIT_TIME.length) {
        self._closeByIssue();
      }
      // attempt again, this time wait a little longer
      else {
        setTimeout(reconnect, RECONNECT_WAIT_TIME[previuseTrys], previuseTrys + 1);
      }
    });
  })(0);
};


DailyClient.prototype._useConnection = function (socket) {
  // Create a daily interface
  this._writer = new DailyInterface.Client(socket);
  this._writer.once('error', this.emit.bind(this, 'error'));
  this._writer.once('close', this._makeWriterConnection.bind(this, false));

  // Stop buffering
  this._connecting = false;

  // Drain the buffer
  for (var i = 0, l = this._logBuffer.length; i < l; i++) {
    this._writer.log(this._logBuffer[i].details, this._logBuffer[i].callback);
  }

  // Reset buffer
  this._logBuffer = [];
};

DailyClient.prototype._closeByIssue = function (socket) {
  // Stop buffering, this will let the daily-interface throw
  this._connecting = false;

  // Prevent socket.close() from doing anything
  this._closeing = true;

  // Tell all buffered log calls that they did not succeed
  var logError = new Error('socket closed, this log did not get saved');
  for (var i = 0, l = this._logBuffer.length; i < l; i++) {
    this._logBuffer[i].callback(logError);
  }

  // Now emit error and close
  this.emit('error', new Error('socket closed unintentionally and reconnection failed'));
  this.emit('close', true);
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
    self.emit('close', false);
  });
};
