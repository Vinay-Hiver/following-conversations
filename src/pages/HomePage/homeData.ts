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
  /** Who it is assigned to: `alex` (the signed-in user, shows in Mine) or `none` (shows in Unassigned). Leave out for a teammate. */
  assignee?: 'alex' | 'none'
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
        // Mine: assigned to you (Alex).
        { id: 'email-15', name: 'Erin Hannon', date: 'Nov 13', assignee: 'alex', unread: true, subject: 'Invoice address is wrong', email: 'erin.hannon@example.com', messages: [customer('Hi,\n\nOur latest invoice still shows our old office address. Could you update it to 1725 Slough Avenue and resend?\n\nThanks,\nErin', 'Nov 13, 09:10 AM')] },
        { id: 'email-16', name: 'Darryl Philbin', date: 'Nov 13', assignee: 'alex', sla: frt, subject: 'Bulk import failed halfway', email: 'darryl.philbin@example.com', messages: [customer('Hello,\n\nI imported 2,000 contacts from a CSV and it stopped at 1,140 with no error. Can you tell me what went wrong?\n\nDarryl', 'Nov 13, 08:30 AM')] },
        { id: 'email-17', name: 'Holly Flax', date: 'Nov 12', assignee: 'alex', status: 'pending', subject: 'SSO setup for our team', email: 'holly.flax@example.com', messages: [customer('Hi there,\n\nWe would like to turn on single sign-on with Okta. What do you need from us?', 'Nov 12, 04:20 PM'), agent('Hi Holly,\n\nPlease send us your Okta metadata URL and we will set it up within a day.', 'Nov 12, 04:50 PM')] },
        // Unassigned: nobody owns these yet.
        // The common email: Michael copied both inboxes, so it is in Email 01 (email-1) and Email 02 (email-14). Following one copy does not follow the other.
        { id: 'email-1', name: 'Michael Scott', date: 'Nov 13', assignee: 'none', subject: 'Charged twice for my renewal', email: 'michael.scott@example.com', messages: [customer('Hi Support,\n\nI was charged twice for my annual renewal. Could you check invoice #4821 and refund the duplicate?\n\nThanks,\nMichael', 'Nov 12, 09:20 AM'), agent('Hello Michael,\n\nThanks for flagging this. I have started a refund for the second charge. You will get a confirmation email shortly.', 'Nov 12, 09:45 AM'), customer('Thank you. How long will the refund take to show up?', 'Nov 12, 10:02 AM')] },
        { id: 'email-18', name: 'Jan Levinson', date: 'Nov 13', assignee: 'none', unread: true, tags: high, subject: 'Refund for unused seats', email: 'jan.levinson@example.com', messages: [customer('Hello,\n\nWe reduced our team from 40 to 25 seats last month. Please refund the 15 unused seats for this billing period.\n\nJan', 'Nov 13, 10:05 AM')] },
        { id: 'email-19', name: 'Roy Anderson', date: 'Nov 13', assignee: 'none', unread: true, subject: 'Mobile app keeps logging me out', email: 'roy.anderson@example.com', messages: [customer('Hi,\n\nThe mobile app logs me out every few minutes since yesterday. I am on Android 15.\n\nRoy', 'Nov 13, 07:45 AM')] },
        { id: 'email-20', name: 'Nellie Bertram', date: 'Nov 12', assignee: 'none', subject: 'Do you offer a nonprofit discount?', email: 'nellie.bertram@example.com', messages: [customer('Good morning,\n\nWe are a registered nonprofit. Do you offer any discount on the Pro plan?\n\nNellie', 'Nov 12, 11:30 AM')] },
      ],
    },
    {
      id: 'email02', channel: 'email', label: 'Email 02',
      conversations: [
        // Mine: assigned to you (Alex).
        { id: 'email-21', name: 'Gabe Lewis', date: 'Nov 13', assignee: 'alex', unread: true, sla: frt, subject: 'Webhook deliveries are delayed', email: 'gabe.lewis@example.com', messages: [customer('Hello,\n\nOur webhooks are arriving 10 to 15 minutes late since this morning. Is there an incident?\n\nGabe', 'Nov 13, 09:40 AM')] },
        { id: 'email-22', name: 'Karen Filippelli', date: 'Nov 13', assignee: 'alex', subject: 'Add a second admin', email: 'karen.filippelli@example.com', messages: [customer('Hi,\n\nHow do I make a teammate an admin too? I only see the option for myself.', 'Nov 13, 08:15 AM'), agent('Hi Karen,\n\nGo to Settings, Users, pick the teammate and change their role to Admin.', 'Nov 13, 08:40 AM')] },
        { id: 'email-23', name: 'Clark Green', date: 'Nov 12', assignee: 'alex', status: 'pending', subject: 'Custom domain for the help center', email: 'clark.green@example.com', messages: [customer('Hello,\n\nWe want our help center on help.dundermifflin.com. What DNS records do we add?', 'Nov 12, 03:05 PM'), agent('Hi Clark,\n\nAdd a CNAME record pointing help to helpcenter.acme.com, then reply here and we will verify it.', 'Nov 12, 03:30 PM')] },
        // Unassigned: nobody owns these yet.
        // The common email: Michael copied both inboxes, so it is in Email 01 (email-1) and Email 02 (email-14). Following one copy does not follow the other.
        { id: 'email-14', name: 'Michael Scott', date: 'Nov 13', assignee: 'none', subject: 'Charged twice for my renewal', email: 'michael.scott@example.com', messages: [customer('Hi Support,\n\nI was charged twice for my annual renewal. Could you check invoice #4821 and refund the duplicate?\n\nThanks,\nMichael', 'Nov 12, 09:20 AM'), agent('Hello Michael,\n\nThanks for flagging this. I have started a refund for the second charge. You will get a confirmation email shortly.', 'Nov 12, 09:45 AM'), customer('Thank you. How long will the refund take to show up?', 'Nov 12, 10:02 AM')] },
        { id: 'email-24', name: 'Pete Miller', date: 'Nov 13', assignee: 'none', unread: true, subject: 'Report totals do not match', email: 'pete.miller@example.com', messages: [customer('Hi,\n\nThe weekly report says 312 conversations but the dashboard shows 298 for the same week. Which one is right?\n\nPete', 'Nov 13, 10:20 AM')] },
        { id: 'email-25', name: 'Jo Bennett', date: 'Nov 13', assignee: 'none', unread: true, tags: high, subject: 'Upgrade to Enterprise', email: 'jo.bennett@example.com', messages: [customer('Hello,\n\nWe would like to move all 120 of our users to the Enterprise plan this quarter. Who can I talk to about pricing?\n\nJo', 'Nov 13, 09:00 AM')] },
        { id: 'email-26', name: 'David Wallace', date: 'Nov 12', assignee: 'none', tags: low, subject: 'Can we export all our data?', email: 'david.wallace@example.com', messages: [customer('Hi,\n\nFor an audit, we need a full export of our conversations from the last two years. Is that possible?\n\nDavid', 'Nov 12, 02:10 PM')] },
      ],
    },
  ],
  customFields: [
    { id: 'mrr', label: 'MRR', kind: 'number', value: '1200' },
    { id: 'plan', label: 'Plan', kind: 'text', value: 'Enterprise' },
    { id: 'date', label: 'Date', kind: 'date' },
  ],
}
