import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Play } from 'lucide-react' // Prototype only: HOT has no play icon yet.
import { Button } from '../../components/Button'
import { Icon } from '../../icons/Icon'

/** The follower events the prototype can play. */
export type SimulatedEvent = 'teammate-closes' | 'teammate-reopens' | 'customer-reopens' | 'teammate-pending' | 'customer-replies-open'

const sections: { title: string; items: { event: SimulatedEvent; label: string; note: string }[] }[] = [
  { title: 'Closed', items: [
    { event: 'teammate-closes', label: 'Closed by a teammate', note: 'Praveen Borawar closes it' },
  ] },
  { title: 'Reopened', items: [
    { event: 'teammate-reopens', label: 'Reopened by a teammate', note: 'Praveen Borawar reopens it' },
    { event: 'customer-reopens', label: 'Reopened by a customer reply', note: 'The customer replies after it was closed' },
  ] },
  { title: 'No notification', items: [
    { event: 'teammate-pending', label: 'Set to Pending', note: 'Open to Pending sends nothing' },
    { event: 'customer-replies-open', label: 'Customer replies while open', note: 'A reply that does not reopen sends nothing' },
  ] },
]

/** Prototype only: "Notifications ^" opens a panel above it with the follower events, grouped. Play makes one happen. */
export function NotificationSimulator({ onPlay }: { onPlay: (event: SimulatedEvent) => void }) {
  const [open, setOpen] = useState(false)
  // The flyout sits above the whole bottom bar (not inside it), centred on the Notifications button.
  const [pos, setPos] = useState({ bottom: 0, left: 0 })
  const toggle = () => {
    const button = root.current?.getBoundingClientRect()
    const bar = root.current?.parentElement?.getBoundingClientRect()
    if (button && bar) setPos({ bottom: window.innerHeight - bar.top + 8, left: button.left + button.width / 2 })
    if (open) close()
    else setOpen(true)
  }
  // Scales and fades in from the button as it opens, and back out as it closes.
  const shown = { opacity: 1, transform: 'translateX(-50%) translateY(0) scale(1)' }
  const hidden = { opacity: 0, transform: 'translateX(-50%) translateY(6px) scale(0.95)' }
  useEffect(() => {
    if (open) flyout.current?.animate([hidden, shown], { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' })
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => {
    const a = flyout.current?.animate([shown, hidden], { duration: 120, easing: 'cubic-bezier(0.3, 0, 1, 1)', fill: 'forwards' })
    if (a) a.onfinish = () => setOpen(false)
    else setOpen(false)
  }
  const root = useRef<HTMLDivElement>(null)
  const flyout = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<SimulatedEvent | null>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { const t = e.target as Node; if (!root.current?.contains(t) && !flyout.current?.contains(t)) close() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={root} style={{ position: 'relative' }}>
      <Button size="xs" variant="secondary" aria-expanded={open} iconRight={<Icon name={open ? 'chevrondown' : 'chevrontop'} size={16} />} onClick={toggle}>Notifications</Button>
      {open && createPortal(
        <div ref={flyout} role="dialog" aria-label="Simulate notifications" style={{ position: 'fixed', zIndex: 30, bottom: pos.bottom, left: pos.left, transform: 'translateX(-50%)', transformOrigin: 'bottom center', width: 360, padding: 'var(--spacing3)', background: 'var(--slateSurfaceWhite)', border: '1px solid var(--slateBorderLight)', borderRadius: 'var(--radius8)', boxShadow: '0 6px 30px color-mix(in srgb, var(--slateTextTitle) 6%, transparent)' }}>
          {sections.map((s, i) => (
            <section key={s.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing1)', paddingTop: i ? 'var(--spacing3)' : 0, marginTop: i ? 'var(--spacing3)' : 0, borderTop: i ? '1px solid var(--slateBorderLight)' : undefined }}>
              <h3 className="text-body-sm-medium" style={{ margin: 0, padding: 'var(--spacing1) var(--spacing3)', color: 'var(--slateTextSubtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.title}</h3>
              {s.items.map((it) => (
                <button
                  key={it.event}
                  type="button"
                  aria-label={`Play: ${it.label}`}
                  onClick={() => onPlay(it.event)}
                  onMouseEnter={() => setHover(it.event)}
                  onMouseLeave={() => setHover(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing3)', width: '100%', padding: 'var(--spacing2) var(--spacing3)', border: 0, borderRadius: 'var(--radius6)', background: hover === it.event ? 'var(--slateSurfaceSubtle)' : 'transparent', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
                >
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing05)' }}>
                    <span className="text-body-md-medium" style={{ color: 'var(--slateTextBody)' }}>{it.label}</span>
                    <span className="text-body-sm-regular" style={{ color: 'var(--slateTextSubtle)' }}>{it.note}</span>
                  </span>
                  <span aria-hidden="true" style={{ display: 'flex', color: 'var(--slateTextSubtle)' }}><Play size={14} strokeWidth={2} /></span>
                </button>
              ))}
            </section>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
