import type { AreaTranslations } from "./types";

/**
 * The help drawer: per-screen help cards, short previews of the User Guide
 * sections, display settings and the "Ask AI" tab. Machine-written for es,
 * zh, nl and ta: ask a native speaker to review.
 */
export const helpDrawer: AreaTranslations = {
  en: {
    helpDrawer: {
      open: "Help",
      title: "Help",
      description: "Tips for this screen, display settings and asking AI.",
      tabHelp: "Help & display",
      tabAsk: "Ask AI",
      onThisScreen: "On this screen",
      previewGuide: "Read more: {{title}}",
      openGuide: "Open the full guide",
      display: "Display",
      textSize: "Text size",
      textDefault: "Default",
      textLarge: "Large",
      textLarger: "Larger",
      highContrast: "High contrast",
      highContrastHint: "Darker text and stronger outlines.",
      reduceMotion: "Reduce motion",
      reduceMotionHint:
        "Stops animations. Follows your device until you change it.",
      showTips: "Show hidden tips again",
      tipsShown: "Hidden tips are back.",
      moreHelp: "More help",
      userGuide: "User guide",
      ask: {
        intro:
          "Ask questions about your money in an AI app connected to Vaulted Money, such as Claude or ChatGPT.",
        status: "Status",
        aiFeatures: "AI features",
        on: "On",
        off: "Off",
        inApp: "AI inside the app",
        inAppReady: "Ready: {{name}}",
        notSetUp: "Not set up",
        otherApps: "Other AI apps",
        connected: "Can connect",
        notConnected: "Not switched on",
        macOnly: "Mac app only",
        samples: "Questions to try",
        copy: "Copy",
        copyQuestion: "Copy question: {{question}}",
        copied: "Question copied",
        copyFailed: "Couldn't copy. Select the text instead.",
        setUp: "Set up the AI assistant",
        privacyNote:
          "What an AI app reads is sent to the company that makes it. Nothing is sent until you switch it on.",
        q1: "What did I spend on eating out last month?",
        q2: "Which subscriptions do I pay for, and what do they cost a year?",
        q3: "Am I over budget anywhere this month?",
        q4: "Which bills are due before my next payday?",
        q5: "How has my spending changed since last month?",
      },
      guide: {
        core: {
          title: "Core ideas",
          summary:
            "A ledger is a separate money book. Accounts are where money lives, payees are who it goes to or comes from, and categories say what it was for.",
        },
        transactions: {
          title: "Transactions",
          summary:
            "Each transaction has a date, account, payee, category and amount. Spending is stored as a negative amount and income as positive.",
        },
        search: {
          title: "Searching in plain words",
          summary:
            'Type a sentence such as "groceries over 50 last month". The box lists what it understood, and nothing is applied until you pick it. Every filter you apply must match.',
        },
        csv: {
          title: "Importing bank files",
          summary:
            "Export a CSV file from your bank, then match its columns to date, amount, account, payee and category. Check a few rows afterwards before trusting the reports.",
        },
        budgets: {
          title: "Budgets and reports",
          summary:
            "Budgets compare your plan with what you actually spent. Reports answer questions like how much you spent this month or whether your savings are growing.",
        },
        ai: {
          title: "Optional AI",
          summary:
            "AI can suggest categories using a service you choose and your own key. Only payee names are sent. Your key stays on this device and is never in backups.",
        },
        backups: {
          title: "Backups",
          summary:
            "Your data lives only on this device, so keep a backup before clearing browser data, switching devices or importing a large file. Encrypt it if it will sit in the cloud.",
        },
        localApi: {
          title: "Connecting other apps",
          summary:
            "The Mac app can let AI apps and your own scripts reach your data through a connection that only works on your own computer. It is off until you switch it on.",
        },
        privacy: {
          title: "Your privacy",
          summary:
            "There is no Vaulted Money account or server. Your data stays on this device unless you export it or switch on an AI feature.",
        },
      },
      cards: {
        glance: {
          title: "Your money at a glance",
          body: "The cards show your balances, recent spending and what's coming up next.",
        },
        search: {
          title: "Search in plain words",
          body: 'Try "groceries over 50 last month". Nothing is applied until you pick it.',
        },
        addTransaction: {
          title: "Add a transaction",
          body: "Use the + button. Pick the account and payee, then the category it was for.",
        },
        importBank: {
          title: "Bring in your bank history",
          body: "Actions, then Import CSV, reads a file exported from your bank.",
        },
        accounts: {
          title: "Where your money lives",
          body: "Add each bank account, card and cash wallet. Every transaction belongs to one account.",
        },
        reconcile: {
          title: "Match your bank's balance",
          body: "If a balance is off, Actions, then Reconcile Balance, adds one adjustment to fix it.",
        },
        setBudget: {
          title: "Set a limit",
          body: "Create a budget for a category, account or payee and watch how much is left.",
        },
        smartBudget: {
          title: "Let the app suggest budgets",
          body: "Smart Create looks at your past spending and suggests realistic limits.",
        },
        calendar: {
          title: "Read the calendar",
          body: "Each day shows money in and out. Open a day to see the transactions behind it.",
        },
        repeats: {
          title: "Add it once, it repeats",
          body: "Set how often a bill or payday repeats. Auto-Schedule can find them in your history.",
        },
        reports: {
          title: "Simple or Detailed",
          body: "Simple reports answer everyday questions; Detailed ones break things down further. Both export to PDF, Excel or CSV.",
        },
        insights: {
          title: "Plan versus reality",
          body: "See which budgets are on track and where most of your money went.",
        },
        charts: {
          title: "Chart just what you need",
          body: 'Pick dates, or type a search like "dining this year", to focus the charts.',
        },
        categories: {
          title: "Categories and sub-categories",
          body: "Group spending like Food, then Groceries. Renaming one updates every transaction that uses it.",
        },
        payees: {
          title: "Keep payees tidy",
          body: 'Merge duplicates like "Starbucks" and "STARBUCKS #12" so your reports add up.',
        },
        aiOptional: {
          title: "AI is optional",
          body: "Nothing is sent until you switch AI on and set it up. You can turn it off at any time.",
        },
        connectApps: {
          title: "Use Claude or ChatGPT",
          body: "In the Mac app, connect an AI app and ask questions about your money in that app.",
        },
        demo: {
          title: "Try it with demo data",
          body: "Generate demo data to explore every feature with sample numbers. Reset clears everything.",
        },
        backup: {
          title: "Back up before big changes",
          body: "Your data lives only on this device. Save a copy before switching devices or reinstalling.",
        },
        currencies: {
          title: "More than one currency",
          body: "Add the currencies you use. Totals convert using the rates on this page.",
        },
        ledgers: {
          title: "One ledger per set of books",
          body: "Keep Home, Business or Travel apart. Each ledger has its own accounts and budgets.",
        },
        privacy: {
          title: "Your data stays here",
          body: "No account, no server. Nothing leaves this device unless you export it or switch on AI.",
        },
      },
    },
  },
  es: {
    helpDrawer: {
      open: "Ayuda",
      title: "Ayuda",
      description:
        "Consejos para esta pantalla, ajustes de pantalla y preguntar a la IA.",
      tabHelp: "Ayuda y pantalla",
      tabAsk: "Preguntar a la IA",
      onThisScreen: "En esta pantalla",
      previewGuide: "Más información: {{title}}",
      openGuide: "Abrir la guía completa",
      display: "Pantalla",
      textSize: "Tamaño del texto",
      textDefault: "Normal",
      textLarge: "Grande",
      textLarger: "Más grande",
      highContrast: "Alto contraste",
      highContrastHint: "Texto más oscuro y bordes más marcados.",
      reduceMotion: "Reducir movimiento",
      reduceMotionHint:
        "Detiene las animaciones. Sigue a tu dispositivo hasta que lo cambies.",
      showTips: "Volver a mostrar consejos ocultos",
      tipsShown: "Los consejos ocultos han vuelto.",
      moreHelp: "Más ayuda",
      userGuide: "Guía de uso",
      ask: {
        intro:
          "Haz preguntas sobre tu dinero en una app de IA conectada a Vaulted Money, como Claude o ChatGPT.",
        status: "Estado",
        aiFeatures: "Funciones de IA",
        on: "Activadas",
        off: "Desactivadas",
        inApp: "IA dentro de la app",
        inAppReady: "Lista: {{name}}",
        notSetUp: "Sin configurar",
        otherApps: "Otras apps de IA",
        connected: "Pueden conectarse",
        notConnected: "Sin activar",
        macOnly: "Solo en la app para Mac",
        samples: "Preguntas para probar",
        copy: "Copiar",
        copyQuestion: "Copiar pregunta: {{question}}",
        copied: "Pregunta copiada",
        copyFailed: "No se pudo copiar. Selecciona el texto.",
        setUp: "Configurar el asistente de IA",
        privacyNote:
          "Lo que lee una app de IA se envía a la empresa que la crea. No se envía nada hasta que lo actives.",
        q1: "¿Cuánto gasté en restaurantes el mes pasado?",
        q2: "¿Qué suscripciones pago y cuánto cuestan al año?",
        q3: "¿Me he pasado de algún presupuesto este mes?",
        q4: "¿Qué facturas vencen antes de mi próxima nómina?",
        q5: "¿Cómo ha cambiado mi gasto desde el mes pasado?",
      },
      guide: {
        core: {
          title: "Ideas básicas",
          summary:
            "Un libro es un registro de dinero aparte. Las cuentas son dónde está el dinero, los beneficiarios a quién va o de quién viene, y las categorías para qué fue.",
        },
        transactions: {
          title: "Transacciones",
          summary:
            "Cada transacción tiene fecha, cuenta, beneficiario, categoría e importe. Los gastos se guardan en negativo y los ingresos en positivo.",
        },
        search: {
          title: "Buscar con tus palabras",
          summary:
            'Escribe una frase como "supermercado más de 50 el mes pasado". El cuadro muestra lo que entendió y no aplica nada hasta que lo elijas. Deben cumplirse todos los filtros.',
        },
        csv: {
          title: "Importar archivos del banco",
          summary:
            "Exporta un CSV desde tu banco y relaciona sus columnas con fecha, importe, cuenta, beneficiario y categoría. Revisa algunas filas antes de fiarte de los informes.",
        },
        budgets: {
          title: "Presupuestos e informes",
          summary:
            "Los presupuestos comparan tu plan con lo que gastaste. Los informes responden cuánto gastaste este mes o si tus ahorros crecen.",
        },
        ai: {
          title: "IA opcional",
          summary:
            "La IA puede sugerir categorías con un servicio que elijas y tu propia clave. Solo se envían nombres de beneficiarios. Tu clave se queda en este dispositivo y nunca va en las copias.",
        },
        backups: {
          title: "Copias de seguridad",
          summary:
            "Tus datos solo están en este dispositivo: haz una copia antes de borrar datos del navegador, cambiar de dispositivo o importar un archivo grande. Cífrala si va a estar en la nube.",
        },
        localApi: {
          title: "Conectar otras apps",
          summary:
            "La app para Mac puede dejar que apps de IA y tus scripts accedan a tus datos mediante una conexión que solo funciona en tu ordenador. Está apagada hasta que la actives.",
        },
        privacy: {
          title: "Tu privacidad",
          summary:
            "No hay cuenta ni servidor de Vaulted Money. Tus datos se quedan en este dispositivo salvo que los exportes o actives una función de IA.",
        },
      },
      cards: {
        glance: {
          title: "Tu dinero de un vistazo",
          body: "Las tarjetas muestran tus saldos, los gastos recientes y lo que viene.",
        },
        search: {
          title: "Busca con tus palabras",
          body: 'Prueba "supermercado más de 50 el mes pasado". No se aplica nada hasta que lo elijas.',
        },
        addTransaction: {
          title: "Añadir una transacción",
          body: "Usa el botón +. Elige la cuenta y el beneficiario, y luego la categoría.",
        },
        importBank: {
          title: "Trae tu historial bancario",
          body: "Acciones y luego Importar CSV lee un archivo exportado de tu banco.",
        },
        accounts: {
          title: "Dónde está tu dinero",
          body: "Añade cada cuenta, tarjeta y efectivo. Cada transacción pertenece a una cuenta.",
        },
        reconcile: {
          title: "Iguala el saldo del banco",
          body: "Si un saldo no cuadra, Acciones y luego Conciliar saldo añade un ajuste.",
        },
        setBudget: {
          title: "Fija un límite",
          body: "Crea un presupuesto para una categoría, cuenta o beneficiario y mira cuánto queda.",
        },
        smartBudget: {
          title: "Deja que la app sugiera",
          body: "Creación inteligente mira tus gastos pasados y sugiere límites realistas.",
        },
        calendar: {
          title: "Cómo leer el calendario",
          body: "Cada día muestra lo que entra y sale. Abre un día para ver sus transacciones.",
        },
        repeats: {
          title: "Añádelo una vez y se repite",
          body: "Indica cada cuánto se repite una factura o nómina. Auto-programar puede encontrarlas en tu historial.",
        },
        reports: {
          title: "Sencillos o detallados",
          body: "Los sencillos responden lo cotidiano; los detallados desglosan más. Ambos se exportan a PDF, Excel o CSV.",
        },
        insights: {
          title: "Plan frente a realidad",
          body: "Mira qué presupuestos van bien y adónde fue la mayor parte del dinero.",
        },
        charts: {
          title: "Grafica solo lo que necesitas",
          body: 'Elige fechas o escribe algo como "restaurantes este año" para centrar los gráficos.',
        },
        categories: {
          title: "Categorías y subcategorías",
          body: "Agrupa gastos como Comida y luego Supermercado. Al renombrar una se actualizan todas sus transacciones.",
        },
        payees: {
          title: "Mantén ordenados los beneficiarios",
          body: 'Une duplicados como "Starbucks" y "STARBUCKS #12" para que los informes cuadren.',
        },
        aiOptional: {
          title: "La IA es opcional",
          body: "No se envía nada hasta que actives y configures la IA. Puedes apagarla cuando quieras.",
        },
        connectApps: {
          title: "Usa Claude o ChatGPT",
          body: "En la app para Mac, conecta una app de IA y pregúntale por tu dinero allí.",
        },
        demo: {
          title: "Pruébalo con datos de ejemplo",
          body: "Genera datos de ejemplo para probar todo con cifras inventadas. Reiniciar lo borra todo.",
        },
        backup: {
          title: "Haz copia antes de cambios grandes",
          body: "Tus datos solo están en este dispositivo. Guarda una copia antes de cambiar de dispositivo o reinstalar.",
        },
        currencies: {
          title: "Más de una moneda",
          body: "Añade las monedas que usas. Los totales se convierten con los tipos de esta página.",
        },
        ledgers: {
          title: "Un libro por cada conjunto de cuentas",
          body: "Separa Casa, Negocio o Viajes. Cada libro tiene sus propias cuentas y presupuestos.",
        },
        privacy: {
          title: "Tus datos se quedan aquí",
          body: "Sin cuenta ni servidor. Nada sale de este dispositivo salvo que lo exportes o actives la IA.",
        },
      },
    },
  },
  zh: {
    helpDrawer: {
      open: "帮助",
      title: "帮助",
      description: "本页面的提示、显示设置以及向 AI 提问。",
      tabHelp: "帮助与显示",
      tabAsk: "询问 AI",
      onThisScreen: "本页面",
      previewGuide: "了解更多：{{title}}",
      openGuide: "打开完整指南",
      display: "显示",
      textSize: "文字大小",
      textDefault: "默认",
      textLarge: "大",
      textLarger: "更大",
      highContrast: "高对比度",
      highContrastHint: "文字更深，轮廓更清晰。",
      reduceMotion: "减少动态效果",
      reduceMotionHint: "停止动画。在你更改前跟随设备设置。",
      showTips: "重新显示已隐藏的提示",
      tipsShown: "已隐藏的提示已恢复。",
      moreHelp: "更多帮助",
      userGuide: "用户指南",
      ask: {
        intro:
          "在连接到 Vaulted Money 的 AI 应用（如 Claude 或 ChatGPT）中询问你的财务问题。",
        status: "状态",
        aiFeatures: "AI 功能",
        on: "已开启",
        off: "已关闭",
        inApp: "应用内 AI",
        inAppReady: "就绪：{{name}}",
        notSetUp: "未设置",
        otherApps: "其他 AI 应用",
        connected: "可以连接",
        notConnected: "未开启",
        macOnly: "仅限 Mac 应用",
        samples: "可以试试的问题",
        copy: "复制",
        copyQuestion: "复制问题：{{question}}",
        copied: "问题已复制",
        copyFailed: "无法复制，请手动选择文本。",
        setUp: "设置 AI 助手",
        privacyNote:
          "AI 应用读取的内容会发送给其开发公司。在你开启之前不会发送任何内容。",
        q1: "我上个月外出就餐花了多少钱？",
        q2: "我订阅了哪些服务？一年要花多少钱？",
        q3: "这个月我有哪项预算超支了吗？",
        q4: "下次发薪前有哪些账单到期？",
        q5: "与上个月相比，我的支出有什么变化？",
      },
      guide: {
        core: {
          title: "基本概念",
          summary:
            "账本是一套独立的账目。账户是钱存放的地方，收款方是钱的去向或来源，类别说明钱的用途。",
        },
        transactions: {
          title: "交易",
          summary:
            "每笔交易都有日期、账户、收款方、类别和金额。支出记为负数，收入记为正数。",
        },
        search: {
          title: "用日常语言搜索",
          summary:
            "输入一句话，例如“上个月超过 50 的日用品”。搜索框会列出它的理解，你选择后才会应用。所有已应用的筛选条件都必须满足。",
        },
        csv: {
          title: "导入银行文件",
          summary:
            "从银行导出 CSV 文件，然后将各列对应到日期、金额、账户、收款方和类别。导入后先检查几行，再依赖报告。",
        },
        budgets: {
          title: "预算和报告",
          summary:
            "预算将你的计划与实际支出进行比较。报告可以回答本月花了多少、储蓄是否在增长等问题。",
        },
        ai: {
          title: "可选 AI",
          summary:
            "AI 可以使用你选择的服务和你自己的密钥来建议类别。只发送收款方名称。你的密钥只保存在本设备，不会进入备份。",
        },
        backups: {
          title: "备份",
          summary:
            "你的数据只保存在本设备上，因此在清除浏览器数据、更换设备或导入大文件前请先备份。如果要存到云端，请加密。",
        },
        localApi: {
          title: "连接其他应用",
          summary:
            "Mac 应用可以通过仅在你自己电脑上可用的连接，让 AI 应用和你的脚本访问你的数据。开启前一直关闭。",
        },
        privacy: {
          title: "你的隐私",
          summary:
            "Vaulted Money 没有账户，也没有服务器。除非你导出数据或开启 AI 功能，数据都只保存在本设备上。",
        },
      },
      cards: {
        glance: {
          title: "资金一览",
          body: "卡片显示你的余额、近期支出和即将发生的款项。",
        },
        search: {
          title: "用日常语言搜索",
          body: "试试“上个月超过 50 的日用品”。你选择后才会应用。",
        },
        addTransaction: {
          title: "添加交易",
          body: "使用 + 按钮。选择账户和收款方，再选择用途类别。",
        },
        importBank: {
          title: "导入银行记录",
          body: "“操作”中的“导入 CSV”可读取从银行导出的文件。",
        },
        accounts: {
          title: "钱存放在哪里",
          body: "添加每个银行账户、卡和现金。每笔交易都属于一个账户。",
        },
        reconcile: {
          title: "与银行余额一致",
          body: "如果余额不对，“操作”中的“对账”会添加一笔调整来修正。",
        },
        setBudget: {
          title: "设置上限",
          body: "为类别、账户或收款方创建预算，随时查看剩余额度。",
        },
        smartBudget: {
          title: "让应用建议预算",
          body: "“智能创建”会根据过去的支出建议合理的上限。",
        },
        calendar: {
          title: "查看日历",
          body: "每天显示资金进出。打开某一天可查看对应的交易。",
        },
        repeats: {
          title: "添加一次，自动重复",
          body: "设置账单或发薪日的重复频率。“自动安排”可以从历史记录中找到它们。",
        },
        reports: {
          title: "简单或详细",
          body: "简单报告回答日常问题，详细报告提供更细的拆分。两者都可导出为 PDF、Excel 或 CSV。",
        },
        insights: {
          title: "计划与实际",
          body: "查看哪些预算进展正常，以及大部分钱花在了哪里。",
        },
        charts: {
          title: "只绘制你需要的内容",
          body: "选择日期，或输入“今年的餐饮”之类的搜索，让图表聚焦。",
        },
        categories: {
          title: "类别和子类别",
          body: "把支出分组，例如“餐饮”下的“日用品”。重命名会更新所有使用它的交易。",
        },
        payees: {
          title: "保持收款方整洁",
          body: "合并“Starbucks”和“STARBUCKS #12”这样的重复项，让报告准确。",
        },
        aiOptional: {
          title: "AI 是可选的",
          body: "在你开启并设置 AI 之前不会发送任何内容。你可以随时关闭。",
        },
        connectApps: {
          title: "使用 Claude 或 ChatGPT",
          body: "在 Mac 应用中连接 AI 应用，然后在该应用中询问你的财务问题。",
        },
        demo: {
          title: "用示例数据试用",
          body: "生成示例数据，用样例数字体验所有功能。重置会清除全部数据。",
        },
        backup: {
          title: "重大变更前先备份",
          body: "你的数据只保存在本设备。更换设备或重装前请保存一份副本。",
        },
        currencies: {
          title: "多种货币",
          body: "添加你使用的货币。总额会按此页的汇率换算。",
        },
        ledgers: {
          title: "每套账目一个账本",
          body: "把家庭、业务或旅行分开。每个账本都有自己的账户和预算。",
        },
        privacy: {
          title: "你的数据留在这里",
          body: "无需账户，没有服务器。除非你导出或开启 AI，否则不会离开本设备。",
        },
      },
    },
  },
  nl: {
    helpDrawer: {
      open: "Help",
      title: "Help",
      description: "Tips voor dit scherm, weergave-instellingen en AI vragen.",
      tabHelp: "Help en weergave",
      tabAsk: "AI vragen",
      onThisScreen: "Op dit scherm",
      previewGuide: "Meer over: {{title}}",
      openGuide: "Open de volledige gids",
      display: "Weergave",
      textSize: "Tekstgrootte",
      textDefault: "Standaard",
      textLarge: "Groot",
      textLarger: "Groter",
      highContrast: "Hoog contrast",
      highContrastHint: "Donkerder tekst en duidelijkere randen.",
      reduceMotion: "Minder beweging",
      reduceMotionHint:
        "Stopt animaties. Volgt je apparaat tot je het wijzigt.",
      showTips: "Verborgen tips weer tonen",
      tipsShown: "Verborgen tips zijn terug.",
      moreHelp: "Meer hulp",
      userGuide: "Gebruikersgids",
      ask: {
        intro:
          "Stel vragen over je geld in een AI-app die aan Vaulted Money gekoppeld is, zoals Claude of ChatGPT.",
        status: "Status",
        aiFeatures: "AI-functies",
        on: "Aan",
        off: "Uit",
        inApp: "AI in de app",
        inAppReady: "Klaar: {{name}}",
        notSetUp: "Niet ingesteld",
        otherApps: "Andere AI-apps",
        connected: "Kunnen verbinden",
        notConnected: "Niet aangezet",
        macOnly: "Alleen in de Mac-app",
        samples: "Vragen om te proberen",
        copy: "Kopiëren",
        copyQuestion: "Vraag kopiëren: {{question}}",
        copied: "Vraag gekopieerd",
        copyFailed: "Kopiëren mislukt. Selecteer de tekst.",
        setUp: "AI-assistent instellen",
        privacyNote:
          "Wat een AI-app leest, gaat naar het bedrijf dat hem maakt. Er wordt niets verstuurd tot je het aanzet.",
        q1: "Hoeveel gaf ik vorige maand uit aan uit eten?",
        q2: "Welke abonnementen betaal ik, en wat kosten ze per jaar?",
        q3: "Zit ik deze maand ergens boven budget?",
        q4: "Welke rekeningen moet ik betalen voor mijn volgende salaris?",
        q5: "Hoe zijn mijn uitgaven veranderd sinds vorige maand?",
      },
      guide: {
        core: {
          title: "Basisbegrippen",
          summary:
            "Een grootboek is een aparte boekhouding. Rekeningen zijn waar geld staat, begunstigden zijn naar wie het gaat of van wie het komt, en categorieën zeggen waarvoor het was.",
        },
        transactions: {
          title: "Transacties",
          summary:
            "Elke transactie heeft een datum, rekening, begunstigde, categorie en bedrag. Uitgaven worden negatief opgeslagen en inkomsten positief.",
        },
        search: {
          title: "Zoeken in gewone taal",
          summary:
            'Typ een zin zoals "boodschappen boven 50 vorige maand". Het vak toont wat het begreep en past niets toe tot je het kiest. Elk filter moet kloppen.',
        },
        csv: {
          title: "Bankbestanden importeren",
          summary:
            "Exporteer een CSV-bestand bij je bank en koppel de kolommen aan datum, bedrag, rekening, begunstigde en categorie. Controleer daarna een paar regels.",
        },
        budgets: {
          title: "Budgetten en rapporten",
          summary:
            "Budgetten vergelijken je plan met wat je echt uitgaf. Rapporten beantwoorden vragen zoals hoeveel je deze maand uitgaf of of je spaargeld groeit.",
        },
        ai: {
          title: "Optionele AI",
          summary:
            "AI kan categorieën voorstellen met een dienst die jij kiest en je eigen sleutel. Alleen namen van begunstigden worden verstuurd. Je sleutel blijft op dit apparaat en zit nooit in back-ups.",
        },
        backups: {
          title: "Back-ups",
          summary:
            "Je gegevens staan alleen op dit apparaat. Maak dus een back-up voordat je browsergegevens wist, van apparaat wisselt of een groot bestand importeert. Versleutel hem als hij in de cloud komt.",
        },
        localApi: {
          title: "Andere apps koppelen",
          summary:
            "De Mac-app kan AI-apps en je eigen scripts bij je gegevens laten via een verbinding die alleen op je eigen computer werkt. Hij staat uit tot je hem aanzet.",
        },
        privacy: {
          title: "Je privacy",
          summary:
            "Er is geen Vaulted Money-account of -server. Je gegevens blijven op dit apparaat, tenzij je ze exporteert of een AI-functie aanzet.",
        },
      },
      cards: {
        glance: {
          title: "Je geld in één oogopslag",
          body: "De kaarten tonen je saldi, recente uitgaven en wat er aankomt.",
        },
        search: {
          title: "Zoek in gewone taal",
          body: 'Probeer "boodschappen boven 50 vorige maand". Er wordt niets toegepast tot je het kiest.',
        },
        addTransaction: {
          title: "Transactie toevoegen",
          body: "Gebruik de knop +. Kies de rekening en begunstigde, daarna de categorie.",
        },
        importBank: {
          title: "Haal je bankgeschiedenis binnen",
          body: "Acties, dan CSV importeren, leest een bestand van je bank.",
        },
        accounts: {
          title: "Waar je geld staat",
          body: "Voeg elke bankrekening, kaart en portemonnee toe. Elke transactie hoort bij één rekening.",
        },
        reconcile: {
          title: "Klopt het saldo met je bank?",
          body: "Klopt een saldo niet, dan voegt Acties, dan Saldo afstemmen, één correctie toe.",
        },
        setBudget: {
          title: "Stel een limiet in",
          body: "Maak een budget voor een categorie, rekening of begunstigde en zie wat er over is.",
        },
        smartBudget: {
          title: "Laat de app budgetten voorstellen",
          body: "Slim aanmaken kijkt naar eerdere uitgaven en stelt realistische limieten voor.",
        },
        calendar: {
          title: "Zo lees je de kalender",
          body: "Elke dag toont geld in en uit. Open een dag om de transacties te zien.",
        },
        repeats: {
          title: "Eén keer toevoegen, het herhaalt zich",
          body: "Geef aan hoe vaak een rekening of salaris terugkomt. Automatisch plannen vindt ze in je geschiedenis.",
        },
        reports: {
          title: "Eenvoudig of gedetailleerd",
          body: "Eenvoudige rapporten beantwoorden dagelijkse vragen; gedetailleerde gaan dieper. Beide exporteren naar PDF, Excel of CSV.",
        },
        insights: {
          title: "Plan tegenover werkelijkheid",
          body: "Zie welke budgetten op koers liggen en waar het meeste geld heen ging.",
        },
        charts: {
          title: "Breng alleen in beeld wat je nodig hebt",
          body: 'Kies data, of typ iets als "uit eten dit jaar", om de grafieken te richten.',
        },
        categories: {
          title: "Categorieën en subcategorieën",
          body: "Groepeer uitgaven zoals Eten en dan Boodschappen. Hernoemen werkt elke transactie bij die het gebruikt.",
        },
        payees: {
          title: "Houd begunstigden netjes",
          body: 'Voeg dubbelen zoals "Starbucks" en "STARBUCKS #12" samen zodat je rapporten kloppen.',
        },
        aiOptional: {
          title: "AI is optioneel",
          body: "Er wordt niets verstuurd tot je AI aanzet en instelt. Je kunt het altijd uitzetten.",
        },
        connectApps: {
          title: "Gebruik Claude of ChatGPT",
          body: "Koppel in de Mac-app een AI-app en stel daar vragen over je geld.",
        },
        demo: {
          title: "Probeer het met demogegevens",
          body: "Maak demogegevens om alles met voorbeeldcijfers te verkennen. Resetten wist alles.",
        },
        backup: {
          title: "Maak een back-up voor grote wijzigingen",
          body: "Je gegevens staan alleen op dit apparaat. Bewaar een kopie voor je wisselt of opnieuw installeert.",
        },
        currencies: {
          title: "Meer dan één valuta",
          body: "Voeg de valuta toe die je gebruikt. Totalen worden omgerekend met de koersen hier.",
        },
        ledgers: {
          title: "Eén grootboek per boekhouding",
          body: "Houd Thuis, Zaak of Reizen gescheiden. Elk grootboek heeft eigen rekeningen en budgetten.",
        },
        privacy: {
          title: "Je gegevens blijven hier",
          body: "Geen account, geen server. Niets verlaat dit apparaat tenzij je exporteert of AI aanzet.",
        },
      },
    },
  },
  ta: {
    helpDrawer: {
      open: "உதவி",
      title: "உதவி",
      description:
        "இந்தத் திரைக்கான குறிப்புகள், காட்சி அமைப்புகள், AI-யிடம் கேட்பது.",
      tabHelp: "உதவியும் காட்சியும்",
      tabAsk: "AI-யிடம் கேளுங்கள்",
      onThisScreen: "இந்தத் திரையில்",
      previewGuide: "மேலும்: {{title}}",
      openGuide: "முழு வழிகாட்டியைத் திறக்கவும்",
      display: "காட்சி",
      textSize: "எழுத்து அளவு",
      textDefault: "இயல்பு",
      textLarge: "பெரியது",
      textLarger: "மிகப் பெரியது",
      highContrast: "உயர் மாறுபாடு",
      highContrastHint: "அடர்ந்த எழுத்தும் தெளிவான விளிம்புகளும்.",
      reduceMotion: "இயக்கத்தைக் குறைக்கவும்",
      reduceMotionHint:
        "அசைவூட்டங்களை நிறுத்தும். நீங்கள் மாற்றும் வரை சாதன அமைப்பைப் பின்பற்றும்.",
      showTips: "மறைத்த குறிப்புகளை மீண்டும் காட்டு",
      tipsShown: "மறைத்த குறிப்புகள் மீண்டும் வந்துவிட்டன.",
      moreHelp: "மேலும் உதவி",
      userGuide: "பயனர் வழிகாட்டி",
      ask: {
        intro:
          "Vaulted Money-உடன் இணைந்த Claude, ChatGPT போன்ற AI பயன்பாட்டில் உங்கள் பணம் பற்றிக் கேளுங்கள்.",
        status: "நிலை",
        aiFeatures: "AI அம்சங்கள்",
        on: "இயக்கத்தில்",
        off: "அணைந்துள்ளது",
        inApp: "பயன்பாட்டிற்குள் AI",
        inAppReady: "தயார்: {{name}}",
        notSetUp: "அமைக்கப்படவில்லை",
        otherApps: "பிற AI பயன்பாடுகள்",
        connected: "இணைக்கலாம்",
        notConnected: "இயக்கப்படவில்லை",
        macOnly: "Mac பயன்பாட்டில் மட்டும்",
        samples: "முயல வேண்டிய கேள்விகள்",
        copy: "நகலெடு",
        copyQuestion: "கேள்வியை நகலெடு: {{question}}",
        copied: "கேள்வி நகலெடுக்கப்பட்டது",
        copyFailed: "நகலெடுக்க முடியவில்லை. உரையைத் தேர்ந்தெடுக்கவும்.",
        setUp: "AI உதவியாளரை அமைக்கவும்",
        privacyNote:
          "AI பயன்பாடு படிப்பது அதை உருவாக்கிய நிறுவனத்துக்குச் செல்லும். நீங்கள் இயக்கும் வரை எதுவும் அனுப்பப்படாது.",
        q1: "கடந்த மாதம் வெளியே சாப்பிட எவ்வளவு செலவழித்தேன்?",
        q2: "நான் எந்தச் சந்தாக்களுக்குச் செலுத்துகிறேன், ஆண்டுக்கு எவ்வளவு?",
        q3: "இந்த மாதம் ஏதேனும் பட்ஜெட்டைத் தாண்டினேனா?",
        q4: "அடுத்த சம்பளத்துக்கு முன் எந்தக் கட்டணங்கள் செலுத்த வேண்டும்?",
        q5: "கடந்த மாதத்திலிருந்து என் செலவு எப்படி மாறியது?",
      },
      guide: {
        core: {
          title: "அடிப்படைக் கருத்துகள்",
          summary:
            "பேரேடு ஒரு தனிப் பணப் புத்தகம். கணக்குகள் பணம் இருக்கும் இடம்; பெறுநர்கள் பணம் யாருக்குப் போனது அல்லது யாரிடமிருந்து வந்தது; வகைகள் எதற்காக என்று சொல்லும்.",
        },
        transactions: {
          title: "பரிவர்த்தனைகள்",
          summary:
            "ஒவ்வொரு பரிவர்த்தனைக்கும் தேதி, கணக்கு, பெறுநர், வகை, தொகை உண்டு. செலவு எதிர்மறைத் தொகையாகவும் வரவு நேர்மறையாகவும் சேமிக்கப்படும்.",
        },
        search: {
          title: "எளிய சொற்களில் தேடல்",
          summary:
            '"கடந்த மாதம் 50க்கு மேல் மளிகை" போன்ற வாக்கியத்தை எழுதுங்கள். பெட்டி தான் புரிந்ததைக் காட்டும்; நீங்கள் தேர்ந்தெடுக்கும் வரை எதுவும் பயன்படாது. எல்லா வடிகட்டிகளும் பொருந்த வேண்டும்.',
        },
        csv: {
          title: "வங்கிக் கோப்புகளை இறக்குதல்",
          summary:
            "உங்கள் வங்கியிலிருந்து CSV கோப்பை எடுத்து, அதன் நெடுவரிசைகளைத் தேதி, தொகை, கணக்கு, பெறுநர், வகையுடன் பொருத்தவும். பின்னர் சில வரிகளைச் சரிபார்க்கவும்.",
        },
        budgets: {
          title: "பட்ஜெட்டுகள் மற்றும் அறிக்கைகள்",
          summary:
            "பட்ஜெட்டுகள் உங்கள் திட்டத்தை உண்மையான செலவுடன் ஒப்பிடும். இந்த மாதம் எவ்வளவு செலவு, சேமிப்பு வளர்கிறதா போன்ற கேள்விகளுக்கு அறிக்கைகள் பதில் தரும்.",
        },
        ai: {
          title: "விருப்ப AI",
          summary:
            "நீங்கள் தேர்ந்தெடுக்கும் சேவையும் உங்கள் விசையும் கொண்டு AI வகைகளைப் பரிந்துரைக்கும். பெறுநர் பெயர்கள் மட்டுமே அனுப்பப்படும். விசை இந்தச் சாதனத்திலேயே இருக்கும்; காப்புப்பிரதியில் சேராது.",
        },
        backups: {
          title: "காப்புப்பிரதிகள்",
          summary:
            "உங்கள் தரவு இந்தச் சாதனத்தில் மட்டுமே உள்ளது. உலாவித் தரவை அழிக்கும் முன், சாதனம் மாற்றும் முன், பெரிய கோப்பை இறக்கும் முன் காப்புப்பிரதி எடுக்கவும். மேகத்தில் வைத்தால் மறையாக்கவும்.",
        },
        localApi: {
          title: "பிற பயன்பாடுகளை இணைத்தல்",
          summary:
            "Mac பயன்பாடு, உங்கள் கணினியில் மட்டுமே இயங்கும் இணைப்பின் மூலம் AI பயன்பாடுகளும் உங்கள் ஸ்கிரிப்டுகளும் தரவை அணுக அனுமதிக்கும். நீங்கள் இயக்கும் வரை அணைந்திருக்கும்.",
        },
        privacy: {
          title: "உங்கள் தனியுரிமை",
          summary:
            "Vaulted Money-க்குக் கணக்கும் சேவையகமும் இல்லை. நீங்கள் ஏற்றுமதி செய்தாலோ AI அம்சத்தை இயக்கினாலோ தவிர, தரவு இந்தச் சாதனத்திலேயே இருக்கும்.",
        },
      },
      cards: {
        glance: {
          title: "ஒரே பார்வையில் உங்கள் பணம்",
          body: "அட்டைகள் உங்கள் இருப்புகள், சமீபத்திய செலவு, வரவிருப்பவற்றைக் காட்டும்.",
        },
        search: {
          title: "எளிய சொற்களில் தேடுங்கள்",
          body: '"கடந்த மாதம் 50க்கு மேல் மளிகை" என முயலுங்கள். நீங்கள் தேர்ந்தெடுக்கும் வரை எதுவும் பயன்படாது.',
        },
        addTransaction: {
          title: "பரிவர்த்தனையைச் சேர்க்கவும்",
          body: "+ பொத்தானைப் பயன்படுத்தவும். கணக்கு, பெறுநர், பின் வகையைத் தேர்ந்தெடுக்கவும்.",
        },
        importBank: {
          title: "உங்கள் வங்கி வரலாற்றைக் கொண்டுவாருங்கள்",
          body: "செயல்கள், பின் CSV இறக்குமதி, வங்கியிலிருந்து எடுத்த கோப்பைப் படிக்கும்.",
        },
        accounts: {
          title: "உங்கள் பணம் இருக்கும் இடம்",
          body: "ஒவ்வொரு வங்கிக் கணக்கு, அட்டை, ரொக்கத்தையும் சேர்க்கவும். ஒவ்வொரு பரிவர்த்தனையும் ஒரு கணக்கைச் சேர்ந்தது.",
        },
        reconcile: {
          title: "வங்கி இருப்புடன் பொருத்துங்கள்",
          body: "இருப்பு தவறினால், செயல்கள், பின் இருப்பைச் சரிபார், ஒரு சரிசெய்தலைச் சேர்க்கும்.",
        },
        setBudget: {
          title: "வரம்பை அமைக்கவும்",
          body: "ஒரு வகை, கணக்கு அல்லது பெறுநருக்குப் பட்ஜெட் அமைத்து மீதத்தைப் பாருங்கள்.",
        },
        smartBudget: {
          title: "பயன்பாடு பட்ஜெட்டுகளைப் பரிந்துரைக்கட்டும்",
          body: "ஸ்மார்ட் உருவாக்கு கடந்த செலவைப் பார்த்து நியாயமான வரம்புகளைப் பரிந்துரைக்கும்.",
        },
        calendar: {
          title: "நாள்காட்டியைப் படிப்பது",
          body: "ஒவ்வொரு நாளும் வரவு, செலவைக் காட்டும். பரிவர்த்தனைகளைப் பார்க்க ஒரு நாளைத் திறக்கவும்.",
        },
        repeats: {
          title: "ஒருமுறை சேர்த்தால் மீண்டும் வரும்",
          body: "கட்டணம் அல்லது சம்பளம் எத்தனை முறை வரும் என அமைக்கவும். தானாக திட்டமிடு உங்கள் வரலாற்றில் அவற்றைக் கண்டறியும்.",
        },
        reports: {
          title: "எளிமையானவை அல்லது விரிவானவை",
          body: "எளிய அறிக்கைகள் அன்றாடக் கேள்விகளுக்குப் பதில் தரும்; விரிவானவை மேலும் பிரிக்கும். இரண்டையும் PDF, Excel, CSV ஆக ஏற்றுமதி செய்யலாம்.",
        },
        insights: {
          title: "திட்டமும் உண்மையும்",
          body: "எந்தப் பட்ஜெட்டுகள் சரியாகப் போகின்றன, அதிகப் பணம் எங்கே போனது என்று பாருங்கள்.",
        },
        charts: {
          title: "தேவையானதை மட்டும் வரைபடமாக்குங்கள்",
          body: 'தேதிகளைத் தேர்ந்தெடுக்கவும் அல்லது "இந்த ஆண்டு உணவகம்" எனத் தேடவும்.',
        },
        categories: {
          title: "வகைகளும் துணை வகைகளும்",
          body: "உணவு, அதன் கீழ் மளிகை என செலவைக் குழுவாக்குங்கள். பெயர் மாற்றினால் அதைப் பயன்படுத்தும் எல்லாப் பரிவர்த்தனைகளும் புதுப்பிக்கப்படும்.",
        },
        payees: {
          title: "பெறுநர்களை ஒழுங்காக வைத்திருங்கள்",
          body: '"Starbucks", "STARBUCKS #12" போன்ற நகல்களை இணைத்தால் அறிக்கைகள் சரியாக வரும்.',
        },
        aiOptional: {
          title: "AI விருப்பமானது",
          body: "AI-ஐ இயக்கி அமைக்கும் வரை எதுவும் அனுப்பப்படாது. எப்போது வேண்டுமானாலும் அணைக்கலாம்.",
        },
        connectApps: {
          title: "Claude அல்லது ChatGPT பயன்படுத்துங்கள்",
          body: "Mac பயன்பாட்டில் ஒரு AI பயன்பாட்டை இணைத்து, அதில் உங்கள் பணம் பற்றிக் கேளுங்கள்.",
        },
        demo: {
          title: "மாதிரித் தரவுடன் முயலுங்கள்",
          body: "மாதிரி எண்களுடன் எல்லா அம்சங்களையும் பார்க்க மாதிரித் தரவை உருவாக்குங்கள். மீட்டமைப்பு அனைத்தையும் அழிக்கும்.",
        },
        backup: {
          title: "பெரிய மாற்றங்களுக்கு முன் காப்புப்பிரதி",
          body: "உங்கள் தரவு இந்தச் சாதனத்தில் மட்டுமே. சாதனம் மாற்றும் அல்லது மீண்டும் நிறுவும் முன் நகலைச் சேமியுங்கள்.",
        },
        currencies: {
          title: "ஒன்றுக்கு மேற்பட்ட நாணயங்கள்",
          body: "நீங்கள் பயன்படுத்தும் நாணயங்களைச் சேர்க்கவும். மொத்தங்கள் இந்தப் பக்க விகிதங்களில் மாற்றப்படும்.",
        },
        ledgers: {
          title: "ஒவ்வொரு கணக்குப் புத்தகத்துக்கும் ஒரு பேரேடு",
          body: "வீடு, தொழில், பயணம் ஆகியவற்றைத் தனியாக வையுங்கள். ஒவ்வொரு பேரேட்டுக்கும் தனிக் கணக்குகளும் பட்ஜெட்டுகளும் உண்டு.",
        },
        privacy: {
          title: "உங்கள் தரவு இங்கேயே இருக்கும்",
          body: "கணக்கு இல்லை, சேவையகம் இல்லை. ஏற்றுமதி செய்தாலோ AI இயக்கினாலோ தவிர எதுவும் வெளியே போகாது.",
        },
      },
    },
  },
};
