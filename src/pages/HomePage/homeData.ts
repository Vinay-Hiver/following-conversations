import type { ConversationCardSla, ConversationCardTag, ConversationChannel } from '../../components/ConversationCard'
import type { CustomFieldValue } from '../../patterns/RightPanel'

/**
 * THE DATA OF THE HOME PAGE. Change this file to change the prototype; the page itself (HomePage.tsx) does not need to change.
 *
 * - `inboxes`: which channels show in the sidebar, in order. Delete an inbox to remove the channel. A channel is one of
 *   chat, whatsapp, sms, slack, email, voice.
 * - Each inbox has `conversations`. Every conversation has a customer `name`, a `date` for its card and its `messages`, oldest first.
 *   The card's second line always shows the latest message (a message you sent shows with the reply arrow).
 * - `customFields`: the fields in the "Custom fields" section of the right panel. A `kind` is text, number or date.
 *   Keep a date as "YYYY-MM-DD". Leave `value` out for an empty field.
 */

/** One message in a conversation. */
export type HomeMessage = {
  from: 'customer' | 'agent'
  text: string
  /** The time shown on the message, for example "Nov 12, 10:05 AM". */
  time: string
  /** WhatsApp only, on an agent message: sent, delivered or read (ticks). */
  status?: 'sent' | 'delivered' | 'read'
  /** Slack only: the reactions on the message, for example { '👍': 2 }. */
  reactions?: Record<string, number>
}

/** The status of a conversation, as the Status field shows it. */
export type HomeStatus = 'open' | 'pending' | 'closed'

export type HomeConversation = {
  /** Unique across the whole page, for example "sms-1". */
  id: string
  /** The customer's name, on the card and the conversation. */
  name: string
  /** The date or time on the card, for example "Nov 12" or "09:20 AM". */
  date: string
  /** Oldest first. Voice conversations have no messages. */
  messages: HomeMessage[]
  /** The status it starts in. Open when left out. */
  status?: HomeStatus
  /** Starts unread: a blue dot and a bolder card until it is opened. */
  unread?: boolean
  /** SLA pills on the card, for example [{ kind: 'frt', status: 'overdue' }]. */
  sla?: ConversationCardSla[]
  /** Tags on the card, for example [{ label: 'High', color: 'red' }]. */
  tags?: ConversationCardTag[]
  /** How many more tags there are than shown ("+2"). */
  moreCount?: number
  /** Email only: the subject of the email conversation. */
  subject?: string
  /** Email only: the customer's address. */
  email?: string
  /** Slack only: the Slack channel the conversation is in, without the "#". */
  slackChannel?: string
  /** Voice only: whether the call was incoming or outgoing. */
  call?: 'incoming' | 'outgoing'
}

export type HomeInbox = {
  /** Unique id of the inbox. Needed when a channel has more than one inbox, for example "email-01" and "email-02". */
  id?: string
  channel: ConversationChannel
  /** The name in the sidebar, for example "Website Chat". */
  label: string
  conversations: HomeConversation[]
}

export type HomeData = {
  inboxes: HomeInbox[]
  customFields: CustomFieldValue[]
}

const customer = (text: string, time: string): HomeMessage => ({ from: 'customer', text, time })
const agent = (text: string, time: string, status?: HomeMessage['status']): HomeMessage => ({ from: 'agent', text, time, status })
const frt: ConversationCardSla[] = [{ kind: 'frt', status: 'overdue' }]
const high: ConversationCardTag[] = [{ label: 'High', color: 'red' }, { label: 'Billing', color: 'lightBlue' }]
const low: ConversationCardTag[] = [{ label: 'Low', color: 'green' }]

/** The example data the starter page shows. */
export const homeData: HomeData = {
  inboxes: [
    {
      id: 'email01', channel: 'email', label: 'Email 01',
      conversations: [
        { id: 'email-1', name: 'Michael Scott', date: 'Nov 12', subject: 'Charged twice for my renewal', email: 'michael.scott@example.com', sla: frt, tags: high, messages: [customer('Hi Support,\n\nI was charged twice for my annual renewal. Could you check invoice #4821 and refund the duplicate?\n\nThanks,\nMichael', 'Nov 12, 09:20 AM'), agent('Hello Michael,\n\nThanks for flagging this. I have started a refund for the second charge. You will get a confirmation email shortly.', 'Nov 12, 09:45 AM'), customer('Thank you. How long will the refund take to show up?', 'Nov 12, 10:02 AM')] },
        { id: 'email-2', name: 'Dwight Schrute', date: 'Nov 12', subject: 'Where is the onboarding checklist?', email: 'dwight.schrute@example.com', unread: true, messages: [customer('Hello,\n\nWe just signed up and I cannot find the onboarding checklist mentioned in the welcome email. Where can I find it?\n\nDwight', 'Nov 12, 08:10 AM')] },
        { id: 'email-3', name: 'Pam Beesly', date: 'Nov 12', subject: 'Adding a new teammate', email: 'pam.beesly@example.com', tags: low, messages: [customer('Hi,\n\nHow do I invite a new teammate to our workspace? The invite button is greyed out for me.', 'Nov 12, 07:55 AM'), agent('Hi Pam,\n\nOnly admins can send invites. I have asked your account admin to update your role, after which the button will be enabled.', 'Nov 12, 08:20 AM')] },
        { id: 'email-4', name: 'Jim Halpert', date: 'Nov 11', subject: 'Password reset link expired', email: 'jim.halpert@example.com', unread: true, sla: frt, messages: [customer('Hello,\n\nThe password reset link I received has already expired. Could you send me a new one?\n\nJim', 'Nov 11, 06:40 PM')] },
        { id: 'email-5', name: 'Angela Martin', date: 'Nov 11', status: 'closed', subject: 'Request for a W-9 form', email: 'angela.martin@example.com', messages: [customer('Good afternoon,\n\nOur accounting team needs a copy of your W-9 for our vendor records. Please send it at your earliest convenience.', 'Nov 11, 02:15 PM'), agent('Hi Angela,\n\nPlease find our W-9 attached. Let me know if you need anything else.', 'Nov 11, 03:00 PM'), customer('Received, thank you.', 'Nov 11, 03:12 PM')] },
        { id: 'email-6', name: 'Kevin Malone', date: 'Nov 10', subject: 'Export not downloading', email: 'kevin.malone@example.com', unread: true, messages: [customer('Hi,\n\nI clicked export on the reports page but nothing downloads. I tried two browsers.\n\nKevin', 'Nov 10, 11:30 AM')] },
        { id: 'email-7', name: 'Oscar Martinez', date: 'Nov 10', status: 'pending', subject: 'Switching to annual billing', email: 'oscar.martinez@example.com', messages: [customer('Hello,\n\nWe would like to switch from monthly to annual billing. Will the unused part of this month be credited?', 'Nov 10, 09:05 AM'), agent('Hi Oscar,\n\nYes, the remaining days of this month will be credited toward your annual plan. I can make the switch today if you confirm.', 'Nov 10, 09:40 AM')] },
      ],
    },
    {
      id: 'email02', channel: 'email', label: 'Email 02',
      conversations: [
        // The same email as email-1: Michael copied both inboxes. Following one copy does not follow the other.
        { id: 'email-14', name: 'Michael Scott', date: 'Nov 12', subject: 'Charged twice for my renewal', email: 'michael.scott@example.com', messages: [customer('Hi Support,\n\nI was charged twice for my annual renewal. Could you check invoice #4821 and refund the duplicate?\n\nThanks,\nMichael', 'Nov 12, 09:20 AM')] },
        { id: 'email-8', name: 'Stanley Hudson', date: 'Nov 12', subject: 'Cannot log in after update', email: 'stanley.hudson@example.com', unread: true, sla: frt, tags: high, messages: [customer('Hello,\n\nSince this morning I cannot log in. The page just reloads after I enter my password.\n\nStanley', 'Nov 12, 10:15 AM')] },
        { id: 'email-9', name: 'Ryan Howard', date: 'Nov 12', subject: 'Question about API limits', email: 'ryan.howard@example.com', messages: [customer('Hi,\n\nWhat are the rate limits on your API for the Pro plan? We are planning an integration.', 'Nov 12, 09:00 AM'), agent('Hi Ryan,\n\nThe Pro plan allows 600 requests per minute. I have attached our API guide with the details.', 'Nov 12, 09:30 AM')] },
        { id: 'email-10', name: 'Kelly Kapoor', date: 'Nov 11', subject: 'Change the email on my account', email: 'kelly.kapoor@example.com', unread: true, messages: [customer('Hi there,\n\nI got married and need to change the email address on my account. Can you help?\n\nKelly', 'Nov 11, 05:20 PM')] },
        { id: 'email-11', name: 'Toby Flenderson', date: 'Nov 11', status: 'closed', subject: 'Data retention policy', email: 'toby.flenderson@example.com', tags: low, messages: [customer('Hello,\n\nCould you share your data retention policy? Our compliance team needs it for review.', 'Nov 11, 01:10 PM'), agent('Hi Toby,\n\nPlease find our data retention policy attached. We keep customer data for the length of the contract plus 30 days.', 'Nov 11, 02:00 PM'), customer('Perfect, thanks for the quick reply.', 'Nov 11, 02:25 PM')] },
        { id: 'email-12', name: 'Meredith Palmer', date: 'Nov 10', status: 'pending', subject: 'Notifications not arriving', email: 'meredith.palmer@example.com', messages: [customer('Hi,\n\nI stopped getting email notifications for new assignments last week.', 'Nov 10, 04:45 PM'), agent('Hi Meredith,\n\nIt looks like notifications were turned off in your profile settings. I have turned them back on for you.', 'Nov 10, 05:10 PM')] },
        { id: 'email-13', name: 'Andy Bernard', date: 'Nov 10', subject: 'Cancel my subscription', email: 'andy.bernard@example.com', unread: true, messages: [customer('Hello,\n\nPlease cancel my subscription at the end of this billing cycle.\n\nAndy', 'Nov 10, 10:00 AM')] },
      ],
    },
  ],
  customFields: [
    { id: 'mrr', label: 'MRR', kind: 'number', value: '1200' },
    { id: 'plan', label: 'Plan', kind: 'text', value: 'Enterprise' },
    { id: 'date', label: 'Date', kind: 'date' },
  ],
}
