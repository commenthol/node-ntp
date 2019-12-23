'use strict'

const udp = require('dgram')
const EventEmitter = require('events')
const Packet = require('./packet.js')
const utils = require('./utils.js')

const DEFAULT = {
  port: 123,
  stratum: 1,
  referenceIdentifier: 'NODE'
}

class NtpServer extends EventEmitter {
  /**
   * @param {object} [options]
   * @param {number} [options.port=123]
   * @param {number} [options.stratum=0]
   * @param {string|Buffer} [options.referenceIdentifier='NODE']
   */
  constructor (options, onRequest) {
    super()

    if (typeof options === 'function') {
      onRequest = options
      options = {}
    }

    Object.assign(this, DEFAULT, options)

    this.precision = utils.precision()
    this.socket = udp.createSocket('udp4')
    this.socket.on('message', this.parse.bind(this))

    this.on('request', onRequest || function (data, cb) { cb(data) })
    return this
  }

  listen (port, address, callback) {
    if (typeof address === 'function') {
      callback = address
      address = undefined
    }
    this.socket.bind(port || this.port, address, callback)
    return this
  }

  close (callback) {
    this.socket.close(callback)
    return this
  }

  address () {
    return this.socket.address()
  }

  send (rinfo, message, callback) {
    if (message instanceof Packet) {
      message.mode = Packet.MODES.SERVER // mark mode as server
      message.transmitTimestamp = Date.now()
      message = message.toBuffer()
    }
    this.socket.send(message, rinfo.port, rinfo.server, callback)
    return this
  }

  /**
   * parses ntp packet `message` and emits `request` event
   * @param {Buffer} message - NTP packet
   * @param {object} rinfo
   * @param {string} rinfo.server
   * @param {number} rinfo.port
   * @return self
   */
  parse (message, rinfo) {
    const receiveTimestamp = Date.now()
    const packet = Packet.parse(message)
    ;['stratum', 'precision', 'referenceIdentifier'].forEach(key => {
      packet[key] = this[key]
    })
    packet.originateTimestamp = packet.transmitTimestamp
    packet.receiveTimestamp = receiveTimestamp
    this.emit('request', packet, this.send.bind(this, rinfo))
    return this
  }
}

module.exports = NtpServer
