## ntp2

simple network time protocol implementation for node.js

![NPM version](https://img.shields.io/npm/v/ntp2.svg?style=flat)
[![Build Status](https://travis-ci.org/song940/node-ntp.svg?branch=master)](https://travis-ci.org/song940/node-ntp)

### Installation

```bash
$ npm i ntp2
```

### Example

```js
const ntp = require('ntp2');

ntp.time((err, response) => {
  console.log('The network time is :', response.time);
});
```

sntp server

```js
const ntp = require('ntp2');

const server = ntp.createServer((message, response) => {
  console.log('server message:', message);
  response(message);
}).listen(123, (err) => {
  console.log('server is running at %s', server.address().port);
});
```

### API

- ntp2.Server()
- ntp2.Client()
- ntp2.createServer()

### CLI

```
bin/ntp2cli.js ch.pool.ntp.org
{
  "leapIndicator": "no-warning",
  "version": 4,
  "mode": "server",
  "stratum": "primary",
  "pollInterval": 6,
  "precision": -107,
  "rootDelay": 0,
  "rootDispersion": 0.0010833740234375,
  "referenceIdentifier": "PPS",
  "referenceTimestamp": "2019-12-23T13:41:42.199Z",
  "originateTimestamp": "2019-12-23T13:41:49.082Z",
  "receiveTimestamp": "2019-12-23T13:41:49.156Z",
  "transmitTimestamp": "2019-12-23T13:41:49.156Z",
  "destinationTimestamp": "2019-12-23T13:41:49.172Z",
  "pollIntervalSecs": 64,
  "time": "2019-12-23T13:41:49.156Z",
  "roundTripDelay": 89.940185546875,
  "systemClockOffset": 29.5443115234375
}
```

### SPEC

- https://tools.ietf.org/html/rfc5905

### Contributing

- Fork this Repo first
- Clone your Repo
- Install dependencies by `$ npm install`
- Checkout a feature branch
- Feel free to add your features
- Make sure your features are fully tested
- Publish your local branch, Open a pull request
- Enjoy hacking <3

### MIT license

Copyright (c) 2016 Lsong &lt;song940@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the &quot;Software&quot;), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---
