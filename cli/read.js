
var util = require('util');
var stream = require('stream');
var color = require('cli-color');
var perceive = require('perceive');

var daily = require('../daily.js');

function toTime(input) {
  if (input === null) return null;
  else return parseInt(input, 10) * 1000;
}

module.exports = function (argv) {
  var addr = argv.address.split(':');
  var ip = addr[0], port = parseInt(addr[1], 10);

  var start = toTime(argv.start), end = toTime(argv.end);
  var levels = argv.levels.split(',').map(Number);
  var past = parseInt(argv.past, 10);

  // If both start and end isn't set then use past
  if (start === null && end === null) {
    start = (Math.floor(Date.now() / 1000) - past) * 1000;
  }

  var client = new daily.Client(port, ip);
  var reader = client.reader(start, end, levels);

  var output = reader.pipe( new FormatStream(process.stdout.isTTY || argv.colors) );
      output.pipe( process.stdout );

  // When pipeing to less and quitting, the pipe is broken and process.stdout
  // will emit an error. Note this will usually happen before SIGPIPE is emitted.
  // So the only way to detect this is to listen for an EPIPE error.
  reader.once('close', closeClient);
  process.once('SIGPIPE', closeClient);
  process.stdout.on('error', function (err) {
    if (err.errno === 'EPIPE') return closeClient();
    throw err;
  });

  var closeing = false;
  function closeClient() {
    if (closeing) return;
    closeing = true;

    output.unpipe(process.stdout);
    client.close();
  }
};

function FormatStream(colors) {
  stream.Transform.call(this, { objectMode: true });
  this.colors = colors;
}
util.inherits(FormatStream, stream.Transform);

function ms2str(ms) {
  return (new Date(ms)).toJSON().replace(/[A-Z]/, ' ').slice(0, -1);
}

FormatStream.prototype._transform = function (log, encoding, done) {
  var level, time, message;

  if (this.colors) {
    level = color.white(log.level);
    time = color.white(ms2str(log.time));
    message = perceive(log.message, { colors: true });
  } else {
    level = log.level;
    time = ms2str(log.time);
    message = perceive(log.message, { colors: false });
  }

  this.push(time + '   ' + level + '\n' + message + '\n');
  done(null);
};
