#daily

> daily - A LevelDB based logging system

## Installation

```sheel
npm install daily
```

## Work In Progress

The submodules have been developed and tested, only cli tool and tests for
the high level interface is missing.

## Example

**1. start a server**

Start a server, with default settings
(port: 10200, address: 0.0.0.0, location: ./daily.db)

```
$ daily server
```

**2. create a client and log**

```javascript
var daily = require('daily');

// Open a connection to the daily server
var client = new daily.Client();

// By default the log-levels range from 1 to 5, where log level 1 will live
// the longest so this should be used for the most critical errors.
client.log(4, { userId: 105, action: 'user changed email' });

// Close the connection
client.close();
```

**3. read the logs**

Read logs over the last one hour (3600 seconds), you can read more with `--past seconds`.

```
$ daily read
```

## Documentation

### CLI tool

```
daily command [options]

 help    prints this message

 read    connects to server and read some log entries          : defaults
         -s --start timestamp   read starts at this time       : 0
         -e --end timestamp     read stops at this time        : now
         -l --levels start,end  range of log levels to read    : 1,9
         -p --past seconds      special case, read some        : 3600
                                seconds intro the past When no
                                options is set, -b is used.
         -c --colors            colors will always be used     : true
         -a --address ip:port   client will connect to         : 127.0.0.1:10200

 server  start a daily server                                  : defaults
         -d --database path     filepath to the log database   : ./daily.db
         -a --address ip:port   server will listen to          : 0.0.0.0:10200
```

### client = new Client([port=10200], [address='127.0.0.1'], [callback])

Creates a client instance, the `new` keyword can be opmitted.

```javascript
var daily = require('daily');
var client = new daily.Client();
```

The client connects to the daily server on the given `port` and `address` using
one TCP socket or more. When the first connection is made the `connect` event
will emit and the `callback` will be called.

Please note that you don't need to to wait for the `connect` event, in order to
log or start a reader. The request will simply be delayed.

#### client.log(level, subject, [ when=Date.now() ], [ callback ])

Logs a object with `JSON.stringify(subject)` along with the log-level. By default
the log-level range from 1 to 5 where 1 is the most citical log.

Here is a simple example, when no `callback` any error will be emitted as an
`error` event on the `client` object. You can also specific the time of the
log manually, but its strongly recommended that you don't do that, as it will
likely be confusing later.

```javascript
client.log(4, { userId: 105, action: 'user changed email' });
```

#### client.reader([ start=null ], [ end=null ], [ levels=[1,9] ])

Read logs from `start` to `end`. Both `start` and `end` should be a timestamp
in milliseconds (like `Date.now()`). However they can also be `null`, this means
that will be no limit in the related direction.

* if `start` is `null` then logs from the begining of time will be send
* if `end` is `null` then logs to end of time will be send

The `levels` is an array of two values, there specifies range of levels there
will be send. Meaning only items there matches `levels[0] <= level <= levels[1]`
will be send from the daily server.

```javascript
var inspectpoint = require('inspectpoint');

// Read logs from the past hour there was logged with level 1, 2, 3 or 4
var reader = client.reader(Date.now() - 3600 * 1000, [1,4])
  .pipe(inspectpoint({ colors: true })) // runs util.inspect on each data object
  .pipe(process.stdout);
```

Please note that the `reader` object can emit an `error` event and supports the
`close` event.

#### client.close([callback])

This will close the client. Under the hood this means both the TCP socket there
logs data and the TCP sockets there reads data will be closed. However as
writeing logs is quite important the TCP socket there logs won't be closed
before all the logs are done. However it will prevent future `client.log()`
calles by throwing.

In effect this means that you can call `client.close()` right after `client.log()`
without worrying.

```javascript
client.close(function () {
  console.log('Client is closed, no more data can be writen or read');
});
```

#### client.on('connect')

The client as made a connection.

#### client.on('close')

The client is completly closed.

#### client.on('error')

An error occurred, this can either be related to a TCP connection or a
`client.log()` call there did not have a `callback`.

### server = new Server(where, [options])

Creates a new server instance, the `new` keyword can be opmitted.

```javascript
var path = require('path');
var daily = require('daily');

var server = daily.Server(path.resolve(__dirname, '../log.db'));
```

#### server.listen([port=10200], [address='0.0.0.0'], [callback])

Attach the server to a given port and address when the server is ready, the
`listening` event will be emitted and the `callback` called. If you want a
random port, use `0` as port argument.

```javascript
server.listen(0, '127.0.0.1', function () {
  var addr = server.address();
  console.log('daily server ready on ' + addr.address + ':' + addr.port);
});
```

#### server.address()

Returns the standard TCP address object for the underlying server. For default
settings the result will be:

```javascript
{
  'address', '0.0.0.0',
  'family', 'IPv4',
  'port': 10200
}
```

#### server.close([callback])

Close the server and all the connections currently active.

This is an example on a very simple error handling.

```javascript
server.once('error', function () {
  // Do a nice shutdown
  server.close(function () {
    process.exit(1);
  });

  // Give `server.close()` 2 sec to close otherwise its possible something is
  // very wrong and forceing a shutdown is the remaining option.
  setTimeout(function () {
    process.exit(1);
  }, 2000);
});
```

#### server.on('connection')

This is purely for debugging purposes, you should never need to handle the
TCP sockets your self. The server will do that internally.

#### server.on('listening')

Emits when the server is listening, to know on what port and address use
`server.address()`.

#### server.on('close')

Emits when the server is closed.

#### server.on('error')

Emits when an error ocure, normally the server won't close because of this. But
it is recomended that you call `server.close()`.

## Low-level modules

Behind this module is a couple of low-level modules that you might need if you
which create you own daily module.

* [daily-interface](https://github.com/AndreasMadsen/daily-interface) - The transport independent interface
* [daily-protocol](https://github.com/AndreasMadsen/daily-protocol) - The protocol encoder and decoder for network communcation
* [daily-storage](https://github.com/AndreasMadsen/daily-storage) - The LevelDB storage abstaction

##License

**The software is license under "MIT"**

> Copyright (c) 2013 Andreas Madsen
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
