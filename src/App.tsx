import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { content, type Locale, type Project } from './content'
import GradientWaves from './GradientWaves'
import PillNav from './PillNav'
import CapabilityGallery from './CapabilityGallery'

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true })

const EMAIL = 'zhen.fang1993@hotmail.com'
const emailHref = (locale: Locale) => {
  const subject = locale === 'en' ? 'Technical art opportunity — Zhen Fang' : '技术美术岗位与项目沟通 — 方震'
  return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`
}
const SOCIAL_LINKS = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/goanywhereyoulike', mark: 'GH' },
  { id: 'bilibili', label: 'Bilibili', href: 'https://space.bilibili.com/2636825', mark: 'BILI' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/zhen-fang/', mark: 'in' },
] as const
const EXPERIENCE_ORDER = [4, 3, 1, 2, 0]
const HOME_META = {
  en: {
    title: 'Zhen Fang — Technical Artist',
    description: 'Technical artist portfolio focused on real-time rendering, VFX, simulation, engine development, and production tools.',
    imageAlt: 'Zhen Fang — Technical Artist portfolio preview',
  },
  'zh-CN': {
    title: '方震 — 技术美术作品集',
    description: '方震的技术美术作品集，聚焦实时渲染、视觉特效、模拟、引擎开发与制作工具。',
    imageAlt: '方震技术美术作品集分享预览',
  },
} as const
const CAPABILITIES = {
  en: [
    { title: 'Programming', body: 'C++, C#', image: '/assets/capabilities/skill-programming-v2.webp', alt: 'Minimal abstract programming pipeline' },
    { title: 'Tools', body: 'Git, Maya, Photoshop, ComfyUI', image: '/assets/capabilities/skill-tools-v2.webp', alt: 'Minimal abstract technical art toolchain' },
    { title: 'Graphics & Engines', body: 'Unity, Unreal Engine, HLSL, Shader Graph, VFX Graph, Niagara', image: '/assets/capabilities/skill-graphics-v2.webp', alt: 'Minimal abstract real-time graphics surface' },
    { title: 'Languages', body: 'Mandarin (Native), English (Fluent)', image: '/assets/capabilities/skill-languages-v2.webp', alt: 'Minimal abstract communication waveforms' },
  ],
  'zh-CN': [
    { title: '编程开发', body: 'C++、C#', image: '/assets/capabilities/skill-programming-v2.webp', alt: '极简抽象的程序开发流程示意图' },
    { title: '工具软件', body: 'Git、Maya、Photoshop、ComfyUI', image: '/assets/capabilities/skill-tools-v2.webp', alt: '极简抽象的技术美术工具链示意图' },
    { title: '图形与引擎', body: 'Unity、Unreal Engine、HLSL、Shader Graph、VFX Graph、Niagara', image: '/assets/capabilities/skill-graphics-v2.webp', alt: '极简抽象的实时图形曲面示意图' },
    { title: '语言能力', body: '普通话（母语）、英语（流利）', image: '/assets/capabilities/skill-languages-v2.webp', alt: '极简抽象的双语沟通波形示意图' },
  ],
} as const

function initialLocale(): Locale {
  const pathLocale = window.location.pathname.split('/')[1]
  if (pathLocale === 'en' || pathLocale === 'zh-CN') return pathLocale
  const saved = window.localStorage.getItem('zf-locale')
  if (saved === 'en' || saved === 'zh-CN') return saved
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

function projectFromPath() {
  return window.location.pathname.match(/\/projects\/([^/]+)/)?.[1] ?? null
}

function setMeta(attribute: 'name' | 'property', key: string, contentValue: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = contentValue
}

function setLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`
  let element = document.head.querySelector<HTMLLinkElement>(selector)
  if (!element) {
    element = document.createElement('link')
    element.rel = rel
    if (hreflang) element.hreflang = hreflang
    document.head.appendChild(element)
  }
  element.href = href
}

function Arrow() {
  return <span className="arrow" aria-hidden="true">↗</span>
}

type ProjectPointerState = { frame: number; clientX: number; clientY: number }
const projectPointerStates = new WeakMap<HTMLElement, ProjectPointerState>()

function setPointerPosition(event: ReactPointerEvent<HTMLElement>) {
  const element = event.currentTarget
  const state = projectPointerStates.get(element) ?? { frame: 0, clientX: 0, clientY: 0 }
  state.clientX = event.clientX
  state.clientY = event.clientY
  projectPointerStates.set(element, state)
  if (state.frame) return

  state.frame = window.requestAnimationFrame(() => {
    state.frame = 0
    const rect = element.getBoundingClientRect()
    const x = state.clientX - rect.left
    const y = state.clientY - rect.top
    const rx = ((y / rect.height) - 0.5) * -2.4
    const ry = ((x / rect.width) - 0.5) * 2.4
    element.style.setProperty('--pointer-x', `${x}px`)
    element.style.setProperty('--pointer-y', `${y}px`)
    element.style.setProperty('--rotate-x', `${rx}deg`)
    element.style.setProperty('--rotate-y', `${ry}deg`)
  })
}

function resetPointer(event: ReactPointerEvent<HTMLElement>) {
  const element = event.currentTarget
  const state = projectPointerStates.get(element)
  if (state?.frame) window.cancelAnimationFrame(state.frame)
  projectPointerStates.delete(element)
  element.style.setProperty('--rotate-x', '0deg')
  element.style.setProperty('--rotate-y', '0deg')
}

export default function App() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(projectFromPath)
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [waveActive, setWaveActive] = useState(false)
  const t = content[locale]
  const selectedProject = t.projects.find(item => item.slug === selectedSlug)

  useLayoutEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const opening = root.querySelector<HTMLElement>('.opening-sequence')
    const wave = root.querySelector<HTMLElement>('.site-wave-background')
    const heroTitle = root.querySelector<HTMLElement>('.headline-line > span')
    const heroDescription = root.querySelector<HTMLElement>('.hero-description')
    const headerParts = root.querySelectorAll<HTMLElement>('.brand, .pill-nav, .header-actions, .progress-track')
    const heroFinalLetterSpacing = heroTitle ? window.getComputedStyle(heroTitle).letterSpacing : 'normal'

    if (selectedSlug) {
      if (opening) gsap.set(opening, { display: 'none' })
      return
    }

    if (reducedMotion) {
      if (opening) gsap.set(opening, { display: 'none' })
      return
    }

    document.body.classList.add('opening-active')
    const context = gsap.context(() => {
      gsap.set(headerParts, { autoAlpha: 0, y: -24 })
      gsap.set(wave, { autoAlpha: 0 })
      gsap.set(heroTitle, {
        yPercent: 130,
        scaleX: 0.62,
        scaleY: 1.16,
        skewY: 4,
        letterSpacing: '0.035em',
        clipPath: 'inset(-22% -16% 122% -16%)',
        transformOrigin: '0% 100%',
      })
      gsap.set(heroDescription, { autoAlpha: 0, y: 34, clipPath: 'inset(0 0 100% 0)' })
      gsap.set('.opening-stroke-horizontal', { scaleX: 0, transformOrigin: '0% 50%' })
      gsap.set('.opening-stroke-vertical, .opening-stroke-diagonal', { scaleY: 0, transformOrigin: '50% 0%' })
      gsap.set('.opening-rule', { scaleX: 0, transformOrigin: '0% 50%' })

      gsap.timeline({
        defaults: { ease: 'power4.out' },
        onComplete: () => {
          document.body.classList.remove('opening-active')
          if (opening) gsap.set(opening, { display: 'none' })
          ScrollTrigger.refresh()
        },
      })
        .to('.opening-f-vertical', { scaleY: 1, duration: 0.28, ease: 'power2.inOut' }, 0.12)
        .to('.opening-f-top', { scaleX: 1, duration: 0.2, ease: 'power2.out' }, 0.32)
        .to('.opening-f-middle', { scaleX: 1, duration: 0.18, ease: 'power2.out' }, 0.46)
        .to('.opening-z-top', { scaleX: 1, duration: 0.2, ease: 'power2.out' }, 0.58)
        .to('.opening-z-diagonal', { scaleY: 1, duration: 0.34, ease: 'power2.inOut' }, 0.72)
        .to('.opening-z-bottom', { scaleX: 1, duration: 0.22, ease: 'power2.out' }, 0.98)
        .to('.opening-rule', { scaleX: 1, duration: 1.05, ease: 'expo.inOut' }, 1.12)
        .to('.opening-signature', { autoAlpha: 0, y: -10, duration: 0.44, ease: 'power2.in' }, 2.3)
        .to('.opening-panel-top', { yPercent: -101, duration: 1.18, ease: 'expo.inOut' }, 2.5)
        .to('.opening-panel-bottom', { yPercent: 101, duration: 1.18, ease: 'expo.inOut' }, 2.5)
        .call(() => setWaveActive(true), [], 2.42)
        .to(wave, { autoAlpha: 1, duration: 1.75, ease: 'power3.out' }, 2.58)
        .to(headerParts, { autoAlpha: 1, y: 0, duration: 1.12, stagger: 0.07, clearProps: 'transform,opacity,visibility' }, 2.82)
        .to(heroTitle, {
          yPercent: 0,
          scaleX: 1,
          scaleY: 1,
          skewY: 0,
          letterSpacing: heroFinalLetterSpacing,
          clipPath: 'inset(-22% -16% -32% -16%)',
          duration: 1.68,
          ease: 'expo.out',
          clearProps: 'transform,letterSpacing,clipPath',
        }, 2.86)
        .to(heroDescription, {
          autoAlpha: 1,
          y: 0,
          clipPath: 'inset(0 0 0% 0)',
          duration: 1.18,
          ease: 'power4.out',
          clearProps: 'transform,opacity,visibility,clipPath',
        }, 3.32)
    }, root)

    return () => {
      document.body.classList.remove('opening-active')
      context.revert()
    }
  }, [])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (selectedSlug || reducedMotion) {
      setWaveActive(false)
      return
    }
    if (!document.body.classList.contains('opening-active')) setWaveActive(true)
  }, [selectedSlug])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const revealElements = gsap.utils.toArray<HTMLElement>('[data-reveal]', root)
    if (reducedMotion) {
      gsap.set(revealElements, { autoAlpha: 1, clearProps: 'transform,opacity,visibility,clipPath' })
      return
    }

    const context = gsap.context(() => {
      revealElements.forEach((element, index) => {
        const trigger = { trigger: element, start: 'top 86%', once: true }

        if (element.matches('.section-heading, .projects-heading, .capabilities-heading')) {
          const eyebrow = element.querySelector('.eyebrow')
          const heading = element.querySelector('h2')
          gsap.set(eyebrow, { autoAlpha: 0, x: -54 })
          gsap.set(heading, {
            autoAlpha: 0,
            yPercent: 112,
            scaleX: 0.78,
            skewY: 3.5,
            clipPath: 'inset(0 0 100% 0)',
            transformOrigin: '0% 100%',
          })
          gsap.timeline({ scrollTrigger: trigger })
            .to(eyebrow, {
              autoAlpha: 1,
              x: 0,
              duration: 0.92,
              ease: 'power4.out',
              clearProps: 'transform,opacity,visibility',
            })
            .to(heading, {
              autoAlpha: 1,
              yPercent: 0,
              scaleX: 1,
              skewY: 0,
              clipPath: 'inset(0 0 0% 0)',
              duration: 1.48,
              ease: 'expo.out',
              clearProps: 'transform,opacity,visibility,clipPath',
            }, 0.08)
          return
        }

        if (element.classList.contains('timeline-item')) {
          const indexLabel = element.querySelector('.timeline-index')
          const contentBlock = element.querySelector('.timeline-content')
          gsap.set(element, {
            autoAlpha: 0,
            y: 92,
            rotationX: 7,
            transformPerspective: 1200,
            transformOrigin: '50% 100%',
          })
          gsap.set(indexLabel, { autoAlpha: 0, x: -24 })
          gsap.set(contentBlock, { clipPath: 'inset(0 0 100% 0)' })
          gsap.timeline({ scrollTrigger: trigger })
            .to(element, {
              autoAlpha: 1,
              y: 0,
              rotationX: 0,
              duration: 1.34,
              ease: 'power4.out',
              clearProps: 'transform,opacity,visibility',
            })
            .to(indexLabel, {
              autoAlpha: 1,
              x: 0,
              duration: 0.74,
              ease: 'power3.out',
              clearProps: 'transform,opacity,visibility',
            }, 0.24)
            .to(contentBlock, {
              clipPath: 'inset(0 0 0% 0)',
              duration: 1.14,
              ease: 'expo.inOut',
              clearProps: 'clipPath',
            }, 0.18)
          return
        }

        if (element.classList.contains('project-card')) {
          const imageWrap = element.querySelector('.project-image-wrap')
          const image = element.querySelector('.project-image-wrap img')
          const info = element.querySelector('.project-info')
          gsap.set(imageWrap, { clipPath: 'inset(0 0 100% 0)' })
          gsap.set(image, { scale: 1.12 })
          gsap.set(info, { autoAlpha: 0, y: 58 })
          gsap.timeline({ scrollTrigger: { ...trigger, start: 'top 82%' } })
            .to(imageWrap, {
              clipPath: 'inset(0 0 0% 0)',
              duration: 1.58,
              ease: 'expo.inOut',
              clearProps: 'clipPath',
            })
            .to(image, {
              scale: 1,
              duration: 1.9,
              ease: 'power3.out',
              clearProps: 'transform',
            }, 0.12)
            .to(info, {
              autoAlpha: 1,
              y: 0,
              duration: 1.1,
              ease: 'power4.out',
              clearProps: 'transform,opacity,visibility',
            }, 0.62)
          return
        }

        if (element.classList.contains('contact-main')) {
          const prompt = element.querySelector('p')
          const link = element.querySelector('a')
          gsap.set(prompt, { autoAlpha: 0, x: -42 })
          gsap.set(link, {
            autoAlpha: 0,
            yPercent: 88,
            scaleX: 0.72,
            skewY: 3,
            transformOrigin: '0% 100%',
          })
          gsap.timeline({ scrollTrigger: { ...trigger, start: 'top 80%' } })
            .to(prompt, {
              autoAlpha: 1,
              x: 0,
              duration: 0.95,
              ease: 'power4.out',
              clearProps: 'transform,opacity,visibility',
            })
            .to(link, {
              autoAlpha: 1,
              yPercent: 0,
              scaleX: 1,
              skewY: 0,
              duration: 1.55,
              ease: 'expo.out',
              clearProps: 'transform,opacity,visibility',
            }, 0.12)
          return
        }

        gsap.set(element, {
          autoAlpha: 0,
          y: 58,
          clipPath: 'inset(8% 0 0 0)',
        })
        gsap.to(element, {
          autoAlpha: 1,
          y: 0,
          clipPath: 'inset(0% 0 0 0)',
          duration: 1.16,
          delay: Math.min(index * 0.015, 0.12),
          ease: 'power4.out',
          clearProps: 'transform,opacity,visibility,clipPath',
          scrollTrigger: trigger,
        })
      })
    }, root)

    let cancelled = false
    const refresh = () => !cancelled && ScrollTrigger.refresh()
    const refreshFrame = window.requestAnimationFrame(refresh)
    window.addEventListener('load', refresh, { once: true })
    document.fonts?.ready.then(refresh).catch(() => undefined)

    return () => {
      cancelled = true
      window.cancelAnimationFrame(refreshFrame)
      window.removeEventListener('load', refresh)
      context.revert()
    }
  }, [locale])

  useLayoutEffect(() => {
    const root = rootRef.current
    const caseStudy = root?.querySelector<HTMLElement>('.case-study')
    if (!root || !caseStudy || !selectedSlug) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const caseReveals = gsap.utils.toArray<HTMLElement>('.case-meta, .case-actions, .case-summary, .case-body section', caseStudy)
    if (reducedMotion) {
      gsap.set([caseStudy, ...caseReveals], { autoAlpha: 1, clearProps: 'transform,opacity,visibility,clipPath' })
      return
    }

    const context = gsap.context(() => {
      const heroImage = caseStudy.querySelector('.case-hero > img')
      const heroLabel = caseStudy.querySelector('.case-hero-copy > span')
      const heroTitle = caseStudy.querySelector('.case-hero-copy h2')
      const heroSubtitle = caseStudy.querySelector('.case-hero-copy p')
      const closeButton = caseStudy.querySelector('.case-close')

      gsap.timeline({ defaults: { ease: 'power4.out' } })
        .fromTo(caseStudy, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.62 })
        .fromTo(heroImage, { scale: 1.1 }, {
          scale: 1,
          duration: 1.72,
          ease: 'expo.out',
          clearProps: 'transform',
        }, 0)
        .fromTo(heroLabel, { autoAlpha: 0, x: -38 }, {
          autoAlpha: 1,
          x: 0,
          duration: 0.86,
          clearProps: 'transform,opacity,visibility',
        }, 0.22)
        .fromTo(heroTitle, {
          autoAlpha: 0,
          yPercent: 104,
          scaleX: 0.72,
          skewY: 3,
          clipPath: 'inset(0 0 100% 0)',
          transformOrigin: '0% 100%',
        }, {
          autoAlpha: 1,
          yPercent: 0,
          scaleX: 1,
          skewY: 0,
          clipPath: 'inset(-12% -8% -35% -8%)',
          duration: 1.46,
          ease: 'expo.out',
          clearProps: 'opacity,visibility',
        }, 0.28)
        .fromTo(heroSubtitle, { autoAlpha: 0, y: 24 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.96,
          clearProps: 'transform,opacity,visibility',
        }, 0.72)
        .fromTo(closeButton, { autoAlpha: 0, y: -20, scale: 0.9 }, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.84,
          clearProps: 'transform,opacity,visibility',
        }, 0.48)

      caseReveals.forEach((element, index) => {
        const isSummary = element.classList.contains('case-summary')
        if (isSummary) {
          gsap.set(element, {
            autoAlpha: 0,
            y: 64,
            transformOrigin: '0% 50%',
          })
          gsap.to(element, {
            autoAlpha: 1,
            y: 0,
            duration: 1.28,
            ease: 'power4.out',
            clearProps: 'opacity,visibility',
            scrollTrigger: {
              trigger: element,
              scroller: caseStudy,
              start: 'top 90%',
              once: true,
            },
          })
          return
        }
        gsap.set(element, {
          autoAlpha: 0,
          y: 58,
          clipPath: 'inset(10% 0 0 0)',
          transformOrigin: '0% 50%',
        })
        gsap.to(element, {
          autoAlpha: 1,
          y: 0,
          clipPath: 'inset(0% 0 0 0)',
          duration: 1.08,
          delay: Math.min(index * 0.025, 0.12),
          ease: 'power4.out',
          clearProps: 'transform,opacity,visibility,clipPath',
          scrollTrigger: {
            trigger: element,
            scroller: caseStudy,
            start: 'top 90%',
            once: true,
          },
        })
      })
    }, caseStudy)

    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => {
      window.cancelAnimationFrame(refreshFrame)
      context.revert()
    }
  }, [selectedSlug, locale])

  useEffect(() => {
    if (window.location.pathname === '/') window.history.replaceState({}, '', `/${locale}${window.location.hash}`)

    const homeMeta = HOME_META[locale]
    const title = selectedProject ? `${selectedProject.title} — ${locale === 'en' ? 'Zhen Fang' : '方震'}` : homeMeta.title
    const description = selectedProject?.summary ?? homeMeta.description
    const routeSuffix = selectedProject ? `/projects/${selectedProject.slug}` : ''
    const routePath = `/${locale}${routeSuffix}`
    const alternateLocale: Locale = locale === 'en' ? 'zh-CN' : 'en'
    const alternatePath = `/${alternateLocale}${routeSuffix}`
    const origin = window.location.origin
    const canonicalUrl = `${origin}${routePath}`
    const imagePath = selectedProject?.image ?? '/og.png'
    const imageUrl = new URL(imagePath, origin).href
    const imageAlt = selectedProject?.alt ?? homeMeta.imageAlt

    document.title = title
    setMeta('name', 'description', description)
    setMeta('name', 'robots', 'index, follow, max-image-preview:large')
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', 'Zhen Fang — Technical Artist')
    setMeta('property', 'og:locale', locale === 'en' ? 'en_US' : 'zh_CN')
    setMeta('property', 'og:locale:alternate', locale === 'en' ? 'zh_CN' : 'en_US')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('property', 'og:image', imageUrl)
    setMeta('property', 'og:image:alt', imageAlt)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', imageUrl)
    setMeta('name', 'twitter:image:alt', imageAlt)
    setLink('canonical', canonicalUrl)
    setLink('alternate', `${origin}${routePath}`, locale)
    setLink('alternate', `${origin}${alternatePath}`, alternateLocale)
    setLink('alternate', `${origin}/en${routeSuffix}`, 'x-default')
  }, [locale, selectedProject])

  useEffect(() => {
    let frame = 0
    const updateProgress = () => {
      frame = 0
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      document.documentElement.style.setProperty('--page-progress', `${Math.min(1, window.scrollY / max) * 100}%`)
    }
    const requestProgressUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress)
    }
    updateProgress()
    window.addEventListener('scroll', requestProgressUpdate, { passive: true })
    window.addEventListener('resize', requestProgressUpdate, { passive: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestProgressUpdate)
      window.removeEventListener('resize', requestProgressUpdate)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    let idleTimer = 0
    let frame = 0

    const applyScrollbarActivity = () => {
      frame = 0
      root.classList.remove('scrollbar-idle')
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => root.classList.add('scrollbar-idle'), 5000)
    }
    const showScrollbar = () => {
      if (!frame) frame = window.requestAnimationFrame(applyScrollbarActivity)
    }

    showScrollbar()
    window.addEventListener('scroll', showScrollbar, { passive: true })
    document.addEventListener('scroll', showScrollbar, { capture: true, passive: true })

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.clearTimeout(idleTimer)
      window.removeEventListener('scroll', showScrollbar)
      document.removeEventListener('scroll', showScrollbar, true)
      root.classList.remove('scrollbar-idle')
    }
  }, [])

  useEffect(() => {
    const sectionIds = ['experience', 'projects', 'capabilities', 'contact']
    let frame = 0
    const updateActiveSection = () => {
      frame = 0
      const marker = window.innerHeight * 0.38
      const active = sectionIds.find(id => {
        const section = document.getElementById(id)
        if (!section) return false
        const rect = section.getBoundingClientRect()
        return rect.top <= marker && rect.bottom > marker
      }) ?? ''
      setActiveSection(previous => previous === active ? previous : active)
    }
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection)
    }
    updateActiveSection()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate, { passive: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [])

  useEffect(() => {
    const onPop = () => setSelectedSlug(projectFromPath())
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && selectedSlug && closeProject()
    window.addEventListener('popstate', onPop)
    window.addEventListener('keydown', onKey)
    document.body.classList.toggle('dialog-open', Boolean(selectedSlug))
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('dialog-open')
    }
  }, [selectedSlug])

  const switchLocale = () => {
    const next: Locale = locale === 'en' ? 'zh-CN' : 'en'
    const suffix = window.location.pathname.replace(/^\/(en|zh-CN)/, '')
    window.localStorage.setItem('zf-locale', next)
    window.history.replaceState({}, '', `/${next}${suffix}${window.location.hash}`)
    setLocale(next)
  }

  const openProject = (project: Project) => {
    window.history.pushState({}, '', `/${locale}/projects/${project.slug}`)
    setSelectedSlug(project.slug)
  }

  const closeProject = () => {
    window.history.replaceState({}, '', `/${locale}#projects`)
    setSelectedSlug(null)
  }

  const copyEmail = async () => {
    await navigator.clipboard.writeText(EMAIL)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const orderedExperience = EXPERIENCE_ORDER.map(index => ({ item: t.experience[index], sourceIndex: index }))
  const navItems = [
    { id: 'experience', label: locale === 'en' ? 'Experience' : '经历' },
    { id: 'projects', label: locale === 'en' ? 'Projects' : '项目' },
    { id: 'capabilities', label: locale === 'en' ? 'Skills' : '技能' },
    { id: 'contact', label: locale === 'en' ? 'Contact' : '联系' },
  ]

  return (
    <div className="portfolio-root" ref={rootRef}>
      <a className="skip-link" href="#main">{locale === 'en' ? 'Skip to content' : '跳至主要内容'}</a>

      <div className="opening-sequence" aria-hidden="true">
        <div className="opening-panel opening-panel-top" />
        <div className="opening-panel opening-panel-bottom" />
        <div className="opening-signature">
          <span className="opening-monogram">
            <span className="opening-letter opening-letter-f">
              <i className="opening-stroke opening-stroke-vertical opening-f-vertical" />
              <i className="opening-stroke opening-stroke-horizontal opening-f-top" />
              <i className="opening-stroke opening-stroke-horizontal opening-f-middle" />
            </span>
            <span className="opening-letter opening-letter-z">
              <i className="opening-stroke opening-stroke-horizontal opening-z-top" />
              <i className="opening-stroke opening-stroke-diagonal opening-z-diagonal" />
              <i className="opening-stroke opening-stroke-horizontal opening-z-bottom" />
            </span>
          </span>
          <span className="opening-rule" />
        </div>
      </div>

      <div className="site-wave-background" aria-hidden="true">
        <GradientWaves
          active={waveActive}
          horizonColor="#090908"
          waveColor="#5E4B31"
          crestColor="#F0EDE5"
          speed={0.22}
          amplitude={2.45}
          waveScale={0.58}
          waveRatio={0.88}
          swell={30}
          turbulence={14}
          tilt={1.12}
          zoom={0.92}
          height={4.9}
          fogDepth={28}
          detail="medium"
          brightness={0.78}
          opacity={1}
          mouseInteraction={false}
          parallaxStrength={0}
          fieldInteraction
          fieldStrength={1.02}
          interactionColor="#F0B84F"
          spotRadius={1.25}
          scanDuration={1.9}
          scanRadius={19}
          grain
          grainIntensity={0.025}
        />
        <div className="site-wave-scrim" />
      </div>

      <header className="topbar">
        <a className="brand intro intro-scale" href={`/${locale}#top`} aria-label={locale === 'en' ? 'Zhen Fang — home' : '方震 — 首页'}>
          <span>FZ</span><small>{locale === 'en' ? 'Technical Artist' : '技术美术'}</small>
        </a>
        <PillNav
          items={navItems}
          activeId={activeSection}
          ariaLabel={locale === 'en' ? 'Primary navigation' : '主导航'}
        />
        <div className="header-actions">
          <button className="language-switch intro intro-soft" onClick={switchLocale} aria-label={locale === 'en' ? 'Switch to Chinese' : '切换为英文'}>
            {locale === 'en' ? '中文' : 'EN'}
          </button>
        </div>
        <div className="progress-track" aria-hidden="true"><span /></div>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="shell hero-inner">
            <div className="hero-copy">
              <h1>
                <span className="headline-line"><span className="intro intro-mask">{locale === 'en' ? 'Zhen Fang' : '方震'}</span></span>
              </h1>
              <p className="hero-description intro intro-soft">
                {locale === 'en'
                  ? 'I build real-time rendering, VFX, and production tools that turn visual goals into reliable in-engine results.'
                  : '我专注实时渲染、视觉特效与制作工具，将视觉目标转化为稳定、可落地的引擎内方案。'}
              </p>
            </div>
          </div>
        </section>

        <section className="experience section" id="experience">
          <div className="shell section-grid">
            <header className="section-heading" data-reveal>
              <p className="eyebrow">01 / {locale === 'en' ? 'Experience' : '经历'}</p>
              <h2>{locale === 'en' ? <>From materials engineering<br />to technical art</> : <>从材料工程<br />到技术美术</>}</h2>
            </header>
            <div className="timeline">
              {orderedExperience.map(({ item, sourceIndex }, index) => {
                const isEducation = [4, 3, 2].includes(sourceIndex)
                return (
                  <article className="timeline-item" key={`${item.years}-${item.role}`} data-reveal>
                    <div className="timeline-index">{String(index + 1).padStart(2, '0')}</div>
                    <div className="timeline-content">
                      <div className="timeline-meta">
                        <span>{isEducation ? (locale === 'en' ? 'Education' : '教育') : (locale === 'en' ? 'Work' : '工作')}</span>
                        <time>{item.years}</time>
                      </div>
                      <h3>{item.role}</h3>
                      <h4>{item.org}</h4>
                      <p>{item.detail}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="projects section" id="projects">
          <div className="shell">
            <header className="projects-heading" data-reveal>
              <div><p className="eyebrow">02 / {locale === 'en' ? 'Projects' : '项目'}</p><h2>{locale === 'en' ? 'Selected Projects' : '精选项目'}</h2></div>
            </header>
            <div className="project-list">
              {t.projects.map((project, index) => (
                <article
                  className={`project-card project-card-${index + 1}`}
                  key={project.slug}
                  data-reveal
                  onPointerMove={setPointerPosition}
                  onPointerLeave={resetPointer}
                >
                  <button className="project-hit" onClick={() => openProject(project)} aria-label={`${t.openCase}: ${project.title}`} />
                  <div className="project-image-wrap">
                    <img src={project.image} alt={project.alt} width="1672" height="941" loading="lazy" decoding="async" />
                    <span className="project-follow">{locale === 'en' ? 'View' : '查看'} <Arrow /></span>
                  </div>
                  <div className="project-info">
                    <div className="project-number">/{project.index}</div>
                    <div className="project-title"><h3>{project.title}</h3><p>{project.subtitle}</p></div>
                    <div className="project-meta"><span>{project.role}</span><time>{project.dates}</time></div>
                    <span className="project-arrow"><Arrow /></span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="capabilities section" id="capabilities">
          <div className="shell">
            <header className="capabilities-heading" data-reveal>
              <p className="eyebrow">03 / {locale === 'en' ? 'Skills' : '技能'}</p>
              <h2>{locale === 'en' ? 'Technical Skills' : '技术能力'}</h2>
            </header>
            <CapabilityGallery items={CAPABILITIES[locale]} ariaLabel={locale === 'en' ? 'Technical skills' : '技术能力'} />
          </div>
        </section>

        <footer className="contact" id="contact">
          <div className="shell contact-inner">
            <div className="contact-top" data-reveal>
              <p className="eyebrow">04 / {locale === 'en' ? 'Contact' : '联系'}</p>
              <p>{t.contact.body}</p>
            </div>
            <div className="contact-main" data-reveal>
              <p>{locale === 'en' ? 'Looking for a technical artist, or need help bringing a visual system into production?' : '正在招聘技术美术，或需要将视觉方案落地到项目中？'}</p>
              <a href={emailHref(locale)}>{locale === 'en' ? 'Get in touch' : '联系我'}</a>
            </div>
            <div className="contact-actions">
              <div className="contact-resources">
                <button onClick={copyEmail}>{copied ? t.contact.copied : t.contact.copy} <Arrow /></button>
                {locale !== 'en' && (
                  <a href="/resume/Fang-Zhen-CV-CN.pdf" target="_blank" rel="noreferrer">{t.contact.resumeZh} <Arrow /></a>
                )}
                <a href="/resume/Zhen-Fang-CV.pdf" target="_blank" rel="noreferrer">{t.contact.resumeEn} <Arrow /></a>
              </div>
              <nav className="social-links" aria-label={locale === 'en' ? 'Social profiles' : '社交主页'}>
                {SOCIAL_LINKS.map(link => (
                  <a
                    className={`social-link social-link-${link.id}`}
                    href={link.href}
                    key={link.id}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    title={link.label}
                  >
                    <span className="social-mark" aria-hidden="true">{link.mark}</span>
                  </a>
                ))}
              </nav>
            </div>
            <div className="footer-base"><span>© 2026 ZHEN FANG</span><span>{locale === 'en' ? 'TECHNICAL ARTIST · WUHAN' : '技术美术 · 武汉'}</span><a href="#top">{t.contact.back} ↑</a></div>
          </div>
        </footer>
      </main>

      {selectedProject && (
        <div className="case-study" role="dialog" aria-modal="true" aria-labelledby="case-title">
          <button className="case-close" onClick={closeProject} autoFocus><span>{locale === 'en' ? 'Close' : '关闭'}</span> ×</button>
          <div className="case-hero">
            <img src={selectedProject.image} alt={selectedProject.alt} width="1672" height="941" loading="eager" decoding="async" fetchPriority="high" />
            <div className="case-hero-copy">
              <span>{selectedProject.index} / {locale === 'en' ? 'Project details' : '项目详情'}</span>
              <div className="case-title-mask"><h2 id="case-title">{selectedProject.title}</h2></div>
              <p>{selectedProject.subtitle}</p>
            </div>
          </div>
          <div className="case-body shell-narrow">
            <div className="case-meta"><span>{selectedProject.role}</span><span>{selectedProject.dates}</span></div>
            {selectedProject.link && (
              <div className="case-actions">
                <a href={selectedProject.link} target="_blank" rel="noreferrer">
                  {selectedProject.linkLabel} <Arrow />
                </a>
              </div>
            )}
            <p className="case-summary">{selectedProject.summary}</p>
            {(['responsibility', 'problem', 'approach', 'result'] as const).map(key => <section key={key}><span>{t.caseLabels[key]}</span><p>{selectedProject[key]}</p></section>)}
            <section><span>{t.caseLabels.tools}</span><div className="case-tech">{selectedProject.technologies.map(item => <em key={item}>{item}</em>)}</div></section>
          </div>
        </div>
      )}
    </div>
  )
}
