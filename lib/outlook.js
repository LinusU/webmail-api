const axios = require('axios').default

const mimeTypeMap = new Map([
  ['text/html', 'html'],
  ['text/plain', 'text']
])

function transformError (err) {
  if (err.response && err.response.data && err.response.data.error) {
    throw Object.assign(new Error(err.response.data.error.message), { name: err.response.data.error.code })
  }

  throw err
}

function parseMessageBody (input, withMimeType) {
  if (input.body.contentType.toLowerCase() === (mimeTypeMap.get(withMimeType) || withMimeType)) {
    return input.body.content
  } else {
    throw new Error(`No parts with the mime-type "${withMimeType}" found`)
  }
}

function parseMessageMeta (input) {
  return {
    date: input.receivedDateTime,
    from: input.from ? input.from.emailAddress : null,
    subject: input.subject
  }
}

function archiveMessage (accessToken, id) {
  const url = `https://graph.microsoft.com/v1.0/me/messages/${id}/move`
  const config = { headers: { 'Authorization': `Bearer ${accessToken}` } }

  return axios.post(url, { destinationId: 'archive' }, config).then(() => undefined).catch(transformError)
}

function fetchMessageBody (accessToken, id, withMimeType) {
  const url = `https://graph.microsoft.com/v1.0/me/messages/${id}?$select=body`
  const outlookBodyType = mimeTypeMap.get(withMimeType) || withMimeType
  const config = { headers: { 'Authorization': `Bearer ${accessToken}`, 'Prefer': `outlook.body-content-type="${outlookBodyType}"` } }

  return axios.get(url, config).then((response) => parseMessageBody(response.data, withMimeType)).catch(transformError)
}

function fetchMessageMeta (accessToken, id) {
  const url = `https://graph.microsoft.com/v1.0/me/messages/${id}?$select=subject,from,receiveddatetime`
  const config = { headers: { 'Authorization': `Bearer ${accessToken}` } }

  return axios.get(url, config).then(response => parseMessageMeta(response.data)).catch(transformError)
}

function getServerTime () {
  return axios.get('https://graph.microsoft.com/v1.0').catch(err => err.response).then(response => new Date(response.headers['date']))
}

function getTokenInfo (accessToken) {
  const url = 'https://graph.microsoft.com/v1.0/me'
  const config = { headers: { 'Authorization': `Bearer ${accessToken}` } }

  return axios.get(url, config).then(response => ({ valid: true, email: response.data.userPrincipalName })).catch(() => ({ valid: false, email: null }))
}

function search (accessToken, query) {
  const url = `https://graph.microsoft.com/v1.0/me/messages?$top=50&$select=id&$search=${encodeURIComponent(`"${query}"`)}`
  const config = { headers: { 'Authorization': `Bearer ${accessToken}` } }

  return axios.get(url, config).then(response => response.data.value.map(item => item.id)).catch(transformError)
}

function send (accessToken, message) {
  const config = { headers: { 'Authorization': `Bearer ${accessToken}` } }
  const draft = {
    Subject: message.subject,
    Body: { ContentType: 'Text', Content: message.body },
    From: {
      EmailAddress: { Address: message.from.address, Name: message.from.name }
    },
    ToRecipients: [{
      EmailAddress: { Address: message.to.address, Name: message.to.name }
    }]
  }

  return Promise.resolve()
    .then(() => axios.post('https://graph.microsoft.com/v1.0/me/messages', draft, config))
    .then(response => response.data.id)
    .then(messageId => axios.post(`https://graph.microsoft.com/v1.0/me/messages/${messageId}/send`, null, config))
    .catch(transformError)
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
