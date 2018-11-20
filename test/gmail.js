/* eslint-env mocha */

const assert = require('assert')
const shortid = require('shortid')

const createClient = require('../')

const address = process.env.WEBMAIL_GMAIL_ADDRESS
const token = process.env.WEBMAIL_GMAIL_TOKEN

;(address && token ? describe : describe.skip)('Gmail', () => {
  const client = createClient('gmail', token)
  const subject = shortid()
  const body = `This is the body id: ${shortid()}`

  let messageId

  it('.send', async () => {
    const from = { name: 'Sender', address }
    const to = { name: 'Receiver', address }

    await client.send({ from, to, subject, body })
  })

  it('.search', async () => {
    const ids = await client.search(`subject:"${subject}"`)

    assert.strictEqual(ids.length, 1)
    assert.strictEqual(typeof ids[0], 'string')

    messageId = ids[0]
  })

  it('.fetchMessageBody', async () => {
    assert.strictEqual(await client.fetchMessageBody(messageId, 'text/plain'), body)
  })

  it('.fetchMessageMeta', async () => {
    const meta = await client.fetchMessageMeta(messageId)

    assert.strictEqual(meta.from.address, address)
    assert.strictEqual(meta.from.name, 'Sender')
    assert.strictEqual(meta.subject, subject)
  })

  it('.archiveMessage', async () => {
    await client.archiveMessage(messageId)
  })
})
