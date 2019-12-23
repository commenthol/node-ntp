const ntp = require('..')

const options = {
  server: 'localhost',
  port: 1123
}

ntp(options, function (err, response) {
  if (err) return console.error(err)
  console.log(response)
})
