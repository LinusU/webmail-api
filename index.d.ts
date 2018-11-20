declare type MessageId = string
declare type MessageBody = string

declare type MimeType = 'text/plain' | 'text/html'
declare type EmailAddress = { name?: string, address: string }

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

interface Client {
  archiveMessage (id: MessageId): Promise<void>
  fetchMessageBody (id: MessageId, withMimeType: MimeType): Promise<MessageBody>
  fetchMessageMeta (id: MessageId): Promise<MessageMeta>
  search (query: string): Promise<MessageId[]>
  send (email: OutgoingMessage): Promise<void>
}

declare function createClient (provider: 'gmail' | 'outlook', accessToken: string): Client

export = createClient
