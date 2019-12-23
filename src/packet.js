const utils = require('./utils.js')

/** converts Reference Identifier based on stratum */
const toRefIdentifier = (buf, stratum) => {
  if (stratum <= 1) {
    return buf.reduce((id, val) => {
      if (val) id += String.fromCharCode(val)
      return id
    }, '')
  } else {
    // first four octets of the MD5 hash of the IPv6 address
    // or four-octet IPv4 address
    return buf.toString('hex')
  }
}

const optionalBuffer = (buf) => (buf && buf.length) ? buf : undefined

/*
  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |LI | VN  |Mode |    Stratum    |     Poll      |   Precision   |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                          Root Delay                           |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                       Root Dispersion                         |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                     Reference Identifier                      |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                                                               |
 |                   Reference Timestamp (64)                    |
 |                                                               |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                                                               |
 |                   Originate Timestamp (64)                    |
 |                                                               |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                                                               |
 |                    Receive Timestamp (64)                     |
 |                                                               |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                                                               |
 |                    Transmit Timestamp (64)                    |
 |                                                               |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                 Key Identifier (optional) (32)                |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                                                               |
 |                                                               |
 |                 Message Digest (optional) (128)               |
 |                                                               |
 |                                                               |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
*/
/**
 * @rfc https://tools.ietf.org/html/rfc4330
 */
class Packet {
  constructor (packet) {
    Object.assign(this, {
      leapIndicator: 0,
      version: 4,
      mode: 3,
      stratum: 0,
      pollInterval: 6,
      precision: -127,
      rootDelay: 0,
      rootDispersion: 0,
      referenceIdentifier: Buffer.from([0, 0, 0, 0]),
      referenceTimestamp: 0,
      originateTimestamp: 0,
      receiveTimestamp: 0,
      transmitTimestamp: 0
    }, packet)
  }

  static parse (buffer) {
    if (buffer.length < 48) throw new Error('Invalid Package')

    const packet = new Packet()
    packet.leapIndicator = (buffer[0] >> 6)
    packet.version = (buffer[0] & 0x38) >> 3
    packet.mode = (buffer[0] & 0x7)
    packet.stratum = buffer[1]
    packet.pollInterval = buffer[2]
    packet.precision = utils.byteToInt(buffer[3])
    packet.rootDelay = utils.ntpShortToSecs(buffer, 4)
    packet.rootDispersion = utils.ntpShortToSecs(buffer, 8)
    packet.referenceIdentifier = toRefIdentifier(buffer.slice(12, 16), packet.stratum)
    packet.referenceTimestamp = utils.ntpTimestampToSecs(buffer, 16)
    packet.originateTimestamp = utils.ntpTimestampToSecs(buffer, 24)
    packet.receiveTimestamp = utils.ntpTimestampToSecs(buffer, 32)
    packet.transmitTimestamp = utils.ntpTimestampToSecs(buffer, 40)
    // optional
    packet.keyIdentifier = optionalBuffer(buffer.slice(48, 52))
    packet.messageDigest = optionalBuffer(buffer.slice(52, 68))

    return new Packet(packet)
  }

  withDestinationTime () {
    this.destinationTimestamp = Date.now()
    this.pollIntervalSecs = Math.pow(2, this.pollInterval)
    this.time = new Date(this.transmitTimestamp)

    // Timestamp Name          ID   When Generated
    // ------------------------------------------------------------
    // Originate Timestamp     T1   time request sent by client
    // Receive Timestamp       T2   time request received by server
    // Transmit Timestamp      T3   time reply sent by server
    // Destination Timestamp   T4   time reply received by client
    const T1 = this.originateTimestamp
    const T2 = this.receiveTimestamp
    const T3 = this.transmitTimestamp
    const T4 = this.destinationTimestamp

    // The roundtrip delay d and system clock offset t are defined as:
    // roundTripDelay = d = (T4 - T1) - (T3 - T2)
    // systemClockOffset = t = ((T2 - T1) + (T3 - T4)) / 2
    this.roundTripDelay = (T4 - T1) - (T3 - T2)
    this.systemClockOffset = ((T2 - T1) + (T3 - T4)) / 2
    return this
  }

  toBuffer () {
    const referenceIdentifier = (typeof this.referenceIdentifier === 'string')
      ? Buffer.from(this.referenceIdentifier, this.stratum >= 2 && 'hex')
      : (this.referenceIdentifier instanceof Buffer)
        ? this.referenceIdentifier
        : Buffer.from([0, 0, 0, 0])

    const buffer = Buffer.alloc(48).fill(0x00)
    buffer[0] = 0 // 0b11100011; // LI, Version, Mode
    buffer[0] += this.leapIndicator << 6
    buffer[0] += this.version << 3
    buffer[0] += this.mode << 0
    buffer[1] = this.stratum
    buffer[2] = this.pollInterval
    buffer[3] = utils.intToByte(this.precision)
    utils.secsToNtpShort(this.rootDelay, buffer, 4)
    utils.secsToNtpShort(this.rootDispersion, buffer, 8)
    referenceIdentifier.copy(buffer, 12, 0, 4)
    utils.secsToNtpTimestamp(this.referenceTimestamp, buffer, 16)
    utils.secsToNtpTimestamp(this.originateTimestamp, buffer, 24)
    utils.secsToNtpTimestamp(this.receiveTimestamp, buffer, 32)
    utils.secsToNtpTimestamp(this.transmitTimestamp, buffer, 40)
    return buffer
  }

  toJSON () {
    const output = Object.assign({}, this)
    const { leapIndicator, mode, stratum } = this

    output.leapIndicator = {
      0: 'no-warning',
      1: 'last-minute-61',
      2: 'last-minute-59',
      3: 'alarm'
    }[leapIndicator]

    switch (mode) {
      case 1: output.mode = 'symmetric-active'; break
      case 2: output.mode = 'symmetric-passive'; break
      case 3: output.mode = 'client'; break
      case 4: output.mode = 'server'; break
      case 5: output.mode = 'broadcast'; break
      case 0:
      case 6:
      case 7: output.mode = 'reserved'; break
    }

    if (stratum === 0) {
      output.stratum = 'death'
    } else if (stratum === 1) {
      output.stratum = 'primary'
    } else if (stratum <= 15) {
      output.stratum = 'secondary'
    } else {
      output.stratum = 'reserved'
    }

    output.referenceTimestamp = new Date(this.referenceTimestamp)
    output.originateTimestamp = new Date(this.originateTimestamp)
    output.receiveTimestamp = new Date(this.receiveTimestamp)
    output.transmitTimestamp = new Date(this.transmitTimestamp)
    output.destinationTimestamp = new Date(this.destinationTimestamp)

    return output
  }
}

// Mode     Meaning
// ------------------------------------
// 0        reserved
// 1        symmetric active
// 2        symmetric passive
// 3        client
// 4        server
// 5        broadcast
// 6        reserved for NTP control message
// 7        reserved for private use
Packet.MODES = {
  CLIENT: 3,
  SERVER: 4
}

module.exports = Packet
