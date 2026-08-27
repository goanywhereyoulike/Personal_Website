# Zhen Fang — Technical Artist Portfolio

A bilingual technical artist portfolio focused on real-time rendering, visual effects, simulation, engine development, and production tools.

The site is built as a client-rendered React application with a custom WebGL wave background, GSAP-driven motion, project case studies, and Chinese/English content.

## Technology

- React 19 and TypeScript
- Vite
- Three.js and React Three Fiber
- GSAP and ScrollTrigger
- OGL and post-processing effects

## Requirements

- Node.js `20.19+` or `22.12+`
- pnpm `11.22+`

## Local development

```bash
pnpm install --frozen-lockfile
pnpm dev
```

On Windows, you can also double-click `start-preview.cmd` or `启动预览.cmd`. The script installs missing dependencies and opens the local preview automatically.

## Validation and production build

```bash
pnpm typecheck
pnpm build
pnpm preview
```

The production output is generated in `dist/`.

For a public deployment, provide the final origin so the build can generate canonical URLs, language alternates, and `sitemap.xml`:

```powershell
$env:SITE_URL='https://your-domain.com'
pnpm build
```

## Project structure

```text
src/                 React components, content, animation, and styles
public/assets/       Optimized project and capability images used at runtime
public/resume/       Public résumé downloads
index.html           Site metadata and application entry document
```

Uncompressed source artwork is intentionally kept outside version control. Only the optimized runtime assets in `public/` are required to build and deploy the site.

## Deployment notes

This project is a single-page application. A static host must serve `index.html` as the fallback for application routes such as `/en/projects/storm-engine` and `/zh-CN/projects/niagara-sph-fluid`.

The build also writes static HTML entry documents for every supported language and project route. Hosts that support the included `_headers` file will apply the recommended security and cache headers automatically; other CDN providers should mirror those values in their control panel.

Build command:

```text
pnpm build
```

Publish directory:

```text
dist
```

### Render

The repository includes `render.yaml` with the production build, SPA fallback, and cache rules for the current Render URL. When the service is managed as a Render Blueprint, syncing the Blueprint applies these settings automatically.

For an existing Dashboard-created Static Site, add the same image cache rule under **Settings → Headers** if the service is not connected to the Blueprint:

```text
Path: /assets/capabilities/*
Name: Cache-Control
Value: public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800
```

Repeat the same header rule for `/resume/*` so both résumé files are served from Render's edge cache as well.

## Content and usage

The portfolio source is published for review. Project artwork, written content, and résumé files remain the property of Zhen Fang and are not licensed for reuse.

---

## 中文说明

这是方震的中英双语技术美术作品集，内容涵盖实时渲染、视觉特效、模拟、引擎开发与生产工具。

本地运行前请安装 Node.js 与 pnpm，然后执行：

```bash
pnpm install --frozen-lockfile
pnpm dev
```

部署时执行 `pnpm build`，并将生成的 `dist/` 目录发布到静态托管平台。托管平台需要为所有项目详情路径配置 SPA 回退到 `index.html`。
