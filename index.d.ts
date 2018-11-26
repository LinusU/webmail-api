declare namespace createClient {
  type MessageId = string
  type MessageBody = string

  type MimeType = 'text/plain' | 'text/html'
  type EmailAddress = { name?: string, address: string }

  interface MessageMeta {
    date: string
    from: EmailAddress | null
    subject: string | null
  }

  interface OutgoingMessage {
    from: EmailAddress
    to: EmailAddress
    subject: string
    body: string
  }

  interface ValidTokenInfo {
    valid: true
    email: string
  }

  interface InvalidTokenInfo {
    valid: false
    email: null
  }

  type TokenInfo = ValidTokenInfo | InvalidTokenInfo

  interface Client {
    archiveMessage (id: MessageId): Promise<void>
    fetchMessageBody (id: MessageId, withMimeType: MimeType): Promise<MessageBody>
    fetchMessageMeta (id: MessageId): Promise<MessageMeta>
    getServerTime(): Promise<Date>
    getTokenInfo(): Promise<TokenInfo>
    search (query: string): Promise<MessageId[]>
    send (email: OutgoingMessage): Promise<void>
  }
}

declare function createClient (provider: 'gmail' | 'outlook', accessToken: string): createClient.Client

export = createClient
