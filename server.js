'use strict'

const udp = require('dgram')
const EventEmitter = require('events')
const Packet = require('./packet')

const DEFAULT = {
  port: 123,
  stratum: 0,
  referenceIdentifier: 'NODE'
}

class NtpServer extends EventEmitter {
  constructor (options, onRequest) {
    super()

    if (typeof options === 'function') {
      onRequest = options
      options = {}
    }

    Object.assign(this, DEFAULT, options)

    this.socket = udp.createSocket('udp4')
    this.socket.on('message', this.parse.bind(this))

    this.on('request', onRequest || function (data, cb) { cb(data) })
    return this
  }

  listen (port, address, callback) {
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

  parse (message, rinfo) {
    const receiveTimestamp = Date.now()
    const packet = Packet.parse(message)
    packet.stratum = this.stratum
    packet.referenceIdentifier = this.referenceIdentifier
    packet.originateTimestamp = packet.transmitTimestamp
    packet.receiveTimestamp = receiveTimestamp
    this.emit('request', packet, this.send.bind(this, rinfo))
    return this
  }
}

module.exports = NtpServer
