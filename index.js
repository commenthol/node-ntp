'use strict'

const udp = require('dgram')
const util = require('util')
const Packet = require('./packet')
const EventEmitter = require('events')

/**
 * [NtpClient description]
 * @docs https://tools.ietf.org/html/rfc2030
 */
function Ntp (options, callback) {
  if (!(this instanceof Ntp)) {
    return new Ntp(options, callback)
  }

  EventEmitter.call(this)

  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  Object.assign(this, {
    server: 'pool.ntp.org',
    port: 123
  }, options)

  this.socket = udp.createSocket('udp4')
  if (typeof callback === 'function') {
    this.time(callback)
  }
  return this
}

util.inherits(Ntp, EventEmitter)

/**
 * [time description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Ntp.prototype.time = function (callback) {
  const { server, port } = this
  const packet = Ntp.createPacket()
  this.socket.send(packet, 0, packet.length, port, server, err => {
    if (err) return callback(err)
    this.socket.once('message', data => {
      this.socket.close()
      const message = Ntp.parse(data)
      callback(err, message)
    })
  })
  return this
}

/**
 * [createPacket description]
 * @return {[type]} [description]
 */
Ntp.createPacket = function () {
  const packet = new Packet()
  packet.mode = Packet.MODES.CLIENT
  packet.transmitTimestamp = Date.now()
  return packet.toBuffer()
}

/**
 * [parse description]
 * @param  {Function} callback [description]
 * @param  {[type]}   msg      [description]
 * @return {[type]}            [description]
 */
Ntp.parse = function (buffer) {
  const message = Packet.parse(buffer).withDestinationTime()
  return message
}

Ntp.Client = Ntp
Ntp.Server = require('./server')

/**
 * [createServer description]
 * @return {[type]} [description]
 */
Ntp.createServer = function (options) {
  return new Ntp.Server(options)
}

module.exports = Ntp
