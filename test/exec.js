
var path = require('path');
var spawn = require('child_process').spawn;

module.exports = function exec(cmd, options) {
  if (options === undefined) options = {};
  if (!('cwd' in options)) options.cwd = __dirname;


  cmd = cmd.replace('{daily}', path.resolve(__dirname, '../cli/index.js'));

  return spawn(process.execPath, cmd.slice(7).split(' '), options);
};
