import { useCallback, useMemo, useRef, useState } from 'react'
import type { AvatarColor } from '../../components/Avatar'
import type { ConversationChannel } from '../../components/ConversationCard'
import type { IconName } from '../../icons/iconData'
import { ChatConversation } from '../../patterns/ChatConversation'
import type { ChatThreadItem } from '../../patterns/ChatConversation'
import { nowLabel, scheduleUserReply } from '../../patterns/ChatConversation/simulatedReply'
import { ConversationList } from '../../patterns/ConversationList'
import { withLatest } from '../../patterns/ConversationList/latest'
import type { LatestMessage } from '../../patterns/ConversationList/latest'
import type { ConversationListItem } from '../../patterns/ConversationList/sampleData'
import { ConversationsSidebar } from '../../patterns/ConversationsSidebar'
import type { ConversationsSidebarSection } from '../../patterns/ConversationsSidebar'
import { channelViews, viewLibrary } from '../../patterns/ConversationsSidebar/data'
import { sampleSections } from '../../patterns/ConversationsSidebar/sampleData'
import { EmailConversation } from '../../patterns/EmailConversation'
import type { EmailThreadMessage } from '../../patterns/EmailConversation'
import { agentEmail, emailAgentAddress, scheduleEmailReply } from '../../patterns/EmailConversation/emailThread'
import { MainNav } from '../../patterns/MainNav'
import { navSampleFooterItems, navSampleItems, navSampleUserMenu } from '../../patterns/MainNav/sampleData'
import { PageLayout } from '../../patterns/PageLayout'
import { EmptyState } from '../../patterns/EmptyState'
import { Button } from '../../components/Button'
import { Tabs } from '../../components/Tabs'
import { Tooltip } from '../../components/Tooltip'
import { Icon } from '../../icons/Icon'
import { SlackConversation } from '../../patterns/SlackConversation'
import type { SlackThreadItem } from '../../patterns/SlackConversation'
import { addReaction, agentMessage, deleteMessage, removeReaction, scheduleSlackReply } from '../../patterns/SlackConversation/slackThread'
import { HomeRightPanel } from './HomeRightPanel'
import { NotificationsPanel } from './NotificationsPanel'
import { BellDot } from './BellDot'
import { NotificationSimulator, notificationSections } from './NotificationSimulator'
import type { SimulatedEvent, SimulatorSection } from './NotificationSimulator'
import type { HomePerson } from './HomeRightPanel'
import type { FollowerAlert } from './NotificationsPanel'
import { homeData } from './homeData'
import type { HomeConversation, HomeData, HomeInbox, HomeStatus } from './homeData'

const avatarColors: AvatarColor[] = ['violet', 'lightBlue', 'green', 'orange', 'purple', 'red', 'yellow', 'grey']
const channelIcons: Record<ConversationChannel, IconName> = { chat: 'chatinbox', slack: 'slack', whatsapp: 'whatsapp', sms: 'sms', email: 'mailbox', voice: 'voice' }
const hasNoList = (viewId: string) => /-(tags|allViews)$/.test(viewId)
/** The key of an inbox in the sidebar: its own id, or its channel when it has none. Lets one channel have several inboxes. */
const keyOf = (inbox: HomeInbox) => inbox.id ?? inbox.channel

type ChatChannel = 'chat' | 'whatsapp' | 'sms'
const isChat = (c: ConversationChannel): c is ChatChannel => c === 'chat' || c === 'whatsapp' || c === 'sms'

/** Turns the data of each conversation into the thread its conversation view shows. */
const chatThread = (c: HomeConversation, channel: ConversationChannel): ChatThreadItem[] =>
  c.messages.map((m, i) => ({ id: String(i + 1), kind: 'message', from: m.from === 'customer' ? 'user' : 'agent', text: m.text, time: m.time, agentName: m.from === 'agent' ? 'Perry' : undefined, status: channel === 'whatsapp' && m.from === 'agent' ? m.status ?? 'sent' : undefined }))
const slackThread = (c: HomeConversation): SlackThreadItem[] => c.messages.map((m, i) => ({ id: String(i + 1), from: m.from === 'customer' ? 'user' : 'agent', text: m.text, time: m.time, reactions: m.reactions }))
const customerAddress = (c: HomeConversation) => c.email ?? `${c.name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`
const emailThread = (c: HomeConversation, color: AvatarColor): EmailThreadMessage[] => c.messages.map((m, i) => ({ id: String(i + 1), email: m.from === 'customer' ? customerAddress(c) : emailAgentAddress, avatarColor: m.from === 'customer' ? color : 'lightBlue', time: m.time, body: m.text }))

const FOLLOWING = 'following'
const MY_WORK = 'my-work'
/** The signed-in user, and the people in the Assignee and Co-assignee lists. */
const ME = 'alex'
const NONE = 'none'
const people: HomePerson[] = [{ value: ME, label: 'Alex (you)', color: 'violet' }, { value: 'praveen', label: 'Praveen Borawar', color: 'orange' }, { value: 'priya', label: 'Priya Nair', color: 'green' }]
/** Prototype only: scenarios from the PRD's edge cases, played from the bottom bar. */
type ScenarioEvent = 'co-assign-me' | 'co-assign-ends' | 'assign-me' | 'unassign-me' | 'lose-access' | 'restore-access' | 'fail-next'
const scenarioSections = (failArmed: boolean, anyRevoked: boolean): SimulatorSection<ScenarioEvent>[] => [
  { title: 'Assignment', items: [
    { event: 'co-assign-me', label: 'Teammate co-assigns you', note: 'It joins My Work and stays in Following' },
    { event: 'co-assign-ends', label: 'Your co-assignment ends', note: 'It leaves My Work and stays in Following' },
    { event: 'assign-me', label: 'Teammate assigns it to you', note: 'Assignee and Follow stay independent' },
    { event: 'unassign-me', label: 'You are unassigned', note: 'Following is unchanged' },
  ] },
  { title: 'Access', items: [
    { event: 'lose-access', label: 'You lose access to its inbox', note: 'It disappears from Following, and its alerts stop' },
    ...(anyRevoked ? [{ event: 'restore-access' as const, label: 'Access is restored', note: 'Followed conversations come back' }] : []),
  ] },
  { title: 'Errors', items: [
    { event: 'fail-next', label: failArmed ? 'Next Follow will fail (armed)' : 'Next Follow fails', note: 'The old state stays, and you can retry' },
  ] },
]
/** Prototype only: the teammate who changes a conversation in the simulator. */
const TEAMMATE = 'Praveen Borawar'
const statusTag: Record<HomeStatus, { label: string; color: 'lightBlue' | 'yellow' | 'green' }> = { open: { label: 'Open', color: 'lightBlue' }, pending: { label: 'Pending', color: 'yellow' }, closed: { label: 'Closed', color: 'green' } }

/** The card of a conversation in the list. */
const toListItem = (c: HomeConversation): ConversationListItem => ({ id: c.id, name: c.name, date: c.date, unread: c.unread, sla: c.sla, tags: c.tags, moreCount: c.moreCount, callDirection: c.call })

/** The Shared Inbox part of the sidebar, built from the inboxes: each inbox gets its channel's views, counted by its conversations. */
function sharedInboxItems(inboxes: HomeInbox[], countOf: (inbox: HomeInbox, viewLabel: string) => number) {
  return inboxes.map((inbox) => ({
    id: keyOf(inbox),
    label: inbox.label,
    icon: channelIcons[inbox.channel],
    views: channelViews[inbox.channel].map((key) => {
      const v = viewLibrary[key]
      return { id: `${keyOf(inbox)}-${v.id}`, label: v.label, icon: v.icon, count: v.hasCount ? countOf(inbox, v.label) : undefined }
    }),
  }))
}

/**
 * The Home page of Hiver: Main nav, Conversations sidebar, the Conversation list of the chosen view, the conversation next to it, and the Right panel.
 * Everything it shows comes from `data` (see homeData.ts): the inboxes (channels) in the sidebar, their conversations and messages, and the custom fields.
 * Chat, WhatsApp, SMS, Slack and Email conversations can be read and answered (the customer replies a moment later). Voice shows its list only.
 * Tags and All Views show no list.
 */
export function HomePage({ data = homeData, onNavChange }: { data?: HomeData; /** Called with the id of the Main nav item that was pressed (for example `admin`), so a page above can switch to it. */ onNavChange?: (id: string) => void }) {
  const { customFields } = data
  // Copies of an email removed from an inbox (Remove from shared inbox). The other inbox keeps its copy.
  const [removed, setRemoved] = useState<string[]>([])
  const inboxes = useMemo(() => data.inboxes.map((i) => ({ ...i, conversations: i.conversations.filter((c) => !removed.includes(c.id)) })), [data.inboxes, removed])
  const first = inboxes[0]
  const [navValue, setNavValue] = useState('conversations')
  const [view, setView] = useState(first ? `${keyOf(first)}-${channelViews[first.channel][0]}` : '')
  // The icon at the top of the Conversation list hides the Conversations sidebar. The Main nav stays.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selected, setSelected] = useState<string | undefined>(first?.conversations[0]?.id)
  const [threads, setThreads] = useState<Record<string, ChatThreadItem[]>>(() => Object.fromEntries(inboxes.filter((i) => isChat(i.channel)).flatMap((i) => i.conversations.map((c) => [c.id, chatThread(c, i.channel)]))))
  const [slackThreads, setSlackThreads] = useState<Record<string, SlackThreadItem[]>>(() => Object.fromEntries(inboxes.filter((i) => i.channel === 'slack').flatMap((i) => i.conversations.map((c) => [c.id, slackThread(c)]))))
  // Statuses, so the Status field and the Following list agree.
  const [statuses, setStatuses] = useState<Record<string, HomeStatus>>(() => Object.fromEntries(inboxes.flatMap((i) => i.conversations.map((c) => [c.id, c.status ?? 'open']))))
  // Conversations the signed-in user follows, newest follow first. The Following tab shows after the first follow and stays.
  const [followed, setFollowed] = useState<string[]>([])
  const [hasFollowed, setHasFollowed] = useState(false)
  // Prototype only: where the Follow action sits, switched from the floating control at the bottom.
  const [followPlacement, setFollowPlacement] = useState<'panel' | 'toolbar'>('panel')
  const setFollow = (id: string, on: boolean) => {
    setFollowed((prev) => (on ? (prev.includes(id) ? prev : [id, ...prev]) : prev.filter((x) => x !== id)))
    if (on) setHasFollowed(true)
  }
  // Who owns each conversation. Assignment and following never start or stop each other.
  const [assignees, setAssignees] = useState<Record<string, string>>({})
  const [coAssignees, setCoAssignees] = useState<Record<string, string>>({})
  const startAssignee = useMemo(() => Object.fromEntries(inboxes.flatMap((i) => i.conversations.map((c) => [c.id, c.assignee ?? 'praveen']))), [inboxes])
  const assigneeOf = (id: string) => assignees[id] ?? startAssignee[id] ?? 'praveen'
  // The conversations a view lists: Mine is yours, Unassigned has no owner. Team and Tickets are empty in this prototype.
  const inView = (inbox: HomeInbox, viewLabel?: string) => inbox.conversations.filter((c) => viewLabel === 'Mine' ? assigneeOf(c.id) === ME : viewLabel === 'Unassigned' ? assigneeOf(c.id) === NONE : viewLabel === 'Team' || viewLabel === 'Tickets' ? false : true)
  const coAssigneeOf = (id: string) => coAssignees[id] ?? NONE
  // Inboxes the signed-in user has lost access to. Following never grants access.
  const [revoked, setRevoked] = useState<string[]>([])
  const accessible = inboxes.filter((i) => !revoked.includes(keyOf(i)))
  // Follow and Unfollow are saved for a moment; when one fails, the old state stays and Retry is offered.
  const [failNext, setFailNext] = useState(false)
  const [followBusy, setFollowBusy] = useState<string | null>(null)
  const [followError, setFollowError] = useState<{ id: string; on: boolean } | null>(null)
  const requestFollow = (id: string, on: boolean) => {
    setFollowError(null)
    setFollowBusy(id)
    const fails = failNext
    window.setTimeout(() => {
      setFollowBusy(null)
      if (fails) { setFailNext(false); setFollowError({ id, on }); return }
      setFollow(id, on)
    }, 600)
  }
  const [emailThreads, setEmailThreads] = useState<Record<string, EmailThreadMessage[]>>(() => Object.fromEntries(inboxes.filter((i) => i.channel === 'email').flatMap((i) => i.conversations.map((c, n) => [c.id, emailThread(c, avatarColors[n % avatarColors.length])]))))

  // Follower alerts in the bell. Only entering or leaving Closed alerts a follower; Open <-> Pending does not.
  const [alerts, setAlerts] = useState<FollowerAlert[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const closeBell = useCallback(() => setBellOpen(false), [])
  // The latest statuses and follows, for changes that land later (a customer's reply arrives a moment after sending).
  const live = useRef({ statuses, followed, revoked })
  live.current = { statuses, followed, revoked }
  const findConv = (id: string) => inboxes.flatMap((i) => i.conversations.map((c) => ({ inbox: i, conv: c }))).find((e) => e.conv.id === id)
  /** Changes a status. `by` is who changed it; leave it out for the signed-in user, whose own changes never alert them. */
  const changeStatus = (id: string, next: HomeStatus, by?: string) => {
    const prev = live.current.statuses[id] ?? 'open'
    if (prev === next) return
    live.current = { ...live.current, statuses: { ...live.current.statuses, [id]: next } }
    setStatuses((p) => ({ ...p, [id]: next }))
    if (!by || !live.current.followed.includes(id)) return
    const kind = next === 'closed' ? 'closed' : prev === 'closed' ? 'reopened' : null
    const entry = findConv(id)
    // No follower updates once access to the inbox is gone.
    if (entry && live.current.revoked.includes(keyOf(entry.inbox))) return
    if (kind && entry) setAlerts((a) => [{ id: `${id}-${Date.now()}`, convId: id, kind, subject: entry.conv.subject ?? 'No subject', inbox: entry.inbox.label, by, time: nowLabel(), read: false }, ...a])
  }
  // A customer reply reopens a closed conversation: one reopen alert, no separate reply alert. A reply to an open one alerts no one.
  const customerReplied = (id: string) => { if ((live.current.statuses[id] ?? 'open') === 'closed') changeStatus(id, 'open', 'a customer reply') }
  // Prototype only: play a follower event. It lands on the open email conversation if you follow it, else the newest one you follow, else the first email conversation (which you then follow).
  const target = () => {
    const emailIds = accessible.filter((i) => i.channel === 'email').flatMap((i) => i.conversations.map((c) => c.id))
    const f = live.current.followed.filter((x) => emailIds.includes(x))
    const id = selected && f.includes(selected) ? selected : f[0] ?? emailIds[0]
    const entry = id ? findConv(id) : undefined
    if (!entry) return undefined
    if (!f.includes(id)) { live.current = { ...live.current, followed: [id, ...live.current.followed] }; setFollow(id, true) }
    return { id, entry }
  }
  const playEvent = (event: SimulatedEvent) => {
    const t = target()
    if (!t) return
    const { id, entry } = t
    const status = () => live.current.statuses[id] ?? 'open'
    const customerReply = () => {
      const address = customerAddress(entry.conv)
      setEmailThreads((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), { id: `customer-${Date.now()}`, email: address, avatarColor: prev[id]?.find((m) => m.email === address)?.avatarColor ?? 'violet', time: nowLabel(), body: 'Hi,\n\nJust following up on this. Is there an update?' }] }))
    }
    // Set up the starting status quietly (no alert), then make the change as someone else.
    if (event === 'teammate-closes') { if (status() === 'closed') changeStatus(id, 'open'); changeStatus(id, 'closed', TEAMMATE) }
    if (event === 'teammate-reopens') { if (status() !== 'closed') changeStatus(id, 'closed'); changeStatus(id, 'open', TEAMMATE) }
    if (event === 'customer-reopens') { if (status() !== 'closed') changeStatus(id, 'closed'); customerReply(); customerReplied(id) }
    if (event === 'teammate-pending') { if (status() !== 'open') changeStatus(id, 'open'); changeStatus(id, 'pending', TEAMMATE) }
    if (event === 'customer-replies-open') { if (status() === 'closed') changeStatus(id, 'open'); customerReply(); customerReplied(id) }
  }
  // Prototype only: the PRD's edge cases.
  const playScenario = (event: ScenarioEvent) => {
    if (event === 'fail-next') { setFailNext(true); return }
    if (event === 'restore-access') { setRevoked([]); return }
    const t = target()
    if (!t) return
    const { id, entry } = t
    if (event === 'co-assign-me') setCoAssignees((p) => ({ ...p, [id]: ME }))
    if (event === 'co-assign-ends') setCoAssignees((p) => ({ ...p, [id]: NONE }))
    if (event === 'assign-me') setAssignees((p) => ({ ...p, [id]: ME }))
    if (event === 'unassign-me') setAssignees((p) => ({ ...p, [id]: 'praveen' }))
    if (event === 'lose-access') {
      setRevoked((p) => [...p, keyOf(entry.inbox)])
      // Stay on the conversation, like an old link: it now shows that you have no access.
      setView(FOLLOWING)
      setSelected(id)
    }
  }
  const openAlert = (a: FollowerAlert) => {
    setAlerts((prev) => prev.map((x) => (x.id === a.id ? { ...x, read: true } : x)))
    setBellOpen(false)
    setNavValue('conversations')
    const entry = findConv(a.convId)
    if (!entry) return
    setView(followed.includes(a.convId) ? FOLLOWING : `${keyOf(entry.inbox)}-${channelViews[entry.inbox.channel][0]}`)
    setSelected(a.convId)
  }

  // The inbox the sidebar opens expanded. Jumping to another inbox's copy expands that inbox (the sidebar is rebuilt to pick it up).
  const [expandedInbox, setExpandedInbox] = useState(first ? keyOf(first) : '')
  const [sidebarKey, setSidebarKey] = useState(0)
  // My Work: conversations you are assigned or co-assigned, from the inboxes you can reach. Its views (Live Queue, Standard Queue) all list them.
  const myWorkEntries = accessible.filter((i) => i.channel === 'email').flatMap((i) => i.conversations.filter((c) => assigneeOf(c.id) === ME || coAssigneeOf(c.id) === ME).map((c) => ({ inbox: i, conv: c })))
  // Followed conversations you can still reach.
  const followingCount = followed.filter((id) => { const e = findConv(id); return !!e && !revoked.includes(keyOf(e.inbox)) }).length
  const sections = useMemo<ConversationsSidebarSection[]>(() => {
    const base = sampleSections(true, first ? [first.channel] : [])
    return base.map((sec, n) => {
      if (sec.title === 'Shared Inbox') return { ...sec, items: sharedInboxItems(accessible, (i, label) => inView(i, label).length).map((it) => ({ ...it, defaultExpanded: it.id === expandedInbox })) }
      // Following sits right after My Work in the personal section, once the user has followed something.
      if (n === 0) return { ...sec, items: sec.items.flatMap((it) => {
        if (it.id !== MY_WORK) return [it]
        const myWork = { ...it, count: String(myWorkEntries.length), views: it.views?.map((v) => ({ ...v, count: myWorkEntries.length })) }
        return hasFollowed ? [myWork, { id: FOLLOWING, label: 'Following', icon: 'view2' as const, count: String(followingCount) }] : [myWork]
      }) }
      return sec
    })
  }, [accessible, first, hasFollowed, expandedInbox, myWorkEntries.length, assignees, followingCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // Followed conversations, from every shared email inbox, with the inbox each one is in.
  const followedEntries = followed.flatMap((id) => accessible.filter((i) => i.channel === 'email').flatMap((i) => i.conversations.filter((c) => c.id === id).map((c) => ({ inbox: i, conv: c }))))

  const myWorkViews = [MY_WORK, ...(sections.flatMap((sec) => sec.items).find((it) => it.id === MY_WORK)?.views?.map((v) => v.id) ?? [])]
  const inboxOf = (key: string) => inboxes.find((i) => keyOf(i) === key)
  // Going to a view selects the first conversation in it (Tags and All Views show no list).
  // Prototype only: these sidebar entries are clickable but do nothing.
  const inert = ['Team', 'Tickets', 'Tags', 'All Views', 'Personal', 'Sent', 'Drafts', 'Spam', 'All mail']
  const go = (id: string) => {
    const entry = sections.flatMap((sec) => sec.items).flatMap((it) => [it, ...(it.views ?? [])]).find((x) => x.id === id)
    if (entry && inert.includes(entry.label)) return
    setView(id)
    if (id === FOLLOWING) { setSelected(followedEntries[0]?.conv.id); return }
    if (myWorkViews.includes(id)) { setSelected(myWorkEntries[0]?.conv.id); return }
    const itemId = sections.flatMap((sec) => sec.items).find((it) => it.views?.some((v) => v.id === id))?.id
    const inbox = itemId ? inboxOf(itemId) : undefined
    const label = sections.flatMap((sec) => sec.items).flatMap((it) => it.views ?? []).find((v) => v.id === id)?.label
    setSelected(inbox && !hasNoList(id) ? inView(inbox, label)[0]?.id : undefined)
  }
  // The second line of each card is the latest message of its thread, as it stands now (a message you send shows with the reply arrow).
  // Line breaks become spaces, so the preview reads past the greeting ("Hi, Our latest invoice…").
  const flat = (text: string) => text.replace(/\s+/g, ' ').trim()
  const latestFor = (id: string): LatestMessage | undefined => {
    const chat = threads[id]?.filter((m) => m.kind === 'message')
    const lastChat = chat?.[chat.length - 1]
    if (lastChat && lastChat.kind === 'message') return { text: flat(lastChat.text), sent: lastChat.from === 'agent' }
    const slack = slackThreads[id]
    if (slack?.length) return { text: flat(slack[slack.length - 1].text), sent: slack[slack.length - 1].from === 'agent' }
    const email = emailThreads[id]
    if (email?.length) return { text: flat(email[email.length - 1].body), sent: email[email.length - 1].email === emailAgentAddress }
    return undefined
  }

  // The inbox and view being shown, found from the sidebar's own data.
  const currentView = sections.flatMap((sec) => sec.items).flatMap((item) => (item.views ?? []).map((v) => ({ inbox: inboxOf(item.id), view: v }))).find((x) => x.view.id === view && x.inbox && !hasNoList(view))
  const isFollowing = view === FOLLOWING
  const isMyWork = myWorkViews.includes(view)
  const myWorkViewLabel = sections.flatMap((sec) => sec.items).flatMap((it) => it.views ?? []).find((v) => v.id === view)?.label
  const personalEntries = isFollowing ? followedEntries : myWorkEntries
  const isPersonal = isFollowing || isMyWork
  // The open conversation and its inbox. In Following or My Work it can come from any email inbox, and stays open after Unfollow.
  const openEntry = inboxes.flatMap((i) => i.conversations.map((c) => ({ inbox: i, conv: c }))).find((e) => e.conv.id === selected)
  const inbox = isPersonal ? openEntry?.inbox ?? personalEntries[0]?.inbox : currentView?.inbox
  // Access was revoked: the conversation is not shown, even from an old link.
  const noAccess = !!openEntry && revoked.includes(keyOf(openEntry.inbox))
  // Other inboxes you can reach that hold the same email.
  const otherInboxes = openEntry ? accessible.filter((i) => i.id !== openEntry.inbox.id && i.conversations.some((c) => c.email === openEntry.conv.email && c.subject === openEntry.conv.subject)).map((i) => i.label) : []
  const channel = inbox?.channel
  const selectedConv = inbox?.conversations.find((c) => c.id === selected)
  const selectedIndex = inbox && selected ? inbox.conversations.findIndex((c) => c.id === selected) : 0
  const listItems = isFollowing
    ? followedEntries.map(({ inbox: i, conv: c }) => ({ ...toListItem(c), preview: c.subject ?? '', sla: undefined, moreCount: undefined, tags: [{ label: i.label }, statusTag[statuses[c.id] ?? 'open']] }))
    : isMyWork
    ? myWorkEntries.map(({ inbox: i, conv: c }) => ({ ...toListItem(c), preview: c.subject ?? '', sla: undefined, moreCount: undefined, tags: [{ label: i.label }, { label: assigneeOf(c.id) === ME ? 'Assignee' : 'Co-assignee' }, statusTag[statuses[c.id] ?? 'open']] }))
    : inbox ? withLatest(inView(inbox, currentView?.view.label).map(toListItem), latestFor) : []
  const color = avatarColors[Math.max(selectedIndex, 0) % avatarColors.length]

  return (
    <div style={{ height: '100vh' }}>
      <PageLayout
        variant="home"
        sidebarCollapsed={sidebarCollapsed}
        nav={<MainNav items={navSampleItems} footerItems={navSampleFooterItems} value={navValue} onChange={(id) => {
          // The bell opens the follower alerts beside it; the page stays.
          if (id === 'notifications') { const open = !bellOpen; setBellOpen(open); setNavValue(open ? 'notifications' : 'conversations'); return }
          setBellOpen(false); setNavValue(id); onNavChange?.(id)
        }} user={{ initial: 'A', name: 'Alex' }} userMenu={navSampleUserMenu} />}
        sidebar={<ConversationsSidebar key={sidebarKey} sections={sections} value={view}
          onChange={go}
          // Opening an inbox lands on its first view.
          onExpandedChange={(id, open) => { const firstView = sections.flatMap((sec) => sec.items).find((i) => i.id === id)?.views?.[0]; if (open && firstView) go(firstView.id) }}
        />}
        rightPanel={noAccess || !selectedConv ? undefined : <HomeRightPanel
          inboxName={inbox?.label ?? ''}
          coAssignee={channel === 'email'}
          customFields={customFields}
          contact={selectedConv ? { name: selectedConv.name, email: channel === 'email' ? customerAddress(selectedConv) : selectedConv.email } : undefined}
          status={(selected && statuses[selected]) || 'open'}
          onStatusChange={(s) => selected && changeStatus(selected, s)}
          following={followPlacement === 'panel' && channel === 'email' && selected ? followed.includes(selected) : undefined}
          onFollowChange={(on) => selected && requestFollow(selected, on)}
          followBusy={!!selected && followBusy === selected}
          followError={followError && followError.id === selected ? `Couldn't ${followError.on ? 'follow' : 'unfollow'} this conversation.` : undefined}
          onFollowRetry={() => followError && requestFollow(followError.id, followError.on)}
          people={people}
          assignee={selected ? assigneeOf(selected) : 'praveen'}
          onAssigneeChange={(v) => selected && setAssignees((p) => ({ ...p, [selected]: v }))}
          coAssigneeValue={selected ? coAssigneeOf(selected) : NONE}
          onCoAssigneeChange={(v) => selected && setCoAssignees((p) => ({ ...p, [selected]: v }))}
          otherInboxes={channel === 'email' ? otherInboxes : undefined}
          onOpenInbox={(label) => {
            // Go to that inbox, on the view that lists this email's copy (Mine or Unassigned), with the copy open.
            const to = accessible.find((i) => i.label === label)
            const copy = to?.conversations.find((c) => c.email === openEntry?.conv.email && c.subject === openEntry?.conv.subject)
            if (!to || !copy) return
            const views = sections.flatMap((sec) => sec.items).find((it) => it.id === keyOf(to))?.views ?? []
            const v = views.find((x) => !hasNoList(x.id) && inView(to, x.label).some((c) => c.id === copy.id)) ?? views[0]
            if (!v) return
            setExpandedInbox(keyOf(to))
            setSidebarKey((k) => k + 1)
            setView(v.id)
            setSelected(copy.id)
          }}
          onRemoveFromInbox={() => {
            if (!selected) return
            setRemoved((p) => [...p, selected])
            setFollowed((p) => p.filter((x) => x !== selected))
            setSelected(listItems.find((c) => c.id !== selected)?.id)
          }}
        />}
      >
        {isPersonal && personalEntries.length === 0 && !noAccess && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            {isFollowing
              ? <EmptyState icon="email" title="No followed conversations" description="Open a conversation in a shared email inbox and choose Follow to keep an eye on it here." />
              : <EmptyState icon="email" title="Nothing in My Work" description="Conversations assigned or co-assigned to you show here." />}
          </div>
        )}
        {(isPersonal ? personalEntries.length > 0 || noAccess : currentView) && inbox && channel && (
          <div style={{ display: 'flex', height: '100%' }}>
            <ConversationList
              title={isFollowing ? 'Following' : isMyWork ? myWorkViewLabel ?? 'My Work' : currentView?.view.label ?? ''}
              icon={isFollowing ? 'view2' : undefined}
              subtitle={isFollowing ? 'Shared email inboxes' : isMyWork ? 'My Work' : undefined}
              channel={channel}
              conversations={listItems}
              selectedId={selected}
              onSelect={setSelected}
              onIconClick={() => setSidebarCollapsed((c) => !c)}
              iconLabel={sidebarCollapsed ? 'Show the sidebar' : 'Hide the sidebar'}
            />
            {noAccess && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmptyState icon="sharedinbox" title="You don't have access to this conversation" description="You no longer have access to its inbox, so it has been removed from Following. Ask an admin if you need it back." />
              </div>
            )}
            {channel === 'email' && selectedConv && selected && !noAccess && (
              <EmailConversation
                key={selected}
                subject={selectedConv.subject ?? 'No subject'}
                messages={emailThreads[selected] ?? []}
                actions={followPlacement === 'toolbar' ? (
                  <>
                    <Tooltip content={followed.includes(selected) ? 'Unfollow' : 'Follow'} placement="bottom">
                      <Button iconOnly variant={followed.includes(selected) ? 'secondary-filled' : 'ghost'} size="xs" disabled={followBusy === selected} aria-label={followed.includes(selected) ? 'Unfollow' : 'Follow'} aria-pressed={followed.includes(selected)} onClick={() => requestFollow(selected, !followed.includes(selected))}>
                        <Icon name="view2" size={16} />
                      </Button>
                    </Tooltip>
                    {followError?.id === selected && (
                      <Tooltip content={`Couldn't ${followError.on ? 'follow' : 'unfollow'}. Retry`} placement="bottom">
                        <Button size="xs" variant="ghost" iconLeft={<Icon name="erroricon" size={16} />} onClick={() => requestFollow(followError.id, followError.on)}>Retry</Button>
                      </Tooltip>
                    )}
                  </>
                ) : undefined}
                onSend={(text) => {
                  const id = selected
                  setEmailThreads((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), agentEmail(text)] }))
                  scheduleEmailReply(customerAddress(selectedConv), color, (reply) => { setEmailThreads((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), reply] })); customerReplied(id) })
                }}
              />
            )}
            {channel === 'slack' && selectedConv && selected && (
              <SlackConversation
                key={selected}
                name={selectedConv.name}
                channelName={selectedConv.slackChannel ?? 'support'}
                avatarColor={color}
                items={slackThreads[selected] ?? []}
                onSend={(text) => {
                  const id = selected
                  setSlackThreads((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), agentMessage(text)] }))
                  scheduleSlackReply((reply) => setSlackThreads((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), reply] })))
                }}
                onAddReaction={(mid, emoji) => setSlackThreads((prev) => ({ ...prev, [selected]: addReaction(prev[selected] ?? [], mid, emoji) }))}
                onRemoveReaction={(mid, emoji) => setSlackThreads((prev) => ({ ...prev, [selected]: removeReaction(prev[selected] ?? [], mid, emoji) }))}
                onDelete={(mid) => setSlackThreads((prev) => ({ ...prev, [selected]: deleteMessage(prev[selected] ?? [], mid) }))}
              />
            )}
            {isChat(channel) && selectedConv && selected && (
              <ChatConversation
                key={selected}
                channel={channel}
                name={selectedConv.name}
                avatarColor={color}
                items={threads[selected] ?? []}
                onSend={(text) => {
                  const id = selected
                  setThreads((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), { id: String((prev[id]?.length ?? 0) + 1), kind: 'message', from: 'agent', agentName: 'Perry', text, time: nowLabel(), status: channel === 'whatsapp' ? 'sent' : undefined }] }))
                  // The customer answers a moment later, to mimic a conversation.
                  scheduleUserReply((reply) => setThreads((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), reply] })))
                }}
              />
            )}
          </div>
        )}
      </PageLayout>
      {/* Prototype only: switch where Follow sits, to compare the options. */}
      <div style={{ position: 'fixed', left: '50%', bottom: 'var(--spacing4)', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', alignItems: 'center', gap: 'var(--spacing3)', padding: 'var(--spacing2) var(--spacing3)', background: 'var(--slateSurfaceWhite)', border: '1px solid var(--slateBorderMild)', borderRadius: 'var(--radiusFull)', boxShadow: '0 6px 30px color-mix(in srgb, var(--slateTextTitle) 6%, transparent)' }}>
        <span className="text-body-sm-medium" style={{ color: 'var(--slateTextSubtle)', whiteSpace: 'nowrap' }}>Follow placement</span>
        <Tabs variant="filled" tabs={[{ value: 'panel', label: 'Right panel' }, { value: 'toolbar', label: 'Email toolbar' }]} value={followPlacement} onChange={(v: string) => setFollowPlacement(v as 'panel' | 'toolbar')} />
        {/* Prototype only: play follower events, to see alerts arrive in the bell. */}
        <span aria-hidden="true" style={{ width: 1, alignSelf: 'stretch', background: 'var(--slateBorderLight)' }} />
        <NotificationSimulator label="Notifications" sections={notificationSections} onPlay={playEvent} />
        <NotificationSimulator label="Scenarios" sections={scenarioSections(failNext, revoked.length > 0)} onPlay={playScenario} />
      </div>
      <BellDot show={alerts.some((a) => { const e = findConv(a.convId); return !a.read && (!e || !revoked.includes(keyOf(e.inbox))) })} />
      {bellOpen && <NotificationsPanel alerts={alerts.filter((a) => { const e = findConv(a.convId); return !e || !revoked.includes(keyOf(e.inbox)) })} onOpen={openAlert} onToggleRead={(t) => setAlerts((prev) => prev.map((x) => (x.id === t.id ? { ...x, read: !x.read } : x)))} onMarkAllRead={() => setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))} onClose={() => { closeBell(); setNavValue('conversations') }} />}
    </div>
  )
}
