import type { AreaTranslations } from "./types";

/**
 * Encrypted continuity sync (Settings card and the conflict question), where
 * AI providers send data, and the homepage "What works where" table.
 * Machine-written: ask a native speaker to review.
 */
export const syncAndPlatforms: AreaTranslations = {
  en: {
    sync: {
      conflict: {
        title: "Changes on two devices",
        body: "This device and another device both changed your books since they last synced. Choose which copy to keep.",
        keptAside:
          "The other copy is saved in your sync folder as {{file}}, so nothing is lost. You can import it later if you need it.",
        useFolder: "Use the other device's copy",
        useDevice: "Keep this device's copy",
      },
    },
    settings: {
      sync: {
        syncNow: "Sync now",
        status: {
          synced: "Last synced {{date}}, {{time}}.",
          waiting: "Waiting for the first sync.",
          syncing: "Syncing…",
          locked:
            "The sync file is encrypted. Enter the passphrase you set on your other device.",
          wrongPassphrase:
            "The passphrase does not open the sync file. Enter the one you set on your other device.",
          newerVersion:
            "The sync file was written by a newer version of Vaulted Money. Update this app to keep syncing.",
          conflict: "Waiting for you to choose which copy to keep.",
          error: "Sync stopped: {{message}}",
        },
        guide: {
          step1:
            "On each device, choose the same folder in iCloud Drive, Google Drive, Dropbox or Nextcloud.",
          step2:
            "Set the same passphrase on each device. The file is encrypted before it leaves the device, so the cloud service cannot read it.",
          step3:
            "Changes are saved to the folder as you work and picked up when you open the app on another device. If both devices changed, you choose which copy to keep.",
        },
        passphrase: {
          on: "Sync file is encrypted",
          off: "Sync file is not encrypted",
          placeholder: "Sync passphrase",
          changePlaceholder: "New passphrase",
          set: "Encrypt sync file",
          change: "Change passphrase",
          remove: "Stop encrypting",
          tooShort: "Use at least {{min}} characters.",
          hint: "Kept on this device only and never included in backups. Every device that uses the folder needs the same passphrase; if it is lost, choose an empty folder to start again.",
        },
      },
    },
    aiHub: {
      providers: {
        location: {
          cloud: "Cloud: payee names leave this device",
          thisComputer: "Local: runs on this computer",
          homeNetwork: "Local: runs on your home network",
        },
      },
    },
    aiConsent: {
      thisTime_one: "This time: {{count}} payee name.",
      thisTime_other: "This time: {{count}} payee names.",
      sendingSummary_one:
        "Sending {{count}} payee name to {{provider}}. Amounts, dates and notes stay on this device.",
      sendingSummary_other:
        "Sending {{count}} payee names to {{provider}}. Amounts, dates and notes stay on this device.",
    },
    home: {
      platforms: {
        title: "What works where",
        intro:
          "Your books work the same on every device. Automation needs the desktop app: phones and browsers do not let an app run a server or talk to other programs on your computer, and Vaulted Money respects that.",
        web: "Web",
        phone: "iPhone, iPad, Android",
        desktop: "Desktop app",
        coreGroup: "Your books: every device",
        desktopGroup: "Automation and agents: desktop app",
        yes: "Available",
        no: "Not available",
        chromeEdge: "Chrome, Edge",
        rows: {
          ledger: "Accounts, transactions, budgets and reports",
          search: "Plain-English search, offline",
          sync: "Encrypted sync through your own cloud folder",
          cloudAi: "AI categories with your own cloud AI key",
          localAi: "AI on your own computer (LM Studio, Ollama)",
          agents: "Connect an AI agent (MCP)",
          api: "Local API for scripts",
        },
      },
    },
  },
  es: {
    sync: {
      conflict: {
        title: "Cambios en dos dispositivos",
        body: "Este dispositivo y otro cambiaron tus libros desde la última sincronización. Elige qué copia conservar.",
        keptAside:
          "La otra copia se guarda en tu carpeta de sincronización como {{file}}, así que no se pierde nada. Puedes importarla más tarde si la necesitas.",
        useFolder: "Usar la copia del otro dispositivo",
        useDevice: "Conservar la copia de este dispositivo",
      },
    },
    settings: {
      sync: {
        syncNow: "Sincronizar ahora",
        status: {
          synced: "Última sincronización: {{date}}, {{time}}.",
          waiting: "Esperando la primera sincronización.",
          syncing: "Sincronizando…",
          locked:
            "El archivo de sincronización está cifrado. Introduce la frase de contraseña que definiste en tu otro dispositivo.",
          wrongPassphrase:
            "La frase de contraseña no abre el archivo de sincronización. Introduce la que definiste en tu otro dispositivo.",
          newerVersion:
            "El archivo de sincronización lo escribió una versión más reciente de Vaulted Money. Actualiza esta app para seguir sincronizando.",
          conflict: "Esperando a que elijas qué copia conservar.",
          error: "La sincronización se detuvo: {{message}}",
        },
        guide: {
          step1:
            "En cada dispositivo, elige la misma carpeta de iCloud Drive, Google Drive, Dropbox o Nextcloud.",
          step2:
            "Define la misma frase de contraseña en cada dispositivo. El archivo se cifra antes de salir del dispositivo, así que el servicio en la nube no puede leerlo.",
          step3:
            "Los cambios se guardan en la carpeta mientras trabajas y se recogen al abrir la app en otro dispositivo. Si ambos dispositivos cambiaron, tú eliges qué copia conservar.",
        },
        passphrase: {
          on: "El archivo de sincronización está cifrado",
          off: "El archivo de sincronización no está cifrado",
          placeholder: "Frase de contraseña de sincronización",
          changePlaceholder: "Nueva frase de contraseña",
          set: "Cifrar archivo de sincronización",
          change: "Cambiar frase de contraseña",
          remove: "Dejar de cifrar",
          tooShort: "Usa al menos {{min}} caracteres.",
          hint: "Se guarda solo en este dispositivo y nunca se incluye en las copias de seguridad. Todos los dispositivos que usan la carpeta necesitan la misma frase; si se pierde, elige una carpeta vacía para empezar de nuevo.",
        },
      },
    },
    aiHub: {
      providers: {
        location: {
          cloud: "Nube: los beneficiarios salen de este dispositivo",
          thisComputer: "Local: se ejecuta en este ordenador",
          homeNetwork: "Local: se ejecuta en tu red doméstica",
        },
      },
    },
    aiConsent: {
      thisTime_one: "Esta vez: {{count}} beneficiario.",
      thisTime_other: "Esta vez: {{count}} beneficiarios.",
      sendingSummary_one:
        "Enviando {{count}} nombre de beneficiario a {{provider}}. Importes, fechas y notas se quedan en este dispositivo.",
      sendingSummary_other:
        "Enviando {{count}} nombres de beneficiarios a {{provider}}. Importes, fechas y notas se quedan en este dispositivo.",
    },
    home: {
      platforms: {
        title: "Qué funciona dónde",
        intro:
          "Tus libros funcionan igual en todos los dispositivos. La automatización necesita la app de escritorio: los teléfonos y navegadores no permiten que una app ejecute un servidor ni hable con otros programas de tu ordenador, y Vaulted Money lo respeta.",
        web: "Web",
        phone: "iPhone, iPad, Android",
        desktop: "App de escritorio",
        coreGroup: "Tus libros: en todos los dispositivos",
        desktopGroup: "Automatización y agentes: app de escritorio",
        yes: "Disponible",
        no: "No disponible",
        chromeEdge: "Chrome, Edge",
        rows: {
          ledger: "Cuentas, transacciones, presupuestos e informes",
          search: "Búsqueda en lenguaje natural, sin conexión",
          sync: "Sincronización cifrada con tu propia carpeta en la nube",
          cloudAi: "Categorías con IA usando tu propia clave en la nube",
          localAi: "IA en tu propio ordenador (LM Studio, Ollama)",
          agents: "Conectar un agente de IA (MCP)",
          api: "API local para scripts",
        },
      },
    },
  },
  zh: {
    sync: {
      conflict: {
        title: "两台设备都有更改",
        body: "自上次同步以来，这台设备和另一台设备都更改了你的账本。请选择保留哪一份。",
        keptAside:
          "另一份已保存在同步文件夹中，名为 {{file}}，不会丢失任何内容。需要时可以稍后导入。",
        useFolder: "使用另一台设备的副本",
        useDevice: "保留这台设备的副本",
      },
    },
    settings: {
      sync: {
        syncNow: "立即同步",
        status: {
          synced: "上次同步：{{date}} {{time}}。",
          waiting: "正在等待首次同步。",
          syncing: "正在同步…",
          locked: "同步文件已加密。请输入你在另一台设备上设置的密码短语。",
          wrongPassphrase:
            "该密码短语无法打开同步文件。请输入你在另一台设备上设置的密码短语。",
          newerVersion:
            "同步文件由更新版本的 Vaulted Money 写入。请更新此应用以继续同步。",
          conflict: "正在等待你选择保留哪一份。",
          error: "同步已停止：{{message}}",
        },
        guide: {
          step1:
            "在每台设备上，选择 iCloud Drive、Google Drive、Dropbox 或 Nextcloud 中的同一个文件夹。",
          step2:
            "在每台设备上设置相同的密码短语。文件在离开设备前即被加密，云服务无法读取。",
          step3:
            "你的更改会在使用时保存到该文件夹，并在另一台设备上打开应用时载入。如果两台设备都有更改，由你选择保留哪一份。",
        },
        passphrase: {
          on: "同步文件已加密",
          off: "同步文件未加密",
          placeholder: "同步密码短语",
          changePlaceholder: "新密码短语",
          set: "加密同步文件",
          change: "更改密码短语",
          remove: "停止加密",
          tooShort: "请至少使用 {{min}} 个字符。",
          hint: "仅保存在这台设备上，绝不会包含在备份中。使用该文件夹的每台设备都需要相同的密码短语；如果遗失，请选择一个空文件夹重新开始。",
        },
      },
    },
    aiHub: {
      providers: {
        location: {
          cloud: "云端：收款方名称会离开这台设备",
          thisComputer: "本地：在这台电脑上运行",
          homeNetwork: "本地：在你的家庭网络中运行",
        },
      },
    },
    aiConsent: {
      thisTime_one: "本次：{{count}} 个收款方名称。",
      thisTime_other: "本次：{{count}} 个收款方名称。",
      sendingSummary_one:
        "正在将 {{count}} 个收款方名称发送给 {{provider}}。金额、日期和备注保留在这台设备上。",
      sendingSummary_other:
        "正在将 {{count}} 个收款方名称发送给 {{provider}}。金额、日期和备注保留在这台设备上。",
    },
    home: {
      platforms: {
        title: "各平台功能",
        intro:
          "你的账本在每台设备上都一样。自动化功能需要桌面应用：手机和浏览器不允许应用运行服务器或与电脑上的其他程序通信，Vaulted Money 尊重这一点。",
        web: "网页",
        phone: "iPhone、iPad、Android",
        desktop: "桌面应用",
        coreGroup: "你的账本：所有设备",
        desktopGroup: "自动化和智能体：桌面应用",
        yes: "可用",
        no: "不可用",
        chromeEdge: "Chrome、Edge",
        rows: {
          ledger: "账户、交易、预算和报表",
          search: "离线自然语言搜索",
          sync: "通过你自己的云文件夹加密同步",
          cloudAi: "使用你自己的云端 AI 密钥进行分类",
          localAi: "在你自己的电脑上运行 AI（LM Studio、Ollama）",
          agents: "连接 AI 智能体（MCP）",
          api: "供脚本使用的本地 API",
        },
      },
    },
  },
  nl: {
    sync: {
      conflict: {
        title: "Wijzigingen op twee apparaten",
        body: "Dit apparaat en een ander apparaat hebben allebei je boeken gewijzigd sinds de laatste synchronisatie. Kies welke kopie je bewaart.",
        keptAside:
          "De andere kopie wordt in je synchronisatiemap bewaard als {{file}}, dus er gaat niets verloren. Je kunt hem later importeren als je hem nodig hebt.",
        useFolder: "Kopie van het andere apparaat gebruiken",
        useDevice: "Kopie van dit apparaat bewaren",
      },
    },
    settings: {
      sync: {
        syncNow: "Nu synchroniseren",
        status: {
          synced: "Laatst gesynchroniseerd: {{date}}, {{time}}.",
          waiting: "Wachten op de eerste synchronisatie.",
          syncing: "Synchroniseren…",
          locked:
            "Het synchronisatiebestand is versleuteld. Voer de wachtzin in die je op je andere apparaat hebt ingesteld.",
          wrongPassphrase:
            "Deze wachtzin opent het synchronisatiebestand niet. Voer de wachtzin in die je op je andere apparaat hebt ingesteld.",
          newerVersion:
            "Het synchronisatiebestand is geschreven door een nieuwere versie van Vaulted Money. Werk deze app bij om te blijven synchroniseren.",
          conflict: "Wachten tot je kiest welke kopie je bewaart.",
          error: "Synchronisatie gestopt: {{message}}",
        },
        guide: {
          step1:
            "Kies op elk apparaat dezelfde map in iCloud Drive, Google Drive, Dropbox of Nextcloud.",
          step2:
            "Stel op elk apparaat dezelfde wachtzin in. Het bestand wordt versleuteld voordat het het apparaat verlaat, dus de clouddienst kan het niet lezen.",
          step3:
            "Wijzigingen worden tijdens het werken in de map opgeslagen en opgehaald wanneer je de app op een ander apparaat opent. Als beide apparaten iets wijzigden, kies jij welke kopie je bewaart.",
        },
        passphrase: {
          on: "Synchronisatiebestand is versleuteld",
          off: "Synchronisatiebestand is niet versleuteld",
          placeholder: "Wachtzin voor synchronisatie",
          changePlaceholder: "Nieuwe wachtzin",
          set: "Synchronisatiebestand versleutelen",
          change: "Wachtzin wijzigen",
          remove: "Stoppen met versleutelen",
          tooShort: "Gebruik minstens {{min}} tekens.",
          hint: "Alleen op dit apparaat bewaard en nooit opgenomen in back-ups. Elk apparaat dat de map gebruikt, heeft dezelfde wachtzin nodig; ben je hem kwijt, kies dan een lege map om opnieuw te beginnen.",
        },
      },
    },
    aiHub: {
      providers: {
        location: {
          cloud: "Cloud: begunstigden verlaten dit apparaat",
          thisComputer: "Lokaal: draait op deze computer",
          homeNetwork: "Lokaal: draait op je thuisnetwerk",
        },
      },
    },
    aiConsent: {
      thisTime_one: "Deze keer: {{count}} begunstigde.",
      thisTime_other: "Deze keer: {{count}} begunstigden.",
      sendingSummary_one:
        "{{count}} naam van een begunstigde wordt naar {{provider}} gestuurd. Bedragen, datums en notities blijven op dit apparaat.",
      sendingSummary_other:
        "{{count}} namen van begunstigden worden naar {{provider}} gestuurd. Bedragen, datums en notities blijven op dit apparaat.",
    },
    home: {
      platforms: {
        title: "Wat werkt waar",
        intro:
          "Je boeken werken op elk apparaat hetzelfde. Automatisering heeft de desktopapp nodig: telefoons en browsers laten een app geen server draaien of met andere programma's op je computer praten, en Vaulted Money respecteert dat.",
        web: "Web",
        phone: "iPhone, iPad, Android",
        desktop: "Desktopapp",
        coreGroup: "Je boeken: elk apparaat",
        desktopGroup: "Automatisering en agents: desktopapp",
        yes: "Beschikbaar",
        no: "Niet beschikbaar",
        chromeEdge: "Chrome, Edge",
        rows: {
          ledger: "Rekeningen, transacties, budgetten en rapporten",
          search: "Zoeken in gewone taal, offline",
          sync: "Versleutelde synchronisatie via je eigen cloudmap",
          cloudAi: "AI-categorieën met je eigen cloud-AI-sleutel",
          localAi: "AI op je eigen computer (LM Studio, Ollama)",
          agents: "Een AI-agent koppelen (MCP)",
          api: "Lokale API voor scripts",
        },
      },
    },
  },
  ta: {
    sync: {
      conflict: {
        title: "இரண்டு சாதனங்களில் மாற்றங்கள்",
        body: "கடைசியாக ஒத்திசைத்த பிறகு இந்தச் சாதனமும் மற்றொரு சாதனமும் உங்கள் கணக்குகளை மாற்றியுள்ளன. எந்த நகலை வைத்திருக்க வேண்டும் என்பதைத் தேர்வுசெய்யவும்.",
        keptAside:
          "மற்ற நகல் உங்கள் ஒத்திசைவுக் கோப்புறையில் {{file}} எனச் சேமிக்கப்படுகிறது, எனவே எதுவும் இழக்கப்படாது. தேவைப்பட்டால் பின்னர் அதை இறக்குமதி செய்யலாம்.",
        useFolder: "மற்ற சாதனத்தின் நகலைப் பயன்படுத்து",
        useDevice: "இந்தச் சாதனத்தின் நகலை வைத்திரு",
      },
    },
    settings: {
      sync: {
        syncNow: "இப்போது ஒத்திசை",
        status: {
          synced: "கடைசியாக ஒத்திசைத்தது: {{date}}, {{time}}.",
          waiting: "முதல் ஒத்திசைவுக்குக் காத்திருக்கிறது.",
          syncing: "ஒத்திசைக்கிறது…",
          locked:
            "ஒத்திசைவுக் கோப்பு மறையாக்கப்பட்டுள்ளது. உங்கள் மற்ற சாதனத்தில் அமைத்த கடவுச்சொற்றொடரை உள்ளிடவும்.",
          wrongPassphrase:
            "இந்தக் கடவுச்சொற்றொடர் ஒத்திசைவுக் கோப்பைத் திறக்கவில்லை. உங்கள் மற்ற சாதனத்தில் அமைத்ததை உள்ளிடவும்.",
          newerVersion:
            "ஒத்திசைவுக் கோப்பு Vaulted Money-இன் புதிய பதிப்பால் எழுதப்பட்டது. ஒத்திசைவைத் தொடர இந்தப் பயன்பாட்டைப் புதுப்பிக்கவும்.",
          conflict: "எந்த நகலை வைத்திருப்பது என்று நீங்கள் தேர்வுசெய்யக் காத்திருக்கிறது.",
          error: "ஒத்திசைவு நின்றது: {{message}}",
        },
        guide: {
          step1:
            "ஒவ்வொரு சாதனத்திலும் iCloud Drive, Google Drive, Dropbox அல்லது Nextcloud-இல் ஒரே கோப்புறையைத் தேர்வுசெய்யவும்.",
          step2:
            "ஒவ்வொரு சாதனத்திலும் ஒரே கடவுச்சொற்றொடரை அமைக்கவும். கோப்பு சாதனத்தை விட்டு வெளியேறும் முன் மறையாக்கப்படுவதால், கிளவுட் சேவையால் அதைப் படிக்க முடியாது.",
          step3:
            "நீங்கள் வேலை செய்யும்போது மாற்றங்கள் கோப்புறையில் சேமிக்கப்பட்டு, மற்றொரு சாதனத்தில் பயன்பாட்டைத் திறக்கும்போது எடுத்துக்கொள்ளப்படும். இரண்டு சாதனங்களும் மாற்றியிருந்தால், எந்த நகலை வைத்திருப்பது என்று நீங்கள் தேர்வுசெய்வீர்கள்.",
        },
        passphrase: {
          on: "ஒத்திசைவுக் கோப்பு மறையாக்கப்பட்டுள்ளது",
          off: "ஒத்திசைவுக் கோப்பு மறையாக்கப்படவில்லை",
          placeholder: "ஒத்திசைவுக் கடவுச்சொற்றொடர்",
          changePlaceholder: "புதிய கடவுச்சொற்றொடர்",
          set: "ஒத்திசைவுக் கோப்பை மறையாக்கு",
          change: "கடவுச்சொற்றொடரை மாற்று",
          remove: "மறையாக்கத்தை நிறுத்து",
          tooShort: "குறைந்தது {{min}} எழுத்துகளைப் பயன்படுத்தவும்.",
          hint: "இந்தச் சாதனத்தில் மட்டுமே வைக்கப்படும், காப்புப்பிரதிகளில் ஒருபோதும் சேர்க்கப்படாது. கோப்புறையைப் பயன்படுத்தும் ஒவ்வொரு சாதனத்துக்கும் அதே கடவுச்சொற்றொடர் தேவை; அது தொலைந்தால், மீண்டும் தொடங்க ஒரு வெற்றுக் கோப்புறையைத் தேர்வுசெய்யவும்.",
        },
      },
    },
    aiHub: {
      providers: {
        location: {
          cloud: "கிளவுட்: பெறுநர் பெயர்கள் இந்தச் சாதனத்தை விட்டு வெளியேறும்",
          thisComputer: "உள்ளூர்: இந்தக் கணினியில் இயங்குகிறது",
          homeNetwork: "உள்ளூர்: உங்கள் வீட்டு நெட்வொர்க்கில் இயங்குகிறது",
        },
      },
    },
    aiConsent: {
      thisTime_one: "இந்த முறை: {{count}} பெறுநர் பெயர்.",
      thisTime_other: "இந்த முறை: {{count}} பெறுநர் பெயர்கள்.",
      sendingSummary_one:
        "{{count}} பெறுநர் பெயர் {{provider}}-க்கு அனுப்பப்படுகிறது. தொகைகள், தேதிகள் மற்றும் குறிப்புகள் இந்தச் சாதனத்திலேயே இருக்கும்.",
      sendingSummary_other:
        "{{count}} பெறுநர் பெயர்கள் {{provider}}-க்கு அனுப்பப்படுகின்றன. தொகைகள், தேதிகள் மற்றும் குறிப்புகள் இந்தச் சாதனத்திலேயே இருக்கும்.",
    },
    home: {
      platforms: {
        title: "எது எங்கே இயங்கும்",
        intro:
          "உங்கள் கணக்குகள் ஒவ்வொரு சாதனத்திலும் ஒரே மாதிரி இயங்கும். தானியக்கத்துக்கு டெஸ்க்டாப் பயன்பாடு தேவை: தொலைபேசிகளும் உலாவிகளும் ஒரு பயன்பாடு சேவையகத்தை இயக்கவோ உங்கள் கணினியில் உள்ள பிற நிரல்களுடன் பேசவோ அனுமதிப்பதில்லை, Vaulted Money அதை மதிக்கிறது.",
        web: "இணையம்",
        phone: "iPhone, iPad, Android",
        desktop: "டெஸ்க்டாப் பயன்பாடு",
        coreGroup: "உங்கள் கணக்குகள்: எல்லாச் சாதனங்களிலும்",
        desktopGroup: "தானியக்கமும் முகவர்களும்: டெஸ்க்டாப் பயன்பாடு",
        yes: "கிடைக்கும்",
        no: "கிடைக்காது",
        chromeEdge: "Chrome, Edge",
        rows: {
          ledger: "கணக்குகள், பரிவர்த்தனைகள், வரவுசெலவுத் திட்டங்கள், அறிக்கைகள்",
          search: "எளிய மொழித் தேடல், ஆஃப்லைனில்",
          sync: "உங்கள் சொந்த கிளவுட் கோப்புறை மூலம் மறையாக்கப்பட்ட ஒத்திசைவு",
          cloudAi: "உங்கள் சொந்த கிளவுட் AI விசையுடன் AI வகைப்படுத்தல்",
          localAi: "உங்கள் சொந்தக் கணினியில் AI (LM Studio, Ollama)",
          agents: "AI முகவரை இணை (MCP)",
          api: "ஸ்கிரிப்ட்களுக்கான உள்ளூர் API",
        },
      },
    },
  },
};
