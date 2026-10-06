export const homeTranslations: Record<string, Record<string, unknown>> = {
  en: {
    nav: {
      trust: "Trust",
      workflow: "Workflow",
      roadmap: "Roadmap",
      install: "Install",
      menu: "Menu",
    },
    badges: {
      private: "Privacy-first",
      local: "Data-local",
      open: "Open-sourced",
    },
    hero: {
      subtitle:
        "A complete local-first money manager for multi-ledger, multi-currency tracking across personal, family, and business accounts.",
      demoLabel: "Actual mobile /ledgers screen",
      demoDescription:
        "Rendered live from the app at real device dimensions so the homepage matches the real mobile experience.",
      demoDimensions: "Dimensions",
    },
    actions: {
      openApp: "Open app",
      startLedger: "Start with ledgers",
      install: "Install locally",
      goLedgers: "Go to /ledgers",
      github: "View source",
      openLedgers: "Open /ledgers",
    },
    proof: {
      noCloud: "No cloud account",
      offline: "Works offline",
      auditable: "Auditable code",
    },
    trust: {
      privacy: {
        title: "Privacy-first",
        description:
          "No account required. Your financial records stay in your browser or desktop app unless you export them.",
        previewTitle: "Local-only ledger",
        previewMeta: "Browser storage",
        previewStat: "0 accounts",
        previewDetail: "required online",
      },
      dataLocal: {
        title: "Data-local",
        description:
          "Vaulted Money is built around local ledgers, IndexedDB, and optional file backups instead of a hosted database.",
        previewTitle: "Backup vault",
        previewMeta: "Encrypted JSON",
        previewStat: "Auto",
        previewDetail: "backup rhythm",
      },
      openSource: {
        title: "Open-sourced",
        description:
          "The code, roadmap, and privacy posture are auditable in the public repository.",
        previewTitle: "Auditable source",
        previewMeta: "MIT project",
        previewStat: "Public",
        previewDetail: "roadmap and code",
      },
    },
    workflow: {
      title: "Everything needed to run a personal ledger.",
      description:
        "Create a ledger, import CSV files, reconcile accounts, watch budgets, schedule recurring money movement, and export backups from one local app.",
    },
    tools: {
      multiLedger: "Multi-ledger tracking",
      multiCurrency: "Multi-currency balances",
      accountScopes: "Account scopes for different people",
      csvImports: "CSV transaction imports",
      accountsVendors: "Accounts, vendors, categories",
      encryptedBackup: "Encrypted backup options",
    },
    roadmap: {
      description:
        "Based on tagged releases and major shipped milestones so far.",
      snapshot: "Snapshot",
      milestoneCount: "5 milestones",
      milestoneShipped:
        "Five major items shipped in 2026, led by the desktop Local API.",
    },
    milestones: {
      localApi: {
        window: "October 2026",
        title: "Local API for the desktop app",
        summary:
          "The Electron desktop app can now expose an opt-in REST API on your own machine, so you can script Vaulted Money, import and export data, or build your own interface while everything stays local.",
      },
      privacyRefresh: {
        window: "May 2026",
        title: "Privacy and public branding refresh",
        summary:
          "The public-facing experience expanded with a dedicated privacy page, updated branding, and sharper trust messaging for new users.",
      },
      brandLaunch: {
        window: "April 2026",
        title: "Vaulted Money brand and public homepage launch",
        summary:
          "The app was renamed to Vaulted Money, the public homepage landed, and the install story became much clearer for web and desktop users.",
      },
      languageRollout: {
        window: "March 2026",
        title: "Language management and localization rollout",
        summary:
          "Multi-language support, language management UX, and broader translation coverage shipped as a major usability milestone.",
      },
      coreRelease: {
        window: "January 2026",
        title: "Core local-first ledger release",
        summary:
          "The first tagged release established the web app foundation for ledgers, transactions, categories, budgets, and local data ownership.",
      },
    },
    status: {
      released: "Released",
      next: "Next",
    },
    commands: {
      title: "Install it or jump straight into a ledger.",
      copied: "Install command copied.",
      web: {
        label: "Web",
        title: "Run the web app",
        detail: "Best for trying Vaulted Money in a browser.",
      },
      desktop: {
        label: "Desktop",
        title: "Run the desktop app",
        detail: "Best for a local app window with desktop backup support.",
      },
      android: {
        label: "Android",
        title: "Build the Android app",
        detail: "Produces a debug APK you can install on any Android device.",
        prereq: "Requires Android Studio and Java SDK on your machine.",
      },
      ios: {
        label: "iOS",
        title: "Build the iOS app",
        detail: "Builds for the iOS Simulator (macOS only).",
        prereq: "Requires Xcode and macOS. Not available on Windows or Linux.",
      },
    },
    usage: {
      csv: {
        title: "Bring your history with CSV",
        description:
          "Start with a ledger, then import bank exports from the Transactions screen. Mapping columns once makes future imports faster.",
      },
      backup: {
        title: "Back up before you rely on the browser",
        description:
          "Local-first means your data is yours, but private windows, browser resets, or clearing site data can erase local storage.",
      },
      automate: {
        title: "Automate a backup rhythm",
        description:
          "Use encrypted or plain JSON exports, and enable automated backups when your browser or desktop platform supports it.",
      },
    },
    stores: {
      heading: "Get Vaulted Money",
      descBefore: "Coming soon to your favorite store. The same app is free on",
      descAfter: ". Buying through a store supports continued development.",
      openStore: "Open store →",
      comingSoon: "Coming Soon",
    },
  },

  es: {
    nav: {
      trust: "Confianza",
      workflow: "Flujo de trabajo",
      roadmap: "Hoja de ruta",
      install: "Instalar",
      menu: "Menú",
    },
    badges: {
      private: "Privacidad primero",
      local: "Datos locales",
      open: "Código abierto",
    },
    hero: {
      subtitle:
        "Un gestor de dinero local completo para seguimiento multi-libro y multi-moneda en cuentas personales, familiares y de negocios.",
      demoLabel: "Pantalla móvil real /ledgers",
      demoDescription:
        "Renderizado en vivo desde la app a dimensiones reales del dispositivo para que la página de inicio coincida con la experiencia móvil real.",
      demoDimensions: "Dimensiones",
    },
    actions: {
      openApp: "Abrir app",
      startLedger: "Empezar con libros",
      install: "Instalar localmente",
      goLedgers: "Ir a /ledgers",
      github: "Ver código fuente",
      openLedgers: "Abrir /ledgers",
    },
    proof: {
      noCloud: "Sin cuenta en la nube",
      offline: "Funciona sin conexión",
      auditable: "Código auditable",
    },
    trust: {
      privacy: {
        title: "Privacidad primero",
        description:
          "No se necesita cuenta. Tus registros financieros permanecen en tu navegador o app de escritorio a menos que los exportes.",
        previewTitle: "Libro solo local",
        previewMeta: "Almacenamiento del navegador",
        previewStat: "0 cuentas",
        previewDetail: "requeridas en línea",
      },
      dataLocal: {
        title: "Datos locales",
        description:
          "Vaulted Money se basa en libros locales, IndexedDB y copias de seguridad opcionales en lugar de una base de datos alojada.",
        previewTitle: "Bóveda de respaldo",
        previewMeta: "JSON cifrado",
        previewStat: "Auto",
        previewDetail: "ritmo de respaldo",
      },
      openSource: {
        title: "Código abierto",
        description:
          "El código, la hoja de ruta y la postura de privacidad son auditables en el repositorio público.",
        previewTitle: "Fuente auditable",
        previewMeta: "Proyecto MIT",
        previewStat: "Público",
        previewDetail: "hoja de ruta y código",
      },
    },
    workflow: {
      title: "Todo lo necesario para gestionar un libro personal.",
      description:
        "Crea un libro, importa archivos CSV, concilia cuentas, controla presupuestos, programa movimientos recurrentes y exporta respaldos desde una sola app local.",
    },
    tools: {
      multiLedger: "Seguimiento multi-libro",
      multiCurrency: "Balances multi-moneda",
      accountScopes: "Ámbitos de cuenta para diferentes personas",
      csvImports: "Importación de transacciones CSV",
      accountsVendors: "Cuentas, proveedores, categorías",
      encryptedBackup: "Opciones de respaldo cifrado",
    },
    roadmap: {
      description:
        "Basado en versiones etiquetadas y los principales hitos entregados hasta ahora.",
      snapshot: "Resumen",
      milestoneCount: "5 hitos",
      milestoneShipped:
        "Cinco grandes elementos entregados en 2026, encabezados por la API local de escritorio.",
    },
    milestones: {
      localApi: {
        window: "Octubre 2026",
        title: "API local para la app de escritorio",
        summary:
          "La app de escritorio Electron ahora puede exponer una API REST opcional en tu propio equipo, para automatizar Vaulted Money, importar y exportar datos o crear tu propia interfaz manteniendo todo local.",
      },
      privacyRefresh: {
        window: "Mayo 2026",
        title: "Actualización de privacidad y marca pública",
        summary:
          "La experiencia pública se amplió con una página de privacidad dedicada, marca actualizada y mensajes de confianza más claros para nuevos usuarios.",
      },
      brandLaunch: {
        window: "Abril 2026",
        title: "Lanzamiento de marca y página de inicio de Vaulted Money",
        summary:
          "La app fue renombrada a Vaulted Money, se lanzó la página de inicio pública y la historia de instalación se hizo más clara para usuarios web y de escritorio.",
      },
      languageRollout: {
        window: "Marzo 2026",
        title: "Gestión de idiomas y despliegue de localización",
        summary:
          "El soporte multi-idioma, la experiencia de gestión de idiomas y una cobertura de traducción más amplia se entregaron como un hito importante de usabilidad.",
      },
      coreRelease: {
        window: "Enero 2026",
        title: "Lanzamiento principal del libro local",
        summary:
          "La primera versión etiquetada estableció la base de la app web para libros, transacciones, categorías, presupuestos y propiedad local de datos.",
      },
    },
    status: {
      released: "Lanzado",
      next: "Siguiente",
    },
    commands: {
      title: "Instálalo o entra directamente a un libro.",
      copied: "Comando de instalación copiado.",
      web: {
        label: "Web",
        title: "Ejecutar la app web",
        detail: "Ideal para probar Vaulted Money en un navegador.",
      },
      desktop: {
        label: "Escritorio",
        title: "Ejecutar la app de escritorio",
        detail:
          "Ideal para una ventana local con soporte de respaldo de escritorio.",
      },
      android: {
        label: "Android",
        title: "Compilar la app Android",
        detail:
          "Produce un APK de depuración que puedes instalar en cualquier dispositivo Android.",
        prereq: "Requiere Android Studio y Java SDK en tu máquina.",
      },
      ios: {
        label: "iOS",
        title: "Compilar la app iOS",
        detail: "Compila para el simulador de iOS (solo macOS).",
        prereq: "Requiere Xcode y macOS. No disponible en Windows o Linux.",
      },
    },
    usage: {
      csv: {
        title: "Trae tu historial con CSV",
        description:
          "Comienza con un libro, luego importa extractos bancarios desde la pantalla de Transacciones. Mapear las columnas una vez hace que futuras importaciones sean más rápidas.",
      },
      backup: {
        title: "Haz respaldo antes de depender del navegador",
        description:
          "Local-first significa que tus datos son tuyos, pero ventanas privadas, reinicios del navegador o borrar datos del sitio pueden eliminar el almacenamiento local.",
      },
      automate: {
        title: "Automatiza un ritmo de respaldo",
        description:
          "Usa exportaciones JSON cifradas o en texto plano, y habilita respaldos automáticos cuando tu navegador o plataforma de escritorio lo permita.",
      },
    },
    stores: {
      heading: "Obtén Vaulted Money",
      descBefore:
        "Próximamente en tu tienda favorita. La misma app es gratuita en",
      descAfter: ". Comprar en una tienda apoya el desarrollo continuo.",
      openStore: "Abrir tienda →",
      comingSoon: "Próximamente",
    },
  },

  zh: {
    nav: {
      trust: "信任",
      workflow: "工作流",
      roadmap: "路线图",
      install: "安装",
      menu: "菜单",
    },
    badges: {
      private: "隐私优先",
      local: "数据本地",
      open: "开源",
    },
    hero: {
      subtitle:
        "一个完整的本地优先资金管理工具，支持多账本、多币种，适用于个人、家庭和商业账户。",
      demoLabel: "实际移动设备 /ledgers 界面",
      demoDescription:
        "以真实设备尺寸从应用实时渲染，让主页与真实移动体验保持一致。",
      demoDimensions: "尺寸",
    },
    actions: {
      openApp: "打开应用",
      startLedger: "从账本开始",
      install: "本地安装",
      goLedgers: "前往 /ledgers",
      github: "查看源码",
      openLedgers: "打开 /ledgers",
    },
    proof: {
      noCloud: "无需云账户",
      offline: "离线可用",
      auditable: "代码可审计",
    },
    trust: {
      privacy: {
        title: "隐私优先",
        description:
          "无需账户。你的财务记录保存在浏览器或桌面应用中，除非你主动导出。",
        previewTitle: "纯本地账本",
        previewMeta: "浏览器存储",
        previewStat: "0 个账户",
        previewDetail: "无需联网",
      },
      dataLocal: {
        title: "数据本地",
        description:
          "Vaulted Money 基于本地账本、IndexedDB 和可选文件备份，而非托管数据库。",
        previewTitle: "备份保险库",
        previewMeta: "加密 JSON",
        previewStat: "自动",
        previewDetail: "备份节奏",
      },
      openSource: {
        title: "开源",
        description: "代码、路线图和隐私策略均可在公开仓库中审计。",
        previewTitle: "可审计源码",
        previewMeta: "MIT 项目",
        previewStat: "公开",
        previewDetail: "路线图与代码",
      },
    },
    workflow: {
      title: "管理个人账本所需的一切。",
      description:
        "创建账本、导入 CSV 文件、对账、监控预算、安排定期资金流动，并从一个本地应用导出备份。",
    },
    tools: {
      multiLedger: "多账本追踪",
      multiCurrency: "多币种余额",
      accountScopes: "不同人员的账户范围",
      csvImports: "CSV 交易导入",
      accountsVendors: "账户、商家、分类",
      encryptedBackup: "加密备份选项",
    },
    roadmap: {
      description: "基于已标记的版本和迄今已交付的主要里程碑。",
      snapshot: "概览",
      milestoneCount: "5 个里程碑",
      milestoneShipped: "2026 年已交付五个主要项目，以桌面本地 API 为首。",
    },
    milestones: {
      localApi: {
        window: "2026 年 10 月",
        title: "桌面应用本地 API",
        summary:
          "Electron 桌面应用现在可以在你自己的电脑上提供可选的 REST API，让你编写脚本操作 Vaulted Money、导入导出数据或构建自己的界面，同时所有数据仍保留在本地。",
      },
      privacyRefresh: {
        window: "2026 年 5 月",
        title: "隐私与公开品牌更新",
        summary:
          "面向公众的体验扩展了专属隐私页面、更新的品牌形象和面向新用户更清晰的信任信息。",
      },
      brandLaunch: {
        window: "2026 年 4 月",
        title: "Vaulted Money 品牌与公共主页上线",
        summary:
          "应用更名为 Vaulted Money，公共主页上线，Web 和桌面用户的安装流程变得更加清晰。",
      },
      languageRollout: {
        window: "2026 年 3 月",
        title: "语言管理和本地化发布",
        summary:
          "多语言支持、语言管理体验和更广泛的翻译覆盖作为重要的可用性里程碑交付。",
      },
      coreRelease: {
        window: "2026 年 1 月",
        title: "核心本地优先账本发布",
        summary:
          "首个标记版本建立了 Web 应用的基础，包括账本、交易、分类、预算和本地数据所有权。",
      },
    },
    status: {
      released: "已发布",
      next: "下一步",
    },
    commands: {
      title: "安装它或直接进入账本。",
      copied: "安装命令已复制。",
      web: {
        label: "Web",
        title: "运行 Web 应用",
        detail: "适合在浏览器中试用 Vaulted Money。",
      },
      desktop: {
        label: "桌面",
        title: "运行桌面应用",
        detail: "适合本地应用窗口并支持桌面备份。",
      },
      android: {
        label: "Android",
        title: "构建 Android 应用",
        detail: "生成可安装在任何 Android 设备上的调试 APK。",
        prereq: "需要在你的机器上安装 Android Studio 和 Java SDK。",
      },
      ios: {
        label: "iOS",
        title: "构建 iOS 应用",
        detail: "为 iOS 模拟器构建（仅限 macOS）。",
        prereq: "需要 Xcode 和 macOS。Windows 或 Linux 不可用。",
      },
    },
    usage: {
      csv: {
        title: "用 CSV 导入你的历史记录",
        description:
          "从创建账本开始，然后在交易页面导入银行导出文件。映射一次列后，未来的导入会更快。",
      },
      backup: {
        title: "在依赖浏览器之前做好备份",
        description:
          "本地优先意味着数据是你的，但隐私窗口、浏览器重置或清除站点数据可能会擦除本地存储。",
      },
      automate: {
        title: "建立自动备份节奏",
        description:
          "使用加密或纯文本 JSON 导出，并在浏览器或桌面平台支持时启用自动备份。",
      },
    },
    stores: {
      heading: "获取 Vaulted Money",
      descBefore: "即将登陆你喜欢的应用商店。同款应用在",
      descAfter: "上免费提供。通过商店购买支持持续开发。",
      openStore: "打开商店 →",
      comingSoon: "即将推出",
    },
  },

  nl: {
    nav: {
      trust: "Vertrouwen",
      workflow: "Werkwijze",
      roadmap: "Routekaart",
      install: "Installeren",
      menu: "Menu",
    },
    badges: {
      private: "Privacy eerst",
      local: "Gegevens lokaal",
      open: "Open source",
    },
    hero: {
      subtitle:
        "Een complete lokaal-eerst geldmanager voor meervoudig-grootboek en meervoudig-valuta tracking voor persoonlijke, familie- en zakelijke rekeningen.",
      demoLabel: "Echte mobiele /ledgers scherm",
      demoDescription:
        "Live weergegeven vanuit de app op echte apparaatafmetingen zodat de homepage overeenkomt met de echte mobiele ervaring.",
      demoDimensions: "Afmetingen",
    },
    actions: {
      openApp: "App openen",
      startLedger: "Beginnen met grootboeken",
      install: "Lokaal installeren",
      goLedgers: "Ga naar /ledgers",
      github: "Broncode bekijken",
      openLedgers: "Open /ledgers",
    },
    proof: {
      noCloud: "Geen cloudaccount",
      offline: "Werkt offline",
      auditable: "Controleerbare code",
    },
    trust: {
      privacy: {
        title: "Privacy eerst",
        description:
          "Geen account vereist. Je financiële gegevens blijven in je browser of desktop-app tenzij je ze exporteert.",
        previewTitle: "Alleen lokaal grootboek",
        previewMeta: "Browseropslag",
        previewStat: "0 accounts",
        previewDetail: "online vereist",
      },
      dataLocal: {
        title: "Gegevens lokaal",
        description:
          "Vaulted Money is gebouwd rond lokale grootboeken, IndexedDB en optionele bestandsback-ups in plaats van een gehoste database.",
        previewTitle: "Back-up kluis",
        previewMeta: "Versleuteld JSON",
        previewStat: "Auto",
        previewDetail: "back-up ritme",
      },
      openSource: {
        title: "Open source",
        description:
          "De code, routekaart en privacyhouding zijn controleerbaar in de openbare repository.",
        previewTitle: "Controleerbare bron",
        previewMeta: "MIT-project",
        previewStat: "Openbaar",
        previewDetail: "routekaart en code",
      },
    },
    workflow: {
      title: "Alles wat nodig is voor een persoonlijk grootboek.",
      description:
        "Maak een grootboek, importeer CSV-bestanden, stem rekeningen af, bewaak budgetten, plan terugkerende geldstromen en exporteer back-ups vanuit één lokale app.",
    },
    tools: {
      multiLedger: "Meerdere grootboeken",
      multiCurrency: "Meerdere valuta's",
      accountScopes: "Accountbereiken voor verschillende personen",
      csvImports: "CSV-transactie-import",
      accountsVendors: "Rekeningen, leveranciers, categorieën",
      encryptedBackup: "Versleutelde back-upopties",
    },
    roadmap: {
      description:
        "Gebaseerd op getagde releases en belangrijke geleverde mijlpalen tot nu toe.",
      snapshot: "Overzicht",
      milestoneCount: "5 mijlpalen",
      milestoneShipped:
        "Vijf belangrijke items geleverd in 2026, aangevoerd door de lokale desktop-API.",
    },
    milestones: {
      localApi: {
        window: "Oktober 2026",
        title: "Lokale API voor de desktop-app",
        summary:
          "De Electron desktop-app kan nu een optionele REST API op je eigen computer aanbieden, zodat je Vaulted Money kunt scripten, gegevens kunt importeren en exporteren of je eigen interface kunt bouwen terwijl alles lokaal blijft.",
      },
      privacyRefresh: {
        window: "Mei 2026",
        title: "Privacy en publieke merkvernieuwing",
        summary:
          "De publieke ervaring is uitgebreid met een speciale privacypagina, vernieuwde branding en scherpere vertrouwensboodschappen voor nieuwe gebruikers.",
      },
      brandLaunch: {
        window: "April 2026",
        title: "Vaulted Money merk en publieke homepage lancering",
        summary:
          "De app is hernoemd naar Vaulted Money, de publieke homepage is gelanceerd en het installatieverhaal is veel duidelijker geworden voor web- en desktopgebruikers.",
      },
      languageRollout: {
        window: "Maart 2026",
        title: "Taalbeheer en lokalisatie-uitrol",
        summary:
          "Meertalige ondersteuning, taalbeheer-UX en bredere vertaaldekking zijn geleverd als een belangrijke bruikbaarheidsmijlpaal.",
      },
      coreRelease: {
        window: "Januari 2026",
        title: "Kern lokaal-eerst grootboek release",
        summary:
          "De eerste getagde release legde de basis voor de webapp met grootboeken, transacties, categorieën, budgetten en lokaal gegevensbeheer.",
      },
    },
    status: {
      released: "Uitgebracht",
      next: "Volgende",
    },
    commands: {
      title: "Installeer het of ga direct naar een grootboek.",
      copied: "Installatiecommando gekopieerd.",
      web: {
        label: "Web",
        title: "De webapp uitvoeren",
        detail: "Ideaal om Vaulted Money in een browser te proberen.",
      },
      desktop: {
        label: "Desktop",
        title: "De desktop-app uitvoeren",
        detail:
          "Ideaal voor een lokaal app-venster met desktop back-up ondersteuning.",
      },
      android: {
        label: "Android",
        title: "De Android-app bouwen",
        detail:
          "Produceert een debug-APK die je op elk Android-apparaat kunt installeren.",
        prereq: "Vereist Android Studio en Java SDK op je machine.",
      },
      ios: {
        label: "iOS",
        title: "De iOS-app bouwen",
        detail: "Bouwt voor de iOS-simulator (alleen macOS).",
        prereq: "Vereist Xcode en macOS. Niet beschikbaar op Windows of Linux.",
      },
    },
    usage: {
      csv: {
        title: "Breng je geschiedenis mee met CSV",
        description:
          "Begin met een grootboek en importeer vervolgens bankexports via het Transactiescherm. Eénmaal kolommen toewijzen maakt toekomstige imports sneller.",
      },
      backup: {
        title: "Maak een back-up voordat je op de browser vertrouwt",
        description:
          "Lokaal-eerst betekent dat je gegevens van jou zijn, maar privévensters, browserresets of het wissen van sitegegevens kunnen lokale opslag verwijderen.",
      },
      automate: {
        title: "Automatiseer een back-up ritme",
        description:
          "Gebruik versleutelde of platte JSON-exports en schakel automatische back-ups in wanneer je browser of desktopplatform dit ondersteunt.",
      },
    },
    stores: {
      heading: "Verkrijg Vaulted Money",
      descBefore:
        "Binnenkort in je favoriete winkel. Dezelfde app is gratis op",
      descAfter: ". Kopen via een winkel ondersteunt verdere ontwikkeling.",
      openStore: "Winkel openen →",
      comingSoon: "Binnenkort",
    },
  },

  ta: {
    nav: {
      trust: "நம்பிக்கை",
      workflow: "பணிப்பாய்வு",
      roadmap: "வழிப்படம்",
      install: "நிறுவு",
      menu: "மெனு",
    },
    badges: {
      private: "தனியுரிமை முதலில்",
      local: "தரவு உள்ளமை",
      open: "திறந்த மூலம்",
    },
    hero: {
      subtitle:
        "தனிப்பட்ட, குடும்ப மற்றும் வணிகக் கணக்குகளில் பல-லெட்ஜர், பல-நாணய கண்காணிப்புக்கான முழுமையான உள்ளமை-முதல் பண மேலாளர்.",
      demoLabel: "உண்மையான மொபைல் /ledgers திரை",
      demoDescription:
        "முகப்புப் பக்கம் உண்மையான மொபைல் அனுபவத்துடன் பொருந்த, உண்மையான சாதன அளவுகளில் பயன்பாட்டிலிருந்து நேரடியாக வழங்கப்படுகிறது.",
      demoDimensions: "அளவுகள்",
    },
    actions: {
      openApp: "பயன்பாட்டை திற",
      startLedger: "லெட்ஜர்களுடன் தொடங்கு",
      install: "உள்ளமையாக நிறுவு",
      goLedgers: "/ledgers க்கு செல்",
      github: "மூலக்குறியீடு பார்",
      openLedgers: "/ledgers திற",
    },
    proof: {
      noCloud: "கிளவுட் கணக்கு இல்லை",
      offline: "ஆஃப்லைனில் செயல்படும்",
      auditable: "தணிக்கை செய்யக்கூடிய குறியீடு",
    },
    trust: {
      privacy: {
        title: "தனியுரிமை முதலில்",
        description:
          "கணக்கு தேவையில்லை. நீங்கள் ஏற்றுமதி செய்யாத வரை உங்கள் நிதிப் பதிவுகள் உலாவி அல்லது டெஸ்க்டாப் பயன்பாட்டில் இருக்கும்.",
        previewTitle: "உள்ளமை மட்டும் லெட்ஜர்",
        previewMeta: "உலாவி சேமிப்பு",
        previewStat: "0 கணக்குகள்",
        previewDetail: "ஆன்லைன் தேவை",
      },
      dataLocal: {
        title: "தரவு உள்ளமை",
        description:
          "Vaulted Money உள்ளமை லெட்ஜர்கள், IndexedDB மற்றும் விருப்ப கோப்பு காப்புப்பிரதிகளை அடிப்படையாகக் கொண்டது, ஹோஸ்ட் செய்யப்பட்ட தரவுத்தளம் அல்ல.",
        previewTitle: "காப்பு பெட்டகம்",
        previewMeta: "மறையாக்கப்பட்ட JSON",
        previewStat: "தானியங்கி",
        previewDetail: "காப்பு தாளம்",
      },
      openSource: {
        title: "திறந்த மூலம்",
        description:
          "குறியீடு, வழிப்படம் மற்றும் தனியுரிமை நிலைப்பாடு பொது களஞ்சியத்தில் தணிக்கை செய்யலாம்.",
        previewTitle: "தணிக்கை செய்யக்கூடிய மூலம்",
        previewMeta: "MIT திட்டம்",
        previewStat: "பொது",
        previewDetail: "வழிப்படம் மற்றும் குறியீடு",
      },
    },
    workflow: {
      title: "தனிப்பட்ட லெட்ஜரை நிர்வகிக்க தேவையான அனைத்தும்.",
      description:
        "லெட்ஜர் உருவாக்கு, CSV கோப்புகள் இறக்குமதி செய், கணக்குகளை சமரசம் செய், பட்ஜெட்டுகளை கண்காணி, தொடர் பண நகர்வுகளை திட்டமிடு, ஒரு உள்ளமை பயன்பாட்டிலிருந்து காப்புப்பிரதிகளை ஏற்றுமதி செய்.",
    },
    tools: {
      multiLedger: "பல-லெட்ஜர் கண்காணிப்பு",
      multiCurrency: "பல-நாணய இருப்புகள்",
      accountScopes: "வெவ்வேறு நபர்களுக்கான கணக்கு எல்லைகள்",
      csvImports: "CSV பரிவர்த்தனை இறக்குமதி",
      accountsVendors: "கணக்குகள், விற்பனையாளர்கள், வகைகள்",
      encryptedBackup: "மறையாக்கப்பட்ட காப்பு விருப்பங்கள்",
    },
    roadmap: {
      description:
        "இதுவரை வழங்கப்பட்ட பெரிய மைல்கற்கள் மற்றும் குறியிடப்பட்ட வெளியீடுகளின் அடிப்படையில்.",
      snapshot: "சுருக்கம்",
      milestoneCount: "5 மைல்கற்கள்",
      milestoneShipped:
        "2026 இல் ஐந்து முக்கிய அம்சங்கள் வழங்கப்பட்டன, டெஸ்க்டாப் உள்ளூர் API முன்னிலையில்.",
    },
    milestones: {
      localApi: {
        window: "அக்டோபர் 2026",
        title: "டெஸ்க்டாப் பயன்பாட்டிற்கான உள்ளூர் API",
        summary:
          "Electron டெஸ்க்டாப் பயன்பாடு இப்போது உங்கள் சொந்த கணினியில் விருப்பத் தேர்வான REST API ஐ வழங்க முடியும்; அனைத்தும் உள்ளூரிலேயே இருக்கும் நிலையில் Vaulted Money ஐ ஸ்கிரிப்ட் செய்யலாம், தரவை இறக்குமதி/ஏற்றுமதி செய்யலாம் அல்லது உங்கள் சொந்த இடைமுகத்தை உருவாக்கலாம்.",
      },
      privacyRefresh: {
        window: "மே 2026",
        title: "தனியுரிமை மற்றும் பொது பிராண்ட் புதுப்பிப்பு",
        summary:
          "பொது அனுபவம் அர்ப்பணிக்கப்பட்ட தனியுரிமை பக்கம், புதுப்பிக்கப்பட்ட பிராண்டிங் மற்றும் புதிய பயனர்களுக்கான தெளிவான நம்பிக்கை செய்திகளுடன் விரிவடைந்தது.",
      },
      brandLaunch: {
        window: "ஏப்ரல் 2026",
        title: "Vaulted Money பிராண்ட் மற்றும் பொது முகப்புப் பக்க வெளியீடு",
        summary:
          "பயன்பாடு Vaulted Money என்று மறுபெயரிடப்பட்டது, பொது முகப்புப் பக்கம் வெளியிடப்பட்டது, மற்றும் வலை மற்றும் டெஸ்க்டாப் பயனர்களுக்கு நிறுவல் செயல்முறை தெளிவாகியது.",
      },
      languageRollout: {
        window: "மார்ச் 2026",
        title: "மொழி மேலாண்மை மற்றும் உள்ளூர்மயமாக்கல் வெளியீடு",
        summary:
          "பல-மொழி ஆதரவு, மொழி மேலாண்மை UX மற்றும் பரந்த மொழிபெயர்ப்பு கவரேஜ் முக்கிய பயன்பாட்டு மைல்கல்லாக வழங்கப்பட்டது.",
      },
      coreRelease: {
        window: "ஜனவரி 2026",
        title: "முக்கிய உள்ளமை-முதல் லெட்ஜர் வெளியீடு",
        summary:
          "முதல் குறியிடப்பட்ட வெளியீடு லெட்ஜர்கள், பரிவர்த்தனைகள், வகைகள், பட்ஜெட்டுகள் மற்றும் உள்ளமை தரவு உரிமைக்கான வலை பயன்பாட்டு அடித்தளத்தை நிறுவியது.",
      },
    },
    status: {
      released: "வெளியிடப்பட்டது",
      next: "அடுத்தது",
    },
    commands: {
      title: "நிறுவுங்கள் அல்லது நேரடியாக லெட்ஜருக்குள் செல்லுங்கள்.",
      copied: "நிறுவல் கட்டளை நகலெடுக்கப்பட்டது.",
      web: {
        label: "வலை",
        title: "வலை பயன்பாட்டை இயக்கு",
        detail: "உலாவியில் Vaulted Money ஐ முயற்சிக்க சிறந்தது.",
      },
      desktop: {
        label: "டெஸ்க்டாப்",
        title: "டெஸ்க்டாப் பயன்பாட்டை இயக்கு",
        detail:
          "டெஸ்க்டாப் காப்பு ஆதரவுடன் உள்ளமை பயன்பாட்டு சாளரத்திற்கு சிறந்தது.",
      },
      android: {
        label: "Android",
        title: "Android பயன்பாட்டை உருவாக்கு",
        detail:
          "எந்த Android சாதனத்திலும் நிறுவக்கூடிய டீபக் APK ஐ உருவாக்குகிறது.",
        prereq: "உங்கள் கணினியில் Android Studio மற்றும் Java SDK தேவை.",
      },
      ios: {
        label: "iOS",
        title: "iOS பயன்பாட்டை உருவாக்கு",
        detail: "iOS சிமுலேட்டருக்கு உருவாக்குகிறது (macOS மட்டும்).",
        prereq:
          "Xcode மற்றும் macOS தேவை. Windows அல்லது Linux இல் கிடைக்காது.",
      },
    },
    usage: {
      csv: {
        title: "CSV மூலம் உங்கள் வரலாற்றை கொண்டு வாருங்கள்",
        description:
          "லெட்ஜரில் தொடங்கி, பரிவர்த்தனைகள் திரையில் வங்கி ஏற்றுமதிகளை இறக்குமதி செய்யுங்கள். நெடுவரிசைகளை ஒருமுறை மேப்பிங் செய்தால் எதிர்கால இறக்குமதிகள் வேகமாகும்.",
      },
      backup: {
        title: "உலாவியை நம்புவதற்கு முன் காப்புப்பிரதி எடுங்கள்",
        description:
          "உள்ளமை-முதல் என்பது உங்கள் தரவு உங்களுடையது, ஆனால் தனிப்பட்ட சாளரங்கள், உலாவி மீட்டமைப்புகள் அல்லது தள தரவை அழிப்பது உள்ளமை சேமிப்பை நீக்கலாம்.",
      },
      automate: {
        title: "காப்பு தாளத்தை தானியக்கமாக்குங்கள்",
        description:
          "மறையாக்கப்பட்ட அல்லது சாதாரண JSON ஏற்றுமதிகளைப் பயன்படுத்தி, உங்கள் உலாவி அல்லது டெஸ்க்டாப் தளம் ஆதரிக்கும்போது தானியங்கி காப்புப்பிரதிகளை இயக்குங்கள்.",
      },
    },
    stores: {
      heading: "Vaulted Money பெறுங்கள்",
      descBefore: "உங்கள் விருப்பமான கடையில் விரைவில் கிடைக்கும். அதே பயன்பாடு",
      descAfter:
        " இல் இலவசமாக கிடைக்கிறது. கடையில் வாங்குவது தொடர்ந்த மேம்பாட்டை ஆதரிக்கிறது.",
      openStore: "கடையைத் திற →",
      comingSoon: "விரைவில்",
    },
  },
};
