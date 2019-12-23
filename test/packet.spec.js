const assert = require('assert')
const Packet = require('../packet.js')

describe('Packet', function () {
  it('shall throw if packet length is less than 48 bytes', function () {
    let err
    try {
      const buffer = Buffer.from(new Array(47).fill(0))
      Packet.parse(buffer)
    } catch (e) {
      err = e
    }
    assert.strictEqual(err.message, 'Invalid Package')
  })

  it('shall parse packet', function () {
    const buffer = Buffer.from('JAIGgQAAABsAAAC+gUaCR+GrGxCgwyLR4asbThO2RaLhqxtOKN9T+OGrG04o4m6Y', 'base64')
    const message = Packet.parse(buffer)
    assert.deepStrictEqual(message, new Packet({
      leapIndicator: 0,
      version: 4,
      mode: 4,
      stratum: 2,
      pollInterval: 6,
      precision: -127,
      rootDelay: 0.0004119873046875,
      rootDispersion: 0.002899169921875,
      referenceIdentifier: '81468247',
      receiveTimestamp: 1577098446159.6577,
      referenceTimestamp: 1577098384627.9775,
      originateTimestamp: 1577098446077,
      transmitTimestamp: 1577098446159.705,
      keyIdentifier: undefined,
      messageDigest: undefined
    }))
  })

  it('shall create package', function () {
    const packet = new Packet({
      leapIndicator: 1,
      stratum: 1,
      referenceIdentifier: 'Testing',
      transmitTimestamp: 1577142062020
    })

    const buffer = packet.toBuffer()
    assert.strictEqual(
      buffer.toString('base64'),
      'YwEGgQAAAAAAAAAAVGVzdIOqfoAAAAAAg6p+gAAAAACDqn6AAAAAAOGrxa4FHrhS'
    )

    const message = Packet.parse(buffer)
    assert.deepStrictEqual(message, new Packet({
      leapIndicator: 1,
      version: 4,
      mode: 3,
      stratum: 1,
      pollInterval: 6,
      precision: -127,
      rootDelay: 0,
      rootDispersion: 0,
      referenceIdentifier: 'Test',
      referenceTimestamp: 0,
      originateTimestamp: 0,
      receiveTimestamp: 0,
      transmitTimestamp: 1577142062020,
      keyIdentifier: undefined,
      messageDigest: undefined
    }))
  })

  it('toBuffer', function () {
    const packet = new Packet({
      leapIndicator: 1,
      mode: Packet.MODES.SERVER
    })

    const message = packet.toBuffer()
    assert.strictEqual(message[0] & 0x7, packet.mode)
    assert.strictEqual(message[0] >> 6, packet.leapIndicator)
    assert.strictEqual(((message[0] & 0x38) >> 3), packet.version)
  })

  it('toBuffer referenceIdentifier as hex value for stratum greater 1', function () {
    const packet = new Packet({
      stratum: 2,
      referenceIdentifier: 'ff88442200'
    })
    const message = packet.toBuffer()
    const result = message.slice(12, 16)
    assert.deepStrictEqual(result, Buffer.from([0xff, 0x88, 0x44, 0x22]))
  })

  it('toBuffer referenceIdentifier is not a Buffer', function () {
    const packet = new Packet({
      stratum: 2,
      referenceIdentifier: []
    })
    const message = packet.toBuffer()
    const result = message.slice(12, 16)
    assert.deepStrictEqual(result, Buffer.from([0, 0, 0, 0]))
  })

  it('toJSON', function () {
    const packet = new Packet()
    const result = packet.toJSON()

    const exp = {
      leapIndicator: 'no-warning',
      version: 4,
      mode: 'client',
      stratum: 'death',
      pollInterval: 6,
      precision: -127,
      rootDelay: 0,
      rootDispersion: 0,
      referenceIdentifier: Buffer.from([0, 0, 0, 0]),
      referenceTimestamp: new Date('1970-01-01T00:00:00.000Z'),
      originateTimestamp: new Date('1970-01-01T00:00:00.000Z'),
      receiveTimestamp: new Date('1970-01-01T00:00:00.000Z'),
      transmitTimestamp: new Date('1970-01-01T00:00:00.000Z')
      // destinationTimestamp: new Date('Invalid Date')
    }

    Object.entries(exp).forEach(([key, val]) => {
      if (typeof val === 'object') {
        assert.deepStrictEqual(result[key], val)
      } else {
        assert.strictEqual(result[key], val)
      }
    })
  })

  ;[
    'reserved',
    'symmetric-active',
    'symmetric-passive',
    'client',
    'server',
    'broadcast',
    'reserved',
    'reserved'
  ].forEach((exp, mode) => {
    it(`toJSON mode ${mode} === ${exp}`, function () {
      const packet = new Packet({ mode }).toJSON()
      assert.strictEqual(packet.mode, exp)
    })
  })

  ;[
    [0, 'death'],
    [1, 'primary'],
    [2, 'secondary'],
    [15, 'secondary'],
    [16, 'reserved']
  ].forEach(([stratum, exp]) => {
    it(`toJSON stratum ${stratum} === ${exp}`, function () {
      const packet = new Packet({ stratum }).toJSON()
      assert.strictEqual(packet.stratum, exp)
    })
  })
})
