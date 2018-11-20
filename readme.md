# Webmail API

A unified API to different webmail providers.

Currently supports Gmail & Outlook.

## Installation

```sh
npm install --save webmail-api
```

## Usage

```js
const createClient = require('webmail-api')

const client = createClient('gmail', 'ya28.zxydjsakdaskdsa...')

// Addresses
const foo = { address: 'foo@example.com' }
const linus = { name: 'Linus Unnebäck', address: 'linus@folkdatorn.se' }

// Send an email
await client.send({ from: linus, to: foo, subject: 'Foobar9000', body: 'Hello, World!' })

// Search for email
const ids = await client.search('subject:Foobar9000')
console.log(ids)
//=> ['1567245ae72d5d2b']

// Fetch email metadata
const meta = await client.fetchMessageMeta(ids[0])
console.log(meta)
//=> {
//   date: '2018-11-20T15:04:44.134Z',
//   from: { name: 'Linus Unnebäck', address: 'linus@folkdatorn.se' },
//   subject: 'Foobar9000'
// }

// Fetch email body
const body = await client.fetchMessageBody(ids[0], 'text/plain')
console.log(body)
//=> 'Hello, World!'

// Archive message
await client.archiveMessage(ids[0])
```
