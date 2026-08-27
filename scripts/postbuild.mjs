import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const outputRoot = resolve('dist')
const template = await readFile(resolve(outputRoot, 'index.html'), 'utf8')
const siteUrl = (process.env.SITE_URL || '').trim().replace(/\/$/, '')

const projects = {
  en: [
    ['flame-hunter-zhong-kui', 'Flame Hunter: Zhong Kui', 'Technical art and VFX development for a Unity URP action-adventure game, covering character readability, real-time effects, and production tooling.', '/assets/project-zhongkui-selected.jpg', 'Stylized top-down Zhong Kui combat scene built from dark sculptural forms and gold light'],
    ['niagara-sph-fluid', 'Niagara SPH Fluid', 'A real-time SPH particle-fluid simulation built in Unreal Engine with the Niagara Simulation Stage workflow.', '/assets/project-fluid-v2.jpg', 'Abstract particle wave transitioning from wireframe points into an ivory fluid surface'],
    ['storm-engine', 'STORM Engine', 'A custom 3D game engine built in C++ and Direct3D 11, covering asset import, rendering, animation, collision, and physics.', '/assets/project-storm-selected.jpg', 'Circular engine-system diagram connecting animation, materials, simulation, and particles'],
    ['tyrant', 'TYRANT', 'A Unity and C# team project that combines top-down shooting with tower defense mechanics.', '/assets/project-tyrant-selected.jpg', 'Stylized top-down defense battlefield with a central player, towers, and approaching units'],
  ],
  'zh-CN': [
    ['flame-hunter-zhong-kui', '钟馗传', '面向 Unity URP 动作冒险项目的技术美术与视觉特效开发，覆盖角色可读性、实时特效和生产工具。', '/assets/project-zhongkui-selected.jpg', '由暗色雕塑形体与金色光效构成的俯视角钟馗战斗场景'],
    ['niagara-sph-fluid', 'Niagara SPH 水模拟', '基于 Unreal Engine Niagara Simulation Stage 构建的实时 SPH 粒子流体模拟。', '/assets/project-fluid-v2.jpg', '由线框粒子过渡为象牙白流体表面的抽象波浪'],
    ['storm-engine', 'STORM 引擎', '使用 C++ 与 Direct3D 11 独立构建的 3D 游戏引擎，覆盖资产导入、渲染、动画、碰撞与物理。', '/assets/project-storm-selected.jpg', '连接动画、材质、模拟与粒子模块的环形引擎系统示意图'],
    ['tyrant', 'TYRANT', '使用 Unity 与 C# 开发，将俯视角射击与塔防机制结合的团队项目。', '/assets/project-tyrant-selected.jpg', '由中央角色、防御塔和来袭单位组成的俯视角塔防战场'],
  ],
}

const home = {
  en: ['Zhen Fang — Technical Artist', 'Technical artist portfolio focused on real-time rendering, VFX, simulation, engine development, and production tools.'],
  'zh-CN': ['方震 — 技术美术作品集', '方震的技术美术作品集，聚焦实时渲染、视觉特效、模拟、引擎开发与制作工具。'],
}

const routes = []
for (const locale of ['en', 'zh-CN']) {
  routes.push({ locale, path: `/${locale}`, title: home[locale][0], description: home[locale][1], image: '/og.png' })
  for (const [slug, projectTitle, description, image, imageAlt] of projects[locale]) {
    routes.push({
      locale,
      path: `/${locale}/projects/${slug}`,
      title: `${projectTitle} — ${locale === 'en' ? 'Zhen Fang' : '方震'}`,
      description,
      image,
      imageAlt,
    })
  }
}

const escapeAttribute = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

function replaceMeta(html, attribute, key, value) {
  const expression = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*\\/?>`, 'i')
  const tag = `<meta ${attribute}="${key}" content="${escapeAttribute(value)}" />`
  return expression.test(html) ? html.replace(expression, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

function renderRoute(route) {
  const suffix = route.path.replace(/^\/(en|zh-CN)/, '')
  const canonical = siteUrl ? `${siteUrl}${route.path}` : ''
  const alternateEn = siteUrl ? `${siteUrl}/en${suffix}` : ''
  const alternateZh = siteUrl ? `${siteUrl}/zh-CN${suffix}` : ''
  const image = siteUrl ? `${siteUrl}${route.image}` : route.image
  let html = template
    .replace(/<html lang="[^"]+">/i, `<html lang="${route.locale}">`)
    .replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttribute(route.title)}</title>`)

  html = replaceMeta(html, 'name', 'description', route.description)
  html = replaceMeta(html, 'property', 'og:locale', route.locale === 'en' ? 'en_US' : 'zh_CN')
  html = replaceMeta(html, 'property', 'og:locale:alternate', route.locale === 'en' ? 'zh_CN' : 'en_US')
  html = replaceMeta(html, 'property', 'og:title', route.title)
  html = replaceMeta(html, 'property', 'og:description', route.description)
  html = replaceMeta(html, 'property', 'og:image', image)
  html = replaceMeta(html, 'property', 'og:image:alt', route.imageAlt || 'Zhen Fang — Technical Artist portfolio preview')
  html = replaceMeta(html, 'name', 'twitter:title', route.title)
  html = replaceMeta(html, 'name', 'twitter:description', route.description)
  html = replaceMeta(html, 'name', 'twitter:image', image)
  html = replaceMeta(html, 'name', 'twitter:image:alt', route.imageAlt || 'Zhen Fang — Technical Artist portfolio preview')

  if (siteUrl) {
    const links = [
      `<link rel="canonical" href="${canonical}" />`,
      `<link rel="alternate" hreflang="en" href="${alternateEn}" />`,
      `<link rel="alternate" hreflang="zh-CN" href="${alternateZh}" />`,
      `<link rel="alternate" hreflang="x-default" href="${alternateEn}" />`,
    ].join('\n    ')
    html = replaceMeta(html, 'property', 'og:url', canonical)
    html = html.replace('</head>', `    ${links}\n  </head>`)
  }
  return html
}

for (const route of routes) {
  const directory = resolve(outputRoot, route.path.slice(1))
  await mkdir(directory, { recursive: true })
  await writeFile(resolve(directory, 'index.html'), renderRoute(route), 'utf8')
}

const defaultRoute = routes.find(route => route.path === '/en')
if (defaultRoute) await writeFile(resolve(outputRoot, 'index.html'), renderRoute(defaultRoute), 'utf8')

if (siteUrl) {
  const urls = routes.map(route => `  <url><loc>${siteUrl}${route.path}</loc></url>`).join('\n')
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  await writeFile(resolve(outputRoot, 'sitemap.xml'), sitemap, 'utf8')
  await writeFile(resolve(outputRoot, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`, 'utf8')
} else {
  console.warn('SITE_URL is not set; canonical links and sitemap generation were skipped.')
}
