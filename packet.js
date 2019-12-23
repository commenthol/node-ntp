/**
 * 1900 ~ 1970
 * @docs https://tools.ietf.org/html/rfc4330#section-3
 */
const SEVENTY_YEARS = 2208988800

/** converts byte to signed integer */
const byteToInt = (val) => (val && 0x7f) * (val & 0x80 ? -1 : 1)

/**
 * converts from NTP Short Format
 * @see https://tools.ietf.org/html/rfc5905#section-6
 */
const shortFormatToFloat = (buf) => {
  const sign = buf[0] & 0x80 ? -1 : 1
  const int = ((buf[0] & 0x7f) << 8) + buf[1]
  const frac = ((buf[2] << 8) + buf[3]) / Math.pow(2, 16)
  return sign * (int + frac)
}

/**
 * reverse conversion of float to NTP Short Format
 */
const floatToShortFormat = (buffer, offset, val) => {
  const seconds = Math.floor(val)
  const fraction = Math.round((val - seconds) * Math.pow(2, 16))
  // seconds
  buffer[offset + 0] = (seconds & 0x0000FF00) >> 8
  buffer[offset + 1] = (seconds & 0x000000FF)
  // fraction
  buffer[offset + 2] = (fraction & 0x0000FF00) >> 8
  buffer[offset + 3] = (fraction & 0x000000FF)
  return buffer
}

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

/**
 * converts from NTP Timestamp Format
 * @see https://tools.ietf.org/html/rfc5905#section-6
 */
function toMsecs (buffer, offset) {
  let seconds = 0
  let fraction = 0
  for (let i = 0; i < 4; ++i) {
    seconds = (seconds * 256) + buffer[offset + i]
  }
  for (let i = 4; i < 8; ++i) {
    fraction = (fraction * 256) + buffer[offset + i]
  }
  return ((seconds - SEVENTY_YEARS + (fraction / Math.pow(2, 32))) * 1000)
}

/**
 * converts to NTP Timestamp Format
 * @see https://tools.ietf.org/html/rfc5905#section-6
 */
function writeMsecs (buffer, offset, ts) {
  // const buffer = Buffer.alloc(8); // 64bits
  const seconds = Math.floor(ts / 1000) + SEVENTY_YEARS
  const fraction = Math.round((ts % 1000) / 1000 * Math.pow(2, 32))
  // seconds
  buffer[offset + 0] = (seconds & 0xFF000000) >> 24
  buffer[offset + 1] = (seconds & 0x00FF0000) >> 16
  buffer[offset + 2] = (seconds & 0x0000FF00) >> 8
  buffer[offset + 3] = (seconds & 0x000000FF)
  // fraction
  buffer[offset + 4] = (fraction & 0xFF000000) >> 24
  buffer[offset + 5] = (fraction & 0x00FF0000) >> 16
  buffer[offset + 6] = (fraction & 0x0000FF00) >> 8
  buffer[offset + 7] = (fraction & 0x000000FF)
  return buffer
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
    packet.precision = byteToInt(buffer[3])
    packet.rootDelay = shortFormatToFloat(buffer.slice(4, 8))
    packet.rootDispersion = shortFormatToFloat(buffer.slice(8, 12))
    packet.referenceIdentifier = toRefIdentifier(buffer.slice(12, 16), packet.stratum)
    packet.referenceTimestamp = toMsecs(buffer, 16)
    packet.originateTimestamp = toMsecs(buffer, 24)
    packet.receiveTimestamp = toMsecs(buffer, 32)
    packet.transmitTimestamp = toMsecs(buffer, 40)
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
    buffer[3] = this.precision
    floatToShortFormat(buffer, 4, this.rootDelay)
    floatToShortFormat(buffer, 8, this.rootDispersion)
    referenceIdentifier.copy(buffer, 12, 0, 4)
    writeMsecs(buffer, 16, this.referenceTimestamp)
    writeMsecs(buffer, 24, this.originateTimestamp)
    writeMsecs(buffer, 32, this.receiveTimestamp)
    writeMsecs(buffer, 40, this.transmitTimestamp)
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
