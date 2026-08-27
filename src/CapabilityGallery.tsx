import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './CapabilityGallery.css'

gsap.registerPlugin(ScrollTrigger)

export type CapabilityGalleryItem = {
  title: string
  body: string
  image: string
  alt: string
}

type CapabilityGalleryProps = {
  items: readonly CapabilityGalleryItem[]
  ariaLabel: string
}

export default function CapabilityGallery({ items, ariaLabel }: CapabilityGalleryProps) {
  const [active, setActive] = useState(Math.min(1, items.length - 1))
  const rootRef = useRef<HTMLDivElement | null>(null)
  const panelRefs = useRef<Array<HTMLElement | null>>([])
  const mediaRefs = useRef<Array<HTMLImageElement | null>>([])
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    const panels = panelRefs.current.filter((panel): panel is HTMLElement => Boolean(panel))
    if (!root || !panels.length) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      gsap.set(panels, { autoAlpha: 1, clearProps: 'transform,opacity,visibility,willChange' })
      return
    }

    let fallbackObserver: IntersectionObserver | null = null
    const context = gsap.context(() => {
      const copies = gsap.utils.toArray<HTMLElement>('.capability-panel-copy', root)
      const sweep = root.querySelector<HTMLElement>('.capability-gallery-sweep')
      let hasPlayed = false

      // The gallery is deliberately left visible in its resting state. ScrollTrigger
      // starts an enhanced reveal only when the section enters the viewport, so a
      // missed trigger can never strand portfolio content at opacity: 0.
      const playReveal = () => {
        if (hasPlayed) return
        hasPlayed = true

        const timeline = gsap.timeline()
        timeline.fromTo(panels, {
          autoAlpha: 0.38,
          y: 118,
          scaleY: 0.88,
          rotationX: 8,
          clipPath: 'inset(0 0 16% 0 round 14px)',
          transformPerspective: 1200,
          transformOrigin: '50% 100%',
          willChange: 'transform, opacity, clip-path',
        }, {
          autoAlpha: 1,
          y: 0,
          scaleY: 1,
          rotationX: 0,
          clipPath: 'inset(0 0 0% 0 round 14px)',
          duration: 1.5,
          stagger: 0.12,
          ease: 'expo.out',
          clearProps: 'transform,opacity,visibility,willChange,clipPath',
        })
          .fromTo(copies, {
            autoAlpha: 0.3,
            y: 34,
          }, {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          stagger: 0.08,
          ease: 'power4.out',
          clearProps: 'transform,opacity,visibility',
          }, 0.46)

        if (sweep) {
          timeline
            .fromTo(sweep, { autoAlpha: 0, x: -12 }, { autoAlpha: 0.72, x: 0, duration: 0.18, ease: 'power2.out' }, 0.1)
            .to(sweep, { x: () => root.clientWidth + 12, duration: 1.35, ease: 'power3.inOut' }, 0.16)
            .to(sweep, { autoAlpha: 0, duration: 0.36, ease: 'power2.out' }, 1.06)
        }
      }

      ScrollTrigger.create({
        trigger: root,
        start: 'top 88%',
        end: 'bottom 10%',
        once: true,
        fastScrollEnd: 1200,
        invalidateOnRefresh: true,
        onEnter: playReveal,
        onEnterBack: playReveal,
        onUpdate: self => {
          if (self.progress > 0) playReveal()
        },
        onRefresh: self => {
          const rect = root.getBoundingClientRect()
          if ((rect.top < window.innerHeight * 0.88 && rect.bottom > 0) || self.scroll() > self.start) {
            playReveal()
          }
        },
      })

      // A lightweight intersection fallback covers hash jumps, restored scroll
      // positions and HMR remounts; ScrollTrigger remains the primary controller.
      fallbackObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) playReveal()
      }, { threshold: 0.08 })
      fallbackObserver.observe(root)
    }, root)

    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => {
      window.cancelAnimationFrame(refreshFrame)
      fallbackObserver?.disconnect()
      context.revert()
    }
  }, [items])

  useEffect(() => {
    timelineRef.current?.kill()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timeline = gsap.timeline()

    panelRefs.current.forEach((panel, index) => {
      if (!panel) return
      const expanded = index === active
      timeline.to(panel, {
        flexGrow: expanded ? 3.25 : 1,
        duration: reduced ? 0 : 0.65,
        ease: 'power3.out',
        overwrite: 'auto',
      }, 0)

      const media = mediaRefs.current[index]
      if (media) {
        timeline.to(media, {
          scale: expanded ? 1 : 1.055,
          xPercent: expanded ? 0 : index < active ? -2.5 : 2.5,
          duration: reduced ? 0 : 0.75,
          ease: 'power3.out',
          overwrite: 'auto',
        }, 0)
      }
    })

    timelineRef.current = timeline
    return () => { timeline.kill() }
  }, [active, items])

  useEffect(() => {
    if (active > items.length - 1) setActive(Math.max(0, items.length - 1))
  }, [active, items.length])

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index + 1) % items.length)
      panelRefs.current[(index + 1) % items.length]?.focus()
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      const previous = (index - 1 + items.length) % items.length
      setActive(previous)
      panelRefs.current[previous]?.focus()
    }
  }

  return (
    <div className="capability-gallery" role="list" aria-label={ariaLabel} ref={rootRef}>
      <span className="capability-gallery-sweep" aria-hidden="true" />
      {items.map((item, index) => {
        const expanded = index === active
        return (
          <article
            className={`capability-panel${expanded ? ' is-active' : ''}`}
            key={item.title}
            role="listitem"
            tabIndex={0}
            aria-current={expanded ? 'true' : undefined}
            ref={element => { panelRefs.current[index] = element }}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
            onKeyDown={event => handleKeyDown(index, event)}
          >
            <img
              ref={element => { mediaRefs.current[index] = element }}
              src={item.image}
              alt={item.alt}
              width="1672"
              height="941"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              draggable="false"
              onLoad={event => event.currentTarget.closest('.capability-panel')?.classList.add('is-image-loaded')}
            />
            <span className="capability-panel-shade" aria-hidden="true" />
            <div className="capability-panel-top"><span>0{index + 1}</span><span>{expanded ? '—' : '+'}</span></div>
            <div className="capability-panel-copy">
              <span className="capability-panel-rule" aria-hidden="true" />
              <div><h3>{item.title}</h3><p>{item.body}</p></div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
