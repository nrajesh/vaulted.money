import type { AreaTranslations } from "./types";

/** New landing-page positioning and shipped-feature copy. */
export const homeLanding: AreaTranslations = {
  en: {
    home: {
      hero: {
        positioning:
          "Local-first. No account. Open source. Search in plain English—no AI or cloud.",
        tryDemo: "Try it with demo data",
        videoLabel: "Natural-language search demo video",
        videoTitle: "Ask. Don’t Search.",
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
        searchDescription: "The app and API share search logic.",
        agentTitle: "Connect an AI agent through MCP",
        agentDescription: "Desktop app only.",
        apiTitle: "Script with the Local API",
        apiDescription: "OpenAPI and Postman. Desktop app only.",
      },
      roadmap: {
        shippedCount: "{{count}} shipped milestones",
        shippedSummary: "Shipped: search, MCP agents, desktop API.",
      },
      milestones: {
        recent: "Recent release",
        agentLabel: "AI & agents",
        search: {
          title: "Natural-language search",
          summary:
            "Dates, amounts, typos, largest and smallest. Search and API share one interpreter. Pick suggestions one at a time.",
        },
        aiHub: {
          title: "AI hub and MCP agent connections",
          summary:
            "One switch controls AI features. Connect Claude Code, Claude Desktop, or Codex through MCP on desktop.",
        },
        localApiDetails: "Desktop Local API. OpenAPI and Postman collection.",
      },
    },
  },
  es: {
    home: {
      hero: {
        positioning:
          "Local. Sin cuenta. Código abierto. Busca en lenguaje natural, sin IA ni nube.",
        tryDemo: "Pruébalo con datos de ejemplo",
        videoLabel: "Vídeo de demostración de búsqueda en lenguaje natural",
        videoTitle: "Pregunta. No busques.",
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
        searchDescription: "La app y la API comparten la lógica de búsqueda.",
        agentTitle: "Conecta un agente de IA mediante MCP",
        agentDescription: "Solo en la app de escritorio.",
        apiTitle: "Crea scripts con la API local",
        apiDescription: "OpenAPI y Postman. Solo en escritorio.",
      },
      roadmap: {
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
        positioning: "本地优先。开源。无需账户。自然语言搜索无需 AI 或云服务。",
        tryDemo: "用示例数据试用",
        videoLabel: "自然语言搜索演示视频",
        videoTitle: "直接提问，不用搜索",
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
        searchDescription: "应用与 API 使用相同的搜索逻辑。",
        agentTitle: "通过 MCP 连接 AI 助手",
        agentDescription: "仅限桌面应用。",
        apiTitle: "使用本地 API 编写脚本",
        apiDescription: "OpenAPI 和 Postman。仅限桌面应用。",
      },
      roadmap: {
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
        positioning:
          "Lokaal. Open source. Geen account. Zoeken in gewone taal heeft geen AI of cloud nodig.",
        tryDemo: "Probeer met demodata",
        videoLabel: "Demovideo voor zoeken in gewone taal",
        videoTitle: "Vraag. Niet zoeken.",
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
        searchDescription: "De app en API delen dezelfde zoeklogica.",
        agentTitle: "Verbind een AI-agent via MCP",
        agentDescription: "Alleen in de desktopapp.",
        apiTitle: "Script met de Local API",
        apiDescription: "OpenAPI en Postman. Alleen desktop.",
      },
      roadmap: {
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
        positioning:
          "உள்ளூர். திறந்த மூலம். கணக்கு தேவையில்லை. இயல்பான மொழித் தேடலுக்கு AI அல்லது மேகம் தேவையில்லை.",
        tryDemo: "மாதிரி தரவுடன் முயற்சி செய்",
        videoLabel: "இயல்பான மொழித் தேடல் விளக்கக் காணொளி",
        videoTitle: "கேளுங்கள். தேட வேண்டாம்.",
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
          "பயன்பாடும் API-யும் ஒரே தேடல் தர்க்கத்தைப் பகிர்கின்றன.",
        agentTitle: "MCP மூலம் AI முகவரை இணைக்கவும்",
        agentDescription: "டெஸ்க்டாப் பயன்பாட்டில் மட்டும்.",
        apiTitle: "Local API மூலம் ஸ்கிரிப்ட் செய்யுங்கள்",
        apiDescription: "OpenAPI மற்றும் Postman. டெஸ்க்டாப்பில் மட்டும்.",
      },
      roadmap: {
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
