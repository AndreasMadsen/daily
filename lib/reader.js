
var util = require('util');
var stream = require('stream');

function ClientReader(source) {
  stream.Readable.call(this, { objectMode: true, highWaterMark: 16 });
  var self = this;

  this._source = source;
  this._source.once('close', this.emit.bind('close'));
  this._source.once('end', this.push.bind(this, null));
  this._source.on('data', function (object) {
    var more = self.push({
      'time': object.seconds * 1000 + object.milliseconds,
      'level': object.level,
      'message': JSON.parse(object.message.toString())
    });

    if (!more) self._source.pause();
  });
}
util.inherits(ClientReader, stream.Readable);
module.exports = ClientReader;

ClientReader.prototype._read = function (object, encoding, done) {
  this._source.resume();
};
