import { useEffect, useState } from 'react'

/** A small dot on the bell in the Main nav while there are unread notifications. Main nav has no badge, so it is placed over the bell from the page. */
export function BellDot({ show }: { show: boolean }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  useEffect(() => {
    const place = () => {
      const bell = document.querySelector('.hot-main-nav [aria-label="Notifications"]')
      if (!bell) return
      const r = bell.getBoundingClientRect()
      setPos({ top: r.top + r.height * 0.25, left: r.left + r.width * 0.62 })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [])
  if (!show || !pos) return null
  return (
    <span
      aria-label="Unread notifications"
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 21, width: 8, height: 8, borderRadius: 'var(--radiusFull)', background: 'var(--errorSurfaceDefault)', boxShadow: '0 0 0 2px var(--slateSurfaceDarkest)', pointerEvents: 'none' }}
    />
  )
}
