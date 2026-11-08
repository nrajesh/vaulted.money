import type { AreaTranslations } from "./types";

/**
 * The Connect to agent page and panel, the Local API card's agent links, and
 * the sidebar entry. The Claude and LM Studio menu names stay in English
 * because those apps show them that way. Machine-written: ask a native speaker
 * to review.
 */
export const connectAgent: AreaTranslations = {
  en: {
    common: {
      cancel: "Cancel",
    },
    layout: {
      nav: {
        connectAgent: "Connect an AI agent",
        aiProvidersHint: "Use your own AI key to categorise transactions",
        connectAgentHint:
          "Analyze, chat or debate with your data using an AI agent",
        aiAndAgents: "AI & agents",
        connectAgentShort: "Connect agent",
      },
    },
    settings: {
      agent: {
        appBadge: "Easiest",
        appBlurb: "Chat in the Claude desktop app.",
        appKeepOpen: "Keep Vaulted Money open.",
        appNoExtra: "No extra software needed.",
        appOpen: "Open the downloaded file. Claude asks you to confirm.",
        appPrivacy: "What Claude reads is sent to Anthropic.",
        appRoute1: "Open Settings, then Customize, then Plugins.",
        appRoute2:
          "Click Add, then Add marketplace, then Add from a repository.",
        appRoute3: "Paste this, then click Sync:",
        appRoute4: "Open Discover, find Vaulted Money and click the + button.",
        appTitle: "The Claude app",
        askTitle: "Ask your first question",
        backToSettings: "Back to Settings",
        byokLink: "See AI Integrations in Settings.",
        byokNote: "Looking for AI categorisation with your own API key?",
        chooseTitle: "How do you want to chat?",
        codeBlurb:
          "For people who already use Claude Code, in the Claude app or in a terminal.",
        codeNode: "Needs Node 18 or newer.",
        copyCommands: "Copy commands",
        codeFound: "Claude Code is on this computer.",
        codeSetupButton: "Set up Claude Code for me",
        codeSetupRunning: "Setting up. This can take a minute.",
        codeSetupReady: "Done. Open Claude Code and ask about your money.",
        codeSetupFailed: "That did not work. Use the steps below instead.",
        codeNotFound: "We could not find Claude Code on this computer.",
        codeGet: "Get Claude Code",
        appNotFound: "We could not find the Claude app on this computer.",
        appGet: "Get the Claude app",
        terminalNote:
          "Paste this into a normal terminal, not into Claude Code.",
        codexTitle: "Codex",
        codexBlurb: "For people who use OpenAI Codex.",
        codexFound: "Codex is on this computer.",
        codexSetupButton: "Set up Codex for me",
        codexSetupReady: "Done. Open Codex and ask about your money.",
        codexSetupFailed: "That did not work. Use the steps below instead.",
        codexNodeMissing:
          "Node 18 or newer is needed. Install it, then try again.",
        codexNotFound: "We could not find Codex on this computer.",
        codexGet: "Get Codex",
        codexInstallNote: "Install, then come back and click Set up.",
        copyInstall: "Copy install command",
        copyConfig: "Copy config",
        codexConfigNote: "Or add this to ~/.codex/config.toml",
        codexPrivacy: "What Codex reads is sent to OpenAI.",
        hubSwitch: "AI features",
        hubSwitchHint: "Off hides AI and blocks agent access.",
        hubOffTitle: "AI is off",
        hubOffBody:
          "Nothing is sent to any AI provider and no agent can connect.",
        hubTurnOn: "Turn on AI",
        codePrivacy: "What Claude reads is sent to Anthropic.",
        codeTitle: "Claude Code",
        confirm: "Disconnect",
        confirmDisconnect: "Confirm disconnect",
        connectFailed:
          "Could not read the connection details. Restart the app and try again.",
        copiedStatus: "Copied",
        copyFailed: "Could not copy to the clipboard.",
        copyQuestion: "Copy question",
        copyRepository: "Copy repository name",
        copySetup: "Copy setup",
        demoTip:
          "Tip: try it with demo data first (Ledgers, then Generate demo data). It replaces your current data, so only use it on a fresh start.",
        description:
          "Chat with an AI about your money manager in three quick steps.",
        disconnect: "Disconnect everything",
        disconnectWarning:
          "This switches the Local API off and replaces the token, which cuts off every connected agent and script. Switch the Local API on again to let them reconnect on their own, with no copy-paste.",
        done: "(done)",
        download: "Download vaulted-money.mcpb from the latest release",
        enable: "Allow agents to connect",
        enableHint:
          "This also turns the Local API on or off for scripts, not only agents.",
        localBadge: "Stays on your device",
        localBlurb: "Runs on your computer, for example in LM Studio.",
        localModel: "Choose a model that can use tools.",
        localOpen:
          "In LM Studio open Program, then Install, then Edit mcp.json, and paste.",
        localPrivacyLine:
          "Your questions and data stay on this computer when the model runs here (for example LM Studio).",
        localTitle: "A private model",
        newTab: "(opens in a new tab)",
        nodeNote: "Requires Node 18 or newer.",
        off: "Off",
        outdatedDesktop:
          "This desktop build cannot connect agents yet. Update or rebuild the desktop app to use it.",
        pageIntro:
          "Let an AI agent read and update your data. What it reads is sent to its AI provider, unless the model runs on this device.",
        privacyCloud:
          "Whatever the agent reads, such as transactions, vendors and balances, is sent to the AI provider (Anthropic, for Claude).",
        privacyLocal:
          "A local model keeps everything on this device. This does not work in the claude.ai website.",
        privacyTitle: "Privacy",
        ready: "Ready",
        routeApp: "In the Claude app",
        routeAppNote: "No commands needed.",
        routeTerminal: "In a terminal",
        step1: "Switch on",
        step2: "Pick how you chat with your money",
        step3: "Ask your first question",
        steps: "Steps",
        title: "Connect to agent",
      },
      ai: {
        chatInstead: "Want to chat with your data instead?",
        connectAgentLink: "Connect an AI agent",
      },
      api: {
        advanced: "Advanced",
        agentHint: "Want an AI agent to work with your money manager?",
        connectAgent: "Connect an AI agent",
        disconnected:
          "Local API switched off and token replaced. Switch it on to reconnect.",
        loadFailed:
          "Could not read the Local API status. Restart the app and try again.",
      },
    },
  },
  es: {
    common: {
      cancel: "Cancelar",
    },
    layout: {
      nav: {
        connectAgent: "Conectar un agente de IA",
        aiProvidersHint:
          "Usa tu propia clave de IA para categorizar transacciones",
        connectAgentHint:
          "Analiza, conversa o debate con tus datos usando un agente de IA",
        aiAndAgents: "IA y agentes",
        connectAgentShort: "Conectar agente",
      },
    },
    settings: {
      agent: {
        appBadge: "Lo más fácil",
        appBlurb: "Chatea en la aplicación de escritorio de Claude.",
        appKeepOpen: "Mantén Vaulted Money abierto.",
        appNoExtra: "No hace falta ningún otro programa.",
        appOpen:
          "Abre el archivo descargado. Claude te pedirá que lo confirmes.",
        appPrivacy: "Lo que Claude lee se envía a Anthropic.",
        appRoute1: 'Abre "Settings", luego "Customize" y después "Plugins".',
        appRoute2:
          'Haz clic en "Add", luego en "Add marketplace" y después en "Add from a repository".',
        appRoute3: 'Pega esto y haz clic en "Sync":',
        appRoute4:
          'Abre "Discover", busca Vaulted Money y haz clic en el botón +.',
        appTitle: "La aplicación de Claude",
        askTitle: "Haz tu primera pregunta",
        backToSettings: "Volver a Configuración",
        byokLink: "Consulta Integraciones de IA en Configuración.",
        byokNote:
          "¿Buscas la categorización con IA usando tu propia clave de API?",
        chooseTitle: "¿Cómo quieres chatear?",
        codeBlurb:
          "Para quienes ya usan Claude Code, en la aplicación de Claude o en un terminal.",
        codeNode: "Necesita Node 18 o posterior.",
        copyCommands: "Copiar comandos",
        codeFound: "Claude Code está en este ordenador.",
        codeSetupButton: "Configurar Claude Code por mí",
        codeSetupRunning: "Configurando. Puede tardar un minuto.",
        codeSetupReady: "Listo. Abre Claude Code y pregunta por tu dinero.",
        codeSetupFailed: "No funcionó. Usa los pasos de abajo.",
        codeNotFound: "No encontramos Claude Code en este ordenador.",
        codeGet: "Obtener Claude Code",
        appNotFound: "No encontramos la app de Claude en este ordenador.",
        appGet: "Obtener la app de Claude",
        terminalNote:
          "Pega esto en un terminal normal, no dentro de Claude Code.",
        codexTitle: "Codex",
        codexBlurb: "Para quienes usan OpenAI Codex.",
        codexFound: "Codex está en este equipo.",
        codexSetupButton: "Configurar Codex por mí",
        codexSetupReady: "Listo. Abre Codex y pregunta por tu dinero.",
        codexSetupFailed: "No funcionó. Usa los pasos de abajo.",
        codexNodeMissing:
          "Se necesita Node 18 o superior. Instálalo e inténtalo de nuevo.",
        codexNotFound: "No encontramos Codex en este equipo.",
        codexGet: "Obtener Codex",
        codexInstallNote: "Instálalo, vuelve y pulsa Configurar.",
        copyInstall: "Copiar comando de instalación",
        copyConfig: "Copiar configuración",
        codexConfigNote: "O añade esto a ~/.codex/config.toml",
        codexPrivacy: "Lo que Codex lee se envía a OpenAI.",
        hubSwitch: "Funciones de IA",
        hubSwitchHint: "Apagado oculta la IA y bloquea a los agentes.",
        hubOffTitle: "La IA está desactivada",
        hubOffBody:
          "No se envía nada a ningún proveedor de IA y ningún agente puede conectarse.",
        hubTurnOn: "Activar IA",
        codePrivacy: "Lo que Claude lee se envía a Anthropic.",
        codeTitle: "Claude Code",
        confirm: "Desconectar",
        confirmDisconnect: "Confirmar la desconexión",
        connectFailed:
          "No se pudieron leer los datos de conexión. Reinicia la aplicación e inténtalo de nuevo.",
        copiedStatus: "Copiado",
        copyFailed: "No se pudo copiar al portapapeles.",
        copyQuestion: "Copiar la pregunta",
        copyRepository: "Copiar el nombre del repositorio",
        copySetup: "Copiar la configuración",
        demoTip:
          "Consejo: pruébalo antes con datos de demostración (Libros y luego Generar datos de demostración). Sustituyen tus datos actuales, así que úsalos solo al empezar de cero.",
        description:
          "Chatea con una IA sobre tu gestor de finanzas en tres pasos rápidos.",
        disconnect: "Desconectar todo",
        disconnectWarning:
          "Esto desactiva la API local y sustituye el token, lo que desconecta a todos los agentes y scripts conectados. Vuelve a activar la API local para que se reconecten solos, sin copiar ni pegar nada.",
        done: "(hecho)",
        download: "Descarga vaulted-money.mcpb de la última versión",
        enable: "Permitir que se conecten agentes",
        enableHint:
          "Esto también activa o desactiva la API local para los scripts, no solo para los agentes.",
        localBadge: "Se queda en tu dispositivo",
        localBlurb: "Se ejecuta en tu ordenador, por ejemplo en LM Studio.",
        localModel: "Elige un modelo que pueda usar herramientas.",
        localOpen:
          'En LM Studio abre "Program", luego "Install", después "Edit mcp.json" y pega.',
        localPrivacyLine:
          "Tus preguntas y tus datos se quedan en este ordenador cuando el modelo se ejecuta aquí (por ejemplo, LM Studio).",
        localTitle: "Un modelo privado",
        newTab: "(se abre en una pestaña nueva)",
        nodeNote: "Requiere Node 18 o posterior.",
        off: "Desactivado",
        outdatedDesktop:
          "Esta versión de escritorio aún no puede conectar agentes. Actualiza o recompila la aplicación de escritorio para usarlo.",
        pageIntro:
          "Deja que un agente de IA lea y actualice tus datos. Lo que lee se envía a su proveedor de IA, salvo que el modelo se ejecute en este equipo.",
        privacyCloud:
          "Todo lo que lee el agente, como transacciones, proveedores y saldos, se envía al proveedor de IA (Anthropic, en el caso de Claude).",
        privacyLocal:
          "Un modelo local lo mantiene todo en este dispositivo. Esto no funciona en el sitio web claude.ai.",
        privacyTitle: "Privacidad",
        ready: "Listo",
        routeApp: "En la aplicación de Claude",
        routeAppNote: "No hace falta ningún comando.",
        routeTerminal: "En un terminal",
        step1: "Actívalo",
        step2: "Elige cómo chatear con tu dinero",
        step3: "Haz tu primera pregunta",
        steps: "Pasos",
        title: "Conectar con un agente",
      },
      ai: {
        chatInstead: "¿Prefieres chatear con tus datos?",
        connectAgentLink: "Conectar un agente de IA",
      },
      api: {
        advanced: "Avanzado",
        agentHint:
          "¿Quieres que un agente de IA trabaje con tu gestor de finanzas?",
        connectAgent: "Conectar un agente de IA",
        disconnected:
          "API local desactivada y token sustituido. Actívala para volver a conectar.",
        loadFailed:
          "No se pudo leer el estado de la API local. Reinicia la aplicación e inténtalo de nuevo.",
      },
    },
  },
  zh: {
    common: {
      cancel: "取消",
    },
    layout: {
      nav: {
        connectAgent: "连接 AI 智能体",
        aiProvidersHint: "使用你自己的 AI 密钥为交易分类",
        connectAgentHint: "借助 AI 智能体分析、对话或探讨你的数据",
        aiAndAgents: "AI 与智能体",
        connectAgentShort: "连接智能体",
      },
    },
    settings: {
      agent: {
        appBadge: "最简单",
        appBlurb: "在 Claude 桌面应用中聊天。",
        appKeepOpen: "保持 Vaulted Money 处于打开状态。",
        appNoExtra: "无需安装其他软件。",
        appOpen: "打开下载的文件。Claude 会请您确认。",
        appPrivacy: "Claude 读取的内容会发送给 Anthropic。",
        appRoute1: "打开“Settings”，然后依次选择“Customize”和“Plugins”。",
        appRoute2:
          "点击“Add”，然后点击“Add marketplace”，再点击“Add from a repository”。",
        appRoute3: "粘贴以下内容，然后点击“Sync”：",
        appRoute4: "打开“Discover”，找到 Vaulted Money 并点击 + 按钮。",
        appTitle: "Claude 应用",
        askTitle: "提出您的第一个问题",
        backToSettings: "返回设置",
        byokLink: "请查看设置中的 AI 集成。",
        byokNote: "想使用自己的 API 密钥进行 AI 分类？",
        chooseTitle: "您想如何聊天？",
        codeBlurb: "适合已经在 Claude 应用或终端中使用 Claude Code 的用户。",
        codeNode: "需要 Node 18 或更高版本。",
        copyCommands: "复制命令",
        codeFound: "这台电脑上已有 Claude Code。",
        codeSetupButton: "为我设置 Claude Code",
        codeSetupRunning: "正在设置，可能需要一分钟。",
        codeSetupReady: "完成。打开 Claude Code，问问你的资金情况。",
        codeSetupFailed: "没有成功。请改用下面的步骤。",
        codeNotFound: "在这台电脑上找不到 Claude Code。",
        codeGet: "获取 Claude Code",
        appNotFound: "在这台电脑上找不到 Claude 应用。",
        appGet: "获取 Claude 应用",
        terminalNote: "请粘贴到普通终端，而不是 Claude Code 里。",
        codexTitle: "Codex",
        codexBlurb: "适合使用 OpenAI Codex 的人。",
        codexFound: "此电脑上已有 Codex。",
        codexSetupButton: "为我设置 Codex",
        codexSetupReady: "完成。打开 Codex，问问你的资金情况。",
        codexSetupFailed: "没有成功。请改用下面的步骤。",
        codexNodeMissing: "需要 Node 18 或更高版本。请先安装，然后重试。",
        codexNotFound: "在此电脑上找不到 Codex。",
        codexGet: "获取 Codex",
        codexInstallNote: "安装后回来点击“设置”。",
        copyInstall: "复制安装命令",
        copyConfig: "复制配置",
        codexConfigNote: "或将此内容添加到 ~/.codex/config.toml",
        codexPrivacy: "Codex 读取的内容会发送给 OpenAI。",
        hubSwitch: "AI 功能",
        hubSwitchHint: "关闭后隐藏 AI 并阻止智能体访问。",
        hubOffTitle: "AI 已关闭",
        hubOffBody: "不会向任何 AI 提供商发送数据，也没有智能体能连接。",
        hubTurnOn: "开启 AI",
        codePrivacy: "Claude 读取的内容会发送给 Anthropic。",
        codeTitle: "Claude Code",
        confirm: "断开连接",
        confirmDisconnect: "确认断开连接",
        connectFailed: "无法读取连接信息。请重启应用后重试。",
        copiedStatus: "已复制",
        copyFailed: "无法复制到剪贴板。",
        copyQuestion: "复制问题",
        copyRepository: "复制仓库名称",
        copySetup: "复制配置",
        demoTip:
          "提示：先用演示数据试一试（账本，然后选择生成演示数据）。演示数据会替换您当前的数据，因此只在全新开始时使用。",
        description: "只需三个简单步骤，即可与 AI 聊聊您的理财应用。",
        disconnect: "全部断开连接",
        disconnectWarning:
          "这会关闭本地 API 并更换令牌，从而断开所有已连接的智能体和脚本。重新打开本地 API 后，它们会自动重新连接，无需复制粘贴。",
        done: "（已完成）",
        download: "从最新版本下载 vaulted-money.mcpb",
        enable: "允许智能体连接",
        enableHint: "这也会为脚本（不只是智能体）打开或关闭本地 API。",
        localBadge: "保留在您的设备上",
        localBlurb: "在您的电脑上运行，例如在 LM Studio 中。",
        localModel: "请选择支持调用工具的模型。",
        localOpen:
          "在 LM Studio 中打开“Program”，然后选择“Install”，再选择“Edit mcp.json”，然后粘贴。",
        localPrivacyLine:
          "当模型在本机运行时（例如 LM Studio），您的问题和数据都会保留在这台电脑上。",
        localTitle: "私有模型",
        newTab: "（在新标签页中打开）",
        nodeNote: "需要 Node 18 或更高版本。",
        off: "已关闭",
        outdatedDesktop:
          "此桌面版本还无法连接智能体。请更新或重新构建桌面应用以使用此功能。",
        pageIntro:
          "让 AI 智能体读取并更新你的数据。它读取的内容会发送给其 AI 提供商，除非模型在本机运行。",
        privacyCloud:
          "智能体读取的任何内容（例如交易、商家和余额）都会发送给 AI 提供商（对 Claude 而言是 Anthropic）。",
        privacyLocal:
          "本地模型会把一切都保留在这台设备上。此功能不适用于 claude.ai 网站。",
        privacyTitle: "隐私",
        ready: "已就绪",
        routeApp: "在 Claude 应用中",
        routeAppNote: "无需输入命令。",
        routeTerminal: "在终端中",
        step1: "打开开关",
        step2: "选择与您的财务数据聊天的方式",
        step3: "提出您的第一个问题",
        steps: "步骤",
        title: "连接智能体",
      },
      ai: {
        chatInstead: "想改为与您的数据聊天？",
        connectAgentLink: "连接 AI 智能体",
      },
      api: {
        advanced: "高级",
        agentHint: "想让 AI 智能体帮您打理理财应用？",
        connectAgent: "连接 AI 智能体",
        disconnected: "本地 API 已关闭，令牌已更换。重新打开即可再次连接。",
        loadFailed: "无法读取本地 API 的状态。请重启应用后重试。",
      },
    },
  },
  nl: {
    common: {
      cancel: "Annuleren",
    },
    layout: {
      nav: {
        connectAgent: "Een AI-agent koppelen",
        aiProvidersHint:
          "Gebruik je eigen AI-sleutel om transacties te categoriseren",
        connectAgentHint:
          "Analyseer, chat of debatteer met je gegevens via een AI-agent",
        aiAndAgents: "AI en agents",
        connectAgentShort: "Agent koppelen",
      },
    },
    settings: {
      agent: {
        appBadge: "Makkelijkst",
        appBlurb: "Chat in de Claude-desktopapp.",
        appKeepOpen: "Houd Vaulted Money open.",
        appNoExtra: "Geen extra software nodig.",
        appOpen:
          "Open het gedownloade bestand. Claude vraagt je om te bevestigen.",
        appPrivacy: "Wat Claude leest, wordt naar Anthropic gestuurd.",
        appRoute1: 'Open "Settings", dan "Customize" en dan "Plugins".',
        appRoute2:
          'Klik op "Add", dan op "Add marketplace" en dan op "Add from a repository".',
        appRoute3: 'Plak dit en klik dan op "Sync":',
        appRoute4: 'Open "Discover", zoek Vaulted Money en klik op de knop +.',
        appTitle: "De Claude-app",
        askTitle: "Stel je eerste vraag",
        backToSettings: "Terug naar Instellingen",
        byokLink: "Zie AI-integraties in Instellingen.",
        byokNote: "Op zoek naar AI-categorisatie met je eigen API-sleutel?",
        chooseTitle: "Hoe wil je chatten?",
        codeBlurb:
          "Voor wie Claude Code al gebruikt, in de Claude-app of in een terminal.",
        codeNode: "Vereist Node 18 of nieuwer.",
        copyCommands: "Opdrachten kopiëren",
        codeFound: "Claude Code staat op deze computer.",
        codeSetupButton: "Claude Code voor mij instellen",
        codeSetupRunning: "Bezig met instellen. Dit kan een minuut duren.",
        codeSetupReady: "Klaar. Open Claude Code en vraag naar je geld.",
        codeSetupFailed: "Dat lukte niet. Gebruik de stappen hieronder.",
        codeNotFound: "We konden Claude Code niet vinden op deze computer.",
        codeGet: "Claude Code downloaden",
        appNotFound: "We konden de Claude-app niet vinden op deze computer.",
        appGet: "De Claude-app downloaden",
        terminalNote: "Plak dit in een gewone terminal, niet in Claude Code.",
        codexTitle: "Codex",
        codexBlurb: "Voor wie OpenAI Codex gebruikt.",
        codexFound: "Codex staat op deze computer.",
        codexSetupButton: "Codex voor mij instellen",
        codexSetupReady: "Klaar. Open Codex en vraag naar je geld.",
        codexSetupFailed: "Dat lukte niet. Gebruik de stappen hieronder.",
        codexNodeMissing:
          "Node 18 of nieuwer is nodig. Installeer het en probeer opnieuw.",
        codexNotFound: "We konden Codex niet vinden op deze computer.",
        codexGet: "Codex downloaden",
        codexInstallNote: "Installeer het, kom terug en klik op Instellen.",
        copyInstall: "Installatieopdracht kopiëren",
        copyConfig: "Config kopiëren",
        codexConfigNote: "Of voeg dit toe aan ~/.codex/config.toml",
        codexPrivacy: "Wat Codex leest, wordt naar OpenAI gestuurd.",
        hubSwitch: "AI-functies",
        hubSwitchHint: "Uit verbergt AI en blokkeert agenttoegang.",
        hubOffTitle: "AI staat uit",
        hubOffBody:
          "Er wordt niets naar een AI-aanbieder gestuurd en geen agent kan verbinden.",
        hubTurnOn: "AI aanzetten",
        codePrivacy: "Wat Claude leest, wordt naar Anthropic gestuurd.",
        codeTitle: "Claude Code",
        confirm: "Loskoppelen",
        confirmDisconnect: "Loskoppelen bevestigen",
        connectFailed:
          "De verbindingsgegevens konden niet worden gelezen. Start de app opnieuw en probeer het nog eens.",
        copiedStatus: "Gekopieerd",
        copyFailed: "Kopiëren naar het klembord is mislukt.",
        copyQuestion: "Vraag kopiëren",
        copyRepository: "Naam van de repository kopiëren",
        copySetup: "Configuratie kopiëren",
        demoTip:
          "Tip: probeer het eerst met demogegevens (Grootboeken, dan Demogegevens genereren). Die vervangen je huidige gegevens, dus gebruik ze alleen als je opnieuw begint.",
        description:
          "Chat in drie snelle stappen met een AI over je geldbeheer.",
        disconnect: "Alles loskoppelen",
        disconnectWarning:
          "Dit zet de lokale API uit en vervangt het token, waardoor elke gekoppelde agent en elk script wordt afgesloten. Zet de lokale API weer aan om ze vanzelf opnieuw te laten verbinden, zonder kopiëren en plakken.",
        done: "(klaar)",
        download: "Download vaulted-money.mcpb uit de nieuwste release",
        enable: "Agents toestaan te verbinden",
        enableHint:
          "Dit zet de lokale API ook aan of uit voor scripts, niet alleen voor agents.",
        localBadge: "Blijft op je apparaat",
        localBlurb: "Draait op je computer, bijvoorbeeld in LM Studio.",
        localModel: "Kies een model dat tools kan gebruiken.",
        localOpen:
          'Open in LM Studio "Program", dan "Install", dan "Edit mcp.json" en plak.',
        localPrivacyLine:
          "Je vragen en gegevens blijven op deze computer als het model hier draait (bijvoorbeeld LM Studio).",
        localTitle: "Een privémodel",
        newTab: "(opent in een nieuw tabblad)",
        nodeNote: "Vereist Node 18 of nieuwer.",
        off: "Uit",
        outdatedDesktop:
          "Deze desktopversie kan nog geen agents koppelen. Werk de desktop-app bij of bouw hem opnieuw om dit te gebruiken.",
        pageIntro:
          "Laat een AI-agent je gegevens lezen en bijwerken. Wat het leest, gaat naar de AI-aanbieder, tenzij het model op dit apparaat draait.",
        privacyCloud:
          "Alles wat de agent leest, zoals transacties, leveranciers en saldi, wordt naar de AI-aanbieder gestuurd (Anthropic, voor Claude).",
        privacyLocal:
          "Een lokaal model houdt alles op dit apparaat. Dit werkt niet op de website claude.ai.",
        privacyTitle: "Privacy",
        ready: "Klaar",
        routeApp: "In de Claude-app",
        routeAppNote: "Geen commando's nodig.",
        routeTerminal: "In een terminal",
        step1: "Zet het aan",
        step2: "Kies hoe je over je geld chat",
        step3: "Stel je eerste vraag",
        steps: "Stappen",
        title: "Koppelen met een agent",
      },
      ai: {
        chatInstead: "Wil je liever met je gegevens chatten?",
        connectAgentLink: "Een AI-agent koppelen",
      },
      api: {
        advanced: "Geavanceerd",
        agentHint: "Wil je dat een AI-agent met je geldbeheer werkt?",
        connectAgent: "Een AI-agent koppelen",
        disconnected:
          "Lokale API uitgezet en token vervangen. Zet hem aan om opnieuw te verbinden.",
        loadFailed:
          "De status van de lokale API kon niet worden gelezen. Start de app opnieuw en probeer het nog eens.",
      },
    },
  },
  ta: {
    common: {
      cancel: "ரத்து செய்",
    },
    layout: {
      nav: {
        connectAgent: "AI முகவரை இணை",
        aiProvidersHint:
          "பரிவர்த்தனைகளை வகைப்படுத்த உங்கள் சொந்த AI விசையைப் பயன்படுத்துங்கள்",
        connectAgentHint:
          "AI முகவருடன் உங்கள் தரவை ஆய்வு செய்யுங்கள், உரையாடுங்கள், விவாதியுங்கள்",
        aiAndAgents: "AI மற்றும் முகவர்கள்",
        connectAgentShort: "முகவரை இணை",
      },
    },
    settings: {
      agent: {
        appBadge: "மிக எளிது",
        appBlurb: "Claude டெஸ்க்டாப் பயன்பாட்டில் உரையாடுங்கள்.",
        appKeepOpen: "Vaulted Money-ஐத் திறந்தே வைத்திருங்கள்.",
        appNoExtra: "கூடுதல் மென்பொருள் தேவையில்லை.",
        appOpen:
          "பதிவிறக்கிய கோப்பைத் திறக்கவும். Claude உறுதிப்படுத்தக் கேட்கும்.",
        appPrivacy: "Claude படிப்பவை Anthropic-க்கு அனுப்பப்படும்.",
        appRoute1:
          '"Settings"-ஐத் திறந்து, பிறகு "Customize", பிறகு "Plugins"-ஐத் திறக்கவும்.',
        appRoute2:
          '"Add"-ஐக் கிளிக் செய்து, பிறகு "Add marketplace", பிறகு "Add from a repository"-ஐக் கிளிக் செய்யவும்.',
        appRoute3: 'இதை ஒட்டி, பிறகு "Sync"-ஐக் கிளிக் செய்யவும்:',
        appRoute4:
          '"Discover"-ஐத் திறந்து, Vaulted Money-ஐக் கண்டுபிடித்து + பொத்தானைக் கிளிக் செய்யவும்.',
        appTitle: "Claude பயன்பாடு",
        askTitle: "உங்கள் முதல் கேள்வியைக் கேளுங்கள்",
        backToSettings: "அமைப்புகளுக்குத் திரும்பு",
        byokLink: "அமைப்புகளில் AI ஒருங்கிணைப்புகளைப் பாருங்கள்.",
        byokNote:
          "உங்கள் சொந்த API விசையுடன் AI வகைப்படுத்தலைத் தேடுகிறீர்களா?",
        chooseTitle: "எப்படி உரையாட விரும்புகிறீர்கள்?",
        codeBlurb:
          "Claude பயன்பாட்டிலோ டெர்மினலிலோ ஏற்கெனவே Claude Code பயன்படுத்துபவர்களுக்கு.",
        codeNode: "Node 18 அல்லது புதிய பதிப்பு தேவை.",
        copyCommands: "கட்டளைகளை நகலெடு",
        codeFound: "இந்தக் கணினியில் Claude Code உள்ளது.",
        codeSetupButton: "எனக்காக Claude Code-ஐ அமை",
        codeSetupRunning: "அமைக்கிறது. ஒரு நிமிடம் ஆகலாம்.",
        codeSetupReady:
          "முடிந்தது. Claude Code-ஐத் திறந்து உங்கள் பணம் பற்றிக் கேளுங்கள்.",
        codeSetupFailed:
          "அது வேலை செய்யவில்லை. கீழே உள்ள படிகளைப் பயன்படுத்துங்கள்.",
        codeNotFound: "இந்தக் கணினியில் Claude Code கிடைக்கவில்லை.",
        codeGet: "Claude Code-ஐப் பெறு",
        appNotFound: "இந்தக் கணினியில் Claude செயலி கிடைக்கவில்லை.",
        appGet: "Claude செயலியைப் பெறு",
        terminalNote:
          "இதை சாதாரண டெர்மினலில் ஒட்டுங்கள், Claude Code-க்குள் அல்ல.",
        codexTitle: "Codex",
        codexBlurb: "OpenAI Codex பயன்படுத்துபவர்களுக்கு.",
        codexFound: "இந்த கணினியில் Codex உள்ளது.",
        codexSetupButton: "எனக்காக Codex ஐ அமை",
        codexSetupReady:
          "முடிந்தது. Codex ஐத் திறந்து உங்கள் பணம் பற்றிக் கேளுங்கள்.",
        codexSetupFailed:
          "அது வேலை செய்யவில்லை. கீழே உள்ள படிகளைப் பயன்படுத்துங்கள்.",
        codexNodeMissing:
          "Node 18 அல்லது புதியது தேவை. நிறுவி மீண்டும் முயலுங்கள்.",
        codexNotFound: "இந்த கணினியில் Codex ஐக் காண முடியவில்லை.",
        codexGet: "Codex ஐப் பெறு",
        codexInstallNote: "நிறுவி, திரும்பி வந்து அமை என்பதை அழுத்துங்கள்.",
        copyInstall: "நிறுவல் கட்டளையை நகலெடு",
        copyConfig: "கட்டமைப்பை நகலெடு",
        codexConfigNote: "அல்லது இதை ~/.codex/config.toml இல் சேர்க்கவும்",
        codexPrivacy: "Codex படிப்பது OpenAI க்கு அனுப்பப்படும்.",
        hubSwitch: "AI அம்சங்கள்",
        hubSwitchHint: "அணைத்தால் AI மறைந்து முகவர் அணுகல் தடுக்கப்படும்.",
        hubOffTitle: "AI அணைந்துள்ளது",
        hubOffBody:
          "எந்த AI வழங்குநருக்கும் எதுவும் அனுப்பப்படாது; எந்த முகவரும் இணைய முடியாது.",
        hubTurnOn: "AI ஐ இயக்கு",
        codePrivacy: "Claude படிப்பவை Anthropic-க்கு அனுப்பப்படும்.",
        codeTitle: "Claude Code",
        confirm: "துண்டி",
        confirmDisconnect: "துண்டிப்பதை உறுதிப்படுத்து",
        connectFailed:
          "இணைப்பு விவரங்களைப் படிக்க முடியவில்லை. பயன்பாட்டை மறுதொடக்கம் செய்து மீண்டும் முயலவும்.",
        copiedStatus: "நகலெடுக்கப்பட்டது",
        copyFailed: "கிளிப்போர்டுக்கு நகலெடுக்க முடியவில்லை.",
        copyQuestion: "கேள்வியை நகலெடு",
        copyRepository: "களஞ்சியத்தின் பெயரை நகலெடு",
        copySetup: "அமைப்பை நகலெடு",
        demoTip:
          "குறிப்பு: முதலில் டெமோ தரவுடன் முயலுங்கள் (பேரேடுகள், பிறகு டெமோ தரவை உருவாக்கு). அது உங்கள் தற்போதைய தரவை மாற்றிவிடும், எனவே புதிதாகத் தொடங்கும்போது மட்டும் பயன்படுத்துங்கள்.",
        description:
          "மூன்று எளிய படிகளில் உங்கள் பண மேலாளர் பற்றி AI உடன் உரையாடுங்கள்.",
        disconnect: "அனைத்தையும் துண்டி",
        disconnectWarning:
          "இது உள்ளூர் API-ஐ அணைத்து டோக்கனை மாற்றுகிறது, இதனால் இணைக்கப்பட்ட ஒவ்வொரு முகவரும் ஸ்கிரிப்டும் துண்டிக்கப்படும். அவை நகலெடுத்து ஒட்டாமலேயே தாமாக மீண்டும் இணைய, உள்ளூர் API-ஐ மீண்டும் இயக்குங்கள்.",
        done: "(முடிந்தது)",
        download:
          "சமீபத்திய வெளியீட்டிலிருந்து vaulted-money.mcpb-ஐப் பதிவிறக்குங்கள்",
        enable: "முகவர்கள் இணைய அனுமதி",
        enableHint:
          "இது முகவர்களுக்கு மட்டுமல்லாமல் ஸ்கிரிப்ட்களுக்கும் உள்ளூர் API-ஐ இயக்கும் அல்லது அணைக்கும்.",
        localBadge: "உங்கள் சாதனத்திலேயே இருக்கும்",
        localBlurb:
          "உங்கள் கணினியில் இயங்கும், எடுத்துக்காட்டாக LM Studio-வில்.",
        localModel: "கருவிகளைப் பயன்படுத்தக்கூடிய மாதிரியைத் தேர்ந்தெடுங்கள்.",
        localOpen:
          'LM Studio-வில் "Program", பிறகு "Install", பிறகு "Edit mcp.json"-ஐத் திறந்து ஒட்டுங்கள்.',
        localPrivacyLine:
          "மாதிரி இங்கேயே இயங்கும்போது (எடுத்துக்காட்டாக LM Studio), உங்கள் கேள்விகளும் தரவும் இந்தக் கணினியிலேயே இருக்கும்.",
        localTitle: "தனிப்பட்ட மாதிரி",
        newTab: "(புதிய தாவலில் திறக்கும்)",
        nodeNote: "Node 18 அல்லது புதிய பதிப்பு தேவை.",
        off: "அணைக்கப்பட்டது",
        outdatedDesktop:
          "இந்த டெஸ்க்டாப் பதிப்பால் இன்னும் முகவர்களை இணைக்க முடியாது. இதைப் பயன்படுத்த டெஸ்க்டாப் பயன்பாட்டைப் புதுப்பிக்கவும் அல்லது மீண்டும் உருவாக்கவும்.",
        pageIntro:
          "AI முகவர் உங்கள் தரவைப் படித்து புதுப்பிக்கட்டும். மாதிரி இந்தச் சாதனத்தில் இயங்காவிட்டால், அது படிப்பது அதன் AI வழங்குநருக்கு அனுப்பப்படும்.",
        privacyCloud:
          "பரிவர்த்தனைகள், விற்பனையாளர்கள், இருப்புகள் போன்று முகவர் படிக்கும் அனைத்தும் AI வழங்குநருக்கு (Claude-க்கு Anthropic) அனுப்பப்படும்.",
        privacyLocal:
          "உள்ளூர் மாதிரி அனைத்தையும் இந்தச் சாதனத்திலேயே வைத்திருக்கும். இது claude.ai இணையதளத்தில் வேலை செய்யாது.",
        privacyTitle: "தனியுரிமை",
        ready: "தயார்",
        routeApp: "Claude பயன்பாட்டில்",
        routeAppNote: "கட்டளைகள் எதுவும் தேவையில்லை.",
        routeTerminal: "டெர்மினலில்",
        step1: "இயக்குங்கள்",
        step2: "உங்கள் பணத்துடன் எப்படி உரையாடுவது என்பதைத் தேர்ந்தெடுங்கள்",
        step3: "உங்கள் முதல் கேள்வியைக் கேளுங்கள்",
        steps: "படிகள்",
        title: "முகவருடன் இணை",
      },
      ai: {
        chatInstead: "அதற்குப் பதிலாக உங்கள் தரவுடன் உரையாட விரும்புகிறீர்களா?",
        connectAgentLink: "AI முகவரை இணை",
      },
      api: {
        advanced: "மேம்பட்டவை",
        agentHint: "உங்கள் பண மேலாளருடன் AI முகவர் வேலை செய்ய வேண்டுமா?",
        connectAgent: "AI முகவரை இணை",
        disconnected:
          "உள்ளூர் API அணைக்கப்பட்டு டோக்கன் மாற்றப்பட்டது. மீண்டும் இணைக்க அதை இயக்குங்கள்.",
        loadFailed:
          "உள்ளூர் API நிலையைப் படிக்க முடியவில்லை. பயன்பாட்டை மறுதொடக்கம் செய்து மீண்டும் முயலவும்.",
      },
    },
  },
};
