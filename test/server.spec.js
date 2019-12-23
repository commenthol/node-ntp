const assert = require('assert')
const Ntp = require('..')

describe('Server', function () {
  const port = 1123
  const server = 'localhost'
  let ntpServer

  before(function (done) {
    ntpServer = Ntp.createServer().listen(port, undefined, done)
  })
  after(function (done) {
    ntpServer.close(done)
  })

  it('shall get socket address', function () {
    const address = ntpServer.address()
    assert.deepStrictEqual(address, { address: '0.0.0.0', family: 'IPv4', port: 1123 })
  })

  it('shall request network time from server', function (done) {
    Ntp.Client({ server, port }, (err, response) => {
      assert.ok(!err, err && err.message)
      assert.strictEqual(response.mode, 4)
      assert.strictEqual(response.stratum, 1)
      assert.strictEqual(response.referenceIdentifier, 'NODE')
      assert.ok(response.roundTripDelay < 10)
      assert.ok(response.systemClockOffset < 10)
      assert.ok(response.time instanceof Date)
      done()
    })
  })
})

describe('Server with stratum 2', function () {
  const port = 1123
  const server = 'localhost'
  let ntpServer

  before(function (done) {
    ntpServer = Ntp.createServer({
      stratum: 2,
      referenceIdentifier: Buffer.from('10.11.12.13'.split(/\./))
    }).listen(port, undefined, done)
  })
  after(function (done) {
    ntpServer.close(done)
  })

  it('shall request network time from server', function (done) {
    Ntp.Client({ server, port }, (err, response) => {
      assert.ok(!err, err && err.message)
      assert.strictEqual(response.mode, 4)
      assert.strictEqual(response.stratum, 2)
      assert.strictEqual(response.referenceIdentifier, '0a0b0c0d')
      done()
    })
  })
})
