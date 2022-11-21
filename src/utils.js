const https = require('https')
const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const INVENTORY = 'https://raw.githubusercontent.com/nodejs/build/main/ansible/inventory.yml'

const extractHosts = (data) => {
  const ips = data.match(/(\b25[0-5]|\b2[0-4][0-9]|\b[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}/g)
  const domains = data.match(/(\S*cloudapp\.azure\.com)/g)
  return Array.from(new Set([...ips, ...domains].filter(host => !host.startsWith('192.168'))))
}

const downloadInventory = () => new Promise((resolve, reject) => {
  const req = https.request(INVENTORY, res => {
    const chunks = []
    res.on('data', chunk => chunks.push(chunk))
    res.on('error', reject)
    res.on('end', () => {
      const { statusCode } = res
      const validResponse = statusCode >= 200 && statusCode <= 299
      const body = chunks.join('')

      if (validResponse) {
        resolve(body)
        return
      }
      reject(new Error(`Request failed. status: ${statusCode}, body: ${body}`))
    })
  })

  req.on('error', reject)
  req.end()
})

const generateTelegrafConfig = hosts => {
  let fileContent = readFileSync(join(process.cwd(), 'src/telegraf.conf'))
  fileContent += `
[[inputs.ping]]
  urls = [${hosts.map(host => `"${host}"`).join(',')}]
  `
  writeFileSync(join(process.cwd(), 'telegraf.conf'), fileContent)
}

module.exports = {
  downloadInventory,
  extractHosts,
  generateTelegrafConfig
}
