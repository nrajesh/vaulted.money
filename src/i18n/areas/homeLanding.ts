import type { AreaTranslations } from "./types";

/** New landing-page positioning and shipped-feature copy. */
export const homeLanding: AreaTranslations = {
  en: {
    home: {
      hero: {
        positioning:
          "Local-first, open-source money tracking with no account; plain-English search needs no AI or cloud.",
        tryDemo: "Try it with demo data",
        videoLabel: "Natural-language search demo video",
      },
      nav: {
        search: "Search",
        differences: "How it differs",
      },
      search: {
        title: "Search in plain English",
        intro:
          "It understands dates, amounts, and typos. Pick suggestions one by one; the row above always shows applied filters or “No filters applied”.",
        languageLabel: "Search in English",
        example1: "expenses over 20 last month in groceries",
        example2: "starbuks since 2020",
        example3: "largest expense 2 weeks from today",
      },
      differences: {
        title: "How it differs",
        privateTitle: "Private by design",
        privateDescription:
          "No account. Your financial data stays on your device unless you export it.",
        searchTitle: "Plain-English search, without AI or cloud",
        searchDescription:
          "Search is interpreted on your device, and the search box and API share the same logic.",
        agentTitle: "Connect your own AI agent through MCP",
        agentDescription:
          "Connect your own agent over MCP from the desktop app.",
        apiTitle: "Script it through the Local API",
        apiDescription:
          "Desktop app only, with an OpenAPI description and a ready-made Postman collection.",
      },
      roadmap: {
        shippedCount: "{{count}} shipped milestones",
        shippedSummary:
          "Recent additions include local natural-language search, MCP agent connections, and the desktop Local API.",
      },
      milestones: {
        recent: "Recent release",
        agentLabel: "AI & agents",
        search: {
          title: "Natural-language search",
          summary:
            "Search understands dates, amounts, largest and smallest results, and names with small typos. Suggestions apply one at a time, and the API uses the same interpretation.",
        },
        aiHub: {
          title: "AI hub and MCP agent connections",
          summary:
            "The AI hub groups provider settings and Connect an agent behind a master AI features switch. Connect Claude Code, Claude Desktop, or Codex through MCP in the desktop app.",
        },
        localApiDetails:
          "The desktop Local API includes an OpenAPI description and a ready-made Postman collection.",
      },
    },
  },
  es: {
    home: {
      hero: {
        positioning:
          "Gestión del dinero local y de código abierto, sin cuenta; busca en lenguaje natural sin IA ni nube.",
        tryDemo: "Pruébalo con datos de ejemplo",
        videoLabel: "Vídeo de demostración de búsqueda en lenguaje natural",
      },
      nav: {
        search: "Búsqueda",
        differences: "Qué lo hace diferente",
      },
      search: {
        title: "Busca en lenguaje natural",
        intro:
          "Entiende fechas, importes y errores tipográficos. Elige las sugerencias una por una; la fila superior muestra los filtros aplicados o «Sin filtros aplicados».",
        languageLabel: "Busca en inglés",
        example1: "expenses over 20 last month in groceries",
        example2: "starbuks since 2020",
        example3: "largest expense 2 weeks from today",
      },
      differences: {
        title: "Qué lo hace diferente",
        privateTitle: "Privacidad desde el diseño",
        privateDescription:
          "Sin cuenta. Tus datos financieros permanecen en tu dispositivo, salvo que los exportes.",
        searchTitle: "Búsqueda en lenguaje natural, sin IA ni nube",
        searchDescription:
          "La búsqueda se interpreta en tu dispositivo y el cuadro de búsqueda comparte la lógica con la API.",
        agentTitle: "Conecta tu propio agente de IA mediante MCP",
        agentDescription:
          "Conecta tu propio agente mediante MCP desde la aplicación de escritorio.",
        apiTitle: "Usa scripts con la API local",
        apiDescription:
          "Solo en la aplicación de escritorio, con una descripción OpenAPI y una colección de Postman lista para usar.",
      },
      roadmap: {
        shippedCount: "{{count}} hitos publicados",
        shippedSummary:
          "Entre las novedades recientes están la búsqueda local en lenguaje natural, las conexiones de agentes MCP y la API local de escritorio.",
      },
      milestones: {
        recent: "Lanzamiento reciente",
        agentLabel: "IA y agentes",
        search: {
          title: "Búsqueda en lenguaje natural",
          summary:
            "La búsqueda entiende fechas, importes, los resultados mayores y menores, y nombres con pequeños errores tipográficos. Las sugerencias se aplican una a una y la API usa la misma interpretación.",
        },
        aiHub: {
          title: "Centro de IA y conexiones de agentes MCP",
          summary:
            "El centro de IA reúne los proveedores y Conectar un agente bajo un interruptor general de funciones de IA. Conecta Claude Code, Claude Desktop o Codex mediante MCP en la aplicación de escritorio.",
        },
        localApiDetails:
          "La API local de escritorio incluye una descripción OpenAPI y una colección de Postman lista para usar.",
      },
    },
  },
  zh: {
    home: {
      hero: {
        positioning:
          "开源、本地优先的财务管理，无需账户；自然语言搜索无需 AI 或云服务。",
        tryDemo: "用示例数据试用",
        videoLabel: "自然语言搜索演示视频",
      },
      nav: {
        search: "搜索",
        differences: "产品特点",
      },
      search: {
        title: "用日常语言搜索",
        intro:
          "它能识别日期、金额和拼写错误。逐个选择建议；上方的行始终显示已应用的筛选条件，或“未应用任何筛选条件”。",
        languageLabel: "请用英文搜索",
        example1: "expenses over 20 last month in groceries",
        example2: "starbuks since 2020",
        example3: "largest expense 2 weeks from today",
      },
      differences: {
        title: "产品特点",
        privateTitle: "隐私融入设计",
        privateDescription:
          "无需账户。财务数据保存在你的设备上，除非你选择导出。",
        searchTitle: "日常语言搜索，无需 AI 或云服务",
        searchDescription:
          "搜索在你的设备上解析，搜索框与 API 使用相同的逻辑。",
        agentTitle: "通过 MCP 连接你自己的 AI 助手",
        agentDescription: "可从桌面应用通过 MCP 连接你自己的助手。",
        apiTitle: "通过本地 API 编写脚本",
        apiDescription:
          "仅限桌面应用，提供 OpenAPI 描述和现成的 Postman 集合。",
      },
      roadmap: {
        shippedCount: "已发布 {{count}} 项里程碑",
        shippedSummary:
          "近期新增功能包括本地自然语言搜索、MCP 助手连接和桌面本地 API。",
      },
      milestones: {
        recent: "近期发布",
        agentLabel: "AI 与助手",
        search: {
          title: "自然语言搜索",
          summary:
            "搜索可识别日期、金额、最大和最小结果，以及带少量拼写错误的名称。建议逐项应用，API 使用相同的解析逻辑。",
        },
        aiHub: {
          title: "AI 中心与 MCP 助手连接",
          summary:
            "AI 中心将服务商设置和连接助手整合在 AI 功能总开关之下。可在桌面应用中通过 MCP 连接 Claude Code、Claude Desktop 或 Codex。",
        },
        localApiDetails:
          "桌面本地 API 提供 OpenAPI 描述和现成的 Postman 集合。",
      },
    },
  },
  nl: {
    home: {
      hero: {
        positioning:
          "Open source en lokaal geldbeheer zonder account; zoeken in gewone taal vereist geen AI of cloud.",
        tryDemo: "Probeer met demodata",
        videoLabel: "Demovideo voor zoeken in gewone taal",
      },
      nav: {
        search: "Zoeken",
        differences: "Wat maakt het anders",
      },
      search: {
        title: "Zoeken in gewone taal",
        intro:
          "Zoeken begrijpt datums, bedragen en typefouten. Kies suggesties één voor één; de rij erboven toont steeds de toegepaste filters of ‘Geen filters toegepast’.",
        languageLabel: "Zoek in het Engels",
        example1: "expenses over 20 last month in groceries",
        example2: "starbuks since 2020",
        example3: "largest expense 2 weeks from today",
      },
      differences: {
        title: "Wat maakt het anders",
        privateTitle: "Privacy zit in het ontwerp",
        privateDescription:
          "Geen account. Je financiële gegevens blijven op je apparaat, tenzij je ze exporteert.",
        searchTitle: "Zoeken in gewone taal, zonder AI of cloud",
        searchDescription:
          "Zoekopdrachten worden op je apparaat verwerkt; het zoekvak en de API gebruiken dezelfde logica.",
        agentTitle: "Verbind je eigen AI-agent via MCP",
        agentDescription:
          "Verbind je eigen agent via MCP vanuit de desktopapp.",
        apiTitle: "Automatiseer met de Local API",
        apiDescription:
          "Alleen in de desktopapp, met een OpenAPI-beschrijving en een kant-en-klare Postman-collectie.",
      },
      roadmap: {
        shippedCount: "{{count}} mijlpalen uitgebracht",
        shippedSummary:
          "Recente toevoegingen zijn lokaal zoeken in gewone taal, MCP-agentverbindingen en de Local API voor desktop.",
      },
      milestones: {
        recent: "Recent uitgebracht",
        agentLabel: "AI en agents",
        search: {
          title: "Zoeken in natuurlijke taal",
          summary:
            "Zoeken begrijpt datums, bedragen, grootste en kleinste resultaten en namen met kleine typefouten. Suggesties pas je één voor één toe; de API gebruikt dezelfde interpretatie.",
        },
        aiHub: {
          title: "AI-hub en MCP-agentverbindingen",
          summary:
            "De AI-hub bundelt providerinstellingen en Agent verbinden achter één hoofdschakelaar voor AI-functies. Verbind Claude Code, Claude Desktop of Codex via MCP in de desktopapp.",
        },
        localApiDetails:
          "De Local API voor desktop bevat een OpenAPI-beschrijving en een kant-en-klare Postman-collectie.",
      },
    },
  },
  ta: {
    home: {
      hero: {
        positioning:
          "திறந்த மூல உள்ளூர் பண மேலாண்மை, கணக்கு தேவையில்லை; இயல்பான மொழித் தேடலுக்கு AI அல்லது மேகம் தேவையில்லை.",
        tryDemo: "மாதிரி தரவுடன் முயற்சி செய்",
        videoLabel: "இயல்பான மொழித் தேடல் விளக்கக் காணொளி",
      },
      nav: {
        search: "தேடல்",
        differences: "இதன் வேறுபாடு",
      },
      search: {
        title: "இயல்பான மொழியில் தேடுங்கள்",
        intro:
          "தேதிகள், தொகைகள் மற்றும் எழுத்துப் பிழைகளை இது புரிந்துகொள்கிறது. பரிந்துரைகளை ஒவ்வொன்றாகத் தேர்ந்தெடுக்கவும்; மேலுள்ள வரி பயன்படுத்திய வடிகட்டிகளையோ ‘வடிகட்டிகள் எதுவும் பயன்படுத்தப்படவில்லை’ என்பதையோ காட்டும்.",
        languageLabel: "ஆங்கிலத்தில் தேடுங்கள்",
        example1: "expenses over 20 last month in groceries",
        example2: "starbuks since 2020",
        example3: "largest expense 2 weeks from today",
      },
      differences: {
        title: "இதன் வேறுபாடு",
        privateTitle: "வடிவமைப்பிலேயே தனியுரிமை",
        privateDescription:
          "கணக்கு தேவையில்லை. ஏற்றுமதி செய்யாவிட்டால் உங்கள் நிதித் தரவு உங்கள் சாதனத்திலேயே இருக்கும்.",
        searchTitle: "AI அல்லது மேகம் இல்லாத இயல்பான மொழித் தேடல்",
        searchDescription:
          "தேடல் உங்கள் சாதனத்திலேயே புரிந்துகொள்ளப்படுகிறது; தேடல் பெட்டியும் API-யும் ஒரே தர்க்கத்தைப் பகிர்கின்றன.",
        agentTitle: "MCP மூலம் உங்கள் சொந்த AI முகவரை இணைக்கவும்",
        agentDescription:
          "டெஸ்க்டாப் பயன்பாட்டிலிருந்து MCP வழியாக உங்கள் சொந்த முகவரை இணைக்கலாம்.",
        apiTitle: "Local API மூலம் ஸ்கிரிப்ட் செய்யுங்கள்",
        apiDescription:
          "டெஸ்க்டாப் பயன்பாட்டில் மட்டும்; OpenAPI விளக்கமும் தயாரான Postman தொகுப்பும் உள்ளன.",
      },
      roadmap: {
        shippedCount: "வெளியிடப்பட்ட {{count}} மைல்கற்கள்",
        shippedSummary:
          "சமீபத்திய சேர்க்கைகள்: உள்ளூர் இயல்பான மொழித் தேடல், MCP முகவர் இணைப்புகள் மற்றும் டெஸ்க்டாப் Local API.",
      },
      milestones: {
        recent: "சமீபத்திய வெளியீடு",
        agentLabel: "AI மற்றும் முகவர்கள்",
        search: {
          title: "இயல்பான மொழித் தேடல்",
          summary:
            "தேதிகள், தொகைகள், பெரியது மற்றும் சிறியது போன்ற முடிவுகள், சிறிய எழுத்துப் பிழையுள்ள பெயர்கள் ஆகியவற்றை தேடல் புரிந்துகொள்கிறது. பரிந்துரைகளை ஒவ்வொன்றாகப் பயன்படுத்தலாம்; API-யும் அதே விளக்கத்தைப் பயன்படுத்துகிறது.",
        },
        aiHub: {
          title: "AI மையமும் MCP முகவர் இணைப்புகளும்",
          summary:
            "AI மையம் வழங்குநர் அமைப்புகளையும் முகவர் இணைப்பையும் AI அம்சங்களுக்கான முதன்மை சுவிட்சின் கீழ் ஒருங்கிணைக்கிறது. டெஸ்க்டாப் பயன்பாட்டில் MCP மூலம் Claude Code, Claude Desktop அல்லது Codex ஐ இணைக்கலாம்.",
        },
        localApiDetails:
          "டெஸ்க்டாப் Local API-யில் OpenAPI விளக்கமும் தயாரான Postman தொகுப்பும் உள்ளன.",
      },
    },
  },
};
