#!/usr/bin/env node

const ntp = require('..')

function argv () {
  const argv = process.argv.slice(2)
  const cmd = {}

  while (argv.length) {
    const arg = argv.shift()

    switch (arg) {
      case '-h':
      case '--help':
        cmd.help = true
        break
      case '-v':
      case '--version':
        cmd.version = true
        break
      default: {
        const [server, port = 123] = arg.split(':')
        cmd.server = server
        cmd.port = port
      }
    }
  }
  return cmd
}

;(() => {
  const cmd = argv()
  if (cmd.help) {
    console.log(`
    ntp2cli [options] pool.ntp.org:123

    -h,--help     show this help
    -v,--version  show version information
    `)
  } else if (cmd.version) {
    console.log(require('../package.json').version)
  } else {
    ntp(cmd, (err, message) => {
      if (err) {
        console.log({ error: err.message })
      } else {
        console.log(JSON.stringify(message, null, 2))
      }
    })
  }
})()
