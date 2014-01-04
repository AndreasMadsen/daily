
var daily = require('../daily.js');

module.exports = function (argv) {
  var addr = argv.address.split(':');
  var ip = addr[0], port = parseInt(addr[1], 10);

  var server = new daily.Server(argv.database);
      server.listen(port, ip, function () {
        var addr = server.address();
        console.log('daily server ready');
        console.log('  address  : ' + addr.address + ':' + addr.port);
        console.log('  pid      : ' + process.pid);
        console.log('  database : ' + argv.database);
      });

  process.on('SIGTERM', closeServer.bind(null, 'SIGTERM'));
  process.on('SIGINT', closeServer.bind(null, 'SIGINT'));

  function closeServer(signal) {
    console.log('got ' + signal + ' closeing daily server now');
    server.close(function () {
      console.log('daily server closed');
    });
  }
};
