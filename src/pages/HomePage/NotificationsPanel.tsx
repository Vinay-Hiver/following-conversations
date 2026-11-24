import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { ListIcon, ListItem } from '../../components/List'
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
  onMarkAllRead: () => void
  onClose: () => void
}

/** The panel the bell in the Main nav opens: follower alerts, newest first. It sits to the right of the bell. */
export function NotificationsPanel({ alerts, onOpen, onMarkAllRead, onClose }: NotificationsPanelProps) {
  const [top, setTop] = useState(0)
  const [left, setLeft] = useState(0)
  useEffect(() => {
    const bell = document.querySelector('.hot-main-nav [aria-label="Notifications"]')
    const nav = document.querySelector('.hot-main-nav')
    if (bell) setTop(bell.getBoundingClientRect().top)
    if (nav) setLeft(nav.getBoundingClientRect().right + 4)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const unread = alerts.filter((a) => !a.read).length

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-label="Notifications" style={{ position: 'fixed', top, left, zIndex: 20, width: 360, maxHeight: '70vh', display: 'flex', flexDirection: 'column', background: 'var(--slateSurfaceWhite)', border: '1px solid var(--slateBorderDefault)', borderRadius: 'var(--radius8)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--spacing3) var(--spacing4)', borderBottom: '1px solid var(--slateBorderLight)' }}>
          <h2 className="text-heading-sm" style={{ margin: 0, color: 'var(--slateTextTitle)' }}>Notifications</h2>
          <Button variant="ghost" size="xs" disabled={unread === 0} onClick={onMarkAllRead}>Mark all as read</Button>
        </div>
        {alerts.length === 0 ? (
          <div style={{ padding: 'var(--spacing6) var(--spacing4)' }}>
            <EmptyState icon="notification" title="No notifications" description="You'll see an update here when a conversation you follow is closed or reopened." />
          </div>
        ) : (
          <div style={{ overflowY: 'auto', padding: 'var(--spacing1) 0' }}>
            {alerts.map((a) => (
              <ListItem
                key={a.id}
                leading={<ListIcon name={a.kind === 'closed' ? 'closedstatus' : 'openstatus'} />}
                label={
                  <span className={a.read ? 'text-body-md-regular' : 'text-body-md-medium'} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing15)' }}>
                    {!a.read && <span aria-label="Unread" style={{ flex: 'none', width: 'var(--spacing15)', height: 'var(--spacing15)', borderRadius: '50%', background: 'var(--primarySurfaceDefault)' }} />}
                    {a.kind === 'closed' ? 'Closed' : 'Reopened'}: {a.subject}
                  </span>
                }
                description={`${a.inbox} · ${a.kind === 'closed' ? 'Closed' : 'Reopened'} by ${a.by} · ${a.time}`}
                onClick={() => onOpen(a)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
