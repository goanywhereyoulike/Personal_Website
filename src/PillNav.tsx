import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './PillNav.css'

type PillNavItem = {
  id: string
  label: string
}

type PillNavProps = {
  items: PillNavItem[]
  activeId: string
  open?: boolean
  onNavigate?: () => void
  ariaLabel: string
}

export default function PillNav({ items, activeId, open = false, onNavigate, ariaLabel }: PillNavProps) {
  const circleRefs = useRef<Array<HTMLSpanElement | null>>([])

  useEffect(() => {
    circleRefs.current.forEach(circle => circle && gsap.set(circle, { scale: 0 }))
    return () => {
      circleRefs.current.forEach(circle => circle && gsap.killTweensOf(circle))
    }
  }, [items])

  const reveal = (index: number) => {
    if (items[index].id === activeId) return
    const circle = circleRefs.current[index]
    if (circle) gsap.to(circle, { scale: 1.18, duration: 0.42, ease: 'power3.out', overwrite: true })
  }

  const conceal = (index: number) => {
    const circle = circleRefs.current[index]
    if (circle) gsap.to(circle, { scale: 0, duration: 0.28, ease: 'power2.out', overwrite: true })
  }

  return (
    <nav id="main-navigation" className={`pill-nav${open ? ' nav-open' : ''}`} aria-label={ariaLabel}>
      {items.map((item, index) => {
        const active = item.id === activeId
        return (
          <a
            className={`pill-nav-link intro intro-soft${active ? ' is-active' : ''}`}
            key={item.id}
            href={`#${item.id}`}
            aria-current={active ? 'location' : undefined}
            onClick={onNavigate}
            onMouseEnter={() => reveal(index)}
            onMouseLeave={() => conceal(index)}
            onFocus={() => reveal(index)}
            onBlur={() => conceal(index)}
          >
            <span
              className="pill-nav-fill"
              aria-hidden="true"
              ref={element => { circleRefs.current[index] = element }}
            />
            <span className="pill-nav-label">{item.label}</span>
          </a>
        )
      })}
    </nav>
  )
}
