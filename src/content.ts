export type Locale = 'en' | 'zh-CN'

export type Project = {
  slug: string
  index: string
  title: string
  subtitle: string
  role: string
  dates: string
  summary: string
  responsibility: string
  problem: string
  approach: string
  result: string
  technologies: string[]
  image: string
  alt: string
  link?: string
  linkLabel?: string
}

const shared = {
  email: 'zhen.fang1993@hotmail.com',
  chapters: ['ATOM', 'MICROSTRUCTURE', 'CHIP', 'COMPUTE', 'SIMULATION', 'WORLD'],
  toolset: ['C++', 'C#', 'UNITY', 'UNREAL ENGINE', 'NIAGARA', 'DIRECT3D 11', 'MAYA', 'PHOTOSHOP'],
}

export const content = {
  en: {
    ...shared,
    localeLabel: '中文',
    nav: { journey: 'Career', projects: 'Projects', experience: 'Experience', skills: 'Skills', about: 'Profile', resume: 'Résumé', contact: 'Contact' },
    hero: {
      availability: 'OPEN TO SELECT OPPORTUNITIES',
      role: 'TECHNICAL ARTIST',
      focus: 'RENDERING · VFX · TOOLS',
      titleTop: 'TECHNICAL',
      titleBottom: 'ARTIST',
      statement: 'I build visual systems for real-time production.',
      support: 'Real-time rendering, VFX, simulation, and production tools.',
      viewProjects: 'View projects',
      explore: 'View experience',
      scroll: 'Scroll to explore',
    },
    morphStages: [
      { label: 'ATOM', short: 'ATOM', career: 'Home', role: 'Starting point', detail: 'An atom marks the beginning.' },
      { label: 'MOLECULE', short: 'MOLECULE', career: 'Northwestern Polytechnical University', role: 'Composite Materials and Engineering', detail: 'Materials engineering introduced the relationship between structure and performance.' },
      { label: 'MICROSTRUCTURE', short: 'MICRO', career: 'The University of Manchester', role: 'Advanced Engineering Materials', detail: 'Tomography and reconstruction made hidden material structures measurable.' },
      { label: 'CHIP', short: 'CHIP', career: 'Yangtze Memory Technologies', role: 'Failure Analysis Engineer', detail: 'Failure analysis applied evidence-driven problem solving to semiconductor products.' },
      { label: 'COMPUTER', short: 'COMPUTER', career: 'LaSalle College Vancouver', role: 'Game Programming', detail: 'Game programming turned engineering analysis into interactive systems.' },
      { label: 'RENDERED WORLD', short: 'WORLD', career: 'Technical Art', role: 'Rendering · VFX · Tools', detail: 'Technical art brings rendering, VFX, and tools into production.' },
    ],
    journey: {
      eyebrow: '01 / EXPERIENCE',
      title: 'From physical materials to real-time systems',
      intro: 'An engineering path spanning materials science, semiconductor analysis, game programming, and technical art.',
      stages: [
        { no: '01', label: 'MATERIALS', years: '2012—2017', title: 'Analyzing physical structure', body: 'Composite materials, microstructure, tomography, and 3D reconstruction established a rigorous engineering foundation.' },
        { no: '02', label: 'SEMICONDUCTORS', years: '2018—2019', title: 'Diagnosing complex systems', body: 'Failure analysis connected test evidence, reliability assessment, and cross-functional engineering decisions.' },
        { no: '03', label: 'GAME PROGRAMMING', years: '2019—2022', title: 'Building interactive systems', body: 'C++, Direct3D, algorithms, and 3D mathematics translated engineering thinking into real-time software.' },
        { no: '04', label: 'TECHNICAL ART', years: '2022—PRESENT', title: 'Bringing visual systems into production', body: 'Rendering, VFX, simulation, and tools now support real-time content and production workflows.' },
      ],
    },
    projectsHeading: { eyebrow: '02 / PROJECTS', title: 'Selected projects', intro: 'Technical work presented through role, challenge, implementation, and outcome.' },
    openCase: 'View project',
    closeCase: 'Close project',
    caseLabels: { responsibility: 'Role and contribution', problem: 'Challenge', approach: 'Implementation', result: 'Outcome', tools: 'Tools and technologies' },
    projects: [
      {
        slug: 'flame-hunter-zhong-kui', index: '01', title: 'Flame Hunter: Zhong Kui', subtitle: 'Production Technical Art and VFX', role: 'Technical Artist / VFX Lead', dates: '2024.09—Present',
        summary: 'Technical art and VFX development for a Unity URP action-adventure game, covering character readability, real-time effects, and production tooling.',
        responsibility: 'Lead real-time rendering and VFX development; build production tools and standards; support cross-disciplinary technical problem solving.',
        problem: 'Maintaining character readability in dense combat scenes while keeping VFX resources and authoring workflows consistent across the team.',
        approach: 'Implemented occlusion detection, semi-transparent character reveal, and outline rendering; established VFX layer and resource standards; built Unity Editor tools for batch particle processing and parameter adjustment.',
        result: 'Improved character readability in complex scenes and made effect authoring and resource use more consistent across the team.',
        technologies: ['Unity', 'URP', 'C#', 'Shaders', 'Unity Editor', 'VFX Pipeline'], image: '/assets/project-zhongkui-selected.jpg', alt: 'Stylized top-down Zhong Kui combat scene built from dark sculptural puzzle forms and gold light',
        link: 'https://store.steampowered.com/app/4550140/_/?l=schinese', linkLabel: 'View on Steam',
      },
      {
        slug: 'niagara-sph-fluid', index: '02', title: 'Niagara SPH Fluid', subtitle: 'Real-Time Particle Fluid Simulation', role: 'Graphics / Simulation Developer', dates: '2022.01—2022.03',
        summary: 'A real-time SPH particle-fluid simulation built in Unreal Engine with the Niagara Simulation Stage workflow.',
        responsibility: 'Built the Niagara particle setup and implemented SPH calculations for particle interaction and fluid-like motion.',
        problem: 'Implementing neighbor-based particle interaction in the Niagara GPU simulation workflow while maintaining stable real-time behavior.',
        approach: 'Used the Niagara Simulation Stage to update particle data, calculate SPH forces, and tune the resulting motion and visual response.',
        result: 'Produced a working real-time particle-fluid prototype that demonstrates SPH behavior in Niagara.',
        technologies: ['Unreal Engine', 'Niagara', 'Simulation Stage', 'SPH', 'Particles'], image: '/assets/project-fluid-v2.jpg', alt: 'Abstract particle wave transitioning from wireframe points into an ivory fluid surface',
        link: 'https://github.com/goanywhereyoulike/Fluid_sim', linkLabel: 'View source on GitHub',
      },
      {
        slug: 'storm-engine', index: '03', title: 'STORM Engine', subtitle: 'Custom C++ / Direct3D 11 Game Engine', role: 'Engine / Graphics Programmer', dates: '2020.10—2021.12',
        summary: 'A custom 3D game engine built in C++ and Direct3D 11, covering asset import, rendering, animation, collision, and physics.',
        responsibility: 'Designed and implemented the asset pipeline, renderer, animation support, and particle physics systems.',
        problem: 'Integrating multiple low-level engine systems into a coherent real-time runtime built from first principles.',
        approach: 'Built model, skeleton, and animation import tools; implemented real-time lighting, shadows, post-processing, animation, constraints, geometric collision, and particle physics.',
        result: 'Completed a working engine prototype and gained hands-on experience across the path from asset data to rendered output and simulation.',
        technologies: ['C++', 'Direct3D 11', 'HLSL', 'Rendering', 'Physics', 'Asset Pipeline'], image: '/assets/project-storm-selected.jpg', alt: 'Circular engine-system diagram connecting animation, materials, simulation and particles',
        link: 'https://github.com/goanywhereyoulike/STORM', linkLabel: 'View source on GitHub',
      },
      {
        slug: 'tyrant', index: '04', title: 'TYRANT', subtitle: '2D Top-Down Tower Defense Shooter', role: 'Gameplay Programmer / Team Project', dates: 'Academic Team Project',
        summary: 'A Unity and C# team project that combines top-down shooting with tower defense mechanics.',
        responsibility: 'Collaborated with a programming team to develop and integrate gameplay systems in Unity.',
        problem: 'Coordinating player combat, enemy behavior, and defensive objectives while keeping moment-to-moment feedback clear.',
        approach: 'Worked in a shared Unity and C# codebase, integrated gameplay logic, and iterated on combat behavior with the team.',
        result: 'Delivered a playable team prototype and gained experience working in a shared game development codebase.',
        technologies: ['Unity', 'C#', '2D Gameplay', 'Team Development'], image: '/assets/project-tyrant-selected.jpg', alt: 'Stylized top-down defence battlefield with a central player, towers and approaching units',
        link: 'https://goanywhereyoulike.itch.io/tyrant', linkLabel: 'Play on itch.io',
      },
    ] as Project[],
    experienceHeading: { eyebrow: '01 / EXPERIENCE', title: 'From materials engineering to technical art' },
    experience: [
      { years: '2024.09—PRESENT', role: 'Technical Artist / VFX Lead', org: 'Taikong Animation · Wuhan', detail: 'Develop real-time rendering, VFX, production tools, and team workflows for a Unity URP title.' },
      { years: '2018.01—2019.06', role: 'Failure Analysis Engineer', org: 'Yangtze Memory Technologies', detail: 'Conducted product failure-analysis testing, developed test plans, assessed reliability, and supported cross-functional process improvement.' },
      { years: '2019.07—2022.06', role: 'BSc, Game Programming', org: 'LaSalle College Vancouver', detail: 'Studied algorithms, data structures, 3D geometry, linear algebra, networking, databases, and 3D modeling; received the Spring 2022 Outstanding Achievement Award.' },
      { years: '2016.09—2017.11', role: 'MSc, Advanced Engineering Materials', org: 'The University of Manchester', detail: 'Graduated with Merit; researched composite microstructures using X-ray computed tomography, 3D reconstruction, and quantitative analysis.' },
      { years: '2012.09—2016.06', role: 'BEng, Composite Materials and Engineering', org: 'Northwestern Polytechnical University', detail: 'Studied materials science, composite processing, and microstructural analysis; completed research on graphene and nanocellulose composite electrodes.' },
    ],
    skillsHeading: { eyebrow: '03 / SKILLS', title: 'Technical skills', intro: 'Rendering, simulation, tools, and programming for real-time production.' },
    skills: [
      { no: 'A01', title: 'REAL-TIME GRAPHICS', body: 'Shaders · Rendering · GPU Effects · Graphics Programming' },
      { no: 'A02', title: 'SIMULATION', body: 'Particles · Fluid · Physics · Procedural Motion' },
      { no: 'A03', title: 'TECHNICAL ART', body: 'Unity · Unreal · VFX Pipeline · Editor Tools' },
      { no: 'A04', title: 'PROGRAMMING', body: 'C++ · C# · HLSL / GLSL · Engine Systems' },
      { no: 'A05', title: 'PRODUCTION', body: 'VFX Leadership · Review · Planning · Collaboration' },
      { no: 'A06', title: 'GENERATIVE', body: 'AI-assisted Content · 3D Generation · World Modeling' },
    ],
    about: { eyebrow: 'PROFILE', title: 'Engineering analysis applied to visual production', body: 'My background spans materials science, semiconductor failure analysis, game programming, and technical art. I bring the same structured approach to rendering, VFX, simulation, and production tools.', location: 'Based in Wuhan, China', focus: 'Focused on real-time graphics, VFX, and production tooling.' },
    contact: { eyebrow: '04 / CONTACT', prompt: 'LOOKING FOR A TECHNICAL ARTIST?', titleA: 'GET IN', titleB: 'TOUCH', body: 'Open to technical artist roles and selected collaborations in real-time graphics and production tools.', copy: 'Copy email', copied: 'Email copied', resumeEn: 'Download resume', resumeZh: 'Chinese resume', back: 'Back to top' },
  },
  'zh-CN': {
    ...shared,
    chapters: ['原子', '微观结构', '芯片', '计算', '模拟', '世界'],
    localeLabel: 'EN',
    nav: { journey: '职业路径', projects: '项目', experience: '经历', skills: '技能', about: '简介', resume: '简历', contact: '联系' },
    hero: {
      availability: '开放合适的岗位与合作机会', role: '技术美术', focus: '渲染 · 特效 · 工具', titleTop: '技术美术', titleBottom: '作品集',
      statement: '为实时项目构建可靠的视觉系统', support: '实时渲染、视觉特效、模拟与生产工具', viewProjects: '查看项目', explore: '查看经历', scroll: '向下浏览',
    },
    morphStages: [
      { label: '原子', short: '原子', career: '主页', role: '起点', detail: '从最基本的结构出发' },
      { label: '分子', short: '分子', career: '西北工业大学', role: '复合材料与工程', detail: '材料工程让我理解结构与性能之间的关系' },
      { label: '微观结构', short: '微结构', career: '曼彻斯特大学', role: '高级工程材料', detail: '断层扫描与三维重建让隐藏的材料结构变得可测量' },
      { label: '芯片', short: '芯片', career: '长江存储', role: '失效分析工程师', detail: '失效分析将证据驱动的问题解决方式带入半导体产品' },
      { label: '计算机', short: '计算机', career: '温哥华拉萨尔学院', role: '游戏编程', detail: '游戏编程把工程分析转化为可交互的实时系统' },
      { label: '实时世界', short: '世界', career: '技术美术', role: '渲染 · 特效 · 工具', detail: '技术美术让渲染、特效与工具真正进入生产流程' },
    ],
    journey: {
      eyebrow: '01 / 经历', title: '从材料工程到实时视觉系统', intro: '经历覆盖材料科学、半导体失效分析、游戏编程与技术美术。',
      stages: [
        { no: '01', label: '材料工程', years: '2012—2017', title: '分析物理结构', body: '复合材料、微观结构、断层扫描与三维重建，为后续技术工作建立了严谨的工程基础。' },
        { no: '02', label: '半导体', years: '2018—2019', title: '定位复杂系统问题', body: '通过失效分析连接测试证据、可靠性评估与跨部门工程决策。' },
        { no: '03', label: '游戏编程', years: '2019—2022', title: '构建交互系统', body: '通过 C++、Direct3D、算法与三维数学，将工程思维转化为实时软件。' },
        { no: '04', label: '技术美术', years: '2022—至今', title: '让视觉系统进入生产', body: '以渲染、特效、模拟和工具支持实时内容与制作流程。' },
      ],
    },
    projectsHeading: { eyebrow: '02 / 项目', title: '精选项目', intro: '从职责、挑战、技术实现与结果四个方面呈现项目工作。' },
    openCase: '查看项目', closeCase: '关闭项目',
    caseLabels: { responsibility: '职责与贡献', problem: '项目挑战', approach: '技术实现', result: '项目结果', tools: '工具与技术' },
    projects: [
      {
        slug: 'flame-hunter-zhong-kui', index: '01', title: '钟馗传', subtitle: '项目技术美术与视觉特效', role: '技术美术 / 特效组长', dates: '2024.09—至今',
        summary: '负责 Unity URP 动作冒险项目的技术美术与特效开发，覆盖角色可读性、实时效果和制作工具。',
        responsibility: '负责实时渲染与视觉特效开发，建立制作工具和流程规范，并协同解决跨专业技术问题。',
        problem: '在复杂战斗场景中保持角色清晰可读，同时统一特效资源与制作流程。',
        approach: '实现角色遮挡检测、半透明消隐与描边渲染；建立特效层级和资源配置规范；开发粒子批处理与参数调整工具。',
        result: '提升复杂场景中的角色可读性，并提高特效制作与资源使用的一致性。',
        technologies: ['Unity', 'URP', 'C#', 'Shaders', 'Unity Editor', 'VFX Pipeline'], image: '/assets/project-zhongkui-selected.jpg', alt: '由暗色拼图形体与金色光效构成的俯视角钟馗战斗示意图',
        link: 'https://store.steampowered.com/app/4550140/_/?l=schinese', linkLabel: '在 Steam 查看',
      },
      {
        slug: 'niagara-sph-fluid', index: '02', title: 'Niagara SPH 水模拟', subtitle: '实时粒子流体模拟', role: '图形 / 模拟开发', dates: '2022.01—2022.03',
        summary: '使用 Unreal Engine Niagara Simulation Stage 构建的实时 SPH 粒子流体模拟。',
        responsibility: '搭建 Niagara 粒子系统，并实现粒子相互作用与流体运动所需的 SPH 计算。',
        problem: '在 Niagara 的 GPU 模拟流程中实现基于邻域的粒子交互，并保持稳定的实时运行。',
        approach: '通过 Niagara Simulation Stage 更新粒子数据、计算 SPH 作用力，并调整运动表现与视觉反馈。',
        result: '完成可实时运行的粒子流体原型，验证了 Niagara 中的 SPH 模拟流程。',
        technologies: ['Unreal Engine', 'Niagara', 'Simulation Stage', 'SPH', 'Particles'], image: '/assets/project-fluid-v2.jpg', alt: '由线框粒子过渡为象牙白流体表面的抽象波浪',
        link: 'https://github.com/goanywhereyoulike/Fluid_sim', linkLabel: '在 GitHub 查看源码',
      },
      {
        slug: 'storm-engine', index: '03', title: 'STORM 引擎', subtitle: 'C++ / Direct3D 11 自研游戏引擎', role: '引擎 / 图形程序开发', dates: '2020.10—2021.12',
        summary: '使用 C++ 与 Direct3D 11 独立构建的 3D 游戏引擎，覆盖资产导入、渲染、动画、碰撞与物理。',
        responsibility: '设计并实现资产管线、渲染器、动画支持和粒子物理系统。',
        problem: '从底层构建多个引擎模块，并将其整合为连贯运行的实时系统。',
        approach: '开发模型、骨骼与动画数据导入工具；实现实时光照、阴影、后处理、动画、约束、几何碰撞与粒子物理。',
        result: '完成可运行的引擎原型，并建立从资产数据到渲染输出与物理模拟的完整实践经验。',
        technologies: ['C++', 'Direct3D 11', 'HLSL', 'Rendering', 'Physics', 'Asset Pipeline'], image: '/assets/project-storm-selected.jpg', alt: '连接动画、材质、模拟与粒子模块的环形引擎系统示意图',
        link: 'https://github.com/goanywhereyoulike/STORM', linkLabel: '在 GitHub 查看源码',
      },
      {
        slug: 'tyrant', index: '04', title: 'TYRANT', subtitle: '2D 俯视角塔防射击游戏', role: '玩法程序 / 团队项目', dates: '课程团队项目',
        summary: '使用 Unity 与 C# 开发，将俯视角射击与塔防玩法结合的团队项目。',
        responsibility: '参与程序团队协作，在 Unity 中开发并整合玩法系统。',
        problem: '协调玩家战斗、敌人行为与防守目标，同时保持即时反馈清晰。',
        approach: '在共享的 Unity 与 C# 代码库中整合玩法逻辑，并与团队共同调整战斗行为。',
        result: '完成可游玩的团队原型，并积累了在共享游戏代码库中协作开发的经验。',
        technologies: ['Unity', 'C#', '2D Gameplay', 'Team Development'], image: '/assets/project-tyrant-selected.jpg', alt: '由中央角色、防御塔和来袭单位组成的俯视角塔防战场示意图',
        link: 'https://goanywhereyoulike.itch.io/tyrant', linkLabel: '在 itch.io 试玩',
      },
    ] as Project[],
    experienceHeading: { eyebrow: '01 / 经历', title: '从材料工程到技术美术' },
    experience: [
      { years: '2024.09—至今', role: '技术美术 / 特效组长', org: '太崆动漫 · 武汉', detail: '负责 Unity URP 项目的实时渲染、视觉特效、制作工具与流程规范。' },
      { years: '2018.01—2019.06', role: '失效分析工程师', org: '长江存储科技有限责任公司', detail: '负责产品失效分析测试，制定并执行测试方案，评估产品性能与可靠性，并协同推进工艺改进。' },
      { years: '2019.07—2022.06', role: '游戏编程 · 本科', org: '温哥华拉萨尔学院', detail: '学习算法与数据结构、三维几何、线性代数、网络、数据库与三维建模；获 2022 年春季优秀成就奖。' },
      { years: '2016.09—2017.11', role: '高级工程材料 · 硕士', org: '曼彻斯特大学', detail: '以 Merit 成绩毕业；使用 X 射线断层扫描、三维重建与定量分析研究复合材料微观结构。' },
      { years: '2012.09—2016.06', role: '复合材料与工程 · 本科', org: '西北工业大学', detail: '学习材料科学、复合材料工艺与微观分析；完成石墨烯/纳米纤维素复合电极相关研究。' },
    ],
    skillsHeading: { eyebrow: '03 / 技能', title: '技术能力', intro: '面向实时项目的渲染、模拟、工具与程序开发能力。' },
    skills: [
      { no: 'A01', title: '实时图形', body: '着色器 · 渲染 · GPU 特效 · 图形编程' },
      { no: 'A02', title: '模拟', body: '粒子 · 流体 · 物理 · 程序化运动' },
      { no: 'A03', title: '技术美术', body: 'Unity · Unreal · 特效管线 · 编辑器工具' },
      { no: 'A04', title: '程序开发', body: 'C++ · C# · HLSL / GLSL · 引擎系统' },
      { no: 'A05', title: '生产协作', body: '特效管理 · 审核 · 计划 · 跨团队协作' },
      { no: 'A06', title: '生成式方向', body: 'AI 辅助内容 · 三维生成 · 世界建模' },
    ],
    about: { eyebrow: '个人简介', title: '把工程分析用于视觉生产', body: '我的经历覆盖材料科学、半导体失效分析、游戏编程与技术美术。这套结构化思维也贯穿于渲染、特效、模拟和生产工具开发。', location: '现居中国武汉', focus: '专注实时图形、视觉特效与生产工具。' },
    contact: { eyebrow: '04 / 联系', prompt: '正在寻找技术美术？', titleA: '欢迎', titleB: '联系', body: '目前开放技术美术岗位机会，也欢迎实时图形与生产工具方向的项目合作。', copy: '复制邮箱', copied: '邮箱已复制', resumeEn: '英文简历', resumeZh: '中文简历', back: '返回顶部' },
  },
} as const
