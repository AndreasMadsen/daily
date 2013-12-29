
var net = require('net');
var util = require('util');
var async = require('async');
var events = require('events');
var DailyStorage = require('daily-storage');
var DailyInterface = require('daily-interface');

function DailyServer(path, options) {
  events.EventEmitter.call(this);
  var self = this;

  this._sockets = [];

  this._handler = new DailyInterface.Server(new DailyStorage(path, options));
  this._handler.on('error', this.emit.bind(this, 'error'));

  this._server = net.createServer(function (socket) {
    self._dispatch(socket);
  });
  this._server.on('error', this.emit.bind(this, 'error'));
}
util.inherits(DailyServer, events.EventEmitter);
module.exports = DailyServer;

DailyServer.prototype._dispatch = function (socket) {
  var self = this;

  this._sockets.push(socket);
  this._handler.dispatch(socket);

  socket.once('close', function () {
    var index = self._sockets.indexOf(socket);
    if (index !== -1) {
      self._sockets.splice(index, 1);
    }
  });

  this.emit('connection', socket);
};

DailyServer.prototype.address = function () {
  return this._server.address();
};

DailyServer.prototype.listen = function () {
  var self = this;

  var port = 10200, address = '0.0.0.0', callback;
  var args = Array.prototype.slice.call(arguments, 0);

  // Extract arguments by type
  if ((args.length > 0 && typeof args[args.length - 1] === 'function') || args.length === 3) {
    callback = args.pop();
  }
  if ((args.length > 0 && typeof args[args.length - 1] === 'string') || args.length === 2) {
    address = args.pop();
  }
  if ((args.length > 0 && typeof args[args.length - 1] === 'number') || args.length === 1) {
    port = args.pop();
  }

  // Bind callbacks
  if (callback) this.once('listening', callback);

  // attach server
  this._server.listen(port, address, self.emit.bind(self, 'listening'));
};

function endSocket(socket, done) {
  socket.once('close', done);
  socket.end();
}

DailyServer.prototype.close = function (callback) {
  if (callback) this.once('close', callback);
  var self = this;

  async.parallel([
    // close sever, callback will not be called before all sockets are closed
    function (done) {
      self._server.close(done);
    },
    // close sockets one by one
    function (done) {
      // the sockets list will mutate to a copy is required
      async.forEach(self._sockets.slice(0), endSocket, done);
    }
  ], function () {
    // All sockets are closed, now close the handler
    self._handler.once('close', self.emit.bind(self, 'close'));
    self._handler.close();
  });
};
