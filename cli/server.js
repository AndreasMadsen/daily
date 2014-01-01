
var daily = require('../daily.js');

module.exports = function (argv) {
  var addr = argv.address.split(':');
  var ip = addr[0], port = parseInt(addr[1], 10);

  var server = new daily.Server(argv.database);
      server.listen(port, ip, function () {
        var addr = server.address();
        console.log('daily server ready on ' + addr.address + ':' + addr.port);
        console.log('data will be stored at ' + argv.database);
      });
};
