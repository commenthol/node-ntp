const assert = require('assert')
const Ntp = require('..')

describe('Client', function () {
  it('shall request network time from pool.ntp.org', function (done) {
    Ntp.Client((err, response) => {
      // console.log(response)
      assert.ok(!err, err && err.message)
      assert.strictEqual(response.mode, 4)
      assert.strictEqual(typeof response.roundTripDelay, 'number')
      assert.strictEqual(typeof response.systemClockOffset, 'number')
      assert.ok(response.time instanceof Date)
      done()
    })
  })
})
