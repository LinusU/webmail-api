/* eslint-env mocha */

const assert = require('assert')
const shortid = require('shortid')

const createClient = require('./')

for (const provider of ['gmail', 'outlook']) {
  const address = process.env[`WEBMAIL_${provider.toUpperCase()}_ADDRESS`]
  const token = process.env[`WEBMAIL_${provider.toUpperCase()}_TOKEN`]

  describe(provider[0].toUpperCase() + provider.slice(1), () => {
    const client = createClient(provider, token || 'x')
    const subject = shortid().replace(/[^a-z0-9]/ig, 'a')
    const body = `This is the body id: ${shortid()}`

    let messageId

    it('.getServerTime', async () => {
      const serverTime = (await client.getServerTime()).getTime() / 1000
      const localTime = (new Date()).getTime() / 1000

      assert.ok(serverTime < localTime + 5 && serverTime > localTime - 5)
    })

    it('.getTokenInfo - invalid', async () => {
      const client = createClient(provider, 'x')
      const result = await client.getTokenInfo()

      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.email, null)
    })

    ;(address && token ? it : it.skip)('.getTokenInfo - valid', async () => {
      const result = await client.getTokenInfo()

      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.email, address)
    })

    ;(address && token ? it : it.skip)('.send', async () => {
      const from = { name: 'Sender', address }
      const to = { name: 'Receiver', address }

      await client.send({ from, to, subject, body })
    })

    ;(address && token ? it : it.skip)('.search', async () => {
      const ids = await client.search(`subject:${subject}`)

      assert.strictEqual(ids.length, 1)
      assert.strictEqual(typeof ids[0], 'string')

      messageId = ids[0]
    })

    ;(address && token ? it : it.skip)('.fetchMessageBody', async () => {
      assert.strictEqual(await client.fetchMessageBody(messageId, 'text/plain'), body)
    })

    ;(address && token ? it : it.skip)('.fetchMessageMeta', async () => {
      const meta = await client.fetchMessageMeta(messageId)

      assert.strictEqual(meta.from.address, address)
      assert.strictEqual(meta.subject, subject)

      if (provider !== 'outlook') {
        assert.strictEqual(meta.from.name, 'Sender')
      }
    })

    ;(address && token ? it : it.skip)('.archiveMessage', async () => {
      await client.archiveMessage(messageId)
    })
  })
}
