const assert = require('assert')
const utils = require('../src/utils.js')

describe('utils', function () {
  describe('byteToInt', function () {
    ;[
      [0x00, 0],
      [0x10, 16],
      [0x88, -8],
      [0xf0, -112]
    ].forEach(([byte, exp]) => {
      it(`byteToInt ${byte} => ${exp}`, function () {
        const result = utils.byteToInt(byte)
        assert.strictEqual(result, exp)
      })
    })
  })

  describe('intToByte', function () {
    ;[
      [0, 0x00],
      [128, 0x00],
      [16, 0x10],
      [-8, 0x88],
      [-112, 0xf0],
      [-127, 0xff]
    ].forEach(([int, exp]) => {
      it(`intToByte ${int} => ${exp}`, function () {
        const result = utils.intToByte(int)
        assert.strictEqual(result, exp)
      })
    })
  })

  describe('secsToNtpShort', function () {
    ;[
      [0, Buffer.from([0, 0, 0, 0])],
      [65535, Buffer.from([255, 255, 0, 0])],
      [65536, Buffer.from([0, 0, 0, 0])],
      [65535.99999, Buffer.from([255, 255, 255, 255])],
      [0.99999, Buffer.from([0, 0, 255, 255])],
      [11111.11111, Buffer.from([43, 103, 28, 114])]
    ].forEach(([val, exp]) => {
      it(`secsToNtpShort ${val}`, function () {
        const result = utils.secsToNtpShort(val)
        assert.deepStrictEqual(result, exp)
      })
    })
  })

  describe('ntpShortToSecs', function () {
    ;[
      [0, Buffer.from([0, 0, 0, 0])],
      [65535, Buffer.from([255, 255, 0, 0])],
      [65535.99998474121, Buffer.from([255, 255, 255, 255])],
      [0.9999847412109375, Buffer.from([0, 0, 255, 255])],
      [11111.111114501953, Buffer.from([43, 103, 28, 114])]
    ].forEach(([exp, buf]) => {
      it(`ntpShortToSecs ${exp}`, function () {
        const result = utils.ntpShortToSecs(buf)
        assert.deepStrictEqual(result, exp)
      })
    })
  })

  describe('secsToNtpTimestamp', function () {
    ;[
      [new Date('1900-01-01T00:00:00.000Z').getTime(), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])],
      [new Date('2000-01-01T00:00:00.999Z').getTime(), Buffer.from([188, 23, 194, 0, 255, 190, 118, 201])],
      [new Date('2036-02-07T06:28:15.999Z').getTime(), Buffer.from([255, 255, 255, 255, 255, 190, 118, 201])],
      [new Date('2036-02-07T06:28:16.000Z').getTime(), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])],
      [new Date('2036-02-07T06:28:17.000Z').getTime(), Buffer.from([0, 0, 0, 1, 0, 0, 0, 0])],
      [new Date('2172-03-15T12:56:32.000Z').getTime(), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])]
    ].forEach(([val, exp]) => {
      it(`secsToNtpTimestamp ${new Date(val).toISOString()}`, function () {
        const result = utils.secsToNtpTimestamp(val)
        assert.deepStrictEqual(result, exp)
      })
    })
  })

  describe('ntpTimestampToSecs', function () {
    ;[
      [new Date('1900-01-01T00:00:00.000Z').getTime(), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])],
      [new Date('2000-01-01T00:00:00.999Z').getTime(), Buffer.from([188, 23, 194, 0, 255, 190, 118, 201])],
      [new Date('2036-02-07T06:28:15.999Z').getTime(), Buffer.from([255, 255, 255, 255, 255, 190, 118, 201])],
      [new Date('2036-02-07T06:28:15.999Z').getTime(), Buffer.from([255, 255, 255, 255, 255, 190, 118, 201]), 1],
      [new Date('2036-02-07T06:28:16.000Z').getTime(), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])],
      [new Date('2036-02-07T06:28:17.000Z').getTime(), Buffer.from([0, 0, 0, 1, 0, 0, 0, 0]), -5],
      [new Date('2172-03-15T12:56:32.000Z').getTime(), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])]
    ].forEach(([exp, buf, add = 0]) => {
      it(`ntpTimestampToSecs ${new Date(exp).toISOString()}`, function () {
        const result = utils.ntpTimestampToSecs(buf, undefined, exp + add)
        // console.log(new Date(result), new Date(exp), result == exp)
        assert.deepStrictEqual(result, exp)
      })
    })
  })
})
