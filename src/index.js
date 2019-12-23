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
  const socket = udp.createSocket('udp4')
  socket.connect(port, server, (err) => {
    if (err) {
      callback(err)
      return
    }
    socket.send(packet, 0, packet.length, err => {
      if (err) {
        callback(err)
        return
      }
      socket.once('message', data => {
        socket.close()
        try {
          const message = Ntp.parse(data) // may throw
          callback(err, message)
        } catch (e) {
          callback(e)
        }
      })
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
