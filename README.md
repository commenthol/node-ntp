# ntp2

Simple network time protocol implementation for node.js

<!--

![NPM version](https://img.shields.io/npm/v/ntp2.svg?style=flat)
[![Build Status](https://travis-ci.org/song940/node-ntp.svg?branch=master)](https://travis-ci.org/song940/node-ntp)

-->

This is an improved fork from [ntp2](https://github.com/song940/node-ntp).

## Installation

This package is not (yet) on npm, so install with...

```bash
$ npm i https://github.com/commenthol/node-ntp.git#semver:^1.0.0
```

## Example

**Client**

```js
const ntp = require('ntp2');

ntp.time((err, response) => {
  console.log('The network time is :', response.time);
});
```

**SNTP Server**

```js
const ntp = require('ntp2');

const server = ntp.createServer((message, response) => {
  console.log('server message:', message);
  response(message);
}).listen(123, (err) => {
  console.log('server is running at %s', server.address().port);
});
```

## API

- ntp2.Server()
- ntp2.Client()
- ntp2.createServer()

## CLI

> May require global install with:  
> `npm i -g https://github.com/commenthol/node-ntp.git#semver:^1.0.0`

**Usage**

```bash
$ ntp2cli --help

    ntp2cli [options] pool.ntp.org:123

    -h,--help     show this help
    -v,--version  show version information
```    

**Example**

```bash
$ ntp2cli ch.pool.ntp.org
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

## Spec

- https://tools.ietf.org/html/rfc5905

## Contributing

- Fork this Repo first
- Clone your Repo
- Install dependencies by `$ npm install`
- Checkout a feature branch
- Feel free to add your features
- Make sure your features are fully tested
- Publish your local branch, Open a pull request
- Enjoy hacking <3

## License

MIT
