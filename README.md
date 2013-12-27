#daily

> daily - A LevelDB based logging system

## Installation

```sheel
npm install daily
```

## Example

**1. start a server**

Start a server, with default settings
(port: 10200, address: 0.0.0.0, location: ./daily.db)

```
$ daily server
```

**2. create a client and log**

```javascript
var Client = require('daily').Client;

// `new` can be obmitted
var logger = new Client();

// Default logging range is 1 to 5, where log level one will live the longest
// so this should be for the most critical errors.
logger.log(5, {
  'user-id': 20,
  'action': 'did something worth logging'
});

logger.close();
```

**3. read the logs**

Read 1 hour (3600 seconds) intro the past.

```
$ daily read --past=3600
```

## Documentation

### CLI tool

```
daily command [options]

 help    prints this message

 read    connects to server and read some log entries          : defaults
         -s --start=timestamp   read starts at this time       : 0
         -e --end=timestamp     read stops at this time        : now
         -l --levels=start,end  range of log levels to read    : 1,9
         -p --past=seconds      special case, read some        : 3600
                                seconds intro the past When no
                                options is set, -b is used.
         -a --address=ip:port   client will connect to         : 127.0.0.1:10200

 server  start a daily server                                  : defaults
         -d --database=path     filepath to the log database   : ./daily.db
         -a --address=ip:port   server will listen to          : 0.0.0.0:10200
```

### logger = new Client([port=10200], [address='127.0.0.1'], [callback])

Creates a client instance, the `new` keyword can be opmitted.

```javascript
var daily = require('daily');
var client = new daily.Client();
```

The Clint connects to the daily server on the given `port` and `address` using
one TCP socket or more. When the first connection is made the `connect` event
will emit and the `callback` will be called.

Please note that you don't need to to wait for the `connect` event, in order to
log or start a reader. The request will simply be delayed.

#### logger.log(level, subject, [ when=Date.now() ], [ callback ])

#### logger.reader([ start=0 ], [ end=Date.now() ], [ levels=[1,9] ])

#### logger.close([callback])

#### logger.on('connect')

#### logger.on('close')

#### logger.on('error')

### server = new Server(where, [options])

Creates a new server instance, the `new` keyword can be opmitted.

#### server.listen([port=10200], [address='0.0.0.0'], [callback])

Attach the server to a given port and address when the server is ready, the
`listening` event will be emitted and the `callback` called.

#### server.address()

Returns the standard TCP address object for the underlying server.

#### server.close([callback])

Close the server and all the connections currently active.

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
