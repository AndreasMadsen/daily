
var fs = require('fs');
var test = require('tap').test;
var path = require('path');
var wrench = require('wrench');
var DailyServer = require('../daily.js').Server;

var DB_PATH = path.resolve(__dirname, 'temp.db');

function ServerSetup() {
  if (!(this instanceof ServerSetup)) return new ServerSetup();

  if (fs.existsSync(DB_PATH)) wrench.rmdirSyncRecursive(DB_PATH);
  this.server = null;
  this.port = 0;
}
module.exports = ServerSetup;

ServerSetup.prototype.DB_PATH = DB_PATH;

ServerSetup.prototype.open = function (port) {
  var self = this;

  test('open daily server', function (t) {
    self.server = new DailyServer(DB_PATH);
    self.server.listen(port || 0, '127.0.0.1', function () {
      self.port = self.server.address().port;
      t.end();
    });
  });
};

ServerSetup.prototype.close = function () {
  var self = this;

  test('close daily server', function (t) {
    self.server.close(t.end.bind(t));
  });
};
