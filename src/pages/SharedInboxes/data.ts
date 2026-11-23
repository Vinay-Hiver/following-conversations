import type { IconName } from '../../icons/iconData'
import type { SubNavChannelId } from '../../patterns/SubNav/data'

/** How an email inbox is connected to its mailbox. */
export type AccountType = 'Outlook User Account' | 'Outlook Shared Mailbox' | 'Forwarding Mailbox' | 'Distribution List or Microsoft 365 Group'

export type Inbox = {
  id: string
  name: string
  /** Only email inboxes have an address; it shows under the heading of their settings and in the list. */
  email?: string
  /** Only email inboxes have one; it shows in the list. */
  accountType?: AccountType
}

export type InboxChannel = {
  id: SubNavChannelId
  /** The name in the Shared Inboxes sub-nav and the page heading, for example "Chat Inboxes". */
  label: string
  /** One inbox of this channel, for the "Create ..." button, for example "Chat Inbox". */
  singular: string
  icon: IconName
  inboxes: Inbox[]
}

/** The channels in the Shared Inboxes sub-nav, in order, each with four example inboxes. */
export const sharedInboxChannels: InboxChannel[] = [
  {
    id: 'email', label: 'Email Inboxes', singular: 'Email Inbox', icon: 'mailbox',
    inboxes: [
      { id: 'email-1', name: 'Email 01', email: 'email01@acme.com', accountType: 'Outlook User Account' },
      { id: 'email-2', name: 'Email 02', email: 'email02@acme.com', accountType: 'Outlook Shared Mailbox' },
    ],
  },
]
