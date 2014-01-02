
var path = require('path');
var execspawn = require('execspawn');

module.exports = function exec(cmd, options) {
  if (options === undefined) options = {};
  if (!('cwd' in options)) options.cwd = __dirname;

  cmd = cmd
    .replace('{node}', process.execPath)
    .replace('{daily}', path.resolve(__dirname, '../cli/index.js'));

  return execspawn(cmd, options);
};
