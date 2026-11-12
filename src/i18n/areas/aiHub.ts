import type { AreaTranslations } from "./types";

/**
 * The single "AI & agents" page, the API key and model picker in the provider
 * dialog, and the Settings page that also opens without a ledger.
 * Machine-written: ask a native speaker to review.
 */
export const aiHub: AreaTranslations = {
  en: {
    aiHub: {
      subtitle:
        "Everything AI lives on this page. Nothing is sent anywhere until you switch it on and set it up.",
      dialog: {
        needKey: "Enter the API key for this provider first.",
        model: "Model",
        selectModel: "Select your model",
        modelsFoundHint:
          "Models found: {{count}}. Select the one to use from the list above.",
        typeInstead: "Type a model name instead",
        modelHint:
          "Click Load models to pick from a list, or type a model name. Leave it blank to use the provider's default.",
        apiKey: "API key",
        apiKeyOptional: "API key (not needed for a local model)",
        apiKeyPlaceholder: "Paste your key",
        apiKeyBlank: "Leave blank",
        apiKeyHint:
          "Stored on this device only. It is never included in backups or exports.",
      },
      providers: {
        title: "AI inside the app",
        subtitle:
          "Powers Auto-categorize. Add a provider with your own key, or a model running on your computer, and pick the one to use. Only vendor names are sent, never amounts.",
        inUse: "In use",
        useThis: "Use this one",
        keyColumn: "API key",
        keySaved: "Saved",
        keyNotNeeded: "Not needed",
        keyMissing: "Add key",
      },
      summary: {
        label: "What is set up",
        inAppNone: "Not set up yet. Add a provider to start.",
        inAppNoneInUse: "No provider is in use. Pick one below.",
        inAppNeedsKey: "{{name}} still needs its API key.",
        inAppLocal: "{{name}} is in use. Your own endpoint, no key needed.",
        inAppReady: "{{name}} is in use.",
        agentsDesktopOnly: "Available in the desktop app.",
        agentsOn: "On. Agents on this computer can connect.",
        agentsOff: "Off. No agent can connect.",
      },
      agents: {
        title: "Chat with your data from an AI agent",
        matchNote:
          "Picked to match {{name}}, which you already use inside the app. Choose another any time.",
      },
    },
    appSettings: {
      subtitle:
        "Settings for the open ledger come first, then the ones that apply to every ledger on this device.",
      thisLedger: "This ledger: {{name}}",
      thisLedgerNone: "This ledger",
      noLedger:
        "No ledger is open. Open one to change its currency and details.",
      chooseLedger: "Choose a ledger",
      allLedgers: "Every ledger on this device",
      backToLedgers: "Back to ledgers",
      navLabel: "App settings",
      ledgerFreeNote:
        "No ledger is open. What you change here applies to every ledger on this device.",
      ai: {
        description:
          "Providers, API keys, local models and AI agents are all set up on one page.",
        open: "Open AI & agents",
        inUse: "In use: {{name}}",
        notSetUp: "No AI provider is in use.",
      },
    },
  },
  es: {
    aiHub: {
      subtitle:
        "Todo lo relacionado con la IA está en esta página. No se envía nada hasta que la actives y la configures.",
      dialog: {
        needKey: "Introduce primero la clave de API de este proveedor.",
        model: "Modelo",
        selectModel: "Selecciona tu modelo",
        modelsFoundHint:
          "Modelos encontrados: {{count}}. Selecciona en la lista de arriba el que quieras usar.",
        typeInstead: "Escribir el nombre del modelo",
        modelHint:
          "Pulsa Cargar modelos para elegir de una lista, o escribe el nombre de un modelo. Déjalo en blanco para usar el predeterminado del proveedor.",
        apiKey: "Clave de API",
        apiKeyOptional: "Clave de API (no hace falta para un modelo local)",
        apiKeyPlaceholder: "Pega tu clave",
        apiKeyBlank: "Déjalo en blanco",
        apiKeyHint:
          "Se guarda solo en este dispositivo. Nunca se incluye en copias de seguridad ni exportaciones.",
      },
      providers: {
        title: "IA dentro de la app",
        subtitle:
          "Se usa para la categorización automática. Añade un proveedor con tu propia clave, o un modelo que se ejecute en tu ordenador, y elige cuál usar. Solo se envían nombres de comercios, nunca importes.",
        inUse: "En uso",
        useThis: "Usar este",
        keyColumn: "Clave de API",
        keySaved: "Guardada",
        keyNotNeeded: "No hace falta",
        keyMissing: "Añadir clave",
      },
      summary: {
        label: "Qué está configurado",
        inAppNone: "Aún sin configurar. Añade un proveedor para empezar.",
        inAppNoneInUse: "No hay ningún proveedor en uso. Elige uno abajo.",
        inAppNeedsKey: "A {{name}} le falta su clave de API.",
        inAppLocal: "{{name}} está en uso. Tu propio servidor, sin clave.",
        inAppReady: "{{name}} está en uso.",
        agentsDesktopOnly: "Disponible en la app de escritorio.",
        agentsOn: "Activado. Los agentes de este ordenador pueden conectarse.",
        agentsOff: "Desactivado. Ningún agente puede conectarse.",
      },
      agents: {
        title: "Chatea con tus datos desde un agente de IA",
        matchNote:
          "Elegido para coincidir con {{name}}, que ya usas dentro de la app. Puedes elegir otro cuando quieras.",
      },
    },
    appSettings: {
      subtitle:
        "Primero los ajustes del libro abierto y después los que se aplican a todos los libros de este dispositivo.",
      thisLedger: "Este libro: {{name}}",
      thisLedgerNone: "Este libro",
      noLedger:
        "No hay ningún libro abierto. Abre uno para cambiar su moneda y sus datos.",
      chooseLedger: "Elegir un libro",
      allLedgers: "Todos los libros de este dispositivo",
      backToLedgers: "Volver a los libros",
      navLabel: "Ajustes de la app",
      ledgerFreeNote:
        "No hay ningún libro abierto. Lo que cambies aquí se aplica a todos los libros de este dispositivo.",
      ai: {
        description:
          "Proveedores, claves de API, modelos locales y agentes de IA se configuran en una sola página.",
        open: "Abrir IA y agentes",
        inUse: "En uso: {{name}}",
        notSetUp: "No hay ningún proveedor de IA en uso.",
      },
    },
  },
  zh: {
    aiHub: {
      subtitle:
        "所有 AI 功能都在此页面。在您开启并完成设置之前，不会发送任何数据。",
      dialog: {
        needKey: "请先输入此提供商的 API 密钥。",
        model: "模型",
        selectModel: "选择您的模型",
        modelsFoundHint:
          "找到 {{count}} 个模型。请在上方列表中选择要使用的模型。",
        typeInstead: "改为手动输入模型名称",
        modelHint:
          "点击“加载模型”从列表中选择，或输入模型名称。留空则使用提供商的默认模型。",
        apiKey: "API 密钥",
        apiKeyOptional: "API 密钥（本地模型不需要）",
        apiKeyPlaceholder: "粘贴您的密钥",
        apiKeyBlank: "留空",
        apiKeyHint: "仅保存在此设备上，绝不会包含在备份或导出中。",
      },
      providers: {
        title: "应用内的 AI",
        subtitle:
          "用于自动分类。添加使用您自己密钥的提供商，或在您电脑上运行的模型，并选择要使用的那个。只发送商户名称，绝不发送金额。",
        inUse: "使用中",
        useThis: "使用这个",
        keyColumn: "API 密钥",
        keySaved: "已保存",
        keyNotNeeded: "不需要",
        keyMissing: "添加密钥",
      },
      summary: {
        label: "当前设置",
        inAppNone: "尚未设置。添加一个提供商即可开始。",
        inAppNoneInUse: "没有正在使用的提供商。请在下方选择一个。",
        inAppNeedsKey: "{{name}} 还需要 API 密钥。",
        inAppLocal: "正在使用 {{name}}。您自己的端点，无需密钥。",
        inAppReady: "正在使用 {{name}}。",
        agentsDesktopOnly: "可在桌面应用中使用。",
        agentsOn: "已开启。此电脑上的智能体可以连接。",
        agentsOff: "已关闭。任何智能体都无法连接。",
      },
      agents: {
        title: "通过 AI 智能体与您的数据对话",
        matchNote:
          "已根据您在应用内使用的 {{name}} 预选。您可以随时选择其他方式。",
      },
    },
    appSettings: {
      subtitle: "先是当前账本的设置，然后是适用于此设备上所有账本的设置。",
      thisLedger: "当前账本：{{name}}",
      thisLedgerNone: "当前账本",
      noLedger: "没有打开的账本。打开一个账本即可更改其货币和详细信息。",
      chooseLedger: "选择账本",
      allLedgers: "此设备上的所有账本",
      backToLedgers: "返回账本列表",
      navLabel: "应用设置",
      ledgerFreeNote:
        "没有打开的账本。您在此处的更改适用于此设备上的所有账本。",
      ai: {
        description:
          "提供商、API 密钥、本地模型和 AI 智能体都在同一个页面设置。",
        open: "打开 AI 与智能体",
        inUse: "使用中：{{name}}",
        notSetUp: "没有正在使用的 AI 提供商。",
      },
    },
  },
  nl: {
    aiHub: {
      subtitle:
        "Alles rond AI staat op deze pagina. Er wordt niets verstuurd totdat je het aanzet en instelt.",
      dialog: {
        needKey: "Vul eerst de API-sleutel van deze provider in.",
        model: "Model",
        selectModel: "Selecteer je model",
        modelsFoundHint:
          "Modellen gevonden: {{count}}. Selecteer in de lijst hierboven welk model je wilt gebruiken.",
        typeInstead: "Zelf een modelnaam typen",
        modelHint:
          "Klik op Modellen laden om uit een lijst te kiezen, of typ een modelnaam. Laat leeg om de standaard van de provider te gebruiken.",
        apiKey: "API-sleutel",
        apiKeyOptional: "API-sleutel (niet nodig voor een lokaal model)",
        apiKeyPlaceholder: "Plak je sleutel",
        apiKeyBlank: "Leeg laten",
        apiKeyHint:
          "Alleen op dit apparaat opgeslagen. Komt nooit in back-ups of exports.",
      },
      providers: {
        title: "AI in de app",
        subtitle:
          "Wordt gebruikt voor automatisch categoriseren. Voeg een provider toe met je eigen sleutel, of een model dat op je computer draait, en kies welke je gebruikt. Alleen namen van leveranciers worden verstuurd, nooit bedragen.",
        inUse: "In gebruik",
        useThis: "Deze gebruiken",
        keyColumn: "API-sleutel",
        keySaved: "Opgeslagen",
        keyNotNeeded: "Niet nodig",
        keyMissing: "Sleutel toevoegen",
      },
      summary: {
        label: "Wat is ingesteld",
        inAppNone: "Nog niet ingesteld. Voeg een provider toe om te beginnen.",
        inAppNoneInUse:
          "Er is geen provider in gebruik. Kies er hieronder een.",
        inAppNeedsKey: "{{name}} heeft nog een API-sleutel nodig.",
        inAppLocal:
          "{{name}} is in gebruik. Je eigen endpoint, geen sleutel nodig.",
        inAppReady: "{{name}} is in gebruik.",
        agentsDesktopOnly: "Beschikbaar in de desktop-app.",
        agentsOn: "Aan. Agents op deze computer kunnen verbinden.",
        agentsOff: "Uit. Geen enkele agent kan verbinden.",
      },
      agents: {
        title: "Chat met je gegevens via een AI-agent",
        matchNote:
          "Gekozen omdat je {{name}} al in de app gebruikt. Je kunt altijd iets anders kiezen.",
      },
    },
    appSettings: {
      subtitle:
        "Eerst de instellingen van het geopende grootboek, daarna die voor elk grootboek op dit apparaat.",
      thisLedger: "Dit grootboek: {{name}}",
      thisLedgerNone: "Dit grootboek",
      noLedger:
        "Er is geen grootboek geopend. Open er een om de valuta en gegevens te wijzigen.",
      chooseLedger: "Kies een grootboek",
      allLedgers: "Elk grootboek op dit apparaat",
      backToLedgers: "Terug naar grootboeken",
      navLabel: "App-instellingen",
      ledgerFreeNote:
        "Er is geen grootboek geopend. Wat je hier wijzigt, geldt voor elk grootboek op dit apparaat.",
      ai: {
        description:
          "Providers, API-sleutels, lokale modellen en AI-agents stel je op één pagina in.",
        open: "AI en agents openen",
        inUse: "In gebruik: {{name}}",
        notSetUp: "Er is geen AI-provider in gebruik.",
      },
    },
  },
  ta: {
    aiHub: {
      subtitle:
        "AI தொடர்பான அனைத்தும் இந்தப் பக்கத்தில் உள்ளன. நீங்கள் இயக்கி அமைக்கும் வரை எதுவும் எங்கும் அனுப்பப்படாது.",
      dialog: {
        needKey: "முதலில் இந்த வழங்குநரின் API விசையை உள்ளிடவும்.",
        model: "மாதிரி",
        selectModel: "உங்கள் மாதிரியைத் தேர்ந்தெடுக்கவும்",
        modelsFoundHint:
          "கிடைத்த மாதிரிகள்: {{count}}. மேலே உள்ள பட்டியலில் பயன்படுத்த வேண்டியதைத் தேர்ந்தெடுக்கவும்.",
        typeInstead: "மாதிரியின் பெயரைத் தட்டச்சு செய்யவும்",
        modelHint:
          "பட்டியலிலிருந்து தேர்வு செய்ய மாதிரிகளை ஏற்று என்பதைக் கிளிக் செய்யவும், அல்லது மாதிரியின் பெயரைத் தட்டச்சு செய்யவும். வழங்குநரின் இயல்புநிலையைப் பயன்படுத்த காலியாக விடவும்.",
        apiKey: "API விசை",
        apiKeyOptional: "API விசை (உள்ளூர் மாதிரிக்குத் தேவையில்லை)",
        apiKeyPlaceholder: "உங்கள் விசையை ஒட்டவும்",
        apiKeyBlank: "காலியாக விடவும்",
        apiKeyHint:
          "இந்தச் சாதனத்தில் மட்டுமே சேமிக்கப்படும். காப்புப்பிரதிகளிலோ ஏற்றுமதிகளிலோ ஒருபோதும் சேர்க்கப்படாது.",
      },
      providers: {
        title: "செயலிக்குள் AI",
        subtitle:
          "தானியங்கு வகைப்படுத்தலுக்குப் பயன்படுகிறது. உங்கள் சொந்த விசையுடன் ஒரு வழங்குநரையோ, உங்கள் கணினியில் இயங்கும் மாதிரியையோ சேர்த்து, பயன்படுத்த வேண்டியதைத் தேர்வு செய்யவும். விற்பனையாளர் பெயர்கள் மட்டுமே அனுப்பப்படும், தொகைகள் ஒருபோதும் இல்லை.",
        inUse: "பயன்பாட்டில்",
        useThis: "இதைப் பயன்படுத்து",
        keyColumn: "API விசை",
        keySaved: "சேமிக்கப்பட்டது",
        keyNotNeeded: "தேவையில்லை",
        keyMissing: "விசையைச் சேர்",
      },
      summary: {
        label: "என்ன அமைக்கப்பட்டுள்ளது",
        inAppNone:
          "இன்னும் அமைக்கப்படவில்லை. தொடங்க ஒரு வழங்குநரைச் சேர்க்கவும்.",
        inAppNoneInUse:
          "எந்த வழங்குநரும் பயன்பாட்டில் இல்லை. கீழே ஒன்றைத் தேர்வு செய்யவும்.",
        inAppNeedsKey: "{{name}} க்கு இன்னும் API விசை தேவை.",
        inAppLocal:
          "{{name}} பயன்பாட்டில் உள்ளது. உங்கள் சொந்த முனையம், விசை தேவையில்லை.",
        inAppReady: "{{name}} பயன்பாட்டில் உள்ளது.",
        agentsDesktopOnly: "டெஸ்க்டாப் செயலியில் கிடைக்கும்.",
        agentsOn: "இயக்கத்தில். இந்தக் கணினியில் உள்ள முகவர்கள் இணையலாம்.",
        agentsOff: "அணைக்கப்பட்டுள்ளது. எந்த முகவரும் இணைய முடியாது.",
      },
      agents: {
        title: "AI முகவர் மூலம் உங்கள் தரவுடன் உரையாடுங்கள்",
        matchNote:
          "நீங்கள் செயலிக்குள் ஏற்கனவே பயன்படுத்தும் {{name}} உடன் பொருந்துமாறு தேர்ந்தெடுக்கப்பட்டது. எப்போது வேண்டுமானாலும் வேறொன்றைத் தேர்வு செய்யலாம்.",
      },
    },
    appSettings: {
      subtitle:
        "முதலில் திறந்திருக்கும் லெட்ஜரின் அமைப்புகள், பின்னர் இந்தச் சாதனத்தில் உள்ள அனைத்து லெட்ஜர்களுக்கும் பொருந்துபவை.",
      thisLedger: "இந்த லெட்ஜர்: {{name}}",
      thisLedgerNone: "இந்த லெட்ஜர்",
      noLedger:
        "எந்த லெட்ஜரும் திறக்கப்படவில்லை. அதன் நாணயத்தையும் விவரங்களையும் மாற்ற ஒன்றைத் திறக்கவும்.",
      chooseLedger: "லெட்ஜரைத் தேர்வு செய்",
      allLedgers: "இந்தச் சாதனத்தில் உள்ள அனைத்து லெட்ஜர்களும்",
      backToLedgers: "லெட்ஜர்களுக்குத் திரும்பு",
      navLabel: "செயலி அமைப்புகள்",
      ledgerFreeNote:
        "எந்த லெட்ஜரும் திறக்கப்படவில்லை. இங்கே நீங்கள் மாற்றுவது இந்தச் சாதனத்தில் உள்ள அனைத்து லெட்ஜர்களுக்கும் பொருந்தும்.",
      ai: {
        description:
          "வழங்குநர்கள், API விசைகள், உள்ளூர் மாதிரிகள் மற்றும் AI முகவர்கள் அனைத்தும் ஒரே பக்கத்தில் அமைக்கப்படுகின்றன.",
        open: "AI மற்றும் முகவர்களைத் திற",
        inUse: "பயன்பாட்டில்: {{name}}",
        notSetUp: "எந்த AI வழங்குநரும் பயன்பாட்டில் இல்லை.",
      },
    },
  },
};

/**
 * The provider cards, the three-step provider dialog, and the wording that
 * says where to chat and what disconnecting does.
 * Machine-written: ask a native speaker to review.
 */
export const aiHubFlow: AreaTranslations = {
  en: {
    aiHub: {
      providers: {
        empty:
          "No provider yet. Add one to let the app suggest categories. A model on your own computer (LM Studio, Ollama) works too and needs no key.",
        keyMissingLong: "Missing",
        needsKeyNote: "This provider cannot be used until you add its API key.",
        embeddingNote:
          "This looks like an embedding model, which cannot answer questions or suggest categories. Pick a chat model instead.",
        editNamed: "Edit {{name}}",
        edit: "Edit",
        removeNamed: "Remove {{name}}",
        remove: "Remove",
        removeTitle: "Remove {{name}}?",
        removeBody:
          "The provider and its saved API key are removed from this device. Your transactions and categories are not changed.",
      },
      dialog: {
        intro:
          "Say where the AI is, pick a model, then test it. Three short steps.",
        stepWhere: "1. Where the AI is",
        kind: "Provider",
        customOption: "A model on my computer (OpenAI-compatible)",
        urlHintHosted: "Filled in for you. Change it only if you use a proxy.",
        urlHintLocal:
          "The address your model server shows. LM Studio uses http://localhost:1234/v1 and Ollama http://localhost:11434/v1.",
        docs: "Provider documentation",
        stepModel: "2. Which model",
        stepUse: "3. Use it",
        useThis: "Use this provider in the app",
        useThisHint: "Auto-categorize uses one provider at a time.",
      },
      chat: {
        whereClaudeApp:
          "Open the Claude desktop app and start a new chat. Ask your question there.",
        whereLocal:
          "Open a chat in LM Studio with a model that can use tools. Ask your question there.",
        whereClaudeCode:
          "Open Claude Code, in the Claude app or by typing claude in a terminal. Ask your question there.",
        whereCodex: "Type codex in a terminal. Ask your question there.",
        pickFirst:
          "Pick how you want to chat. This card then says where to ask.",
        switchOnFirst:
          "Switch on Allow agents to connect first. This card then says where to ask.",
        notHere:
          "The chat happens in that app, not on this page. Keep Vaulted Money open while you chat.",
      },
      agents: {
        disconnectWarning:
          "This switches agent access off and replaces the token, which cuts off every connected agent and script. Switch Allow agents to connect on again and they reconnect on their own. AI inside the app is not affected.",
        disconnect: "Disconnect all agents",
        disconnectHint:
          "Cuts off agents and scripts only. AI inside the app keeps working.",
        disconnectedHint: "Agent access is off, so nothing is connected.",
        disconnected:
          "All agents disconnected. Agent access is off and the token was replaced. AI inside the app is not affected.",
      },
      api: {
        offHint:
          "Switch on Allow agents to connect above to see the address and access token for your own scripts.",
      },
    },
  },
  es: {
    aiHub: {
      providers: {
        empty:
          "Aún no hay ningún proveedor. Añade uno para que la app sugiera categorías. También sirve un modelo en tu propio ordenador (LM Studio, Ollama), que no necesita clave.",
        keyMissingLong: "Falta",
        needsKeyNote:
          "Este proveedor no se puede usar hasta que añadas su clave de API.",
        embeddingNote:
          "Parece un modelo de embeddings, que no puede responder preguntas ni sugerir categorías. Elige un modelo de chat.",
        editNamed: "Editar {{name}}",
        edit: "Editar",
        removeNamed: "Quitar {{name}}",
        remove: "Quitar",
        removeTitle: "¿Quitar {{name}}?",
        removeBody:
          "El proveedor y su clave de API guardada se quitan de este dispositivo. Tus transacciones y categorías no cambian.",
      },
      dialog: {
        intro:
          "Indica dónde está la IA, elige un modelo y pruébalo. Tres pasos cortos.",
        stepWhere: "1. Dónde está la IA",
        kind: "Proveedor",
        customOption: "Un modelo en mi ordenador (compatible con OpenAI)",
        urlHintHosted: "Ya está rellenada. Cámbiala solo si usas un proxy.",
        urlHintLocal:
          "La dirección que muestra tu servidor de modelos. LM Studio usa http://localhost:1234/v1 y Ollama http://localhost:11434/v1.",
        docs: "Documentación del proveedor",
        stepModel: "2. Qué modelo",
        stepUse: "3. Úsalo",
        useThis: "Usar este proveedor en la app",
        useThisHint: "La categorización automática usa un proveedor cada vez.",
      },
      chat: {
        whereClaudeApp:
          "Abre la app de escritorio de Claude e inicia un chat nuevo. Haz tu pregunta allí.",
        whereLocal:
          "Abre un chat en LM Studio con un modelo que pueda usar herramientas. Haz tu pregunta allí.",
        whereClaudeCode:
          "Abre Claude Code, en la app de Claude o escribiendo claude en un terminal. Haz tu pregunta allí.",
        whereCodex: "Escribe codex en un terminal. Haz tu pregunta allí.",
        pickFirst:
          "Elige cómo quieres chatear. Esta tarjeta te dirá dónde preguntar.",
        switchOnFirst:
          "Activa primero Permitir que se conecten agentes. Esta tarjeta te dirá dónde preguntar.",
        notHere:
          "El chat ocurre en esa aplicación, no en esta página. Mantén Vaulted Money abierto mientras chateas.",
      },
      agents: {
        disconnectWarning:
          "Esto desactiva el acceso de agentes y cambia el token, lo que desconecta todos los agentes y scripts. Vuelve a activar Permitir que se conecten agentes y se reconectarán solos. La IA dentro de la app no se ve afectada.",
        disconnect: "Desconectar todos los agentes",
        disconnectHint:
          "Solo desconecta agentes y scripts. La IA dentro de la app sigue funcionando.",
        disconnectedHint:
          "El acceso de agentes está desactivado, así que no hay nada conectado.",
        disconnected:
          "Todos los agentes desconectados. El acceso de agentes está desactivado y se cambió el token. La IA dentro de la app no se ve afectada.",
      },
      api: {
        offHint:
          "Activa arriba Permitir que se conecten agentes para ver la dirección y el token de acceso para tus propios scripts.",
      },
    },
  },
  zh: {
    aiHub: {
      providers: {
        empty:
          "还没有提供商。添加一个，让应用为您建议分类。在您自己电脑上运行的模型（LM Studio、Ollama）也可以，且无需密钥。",
        keyMissingLong: "缺失",
        needsKeyNote: "添加 API 密钥后才能使用此提供商。",
        embeddingNote:
          "这看起来是一个嵌入模型，无法回答问题或建议分类。请改选对话模型。",
        editNamed: "编辑 {{name}}",
        edit: "编辑",
        removeNamed: "移除 {{name}}",
        remove: "移除",
        removeTitle: "移除 {{name}}？",
        removeBody:
          "该提供商及其保存的 API 密钥将从此设备移除。您的交易和分类不会改变。",
      },
      dialog: {
        intro: "说明 AI 在哪里，选择模型，然后测试。只需三步。",
        stepWhere: "1. AI 在哪里",
        kind: "提供商",
        customOption: "我电脑上的模型（兼容 OpenAI）",
        urlHintHosted: "已为您填好。仅在使用代理时才需要更改。",
        urlHintLocal:
          "您的模型服务器显示的地址。LM Studio 使用 http://localhost:1234/v1，Ollama 使用 http://localhost:11434/v1。",
        docs: "提供商文档",
        stepModel: "2. 使用哪个模型",
        stepUse: "3. 开始使用",
        useThis: "在应用中使用此提供商",
        useThisHint: "自动分类一次只使用一个提供商。",
      },
      chat: {
        whereClaudeApp: "打开 Claude 桌面应用并开始新对话，在那里提问。",
        whereLocal: "在 LM Studio 中用支持工具的模型打开对话，在那里提问。",
        whereClaudeCode:
          "打开 Claude Code（在 Claude 应用中，或在终端输入 claude），在那里提问。",
        whereCodex: "在终端输入 codex，在那里提问。",
        pickFirst: "选择您想要的对话方式。此卡片随后会告诉您在哪里提问。",
        switchOnFirst:
          "请先开启“允许智能体连接”。此卡片随后会告诉您在哪里提问。",
        notHere:
          "对话在那个应用中进行，而不是在此页面。对话期间请保持 Vaulted Money 打开。",
      },
      agents: {
        disconnectWarning:
          "这会关闭智能体访问并更换令牌，所有已连接的智能体和脚本都会断开。重新开启“允许智能体连接”后，它们会自行重新连接。应用内的 AI 不受影响。",
        disconnect: "断开所有智能体",
        disconnectHint: "仅断开智能体和脚本。应用内的 AI 继续工作。",
        disconnectedHint: "智能体访问已关闭，因此没有任何连接。",
        disconnected:
          "已断开所有智能体。智能体访问已关闭，令牌已更换。应用内的 AI 不受影响。",
      },
      api: {
        offHint:
          "在上方开启“允许智能体连接”，即可查看供您自己的脚本使用的地址和访问令牌。",
      },
    },
  },
  nl: {
    aiHub: {
      providers: {
        empty:
          "Nog geen provider. Voeg er een toe zodat de app categorieën kan voorstellen. Een model op je eigen computer (LM Studio, Ollama) werkt ook en heeft geen sleutel nodig.",
        keyMissingLong: "Ontbreekt",
        needsKeyNote:
          "Deze provider kan pas worden gebruikt als je de API-sleutel toevoegt.",
        embeddingNote:
          "Dit lijkt een embedding-model, dat geen vragen kan beantwoorden of categorieën kan voorstellen. Kies een chatmodel.",
        editNamed: "{{name}} bewerken",
        edit: "Bewerken",
        removeNamed: "{{name}} verwijderen",
        remove: "Verwijderen",
        removeTitle: "{{name}} verwijderen?",
        removeBody:
          "De provider en de opgeslagen API-sleutel worden van dit apparaat verwijderd. Je transacties en categorieën veranderen niet.",
      },
      dialog: {
        intro:
          "Geef aan waar de AI staat, kies een model en test het. Drie korte stappen.",
        stepWhere: "1. Waar de AI staat",
        kind: "Provider",
        customOption: "Een model op mijn computer (OpenAI-compatibel)",
        urlHintHosted:
          "Al voor je ingevuld. Wijzig dit alleen als je een proxy gebruikt.",
        urlHintLocal:
          "Het adres dat je modelserver toont. LM Studio gebruikt http://localhost:1234/v1 en Ollama http://localhost:11434/v1.",
        docs: "Documentatie van de provider",
        stepModel: "2. Welk model",
        stepUse: "3. Gebruik het",
        useThis: "Deze provider in de app gebruiken",
        useThisHint:
          "Automatisch categoriseren gebruikt één provider tegelijk.",
      },
      chat: {
        whereClaudeApp:
          "Open de Claude-desktopapp en start een nieuwe chat. Stel daar je vraag.",
        whereLocal:
          "Open een chat in LM Studio met een model dat tools kan gebruiken. Stel daar je vraag.",
        whereClaudeCode:
          "Open Claude Code, in de Claude-app of door claude in een terminal te typen. Stel daar je vraag.",
        whereCodex: "Typ codex in een terminal. Stel daar je vraag.",
        pickFirst:
          "Kies hoe je wilt chatten. Deze kaart zegt daarna waar je je vraag stelt.",
        switchOnFirst:
          "Zet eerst Agents toestaan te verbinden aan. Deze kaart zegt daarna waar je je vraag stelt.",
        notHere:
          "De chat vindt plaats in die app, niet op deze pagina. Houd Vaulted Money open terwijl je chat.",
      },
      agents: {
        disconnectWarning:
          "Dit zet de toegang voor agents uit en vervangt het token, waardoor elke verbonden agent en elk script wordt afgesloten. Zet Agents toestaan te verbinden weer aan en ze verbinden vanzelf opnieuw. AI in de app wordt niet beïnvloed.",
        disconnect: "Alle agents ontkoppelen",
        disconnectHint:
          "Sluit alleen agents en scripts af. AI in de app blijft werken.",
        disconnectedHint:
          "Toegang voor agents staat uit, dus er is niets verbonden.",
        disconnected:
          "Alle agents ontkoppeld. Toegang voor agents staat uit en het token is vervangen. AI in de app wordt niet beïnvloed.",
      },
      api: {
        offHint:
          "Zet hierboven Agents toestaan te verbinden aan om het adres en het toegangstoken voor je eigen scripts te zien.",
      },
    },
  },
  ta: {
    aiHub: {
      providers: {
        empty:
          "இன்னும் வழங்குநர் இல்லை. செயலி வகைகளைப் பரிந்துரைக்க ஒன்றைச் சேர்க்கவும். உங்கள் சொந்தக் கணினியில் உள்ள மாதிரியும் (LM Studio, Ollama) வேலை செய்யும், அதற்கு விசை தேவையில்லை.",
        keyMissingLong: "இல்லை",
        needsKeyNote:
          "API விசையைச் சேர்க்கும் வரை இந்த வழங்குநரைப் பயன்படுத்த முடியாது.",
        embeddingNote:
          "இது ஒரு எம்பெடிங் மாதிரி போலத் தெரிகிறது; அது கேள்விகளுக்குப் பதிலளிக்கவோ வகைகளைப் பரிந்துரைக்கவோ முடியாது. அதற்குப் பதிலாக ஒரு உரையாடல் மாதிரியைத் தேர்ந்தெடுக்கவும்.",
        editNamed: "{{name}} ஐத் திருத்து",
        edit: "திருத்து",
        removeNamed: "{{name}} ஐ அகற்று",
        remove: "அகற்று",
        removeTitle: "{{name}} ஐ அகற்றவா?",
        removeBody:
          "வழங்குநரும் அதன் சேமிக்கப்பட்ட API விசையும் இந்தச் சாதனத்திலிருந்து அகற்றப்படும். உங்கள் பரிவர்த்தனைகளும் வகைகளும் மாறாது.",
      },
      dialog: {
        intro:
          "AI எங்கே உள்ளது என்று சொல்லுங்கள், ஒரு மாதிரியைத் தேர்ந்தெடுங்கள், பின்னர் சோதியுங்கள். மூன்று சிறிய படிகள்.",
        stepWhere: "1. AI எங்கே உள்ளது",
        kind: "வழங்குநர்",
        customOption: "என் கணினியில் உள்ள மாதிரி (OpenAI இணக்கமானது)",
        urlHintHosted:
          "உங்களுக்காக நிரப்பப்பட்டுள்ளது. ப்ராக்ஸி பயன்படுத்தினால் மட்டும் மாற்றவும்.",
        urlHintLocal:
          "உங்கள் மாதிரி சேவையகம் காட்டும் முகவரி. LM Studio http://localhost:1234/v1 ஐயும் Ollama http://localhost:11434/v1 ஐயும் பயன்படுத்துகின்றன.",
        docs: "வழங்குநர் ஆவணங்கள்",
        stepModel: "2. எந்த மாதிரி",
        stepUse: "3. பயன்படுத்துங்கள்",
        useThis: "இந்த வழங்குநரைச் செயலியில் பயன்படுத்து",
        useThisHint:
          "தானியங்கு வகைப்படுத்தல் ஒரு நேரத்தில் ஒரு வழங்குநரைப் பயன்படுத்துகிறது.",
      },
      chat: {
        whereClaudeApp:
          "Claude டெஸ்க்டாப் செயலியைத் திறந்து புதிய உரையாடலைத் தொடங்குங்கள். உங்கள் கேள்வியை அங்கே கேளுங்கள்.",
        whereLocal:
          "கருவிகளைப் பயன்படுத்தக்கூடிய மாதிரியுடன் LM Studio இல் உரையாடலைத் திறக்கவும். உங்கள் கேள்வியை அங்கே கேளுங்கள்.",
        whereClaudeCode:
          "Claude Code ஐத் திறக்கவும் (Claude செயலியில், அல்லது டெர்மினலில் claude என்று தட்டச்சு செய்து). உங்கள் கேள்வியை அங்கே கேளுங்கள்.",
        whereCodex:
          "டெர்மினலில் codex என்று தட்டச்சு செய்யவும். உங்கள் கேள்வியை அங்கே கேளுங்கள்.",
        pickFirst:
          "எப்படி உரையாட விரும்புகிறீர்கள் என்பதைத் தேர்வு செய்யுங்கள். எங்கே கேட்பது என்பதை இந்த அட்டை பின்னர் சொல்லும்.",
        switchOnFirst:
          "முதலில் முகவர்கள் இணைய அனுமதி என்பதை இயக்கவும். எங்கே கேட்பது என்பதை இந்த அட்டை பின்னர் சொல்லும்.",
        notHere:
          "உரையாடல் அந்தச் செயலியில் நடக்கும், இந்தப் பக்கத்தில் அல்ல. உரையாடும்போது Vaulted Money ஐத் திறந்தே வைத்திருங்கள்.",
      },
      agents: {
        disconnectWarning:
          "இது முகவர் அணுகலை அணைத்து டோக்கனை மாற்றுகிறது; இணைக்கப்பட்ட ஒவ்வொரு முகவரும் ஸ்கிரிப்டும் துண்டிக்கப்படும். முகவர்கள் இணைய அனுமதி என்பதை மீண்டும் இயக்கினால் அவை தாமாகவே மீண்டும் இணையும். செயலிக்குள் உள்ள AI பாதிக்கப்படாது.",
        disconnect: "அனைத்து முகவர்களையும் துண்டி",
        disconnectHint:
          "முகவர்களையும் ஸ்கிரிப்டுகளையும் மட்டுமே துண்டிக்கும். செயலிக்குள் உள்ள AI தொடர்ந்து வேலை செய்யும்.",
        disconnectedHint:
          "முகவர் அணுகல் அணைக்கப்பட்டுள்ளது, எனவே எதுவும் இணைக்கப்படவில்லை.",
        disconnected:
          "அனைத்து முகவர்களும் துண்டிக்கப்பட்டன. முகவர் அணுகல் அணைக்கப்பட்டு டோக்கன் மாற்றப்பட்டது. செயலிக்குள் உள்ள AI பாதிக்கப்படவில்லை.",
      },
      api: {
        offHint:
          "உங்கள் சொந்த ஸ்கிரிப்டுகளுக்கான முகவரியையும் அணுகல் டோக்கனையும் காண, மேலே முகவர்கள் இணைய அனுமதி என்பதை இயக்கவும்.",
      },
    },
  },
};

/**
 * The switch-only disconnect, what blocks a route, and the privacy points.
 * Machine-written: ask a native speaker to review.
 */
export const aiHubReady: AreaTranslations = {
  en: {
    aiHub: {
      chat: {
        blockNoLocal:
          "No model on this computer is set up. Add one under AI inside the app first, or pick another way to chat.",
        blockEmbedding:
          "Your local model is an embedding model, which cannot chat. Pick a chat model under AI inside the app first.",
        blockSetup:
          "The setup did not finish. Use the manual steps, then come back.",
        readyStep: "Ready to ask your first question",
      },
      agents: {
        switchOnHint:
          "Switch this off to disconnect every agent and script at once.",
        switchOffHint: "Off: no agent or script can reach your data.",
        switchedOff: "Agent access is off. No agent or script can connect.",
        switchedOn: "Agent access is on.",
      },
      privacy: {
        cloudTitle: "Claude and Codex",
        cloudBody:
          "What the agent reads (transactions, vendors, balances) is sent to its maker: Anthropic or OpenAI.",
        localTitle: "A private model",
        localBody: "Everything stays on this computer.",
        offTitle: "Switched off",
        offBody:
          "No agent can read anything. Agents work with the desktop app only, not the claude.ai website.",
      },
    },
  },
  es: {
    aiHub: {
      chat: {
        blockNoLocal:
          "No hay ningún modelo configurado en este ordenador. Añade uno primero en IA dentro de la app, o elige otra forma de chatear.",
        blockEmbedding:
          "Tu modelo local es un modelo de embeddings, que no puede chatear. Elige primero un modelo de chat en IA dentro de la app.",
        blockSetup:
          "La configuración no terminó. Usa los pasos manuales y vuelve aquí.",
        readyStep: "Todo listo para hacer tu primera pregunta",
      },
      agents: {
        switchOnHint:
          "Desactívalo para desconectar todos los agentes y scripts a la vez.",
        switchOffHint:
          "Desactivado: ningún agente ni script puede acceder a tus datos.",
        switchedOff:
          "El acceso de agentes está desactivado. Ningún agente ni script puede conectarse.",
        switchedOn: "El acceso de agentes está activado.",
      },
      privacy: {
        cloudTitle: "Claude y Codex",
        cloudBody:
          "Lo que lee el agente (transacciones, comercios, saldos) se envía a su creador: Anthropic u OpenAI.",
        localTitle: "Un modelo privado",
        localBody: "Todo se queda en este ordenador.",
        offTitle: "Desactivado",
        offBody:
          "Ningún agente puede leer nada. Los agentes solo funcionan con la app de escritorio, no con el sitio web claude.ai.",
      },
    },
  },
  zh: {
    aiHub: {
      chat: {
        blockNoLocal:
          "此电脑上尚未设置任何模型。请先在“应用内的 AI”中添加一个，或选择其他对话方式。",
        blockEmbedding:
          "您的本地模型是嵌入模型，无法对话。请先在“应用内的 AI”中选择一个对话模型。",
        blockSetup: "设置未完成。请使用手动步骤，然后再回来。",
        readyStep: "可以提出您的第一个问题了",
      },
      agents: {
        switchOnHint: "关闭此开关即可一次断开所有智能体和脚本。",
        switchOffHint: "已关闭：任何智能体或脚本都无法访问您的数据。",
        switchedOff: "智能体访问已关闭。任何智能体或脚本都无法连接。",
        switchedOn: "智能体访问已开启。",
      },
      privacy: {
        cloudTitle: "Claude 和 Codex",
        cloudBody:
          "智能体读取的内容（交易、商户、余额）会发送给其开发方：Anthropic 或 OpenAI。",
        localTitle: "私有模型",
        localBody: "所有内容都留在此电脑上。",
        offTitle: "已关闭",
        offBody:
          "任何智能体都无法读取任何内容。智能体仅适用于桌面应用，不适用于 claude.ai 网站。",
      },
    },
  },
  nl: {
    aiHub: {
      chat: {
        blockNoLocal:
          "Er is geen model op deze computer ingesteld. Voeg er eerst een toe onder AI in de app, of kies een andere manier om te chatten.",
        blockEmbedding:
          "Je lokale model is een embedding-model en kan niet chatten. Kies eerst een chatmodel onder AI in de app.",
        blockSetup:
          "De installatie is niet voltooid. Gebruik de handmatige stappen en kom dan terug.",
        readyStep: "Klaar om je eerste vraag te stellen",
      },
      agents: {
        switchOnHint:
          "Zet dit uit om alle agents en scripts in één keer te ontkoppelen.",
        switchOffHint: "Uit: geen enkele agent of script kan bij je gegevens.",
        switchedOff:
          "Toegang voor agents staat uit. Geen enkele agent of script kan verbinden.",
        switchedOn: "Toegang voor agents staat aan.",
      },
      privacy: {
        cloudTitle: "Claude en Codex",
        cloudBody:
          "Wat de agent leest (transacties, leveranciers, saldi) wordt naar de maker gestuurd: Anthropic of OpenAI.",
        localTitle: "Een privémodel",
        localBody: "Alles blijft op deze computer.",
        offTitle: "Uitgeschakeld",
        offBody:
          "Geen enkele agent kan iets lezen. Agents werken alleen met de desktop-app, niet met de website claude.ai.",
      },
    },
  },
  ta: {
    aiHub: {
      chat: {
        blockNoLocal:
          "இந்தக் கணினியில் எந்த மாதிரியும் அமைக்கப்படவில்லை. முதலில் செயலிக்குள் AI என்பதன் கீழ் ஒன்றைச் சேர்க்கவும், அல்லது உரையாட வேறு வழியைத் தேர்வு செய்யவும்.",
        blockEmbedding:
          "உங்கள் உள்ளூர் மாதிரி ஒரு எம்பெடிங் மாதிரி; அதனால் உரையாட முடியாது. முதலில் செயலிக்குள் AI என்பதன் கீழ் ஒரு உரையாடல் மாதிரியைத் தேர்வு செய்யவும்.",
        blockSetup:
          "அமைப்பு முடியவில்லை. கைமுறைப் படிகளைப் பயன்படுத்திவிட்டு மீண்டும் வாருங்கள்.",
        readyStep: "உங்கள் முதல் கேள்வியைக் கேட்கத் தயார்",
      },
      agents: {
        switchOnHint:
          "அனைத்து முகவர்களையும் ஸ்கிரிப்டுகளையும் ஒரே நேரத்தில் துண்டிக்க இதை அணைக்கவும்.",
        switchOffHint:
          "அணைக்கப்பட்டுள்ளது: எந்த முகவரும் ஸ்கிரிப்டும் உங்கள் தரவை அணுக முடியாது.",
        switchedOff:
          "முகவர் அணுகல் அணைக்கப்பட்டுள்ளது. எந்த முகவரும் ஸ்கிரிப்டும் இணைய முடியாது.",
        switchedOn: "முகவர் அணுகல் இயக்கத்தில் உள்ளது.",
      },
      privacy: {
        cloudTitle: "Claude மற்றும் Codex",
        cloudBody:
          "முகவர் படிப்பவை (பரிவர்த்தனைகள், விற்பனையாளர்கள், இருப்புகள்) அதை உருவாக்கிய நிறுவனத்திற்கு அனுப்பப்படும்: Anthropic அல்லது OpenAI.",
        localTitle: "தனிப்பட்ட மாதிரி",
        localBody: "அனைத்தும் இந்தக் கணினியிலேயே இருக்கும்.",
        offTitle: "அணைக்கப்பட்டுள்ளது",
        offBody:
          "எந்த முகவரும் எதையும் படிக்க முடியாது. முகவர்கள் டெஸ்க்டாப் செயலியுடன் மட்டுமே வேலை செய்யும், claude.ai இணையதளத்துடன் அல்ல.",
      },
    },
  },
};

/** The two collapsible bars on the AI page. Machine-written: ask a native speaker to review. */
export const aiHubBars: AreaTranslations = {
  en: {
    aiHub: {
      bars: {
        inAppNote:
          "Works on its own. Agent access below does not switch this on or off.",
        agentsNote:
          "Separate from AI inside the app. The Allow agents to connect switch here also switches the Local API for scripts on and off.",
      },
      summary: {
        inAppWrongModel:
          "{{name}} is in use, but its model cannot chat. Pick another.",
      },
    },
  },
  es: {
    aiHub: {
      bars: {
        inAppNote:
          "Funciona por sí sola. El acceso de agentes de abajo no la activa ni la desactiva.",
        agentsNote:
          "Independiente de la IA dentro de la app. El interruptor Permitir que se conecten agentes también activa y desactiva la API local para scripts.",
      },
      summary: {
        inAppWrongModel:
          "{{name}} está en uso, pero su modelo no puede chatear. Elige otro.",
      },
    },
  },
  zh: {
    aiHub: {
      bars: {
        inAppNote: "独立运行。下方的智能体访问不会开启或关闭它。",
        agentsNote:
          "与应用内的 AI 相互独立。此处的“允许智能体连接”开关同时控制供脚本使用的本地 API 的开启和关闭。",
      },
      summary: {
        inAppWrongModel: "正在使用 {{name}}，但其模型无法对话。请另选一个。",
      },
    },
  },
  nl: {
    aiHub: {
      bars: {
        inAppNote:
          "Werkt op zichzelf. De toegang voor agents hieronder zet dit niet aan of uit.",
        agentsNote:
          "Los van AI in de app. De schakelaar Agents toestaan te verbinden zet hier ook de lokale API voor scripts aan en uit.",
      },
      summary: {
        inAppWrongModel:
          "{{name}} is in gebruik, maar het model kan niet chatten. Kies een ander.",
      },
    },
  },
  ta: {
    aiHub: {
      bars: {
        inAppNote:
          "இது தனியாக வேலை செய்கிறது. கீழே உள்ள முகவர் அணுகல் இதை இயக்கவோ அணைக்கவோ செய்யாது.",
        agentsNote:
          "செயலிக்குள் உள்ள AI இலிருந்து தனியானது. இங்குள்ள முகவர்கள் இணைய அனுமதி சுவிட்ச், ஸ்கிரிப்டுகளுக்கான உள்ளூர் API ஐயும் இயக்கி அணைக்கிறது.",
      },
      summary: {
        inAppWrongModel:
          "{{name}} பயன்பாட்டில் உள்ளது, ஆனால் அதன் மாதிரியால் உரையாட முடியாது. வேறொன்றைத் தேர்வு செய்யவும்.",
      },
    },
  },
};

/** Bullet wording and the Local API row inside the agent steps. Machine-written: ask a native speaker to review. */
export const aiHubPoints: AreaTranslations = {
  en: {
    aiHub: {
      providers: {
        point1: "Powers Auto-categorize.",
        point2: "Only vendor names are sent, never amounts.",
      },
      bars: {
        agentsNote2:
          "Separate from AI inside the app. This switches the Local API for scripts on/off.",
      },
      agents: {
        point1:
          "Let an AI agent read and update your data. What it reads is sent to its AI provider.",
        point2: "Use a local LLM to keep your data private.",
      },
      chat: {
        pickOne: "Click one of the four options to choose it.",
      },
      api: {
        inlineTitle: "Local API for scripts",
        on: "On",
        inlineBody: "For your own scripts. Reachable from this computer only.",
        address: "Address",
        savePort: "Save port",
        portOnly: "Only the port number can be changed.",
        inlineOff:
          "Switch on Allow agents to connect to see the address and access token.",
      },
    },
  },
  es: {
    aiHub: {
      providers: {
        point1: "Se usa para la categorización automática.",
        point2: "Solo se envían nombres de comercios, nunca importes.",
      },
      bars: {
        agentsNote2:
          "Independiente de la IA dentro de la app. Esto activa y desactiva la API local para scripts.",
      },
      agents: {
        point1:
          "Deja que un agente de IA lea y actualice tus datos. Lo que lee se envía a su proveedor de IA.",
        point2: "Usa un LLM local para mantener tus datos privados.",
      },
      chat: {
        pickOne: "Haz clic en una de las cuatro opciones para elegirla.",
      },
      api: {
        inlineTitle: "API local para scripts",
        on: "Activada",
        inlineBody:
          "Para tus propios scripts. Accesible solo desde este ordenador.",
        address: "Dirección",
        savePort: "Guardar puerto",
        portOnly: "Solo se puede cambiar el número de puerto.",
        inlineOff:
          "Activa Permitir que se conecten agentes para ver la dirección y el token de acceso.",
      },
    },
  },
  zh: {
    aiHub: {
      providers: {
        point1: "用于自动分类。",
        point2: "只发送商户名称，绝不发送金额。",
      },
      bars: {
        agentsNote2:
          "与应用内的 AI 相互独立。此开关同时开启或关闭供脚本使用的本地 API。",
      },
      agents: {
        point1:
          "让 AI 智能体读取并更新您的数据。它读取的内容会发送给其 AI 提供商。",
        point2: "使用本地 LLM 可让您的数据保持私密。",
      },
      chat: {
        pickOne: "点击四个选项之一即可选择。",
      },
      api: {
        inlineTitle: "供脚本使用的本地 API",
        on: "已开启",
        inlineBody: "供您自己的脚本使用。仅可从此电脑访问。",
        address: "地址",
        savePort: "保存端口",
        portOnly: "只能更改端口号。",
        inlineOff: "开启“允许智能体连接”即可查看地址和访问令牌。",
      },
    },
  },
  nl: {
    aiHub: {
      providers: {
        point1: "Wordt gebruikt voor automatisch categoriseren.",
        point2:
          "Alleen namen van leveranciers worden verstuurd, nooit bedragen.",
      },
      bars: {
        agentsNote2:
          "Los van AI in de app. Dit zet de lokale API voor scripts aan/uit.",
      },
      agents: {
        point1:
          "Laat een AI-agent je gegevens lezen en bijwerken. Wat hij leest, wordt naar zijn AI-provider gestuurd.",
        point2: "Gebruik een lokale LLM om je gegevens privé te houden.",
      },
      chat: {
        pickOne: "Klik op een van de vier opties om die te kiezen.",
      },
      api: {
        inlineTitle: "Lokale API voor scripts",
        on: "Aan",
        inlineBody:
          "Voor je eigen scripts. Alleen bereikbaar vanaf deze computer.",
        address: "Adres",
        savePort: "Poort opslaan",
        portOnly: "Alleen het poortnummer kan worden gewijzigd.",
        inlineOff:
          "Zet Agents toestaan te verbinden aan om het adres en het toegangstoken te zien.",
      },
    },
  },
  ta: {
    aiHub: {
      providers: {
        point1: "தானியங்கு வகைப்படுத்தலுக்குப் பயன்படுகிறது.",
        point2:
          "விற்பனையாளர் பெயர்கள் மட்டுமே அனுப்பப்படும், தொகைகள் ஒருபோதும் இல்லை.",
      },
      bars: {
        agentsNote2:
          "செயலிக்குள் உள்ள AI இலிருந்து தனியானது. இது ஸ்கிரிப்டுகளுக்கான உள்ளூர் API ஐ இயக்கும்/அணைக்கும்.",
      },
      agents: {
        point1:
          "AI முகவர் உங்கள் தரவைப் படிக்கவும் புதுப்பிக்கவும் அனுமதிக்கவும். அது படிப்பவை அதன் AI வழங்குநருக்கு அனுப்பப்படும்.",
        point2:
          "உங்கள் தரவைத் தனிப்பட்டதாக வைத்திருக்க உள்ளூர் LLM ஐப் பயன்படுத்துங்கள்.",
      },
      chat: {
        pickOne:
          "நான்கு விருப்பங்களில் ஒன்றைத் தேர்வு செய்ய அதைக் கிளிக் செய்யவும்.",
      },
      api: {
        inlineTitle: "ஸ்கிரிப்டுகளுக்கான உள்ளூர் API",
        on: "இயக்கத்தில்",
        inlineBody:
          "உங்கள் சொந்த ஸ்கிரிப்டுகளுக்கானது. இந்தக் கணினியிலிருந்து மட்டுமே அணுக முடியும்.",
        address: "முகவரி",
        savePort: "போர்ட்டைச் சேமி",
        portOnly: "போர்ட் எண்ணை மட்டுமே மாற்ற முடியும்.",
        inlineOff:
          "முகவரியையும் அணுகல் டோக்கனையும் காண முகவர்கள் இணைய அனுமதி என்பதை இயக்கவும்.",
      },
    },
  },
};

/** Icon facts on the bars, the Mac-only notice and missing-agent blockers. Machine-written: ask a native speaker to review. */
export const aiHubFacts: AreaTranslations = {
  en: {
    aiHub: {
      facts: {
        autoCategorize: "Powers Auto-categorize",
        vendorNamesOnly: "Sends vendor names only, never amounts",
        independent: "Works without agent access",
        readsUpdates: "Reads and updates your data",
        sentToProvider: "What it reads is sent to its AI provider",
        localPrivate: "A local LLM keeps your data private",
        switchesApi: "Its switch also runs the Local API for scripts",
      },
      summary: {
        agentsMacOnly: "Available ONLY in the Mac app.",
      },
      chat: {
        blockNoClaudeCode:
          "Claude Code is not on this computer yet. Install it, then come back.",
        blockNoCodex:
          "Codex is not on this computer yet. Install it, then come back.",
      },
    },
  },
  es: {
    aiHub: {
      facts: {
        autoCategorize: "Se usa para la categorización automática",
        vendorNamesOnly: "Solo envía nombres de comercios, nunca importes",
        independent: "Funciona sin acceso de agentes",
        readsUpdates: "Lee y actualiza tus datos",
        sentToProvider: "Lo que lee se envía a su proveedor de IA",
        localPrivate: "Un LLM local mantiene tus datos privados",
        switchesApi:
          "Su interruptor también controla la API local para scripts",
      },
      summary: {
        agentsMacOnly: "Disponible SOLO en la app para Mac.",
      },
      chat: {
        blockNoClaudeCode:
          "Claude Code aún no está en este ordenador. Instálalo y vuelve aquí.",
        blockNoCodex:
          "Codex aún no está en este ordenador. Instálalo y vuelve aquí.",
      },
    },
  },
  zh: {
    aiHub: {
      facts: {
        autoCategorize: "用于自动分类",
        vendorNamesOnly: "只发送商户名称，绝不发送金额",
        independent: "无需智能体访问即可使用",
        readsUpdates: "读取并更新您的数据",
        sentToProvider: "读取的内容会发送给其 AI 提供商",
        localPrivate: "本地 LLM 可让您的数据保持私密",
        switchesApi: "其开关同时控制供脚本使用的本地 API",
      },
      summary: {
        agentsMacOnly: "仅在 Mac 应用中可用。",
      },
      chat: {
        blockNoClaudeCode: "此电脑上还没有 Claude Code。请安装后再回来。",
        blockNoCodex: "此电脑上还没有 Codex。请安装后再回来。",
      },
    },
  },
  nl: {
    aiHub: {
      facts: {
        autoCategorize: "Voor automatisch categoriseren",
        vendorNamesOnly: "Stuurt alleen namen van leveranciers, nooit bedragen",
        independent: "Werkt zonder toegang voor agents",
        readsUpdates: "Leest en wijzigt je gegevens",
        sentToProvider: "Wat hij leest, gaat naar zijn AI-provider",
        localPrivate: "Een lokale LLM houdt je gegevens privé",
        switchesApi: "De schakelaar bedient ook de lokale API voor scripts",
      },
      summary: {
        agentsMacOnly: "ALLEEN beschikbaar in de Mac-app.",
      },
      chat: {
        blockNoClaudeCode:
          "Claude Code staat nog niet op deze computer. Installeer het en kom dan terug.",
        blockNoCodex:
          "Codex staat nog niet op deze computer. Installeer het en kom dan terug.",
      },
    },
  },
  ta: {
    aiHub: {
      facts: {
        autoCategorize: "தானியங்கு வகைப்படுத்தலுக்குப் பயன்படுகிறது",
        vendorNamesOnly:
          "விற்பனையாளர் பெயர்களை மட்டுமே அனுப்பும், தொகைகளை ஒருபோதும் இல்லை",
        independent: "முகவர் அணுகல் இல்லாமலே வேலை செய்யும்",
        readsUpdates: "உங்கள் தரவைப் படித்துப் புதுப்பிக்கும்",
        sentToProvider: "அது படிப்பவை அதன் AI வழங்குநருக்கு அனுப்பப்படும்",
        localPrivate: "உள்ளூர் LLM உங்கள் தரவைத் தனிப்பட்டதாக வைத்திருக்கும்",
        switchesApi:
          "இதன் சுவிட்ச் ஸ்கிரிப்டுகளுக்கான உள்ளூர் API ஐயும் இயக்குகிறது",
      },
      summary: {
        agentsMacOnly: "Mac செயலியில் மட்டுமே கிடைக்கும்.",
      },
      chat: {
        blockNoClaudeCode:
          "Claude Code இன்னும் இந்தக் கணினியில் இல்லை. அதை நிறுவிவிட்டு மீண்டும் வாருங்கள்.",
        blockNoCodex:
          "Codex இன்னும் இந்தக் கணினியில் இல்லை. அதை நிறுவிவிட்டு மீண்டும் வாருங்கள்.",
      },
    },
  },
};

/** Shown over the chat options while agent access is off. Machine-written: ask a native speaker to review. */
export const aiHubLocked: AreaTranslations = {
  en: {
    aiHub: {
      chat: {
        pickLocked: "Switch on Allow agents to connect to choose one.",
      },
    },
  },
  es: {
    aiHub: {
      chat: {
        pickLocked: "Activa Permitir que se conecten agentes para elegir una.",
      },
    },
  },
  zh: {
    aiHub: {
      chat: {
        pickLocked: "开启“允许智能体连接”后即可选择。",
      },
    },
  },
  nl: {
    aiHub: {
      chat: {
        pickLocked: "Zet Agents toestaan te verbinden aan om er een te kiezen.",
      },
    },
  },
  ta: {
    aiHub: {
      chat: {
        pickLocked:
          "ஒன்றைத் தேர்வு செய்ய முகவர்கள் இணைய அனுமதி என்பதை இயக்கவும்.",
      },
    },
  },
};

/** Wording for devices that cannot reach a local model. Machine-written: ask a native speaker to review. */
export const aiHubMobile: AreaTranslations = {
  en: {
    aiHub: {
      dialog: {
        noLocalHere:
          "A model on this phone or tablet cannot be reached. Local models need the desktop app.",
        customHosted: "Another OpenAI-compatible service",
        unreachable:
          "nothing answered at {{url}}. Check the server is running and allows requests from other apps (CORS).",
      },
      providers: {
        emptyMobile:
          "No provider yet. Add one to let the app suggest categories. Models running on your own computer need the desktop app.",
      },
    },
  },
  es: {
    aiHub: {
      dialog: {
        noLocalHere:
          "No se puede acceder a un modelo en este teléfono o tableta. Los modelos locales necesitan la app de escritorio.",
        customHosted: "Otro servicio compatible con OpenAI",
        unreachable:
          "no respondió nada en {{url}}. Comprueba que el servidor está en marcha y permite solicitudes de otras apps (CORS).",
      },
      providers: {
        emptyMobile:
          "Aún no hay ningún proveedor. Añade uno para que la app sugiera categorías. Los modelos que se ejecutan en tu propio ordenador necesitan la app de escritorio.",
      },
    },
  },
  zh: {
    aiHub: {
      dialog: {
        noLocalHere: "无法访问此手机或平板上的模型。本地模型需要使用桌面应用。",
        customHosted: "其他兼容 OpenAI 的服务",
        unreachable:
          "{{url}} 没有响应。请确认服务器正在运行并允许来自其他应用的请求（CORS）。",
      },
      providers: {
        emptyMobile:
          "还没有提供商。添加一个，让应用为您建议分类。在您自己电脑上运行的模型需要使用桌面应用。",
      },
    },
  },
  nl: {
    aiHub: {
      dialog: {
        noLocalHere:
          "Een model op deze telefoon of tablet is niet bereikbaar. Lokale modellen hebben de desktop-app nodig.",
        customHosted: "Een andere OpenAI-compatibele dienst",
        unreachable:
          "er kwam geen antwoord op {{url}}. Controleer of de server draait en verzoeken van andere apps toestaat (CORS).",
      },
      providers: {
        emptyMobile:
          "Nog geen provider. Voeg er een toe zodat de app categorieën kan voorstellen. Modellen op je eigen computer hebben de desktop-app nodig.",
      },
    },
  },
  ta: {
    aiHub: {
      dialog: {
        noLocalHere:
          "இந்தத் தொலைபேசி அல்லது டேப்லெட்டில் உள்ள மாதிரியை அணுக முடியாது. உள்ளூர் மாதிரிகளுக்கு டெஸ்க்டாப் செயலி தேவை.",
        customHosted: "OpenAI இணக்கமான வேறு சேவை",
        unreachable:
          "{{url}} இல் எதுவும் பதிலளிக்கவில்லை. சேவையகம் இயங்குகிறதா, பிற செயலிகளின் கோரிக்கைகளை அனுமதிக்கிறதா (CORS) என்று சரிபார்க்கவும்.",
      },
      providers: {
        emptyMobile:
          "இன்னும் வழங்குநர் இல்லை. செயலி வகைகளைப் பரிந்துரைக்க ஒன்றைச் சேர்க்கவும். உங்கள் சொந்தக் கணினியில் இயங்கும் மாதிரிகளுக்கு டெஸ்க்டாப் செயலி தேவை.",
      },
    },
  },
};
