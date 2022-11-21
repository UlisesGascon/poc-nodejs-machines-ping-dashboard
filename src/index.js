const { downloadInventory, extractHosts, generateTelegrafConfig } = require('./utils')

;(async () => {
  const data = await downloadInventory()
  const hosts = extractHosts(data)
  generateTelegrafConfig(hosts)
})()
