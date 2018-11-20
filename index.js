const gmail = require('./lib/gmail')
const outlook = require('./lib/outlook')

module.exports = function createClient (provider, accessToken) {
  switch (provider) {
    case 'gmail': return gmail(accessToken)
    case 'outlook': return outlook(accessToken)
    default: throw new Error(`Unknown provider: ${provider}`)
  }
}
