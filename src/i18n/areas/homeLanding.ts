import type { AreaTranslations } from "./types";

/** New landing-page positioning and shipped-feature copy. */
export const homeLanding: AreaTranslations = {
  en: {
    home: {
      hero: {
        headline: "Ask your ledger. Keep control.",
        positioning:
          "Private, local-first money tracking. No account. Open source. Search needs no AI or cloud.",
        tryDemo: "Try it with demo data",
        videoLabel: "Natural-language search demo video",
        videoTitle: "Ask. Don’t Search.",
        videoFullscreen: "Full screen",
      },
      demos: {
        title: "See it in action",
        intro:
          "Short videos of the real app. Nothing loads until you press play.",
        play: "Play video: {{title}}",
        comingSoon: "Coming soon",
        ai: {
          title: "AI, Your Call",
          body: "AI stays off until you switch it on.",
        },
        claude: {
          title: "AI agent - Meet Ledger",
          body: "A local LLM helps in importing years of transactions. One of many possibilities with AI.",
        },
        api: {
          title: "Your Ledger, Scriptable",
          body: "A documented API on your own computer.",
        },
        sync: {
          title: "One Ledger, Two Devices",
          body: "Carry a ledger through a folder you choose.",
        },
      },
      nav: {
        search: "Search",
        differences: "How it differs",
      },
      search: {
        title: "Search in plain English",
        intro:
          "Dates. Amounts. Typos. Pick filters one by one. See them above.",
        languageLabel: "Search in English",
        example1: "expenses over 20 last month in groceries",
        example2: "starbuks since 2020",
        example3: "largest expense 2 weeks from today",
      },
      usage: {
        ai: {
          title: "AI, when you choose",
          description:
            "AI features are optional. Use them on your terms; connect an agent from desktop.",
        },
      },
      differences: {
        title: "How it differs",
        privateTitle: "Private by design",
        privateDescription:
          "No account. Your data stays local unless exported.",
        searchTitle: "Plain-English search. No AI or cloud.",
        searchDescription:
          "Search runs locally. AI features are separate and optional.",
        agentTitle: "Connect your own AI agent (optional)",
        agentDescription: "Use MCP from the desktop app.",
        apiTitle: "Script with the Local API",
        apiDescription: "OpenAPI and Postman. Desktop app only.",
      },
      roadmap: {
        recentDescription: "Recent releases. Built in public.",
        shippedCount: "{{count}} shipped milestones",
        shippedSummary: "Shipped: search, MCP agents, desktop API.",
      },
      milestones: {
        recent: "Recent release",
        agentLabel: "AI & agents",
        search: {
          title: "Natural-language search",
          summary:
            "Dates, amounts, typos, and top results. Search box and API share logic.",
        },
        aiHub: {
          title: "AI hub and MCP agent connections",
          summary:
            "One AI switch. Connect Claude Code, Claude Desktop, or Codex through MCP on desktop.",
        },
        localApiDetails: "Desktop Local API. OpenAPI and Postman collection.",
      },
    },
  },
  es: {
    home: {
      hero: {
        headline: "Tu dinero, bajo tu control.",
        positioning:
          "Dinero privado y local. Sin cuenta. Código abierto. Busca sin IA ni nube.",
        tryDemo: "Pruébalo con datos de ejemplo",
        videoLabel: "Vídeo de demostración de búsqueda en lenguaje natural",
        videoTitle: "Pregunta. No busques.",
        videoFullscreen: "Pantalla completa",
      },
      demos: {
        title: "Míralo en acción",
        intro:
          "Vídeos cortos de la app real. Nada se carga hasta que pulsas reproducir.",
        play: "Reproducir vídeo: {{title}}",
        comingSoon: "Próximamente",
        ai: {
          title: "IA, tú decides",
          body: "La IA sigue apagada hasta que la enciendes.",
        },
        claude: {
          title: "Agente de IA y tu libro",
          body: "Un LLM local ayuda a importar años de movimientos. Una de las muchas posibilidades de la IA.",
        },
        api: {
          title: "Tu libro, programable",
          body: "Una API documentada en tu propio ordenador.",
        },
        sync: {
          title: "Un libro, dos dispositivos",
          body: "Lleva tu libro en una carpeta que tú eliges.",
        },
      },
      nav: {
        search: "Búsqueda",
        differences: "Qué lo hace diferente",
      },
      search: {
        title: "Busca en lenguaje natural",
        intro:
          "Fechas. Importes. Errores. Elige filtros uno por uno. Míralos arriba.",
        languageLabel: "Busca en inglés",
        example1: "expenses over 20 last month in groceries",
        example2: "starbuks since 2020",
        example3: "largest expense 2 weeks from today",
      },
      usage: {
        ai: {
          title: "IA, cuando tú quieras",
          description:
            "Las funciones de IA son opcionales. Úsalas a tu manera y conecta agentes desde escritorio.",
        },
      },
      differences: {
        title: "Qué lo hace diferente",
        privateTitle: "Privacidad desde el diseño",
        privateDescription:
          "Sin cuenta. Tus datos siguen locales, salvo que los exportes.",
        searchTitle: "Busca en lenguaje natural. Sin IA ni nube.",
        searchDescription:
          "La búsqueda funciona en local. Las funciones de IA son opcionales.",
        agentTitle: "Conecta tu propio agente de IA (opcional)",
        agentDescription: "Usa MCP desde la app de escritorio.",
        apiTitle: "Crea scripts con la API local",
        apiDescription: "OpenAPI y Postman. Solo en escritorio.",
      },
      roadmap: {
        recentDescription: "Novedades recientes. Desarrollo público.",
        shippedCount: "{{count}} hitos publicados",
        shippedSummary:
          "Ya disponibles: búsqueda, agentes MCP y API local de escritorio.",
      },
      milestones: {
        recent: "Lanzamiento reciente",
        agentLabel: "IA y agentes",
        search: {
          title: "Búsqueda en lenguaje natural",
          summary:
            "Fechas, importes, errores, máximos y mínimos. La búsqueda y la API comparten intérprete. Elige sugerencias una por una.",
        },
        aiHub: {
          title: "Centro de IA y conexiones de agentes MCP",
          summary:
            "Un interruptor controla las funciones de IA. Conecta Claude Code, Claude Desktop o Codex mediante MCP en escritorio.",
        },
        localApiDetails:
          "API local de escritorio. Especificación OpenAPI y colección de Postman.",
      },
    },
  },
  zh: {
    home: {
      hero: {
        headline: "用日常语言问账本。",
        positioning:
          "私密、本地优先的记账。无需账户，开源。搜索无需 AI 或云服务。",
        tryDemo: "用示例数据试用",
        videoLabel: "自然语言搜索演示视频",
        videoTitle: "直接提问，不用搜索",
        videoFullscreen: "全屏",
      },
      demos: {
        title: "看看实际效果",
        intro: "真实应用的短视频。点击播放前不会加载任何内容。",
        play: "播放视频：{{title}}",
        comingSoon: "即将推出",
        ai: {
          title: "AI，由你决定",
          body: "在你打开之前，AI 一直关闭。",
        },
        claude: {
          title: "AI 智能体遇见账本",
          body: "本地 LLM 帮你导入多年的交易。这只是 AI 众多可能中的一种。",
        },
        api: {
          title: "账本可编程",
          body: "运行在你自己电脑上的、有文档的 API。",
        },
        sync: {
          title: "一个账本，两台设备",
          body: "通过你选择的文件夹携带账本。",
        },
      },
      nav: {
        search: "搜索",
        differences: "产品特点",
      },
      search: {
        title: "用日常语言搜索",
        intro: "日期、金额、拼写错误。逐个选择筛选条件。上方可查看结果。",
        languageLabel: "请用英文搜索",
        example1: "expenses over 20 last month in groceries",
        example2: "starbuks since 2020",
        example3: "largest expense 2 weeks from today",
      },
      usage: {
        ai: {
          title: "AI，由你选择",
          description: "AI 功能可选。按自己的方式使用，也可在桌面端连接助手。",
        },
      },
      differences: {
        title: "产品特点",
        privateTitle: "隐私融入设计",
        privateDescription: "无需账户。数据保存在本地，除非你选择导出。",
        searchTitle: "自然语言搜索。无需 AI 或云服务。",
        searchDescription: "搜索在本地运行。AI 功能独立且可选。",
        agentTitle: "连接自己的 AI 助手（可选）",
        agentDescription: "通过桌面应用使用 MCP。",
        apiTitle: "使用本地 API 编写脚本",
        apiDescription: "OpenAPI 和 Postman。仅限桌面应用。",
      },
      roadmap: {
        recentDescription: "近期更新，公开开发。",
        shippedCount: "已发布 {{count}} 项里程碑",
        shippedSummary: "已发布：搜索、MCP 助手连接和桌面本地 API。",
      },
      milestones: {
        recent: "近期发布",
        agentLabel: "AI 与助手",
        search: {
          title: "自然语言搜索",
          summary:
            "日期、金额、拼写错误、最大和最小结果。搜索与 API 共用解析逻辑。建议逐项选择。",
        },
        aiHub: {
          title: "AI 中心与 MCP 助手连接",
          summary:
            "一个开关控制 AI 功能。可在桌面应用中通过 MCP 连接 Claude Code、Claude Desktop 或 Codex。",
        },
        localApiDetails: "桌面本地 API。提供 OpenAPI 描述和 Postman 集合。",
      },
    },
  },
  nl: {
    home: {
      hero: {
        headline: "Je geld, onder jouw regie.",
        positioning:
          "Privé en lokaal geldbeheer. Geen account. Open source. Zoeken zonder AI of cloud.",
        tryDemo: "Probeer met demodata",
        videoLabel: "Demovideo voor zoeken in gewone taal",
        videoTitle: "Vraag. Niet zoeken.",
        videoFullscreen: "Volledig scherm",
      },
      demos: {
        title: "Zie het in actie",
        intro:
          "Korte video’s van de echte app. Er laadt niets tot je op afspelen drukt.",
        play: "Video afspelen: {{title}}",
        comingSoon: "Binnenkort",
        ai: {
          title: "AI, jij beslist",
          body: "AI blijft uit tot jij het aanzet.",
        },
        claude: {
          title: "AI-agent ontmoet je grootboek",
          body: "Een lokale LLM helpt bij het importeren van jaren aan transacties. Een van de vele mogelijkheden met AI.",
        },
        api: {
          title: "Je grootboek, scriptbaar",
          body: "Een gedocumenteerde API op je eigen computer.",
        },
        sync: {
          title: "Eén grootboek, twee apparaten",
          body: "Neem je grootboek mee via een map die jij kiest.",
        },
      },
      nav: {
        search: "Zoeken",
        differences: "Wat maakt het anders",
      },
      search: {
        title: "Zoeken in gewone taal",
        intro:
          "Datums. Bedragen. Typefouten. Kies filters één voor één. Bekijk ze erboven.",
        languageLabel: "Zoek in het Engels",
        example1: "expenses over 20 last month in groceries",
        example2: "starbuks since 2020",
        example3: "largest expense 2 weeks from today",
      },
      usage: {
        ai: {
          title: "AI, als jij dat wilt",
          description:
            "AI-functies zijn optioneel. Gebruik ze op jouw manier en verbind agents via de desktopapp.",
        },
      },
      differences: {
        title: "Wat maakt het anders",
        privateTitle: "Privacy zit in het ontwerp",
        privateDescription:
          "Geen account. Je gegevens blijven lokaal, tenzij je ze exporteert.",
        searchTitle: "Zoeken in gewone taal. Geen AI of cloud.",
        searchDescription:
          "Zoeken werkt lokaal. AI-functies staan daar los van en zijn optioneel.",
        agentTitle: "Verbind je eigen AI-agent (optioneel)",
        agentDescription: "Gebruik MCP in de desktopapp.",
        apiTitle: "Script met de Local API",
        apiDescription: "OpenAPI en Postman. Alleen desktop.",
      },
      roadmap: {
        recentDescription: "Recente updates. Open ontwikkeling.",
        shippedCount: "{{count}} mijlpalen uitgebracht",
        shippedSummary:
          "Beschikbaar: zoeken, MCP-agents en de Local API voor desktop.",
      },
      milestones: {
        recent: "Recent uitgebracht",
        agentLabel: "AI en agents",
        search: {
          title: "Zoeken in natuurlijke taal",
          summary:
            "Datums, bedragen, typefouten, grootste en kleinste. App en API delen de interpretatie. Kies suggesties één voor één.",
        },
        aiHub: {
          title: "AI-hub en MCP-agentverbindingen",
          summary:
            "Eén schakelaar bestuurt AI-functies. Verbind Claude Code, Claude Desktop of Codex via MCP op desktop.",
        },
        localApiDetails:
          "Local API voor desktop. OpenAPI-beschrijving en Postman-collectie.",
      },
    },
  },
  ta: {
    home: {
      hero: {
        headline: "உங்கள் லெட்ஜரைக் கேளுங்கள். கட்டுப்பாடு உங்களிடம்.",
        positioning:
          "தனிப்பட்ட, உள்ளூர் பணக் கணக்கு. கணக்கு தேவையில்லை. திறந்த மூலம். தேடலுக்கு AI அல்லது மேகம் தேவையில்லை.",
        tryDemo: "மாதிரி தரவுடன் முயற்சி செய்",
        videoLabel: "இயல்பான மொழித் தேடல் விளக்கக் காணொளி",
        videoTitle: "கேளுங்கள். தேட வேண்டாம்.",
        videoFullscreen: "முழுத்திரை",
      },
      demos: {
        title: "செயலில் பாருங்கள்",
        intro:
          "உண்மையான செயலியின் குறுங்காணொளிகள். இயக்கும் வரை எதுவும் ஏற்றப்படாது.",
        play: "காணொளியை இயக்கு: {{title}}",
        comingSoon: "விரைவில்",
        ai: {
          title: "AI, உங்கள் முடிவு",
          body: "நீங்கள் இயக்கும் வரை AI அணைந்தே இருக்கும்.",
        },
        claude: {
          title: "AI முகவர், லெட்ஜரைச் சந்தி",
          body: "உள்ளூர் LLM பல ஆண்டுப் பரிவர்த்தனைகளை இறக்குமதி செய்ய உதவுகிறது. AI தரும் பல சாத்தியங்களில் ஒன்று.",
        },
        api: {
          title: "உங்கள் லெட்ஜர், நிரலாக்கக்கூடியது",
          body: "உங்கள் கணினியிலேயே ஆவணப்படுத்தப்பட்ட API.",
        },
        sync: {
          title: "ஒரு லெட்ஜர், இரண்டு சாதனங்கள்",
          body: "நீங்கள் தேர்ந்தெடுக்கும் கோப்புறை வழியாக லெட்ஜரை எடுத்துச் செல்லுங்கள்.",
        },
      },
      nav: {
        search: "தேடல்",
        differences: "இதன் வேறுபாடு",
      },
      search: {
        title: "இயல்பான மொழியில் தேடுங்கள்",
        intro:
          "தேதிகள். தொகைகள். எழுத்துப் பிழைகள். வடிகட்டிகளை ஒவ்வொன்றாகத் தேர்ந்தெடுக்கவும். மேலே பார்க்கலாம்.",
        languageLabel: "ஆங்கிலத்தில் தேடுங்கள்",
        example1: "expenses over 20 last month in groceries",
        example2: "starbuks since 2020",
        example3: "largest expense 2 weeks from today",
      },
      usage: {
        ai: {
          title: "நீங்கள் தேர்ந்தெடுத்தால் AI",
          description:
            "AI அம்சங்கள் விருப்பமானவை. உங்கள் விருப்பப்படி பயன்படுத்துங்கள்; டெஸ்க்டாப்பில் முகவரை இணைக்கலாம்.",
        },
      },
      differences: {
        title: "இதன் வேறுபாடு",
        privateTitle: "வடிவமைப்பிலேயே தனியுரிமை",
        privateDescription:
          "கணக்கு தேவையில்லை. ஏற்றுமதி செய்யாவிட்டால் தரவு உள்ளூரிலேயே இருக்கும்.",
        searchTitle: "இயல்பான தேடல். AI அல்லது மேகம் தேவையில்லை.",
        searchDescription:
          "தேடல் சாதனத்தில் இயங்கும். AI அம்சங்கள் தனியானவை, விருப்பத்திற்குரியவை.",
        agentTitle: "உங்கள் AI முகவரை இணைக்கவும் (விருப்பம்)",
        agentDescription: "டெஸ்க்டாப் பயன்பாட்டில் MCP பயன்படுத்தவும்.",
        apiTitle: "Local API மூலம் ஸ்கிரிப்ட் செய்யுங்கள்",
        apiDescription: "OpenAPI மற்றும் Postman. டெஸ்க்டாப்பில் மட்டும்.",
      },
      roadmap: {
        recentDescription: "சமீபத்திய வெளியீடுகள். திறந்த மேம்பாடு.",
        shippedCount: "வெளியிடப்பட்ட {{count}} மைல்கற்கள்",
        shippedSummary: "வெளியீடு: தேடல், MCP முகவர்கள், டெஸ்க்டாப் API.",
      },
      milestones: {
        recent: "சமீபத்திய வெளியீடு",
        agentLabel: "AI மற்றும் முகவர்கள்",
        search: {
          title: "இயல்பான மொழித் தேடல்",
          summary:
            "தேதிகள், தொகைகள், எழுத்துப் பிழைகள், பெரியது மற்றும் சிறியது. தேடலும் API-யும் ஒரே விளக்கத்தைப் பகிர்கின்றன.",
        },
        aiHub: {
          title: "AI மையமும் MCP முகவர் இணைப்புகளும்",
          summary:
            "ஒரு சுவிட்ச் AI அம்சங்களைக் கட்டுப்படுத்தும். டெஸ்க்டாப்பில் MCP மூலம் Claude Code, Claude Desktop அல்லது Codex ஐ இணைக்கலாம்.",
        },
        localApiDetails:
          "டெஸ்க்டாப் Local API. OpenAPI விளக்கமும் Postman தொகுப்பும்.",
      },
    },
  },
};
