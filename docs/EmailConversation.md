# EmailConversation
`import { EmailConversation } from './patterns/EmailConversation'` — The Email conversation: a top bar, the subject with a toolbar beside it (expand all,…
- `subject`: string — The subject of the email conversation.
- `messages`: EmailThreadMessage[] — The messages, in the order they are shown.
- `inboxEmail?`: string (default support@acme.com) — The address the conversation was sent to, shown as "To: …" under the sender.
- `onSend?`: function
- `actions?`: ReactNode — Extra buttons at the start of the subject toolbar, before Expand all, with a divider after them (for example Follow).
