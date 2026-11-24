import { useEffect, useRef, useState } from 'react'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Tabs } from '../../components/Tabs'
import { Tooltip } from '../../components/Tooltip'
import { Icon } from '../../icons/Icon'
import { EmptyState } from '../../patterns/EmptyState'

/** One follower alert in the bell: a followed conversation was closed or reopened. */
export type FollowerAlert = {
  id: string
  convId: string
  kind: 'closed' | 'reopened'
  subject: string
  inbox: string
  /** Who or what changed it, for example "Praveen Borawar" or "a customer reply". */
  by: string
  time: string
  read: boolean
}

export type NotificationsPanelProps = {
  alerts: FollowerAlert[]
  onOpen: (alert: FollowerAlert) => void
  onToggleRead: (alert: FollowerAlert) => void
  onMarkAllRead: () => void
  onClose: () => void
}

/** The panel the bell in the Main nav opens (Figma "Notification panel"): Unread / All tabs, mark all as read, the alerts. Floats beside the Main nav, 14px from the window edges. */
export function NotificationsPanel({ alerts, onOpen, onToggleRead, onMarkAllRead, onClose }: NotificationsPanelProps) {
  const [left, setLeft] = useState(0)
  const [tab, setTab] = useState('unread')
  const panel = useRef<HTMLDivElement>(null)
  // Slides in from the left, 10px, as it opens.
  useEffect(() => {
    panel.current?.animate([{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' })
  }, [])
  // Slides back out 10px to the left, then closes (or opens the clicked alert).
  const leave = (then: () => void) => {
    const a = panel.current?.animate([{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(-10px)' }], { duration: 90, easing: 'cubic-bezier(0.3, 0, 1, 1)', fill: 'forwards' })
    if (a) a.onfinish = then
    else then()
  }
  useEffect(() => {
    const nav = document.querySelector('.hot-main-nav')
    if (nav) setLeft(nav.getBoundingClientRect().right)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') leave(onClose) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const unread = alerts.filter((a) => !a.read)
  const shown = tab === 'unread' ? unread : alerts
  const rows = shown
  const verb = (a: FollowerAlert) => (a.kind === 'closed' ? 'Closed' : 'Reopened')

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => leave(onClose)} aria-hidden="true" />
      <div ref={panel} role="dialog" aria-label="Notifications" style={{ position: 'fixed', top: 'var(--scale35)', bottom: 'var(--scale35)', left: `calc(${left}px + var(--scale35))`, zIndex: 20, width: 500, padding: 'var(--spacing2)', display: 'flex', flexDirection: 'column', background: 'var(--slateSurfaceWhite)', border: '1px solid var(--slateBorderLight)', borderRadius: 'var(--radius8)', boxShadow: '0 6px 30px color-mix(in srgb, var(--slateTextTitle) 6%, transparent)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 'var(--spacing4)', borderBottom: '1px solid var(--slateBorderLight)' }}>
          <Tabs
            tabs={[
              { value: 'unread', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing15)' }}>Unread <Badge>{unread.length}</Badge></span> },
              { value: 'all', label: 'All' },
            ]}
            value={tab}
            onChange={(v: string) => setTab(v)}
          />
          <Tooltip content="Mark all as read">
            <Button iconOnly variant="ghost" size="xs" aria-label="Mark all as read" disabled={unread.length === 0} onClick={onMarkAllRead}><Icon name="markasread" size={16} /></Button>
          </Tooltip>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: 'var(--spacing2) var(--spacing1)' }}>
          {rows.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState icon="notification" title={tab === 'unread' ? 'No unread notifications' : 'No notifications'} description="You'll see an update here when a conversation you follow is closed or reopened." />
            </div>
          ) : rows.map((a) => (
            <div
              key={a.id}
              role="button"
              tabIndex={0}
              onClick={() => leave(() => onOpen(a))}
              onKeyDown={(e) => { if (e.key === 'Enter') leave(() => onOpen(a)) }}
              style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 'var(--spacing3)', padding: 'var(--spacing2) var(--spacing4) var(--spacing2) var(--spacing2)', borderRadius: 'var(--radius6)', cursor: 'pointer' }}
            >
              <span style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 2, color: 'var(--slateTextBody)' }}>
                <Icon name={a.kind === 'closed' ? 'closedstatus' : 'openstatus'} size={16} />
              </span>
              <div className="text-body-md-medium" style={{ minWidth: 0, color: a.read ? 'var(--slateTextSubtle)' : 'var(--slateTextBody)' }}>
                <div>{verb(a)} by {a.by} in {a.inbox} :</div>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.subject}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--spacing1)' }}>
                <Tooltip content={a.read ? 'Mark as unread' : 'Mark as read'}>
                  <Button iconOnly variant="ghost" size="xs" aria-label={a.read ? 'Mark as unread' : 'Mark as read'} onClick={(e) => { e.stopPropagation(); onToggleRead(a) }}>
                    <Icon name={a.read ? 'markasunread' : 'markasread'} size={12} />
                  </Button>
                </Tooltip>
                <span className="text-body-sm-regular" style={{ color: 'var(--slateTextSubtle)', whiteSpace: 'nowrap' }}>{a.time}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  )
}
