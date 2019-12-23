/**
 * seconds between 1900 - 1970
 * @docs https://tools.ietf.org/html/rfc4330#section-3
 */
const SEVENTY_YEARS = 2208988800
const TWO_POW_32 = 2 ** 32
const TWO_POW_16 = 2 ** 16

/**
 * calculate precision in seconds to read date in log2 representation
 * @private
 */
const precision = () => {
  const loop = 1e3
  const start = process.hrtime.bigint()
  for (let i = 0; i < loop; i++) {
    Date.now()
  }
  const end = process.hrtime.bigint()
  const diff = Number(end - start) / loop / 1e9
  return Math.round(Math.log2(diff))
}

/**
 * converts byte to signed integer
 */
const byteToInt = (val) => (val & 0x7f) * (val & 0x80 ? -1 : 1)

/**
 * converts signed integer to byte
 */
const intToByte = (val) => {
  const msb = val < 0
  return Math.abs(val % 128) | (msb ? 0x80 : 0)
}

/**
 * converts from NTP Short Format
 * @see https://tools.ietf.org/html/rfc5905#section-6
 */
const ntpShortToSecs = (buf, offset = 0) => {
  const seconds = (buf[offset + 0] << 8) + buf[offset + 1]
  const fraction = ((buf[offset + 2] << 8) + buf[offset + 3]) / TWO_POW_16
  return seconds + fraction
}

/**
 * reverse conversion of float to NTP Short Format
 */
const secsToNtpShort = (ts, buf = Buffer.alloc(4), offset = 0) => {
  const seconds = Math.floor(ts)
  const fraction = Math.round((ts - seconds) * TWO_POW_16)
  // seconds
  buf[offset + 0] = (seconds & 0xFF00) >> 8
  buf[offset + 1] = (seconds & 0x00FF)
  // fraction
  buf[offset + 2] = (fraction & 0xFF00) >> 8
  buf[offset + 3] = (fraction & 0x00FF)
  return buf
}

/**
 * converts from NTP Timestamp Format
 * @see https://tools.ietf.org/html/rfc5905#section-6
 */
function ntpTimestampToSecs (buf, offset = 0, currentMsecs = Date.now()) {
  let seconds = 0
  let fraction = 0
  for (let i = 0; i < 4; ++i) {
    seconds = (seconds * 256) + buf[offset + i]
  }
  for (let i = 4; i < 8; ++i) {
    fraction = (fraction * 256) + buf[offset + i]
  }
  // era correction
  const currentSecs = (currentMsecs / 1000) + SEVENTY_YEARS
  const era = Math.floor(currentSecs / TWO_POW_32)
  if (era) seconds += era * TWO_POW_32
  // consider an overflow at era change borders
  if (seconds - currentSecs > TWO_POW_16) seconds -= TWO_POW_32

  return ((seconds - SEVENTY_YEARS + (fraction / TWO_POW_32)) * 1000)
}

/**
 * converts to NTP Timestamp Format
 * @see https://tools.ietf.org/html/rfc5905#section-6
 */
function secsToNtpTimestamp (ts, buf = Buffer.alloc(8), offset = 0) {
  const seconds = Math.floor(ts / 1000) + SEVENTY_YEARS
  const fraction = Math.round((ts % 1000) / 1000 * TWO_POW_32)
  // seconds
  buf[offset + 0] = (seconds & 0xFF000000) >> 24
  buf[offset + 1] = (seconds & 0x00FF0000) >> 16
  buf[offset + 2] = (seconds & 0x0000FF00) >> 8
  buf[offset + 3] = (seconds & 0x000000FF)
  // fraction
  buf[offset + 4] = (fraction & 0xFF000000) >> 24
  buf[offset + 5] = (fraction & 0x00FF0000) >> 16
  buf[offset + 6] = (fraction & 0x0000FF00) >> 8
  buf[offset + 7] = (fraction & 0x000000FF)
  return buf
}

module.exports = {
  precision,
  byteToInt,
  intToByte,
  ntpShortToSecs,
  secsToNtpShort,
  ntpTimestampToSecs,
  secsToNtpTimestamp
}
