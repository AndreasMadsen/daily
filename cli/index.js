#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var optimist = require('optimist');

var HELP_TEXT = fs.readFileSync(path.resolve(__dirname, './help.txt'), 'utf8');

//
// Parse options
//
var argv = optimist
  .options('s', {
    alias : 'start',
    default : null
  })
  .options('e', {
    alias : 'end',
    default : null
  })
  .options('l', {
    alias : 'levels',
    default : '1,9'
  })
  .options('p', {
    alias : 'past',
    default : 3600
  })
  .options('a', {
    alias : 'address',
    default : 'auto:10200'
  })
  .options('d', {
    alias : 'database',
    default : path.resolve('./daily.db')
  })
  .argv;

// Handle address default, depending on type
if (argv.address.slice(0, 5) === 'auto:') {
  argv.address = argv.a = (argv._[0] === 'server' ? '0.0.0.0' : '127.0.0.1') + argv.address.slice(4);
}

//
// Perform simple options checks
//
var checks = {
  'start': function (val) {
    if (val !== null && (Number(val) !== val || isNaN(Number(val)) === true)) {
      return '--start is not a integer';
    }
    return true;
  },
  'end': function (val) {
    if (val !== null && (Number(val) !== val || isNaN(Number(val)) === true)) {
      return '--end is not a integer';
    }
    return true;
  },
  'levels': function (val) {
    var parse = val.match(/^([1-9]),([1-9])$/);
    if (parse === null) return '--levels is not corretly formated';
    if (Number(parse[1]) > Number(parse[2])) '--levels the order wrong';
    return true;
  },
  'past': function (val) {
    if (Number(val) !== val || isNaN(Number(val)) === true) {
      return '--past must be an integer';
    }
    return true;
  },
  'address': function (val) {
    var parse = val.match(/^([^:]+):([0-9]+)$/);
    if (parse === null) return '--address is not corretly formated';
    if (Number(parse[2]) < 0) return '--address port number is invalid';
    return true;
  },
  'database': function (val) {
    if (fs.existsSync(path.dirname(val)) === false) {
      return '--database the directory ' + path.dirname(val) + ' do not exists';
    }
    return true;
  }
};

var badOption = false;

Object.keys(checks).forEach(function (argname) {
  var status = checks[argname](argv[argname]);
  if (status !== true) {
    console.log(status);
    badOption = true;
  }
});

if (badOption) process.exit(1);

//
// All the simple checks are done, route the command and do some work
//
switch (argv._[0]) {
  case 'read':
    require('./read.js')(argv);
    break;

  case 'server':
    require('./server.js')(argv);
    break;

  case undefined:
  case 'help':
    console.log(HELP_TEXT);
    break;

  // Bad command show help and exit with status code 1
  default:
    console.log(HELP_TEXT);
    process.exit(1);
    break;
}
