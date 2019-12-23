const ntp = require('..')

const server = ntp.createServer((message, response) => {
  console.log('server message:', message)
  message.transmitTimestamp = Date.now()
  response(message)
}).listen(1123, (err) => {
  if (err) {
    console.error(err)
  } else {
    console.log('server is running at %s', server.address().port)
  }
})
