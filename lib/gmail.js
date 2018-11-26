const axios = require('axios').default
const base64 = require('base64-js')
const decodeUtf8 = require('decode-utf8')
const encodeUtf8 = require('encode-utf8')
const formatEmail = require('format-email')
const formatEmailAddress = require('format-email-address')
const parseAddress = require('addressparser')

function base64UrlEncode (input) {
  const bytes = new Uint8Array(encodeUtf8(input))
  const encoded = base64.fromByteArray(bytes)

  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode (input) {
  return decodeUtf8(base64.toByteArray(input.replace(/-/g, '+').replace(/_/g, '/')))
}

function transformError (err) {
  if (err.response && err.response.data && err.response.data.error) {
    throw Object.assign(new Error(err.response.data.error.message), { statusCode: err.response.data.error.code, errors: err.response.data.error.errors })
  }

  throw err
}

function parseMessageBody (input, withMimeType) {
  if (input.payload.body) {
    if (input.payload.mimeType === withMimeType) {
      return base64UrlDecode(input.payload.body.data)
    }
  }

  if (input.payload.parts) {
    const parts = input.payload.parts.filter((part) => part.mimeType === withMimeType)

    if (parts.length > 0) {
      return base64UrlDecode(parts[0].body.data)
    }

    const children = input.payload.parts.filter((part) => part.mimeType === 'multipart/related')

    if (children.length > 0 && children[0].parts) {
      const parts = children[0].parts.filter((part) => part.mimeType === withMimeType)

      if (parts.length > 0) {
        return base64UrlDecode(parts[0].body.data)
      }
    }
  }

  throw new Error(`No parts with the mime-type "${withMimeType}" found`)
}

function parseMessageMeta (input) {
  const fromHeader = input.payload.headers.find(header => header.name === 'From')
  const subjectHeader = input.payload.headers.find(header => header.name === 'Subject')

  return {
    date: (new Date(Number(input.internalDate))).toISOString(),
    from: (fromHeader ? parseAddress(fromHeader.value)[0] : null),
    subject: (subjectHeader ? subjectHeader.value : null)
  }
}

function archiveMessage (accessToken, id) {
  const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${id}/modify`
  const config = { headers: { 'Authorization': `Bearer ${accessToken}` } }

  return axios.post(url, { removeLabelIds: ['INBOX'] }, config).then(() => undefined).catch(transformError)
}

function fetchMessageBody (accessToken, id, withMimeType) {
  const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${id}?fields=payload/parts/mimeType,payload/parts/body,payload/parts/parts/mimeType,payload/parts/parts/body,payload/mimeType,payload/body`
  const config = { headers: { 'Authorization': `Bearer ${accessToken}` } }

  return axios.get(url, config).then(response => parseMessageBody(response.data, withMimeType)).catch(transformError)
}

function fetchMessageMeta (accessToken, id) {
  const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${id}?fields=internalDate,payload/headers`
  const config = { headers: { 'Authorization': `Bearer ${accessToken}` } }

  return axios.get(url, config).then(response => parseMessageMeta(response.data)).catch(transformError)
}

function getServerTime () {
  return axios.get('https://www.googleapis.com/gmail/v1').catch(err => err.response).then(response => new Date(response.headers['date']))
}

function getTokenInfo (accessToken) {
  return axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`).then(response => ({ valid: true, email: response.data.email })).catch(() => ({ valid: false, email: null }))
}

function search (accessToken, query) {
  // FIXME: Potentially request nextPageToken,resultSizeEstimate as well, and then iterate the pages
  const url = `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&fields=messages/id`
  const config = { headers: { 'Authorization': `Bearer ${accessToken}` } }

  return axios.get(url, config).then(response => (response.data.messages || []).map(message => message.id)).catch(transformError)
}

function send (accessToken, message) {
  const rawFrom = formatEmailAddress(message.from)
  const rawTo = formatEmailAddress(message.to)
  const rawEmail = formatEmail(rawFrom, rawTo, message.subject, message.body)
  const payload = { raw: base64UrlEncode(rawEmail) }
  const config = { headers: { 'Authorization': `Bearer ${accessToken}` } }

  return axios.post('https://www.googleapis.com/gmail/v1/users/me/messages/send', payload, config).then(() => undefined).catch(transformError)
}

module.exports = function (accessToken) {
  return {
    archiveMessage: archiveMessage.bind(null, accessToken),
    fetchMessageBody: fetchMessageBody.bind(null, accessToken),
    fetchMessageMeta: fetchMessageMeta.bind(null, accessToken),
    getServerTime,
    getTokenInfo: getTokenInfo.bind(null, accessToken),
    search: search.bind(null, accessToken),
    send: send.bind(null, accessToken)
  }
}
