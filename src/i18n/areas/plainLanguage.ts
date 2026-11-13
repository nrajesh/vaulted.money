import type { AreaTranslations } from "./types";

/**
 * Plain-language copy added in the pre-store polish: placeholders, page
 * subtitles (6-8 words so they fit two lines on a phone), one-line
 * explanations under each Actions menu item, and feature tips. Machine-written
 * for es, zh, nl and ta: ask a native speaker to review.
 */
export const plainLanguage: AreaTranslations = {
  en: {
    dialogs: {
      payee: {
        namePlaceholderAccount: "e.g., Joint Checking, Savings, Visa Card",
        namePlaceholderPayee: "e.g., SuperMart, Salary",
      },
    },
    pages: {
      overview: {
        subtitle: "Where your money stands, and what's next.",
      },
      transactions: {
        subtitle: "Every payment and deposit, easy to search.",
      },
      accounts: {
        subtitle: "Your bank accounts, cards and cash.",
      },
      budgets: {
        subtitle: "Spending limits, and how much is left.",
      },
      calendar: {
        subtitle: "See which days money comes and goes.",
      },
      scheduled: {
        subtitle: "Bills, paydays, and transfers that repeat.",
      },
      insights: {
        subtitle: "Where your money went, versus your budgets.",
      },
      charts: {
        subtitle: "Spending and trends for any period.",
      },
      categories: {
        subtitle: "Groups like Groceries that make spending clear.",
      },
      payees: {
        subtitle: "Who you pay, and who pays you.",
      },
      ai: {
        subtitle: "Optional, and off until you turn it on.",
      },
      yourData: {
        subtitle: "Save, restore, reset, or try demo data.",
      },
      backup: {
        subtitle: "Save a copy of your data locally.",
      },
      currencies: {
        subtitle: "Currencies you use and their exchange rates.",
      },
    },
    pageActions: {
      descriptions: {
        detectTransfers: "Pair money moved between your own accounts",
        cleanupDuplicates: "Find and remove entries entered twice",
        categorizeMissing:
          "Let AI suggest categories (only payee names are sent)",
        importBankCsv: "Add a file exported from your bank",
        exportView: "Save what you see as a CSV file",
        reconcile: "Match the app's balance to your bank's",
        cleanupUnused: "Remove ones no transaction uses",
        dedupe: "Merge entries that are the same thing",
        importList: "Add many at once from a CSV file",
        exportList: "Save this list as a CSV file",
        refresh: "Reload the list",
        smartCreate: "Suggest budgets from your past spending",
        autoSchedule: "Find bills that repeat and add them",
      },
    },
    hints: {
      ledger: {
        title: "What's a ledger?",
        body: "A ledger is a separate set of books, like Home or a side business. Each one has its own accounts, budgets and transactions.",
      },
      reconcile: {
        title: "Balance not matching your bank?",
        body: "Open Actions, then Reconcile Balance, and enter what your bank shows. The app adds one adjustment so the two agree.",
      },
      transfers: {
        title: "Money moved between your accounts",
        body: "Moving money between your own accounts is a transfer, not spending. Actions, then Detect Transfers, pairs them so your totals stay right.",
      },
      scheduled: {
        title: "How upcoming bills work",
        body: "Add a bill, payday or transfer once and say how often it repeats. It then shows on the Calendar and in forecasts. Auto-Schedule can find repeats for you.",
      },
      connectApps: {
        title: "Ask other AI apps about your money",
        body: "In the Mac app you can let Claude, ChatGPT and similar apps read and update your data. It stays off until you switch it on, and what they read goes to that app's maker.",
      },
    },
    help: {
      readMore: "Read more",
      hideTip: "Got it, hide this tip",
      aboutTip: "Tip: {{title}}",
    },
  },
  es: {
    dialogs: {
      payee: {
        namePlaceholderAccount:
          "p. ej., Cuenta conjunta, Ahorros, Tarjeta Visa",
        namePlaceholderPayee: "p. ej., SuperMart, Nómina",
      },
    },
    pages: {
      overview: {
        subtitle: "Cómo está tu dinero y qué viene.",
      },
      transactions: {
        subtitle: "Cada pago e ingreso, fácil de buscar.",
      },
      accounts: {
        subtitle: "Tus cuentas, tarjetas y efectivo.",
      },
      budgets: {
        subtitle: "Límites de gasto y cuánto te queda.",
      },
      calendar: {
        subtitle: "Qué días entra y sale dinero.",
      },
      scheduled: {
        subtitle: "Facturas, nóminas y transferencias que se repiten.",
      },
      insights: {
        subtitle: "Adónde fue tu dinero, frente a tus presupuestos.",
      },
      charts: {
        subtitle: "Gastos y tendencias de cualquier periodo.",
      },
      categories: {
        subtitle: "Grupos como Supermercado que aclaran tus gastos.",
      },
      payees: {
        subtitle: "A quién pagas y quién te paga.",
      },
      ai: {
        subtitle: "Opcional y apagado hasta que lo actives.",
      },
      yourData: {
        subtitle: "Guarda, restaura, reinicia o prueba datos de ejemplo.",
      },
      backup: {
        subtitle: "Guarda una copia de tus datos en local.",
      },
      currencies: {
        subtitle: "Tus monedas y sus tipos de cambio.",
      },
    },
    pageActions: {
      descriptions: {
        detectTransfers: "Empareja dinero movido entre tus cuentas",
        cleanupDuplicates: "Busca y quita entradas repetidas",
        categorizeMissing:
          "La IA sugiere categorías (solo se envían nombres de beneficiarios)",
        importBankCsv: "Añade un archivo exportado de tu banco",
        exportView: "Guarda lo que ves como archivo CSV",
        reconcile: "Iguala el saldo de la app al de tu banco",
        cleanupUnused: "Quita los que ninguna transacción usa",
        dedupe: "Une entradas que son lo mismo",
        importList: "Añade muchos a la vez desde un CSV",
        exportList: "Guarda esta lista como CSV",
        refresh: "Vuelve a cargar la lista",
        smartCreate: "Sugiere presupuestos según tus gastos",
        autoSchedule: "Busca facturas que se repiten y las añade",
      },
    },
    hints: {
      ledger: {
        title: "¿Qué es un libro?",
        body: "Un libro es un conjunto de cuentas aparte, como Casa o un negocio. Cada uno tiene sus propias cuentas, presupuestos y transacciones.",
      },
      reconcile: {
        title: "¿El saldo no coincide con tu banco?",
        body: "Abre Acciones, luego Conciliar saldo, e introduce lo que muestra tu banco. La app añade un ajuste para que coincidan.",
      },
      transfers: {
        title: "Dinero entre tus cuentas",
        body: "Mover dinero entre tus propias cuentas es una transferencia, no un gasto. Acciones y luego Detectar transferencias las empareja para que tus totales sean correctos.",
      },
      scheduled: {
        title: "Cómo funcionan los próximos pagos",
        body: "Añade una factura, nómina o transferencia una vez e indica cada cuánto se repite. Aparecerá en el Calendario y en las previsiones. Auto-programar puede encontrar repeticiones por ti.",
      },
      connectApps: {
        title: "Pregunta a otras apps de IA por tu dinero",
        body: "En la app para Mac puedes dejar que Claude, ChatGPT y apps similares lean y actualicen tus datos. Está apagado hasta que lo actives, y lo que leen se envía a quien creó esa app.",
      },
    },
    help: {
      readMore: "Leer más",
      hideTip: "Entendido, ocultar",
      aboutTip: "Consejo: {{title}}",
    },
  },
  zh: {
    dialogs: {
      payee: {
        namePlaceholderAccount: "例如：联名支票账户、储蓄、Visa 卡",
        namePlaceholderPayee: "例如：SuperMart、工资",
      },
    },
    pages: {
      overview: {
        subtitle: "你的资金现状和接下来的安排。",
      },
      transactions: {
        subtitle: "每笔付款和存款，一搜即得。",
      },
      accounts: {
        subtitle: "你的银行账户、卡和现金。",
      },
      budgets: {
        subtitle: "支出上限，以及还剩多少。",
      },
      calendar: {
        subtitle: "查看哪些日子有进账和支出。",
      },
      scheduled: {
        subtitle: "重复的账单、发薪日和转账。",
      },
      insights: {
        subtitle: "钱花在哪里，与预算相比如何。",
      },
      charts: {
        subtitle: "任意时段的支出和趋势。",
      },
      categories: {
        subtitle: "像“日用品”这样的分组，让支出一目了然。",
      },
      payees: {
        subtitle: "你付款给谁，谁付款给你。",
      },
      ai: {
        subtitle: "可选功能，开启前不会运行。",
      },
      yourData: {
        subtitle: "保存、恢复、重置或试用示例数据。",
      },
      backup: {
        subtitle: "在本地保存一份数据副本。",
      },
      currencies: {
        subtitle: "你使用的货币及其汇率。",
      },
    },
    pageActions: {
      descriptions: {
        detectTransfers: "配对你自己账户之间的转账",
        cleanupDuplicates: "查找并删除重复录入的条目",
        categorizeMissing: "让 AI 建议类别（只发送收款方名称）",
        importBankCsv: "添加从银行导出的文件",
        exportView: "将当前视图保存为 CSV 文件",
        reconcile: "让应用余额与银行余额一致",
        cleanupUnused: "删除没有交易使用的项目",
        dedupe: "合并实际相同的条目",
        importList: "从 CSV 文件批量添加",
        exportList: "将此列表保存为 CSV 文件",
        refresh: "重新加载列表",
        smartCreate: "根据过去的支出建议预算",
        autoSchedule: "查找重复的账单并添加",
      },
    },
    hints: {
      ledger: {
        title: "什么是账本？",
        body: "账本是一套独立的账目，例如“家庭”或副业。每个账本都有自己的账户、预算和交易。",
      },
      reconcile: {
        title: "余额和银行对不上？",
        body: "打开“操作”，选择“对账”，输入银行显示的余额。应用会添加一笔调整，使两者一致。",
      },
      transfers: {
        title: "在自己账户之间转钱",
        body: "在自己账户之间转钱是转账，不是支出。“操作”中的“检测转账”会将它们配对，让总额保持正确。",
      },
      scheduled: {
        title: "即将到期的账单如何运作",
        body: "只需添加一次账单、发薪日或转账，并设置重复频率。之后它会显示在日历和预测中。“自动安排”可以帮你找出重复项。",
      },
      connectApps: {
        title: "向其他 AI 应用询问你的财务",
        body: "在 Mac 应用中，你可以让 Claude、ChatGPT 等应用读取和更新你的数据。开启前一直关闭，它们读取的内容会发送给该应用的开发方。",
      },
    },
    help: {
      readMore: "了解更多",
      hideTip: "知道了，隐藏此提示",
      aboutTip: "提示：{{title}}",
    },
  },
  nl: {
    dialogs: {
      payee: {
        namePlaceholderAccount:
          "bijv. Gezamenlijke rekening, Spaarrekening, Visa-kaart",
        namePlaceholderPayee: "bijv. SuperMart, Salaris",
      },
    },
    pages: {
      overview: {
        subtitle: "Hoe je geld ervoor staat en wat komt.",
      },
      transactions: {
        subtitle: "Elke betaling en storting, snel te vinden.",
      },
      accounts: {
        subtitle: "Je bankrekeningen, kaarten en contant geld.",
      },
      budgets: {
        subtitle: "Bestedingslimieten en wat er nog over is.",
      },
      calendar: {
        subtitle: "Zie op welke dagen geld komt en gaat.",
      },
      scheduled: {
        subtitle: "Terugkerende rekeningen, salarissen en overboekingen.",
      },
      insights: {
        subtitle: "Waar je geld heen ging, naast je budgetten.",
      },
      charts: {
        subtitle: "Uitgaven en trends voor elke periode.",
      },
      categories: {
        subtitle: "Groepen zoals Boodschappen die uitgaven duidelijk maken.",
      },
      payees: {
        subtitle: "Wie jij betaalt en wie jou betaalt.",
      },
      ai: {
        subtitle: "Optioneel, en uit tot je het aanzet.",
      },
      yourData: {
        subtitle: "Opslaan, herstellen, resetten of demogegevens proberen.",
      },
      backup: {
        subtitle: "Bewaar lokaal een kopie van je gegevens.",
      },
      currencies: {
        subtitle: "Je valuta en hun wisselkoersen.",
      },
    },
    pageActions: {
      descriptions: {
        detectTransfers: "Koppel geld tussen je eigen rekeningen",
        cleanupDuplicates: "Vind en verwijder dubbel ingevoerde regels",
        categorizeMissing:
          "Laat AI categorieën voorstellen (alleen namen van begunstigden)",
        importBankCsv: "Voeg een bestand van je bank toe",
        exportView: "Bewaar wat je ziet als CSV-bestand",
        reconcile: "Laat het saldo gelijk zijn aan dat van je bank",
        cleanupUnused: "Verwijder wat geen transactie gebruikt",
        dedupe: "Voeg dubbele vermeldingen samen",
        importList: "Voeg er veel tegelijk toe uit een CSV",
        exportList: "Bewaar deze lijst als CSV-bestand",
        refresh: "Laad de lijst opnieuw",
        smartCreate: "Stel budgetten voor op basis van eerdere uitgaven",
        autoSchedule: "Vind terugkerende rekeningen en voeg ze toe",
      },
    },
    hints: {
      ledger: {
        title: "Wat is een grootboek?",
        body: "Een grootboek is een aparte boekhouding, zoals Thuis of een bijbaan. Elk heeft eigen rekeningen, budgetten en transacties.",
      },
      reconcile: {
        title: "Saldo klopt niet met je bank?",
        body: "Open Acties, dan Saldo afstemmen, en vul in wat je bank toont. De app voegt één correctie toe zodat ze kloppen.",
      },
      transfers: {
        title: "Geld tussen je eigen rekeningen",
        body: "Geld tussen je eigen rekeningen is een overboeking, geen uitgave. Acties, dan Overschrijvingen detecteren, koppelt ze zodat je totalen kloppen.",
      },
      scheduled: {
        title: "Zo werken komende rekeningen",
        body: "Voeg een rekening, salaris of overboeking één keer toe en geef aan hoe vaak die terugkomt. Die verschijnt dan in de Kalender en prognoses. Automatisch plannen kan herhalingen voor je vinden.",
      },
      connectApps: {
        title: "Vraag andere AI-apps naar je geld",
        body: "In de Mac-app kun je Claude, ChatGPT en vergelijkbare apps je gegevens laten lezen en bijwerken. Het staat uit tot je het aanzet, en wat ze lezen gaat naar de maker van die app.",
      },
    },
    help: {
      readMore: "Meer lezen",
      hideTip: "Begrepen, verberg tip",
      aboutTip: "Tip: {{title}}",
    },
  },
  ta: {
    dialogs: {
      payee: {
        namePlaceholderAccount: "எ.கா., கூட்டுக் கணக்கு, சேமிப்பு, Visa அட்டை",
        namePlaceholderPayee: "எ.கா., SuperMart, சம்பளம்",
      },
    },
    pages: {
      overview: {
        subtitle: "உங்கள் பணநிலை, அடுத்து வருவது.",
      },
      transactions: {
        subtitle: "ஒவ்வொரு செலவும் வரவும், எளிதில் தேடலாம்.",
      },
      accounts: {
        subtitle: "உங்கள் வங்கிக் கணக்குகள், அட்டைகள், ரொக்கம்.",
      },
      budgets: {
        subtitle: "செலவு வரம்புகள், மீதம் எவ்வளவு.",
      },
      calendar: {
        subtitle: "எந்த நாளில் பணம் வருகிறது, போகிறது.",
      },
      scheduled: {
        subtitle: "மீண்டும் வரும் கட்டணங்கள், சம்பளம், பரிமாற்றங்கள்.",
      },
      insights: {
        subtitle: "பணம் எங்கே போனது, பட்ஜெட்டுடன் ஒப்பீடு.",
      },
      charts: {
        subtitle: "எந்தக் காலத்துக்கும் செலவும் போக்கும்.",
      },
      categories: {
        subtitle: "மளிகை போன்ற குழுக்கள் செலவைத் தெளிவாக்கும்.",
      },
      payees: {
        subtitle: "நீங்கள் யாருக்குச் செலுத்துகிறீர்கள், யார் உங்களுக்கு.",
      },
      ai: {
        subtitle: "விருப்பமானது; நீங்கள் இயக்கும் வரை அணைந்திருக்கும்.",
      },
      yourData: {
        subtitle: "சேமி, மீட்டமை, அழி, அல்லது மாதிரித் தரவு.",
      },
      backup: {
        subtitle: "உங்கள் தரவின் நகலை உள்ளூரில் சேமிக்கவும்.",
      },
      currencies: {
        subtitle: "நீங்கள் பயன்படுத்தும் நாணயங்கள், மாற்று விகிதங்கள்.",
      },
    },
    pageActions: {
      descriptions: {
        detectTransfers: "உங்கள் கணக்குகளுக்கு இடையிலான பணத்தை இணைக்கவும்",
        cleanupDuplicates: "இருமுறை பதிந்தவற்றைக் கண்டு நீக்கவும்",
        categorizeMissing:
          "AI வகைகளைப் பரிந்துரைக்கும் (பெறுநர் பெயர்கள் மட்டும்)",
        importBankCsv: "உங்கள் வங்கியிலிருந்து எடுத்த கோப்பைச் சேர்க்கவும்",
        exportView: "காண்பதை CSV கோப்பாகச் சேமிக்கவும்",
        reconcile: "பயன்பாட்டு இருப்பை வங்கியுடன் பொருத்தவும்",
        cleanupUnused: "எந்தப் பரிவர்த்தனையும் பயன்படுத்தாதவற்றை நீக்கவும்",
        dedupe: "ஒரே பொருளான பதிவுகளை இணைக்கவும்",
        importList: "CSV கோப்பிலிருந்து பலவற்றை ஒரே முறை சேர்க்கவும்",
        exportList: "இந்தப் பட்டியலை CSV ஆகச் சேமிக்கவும்",
        refresh: "பட்டியலை மீண்டும் ஏற்றவும்",
        smartCreate: "கடந்த செலவிலிருந்து பட்ஜெட்டுகளைப் பரிந்துரைக்கும்",
        autoSchedule: "மீண்டும் வரும் கட்டணங்களைக் கண்டு சேர்க்கும்",
      },
    },
    hints: {
      ledger: {
        title: "பேரேடு என்றால் என்ன?",
        body: "பேரேடு என்பது வீடு அல்லது பக்கத் தொழில் போன்ற தனிக் கணக்குப் புத்தகம். ஒவ்வொன்றுக்கும் தனிக் கணக்குகள், பட்ஜெட்டுகள், பரிவர்த்தனைகள் உண்டு.",
      },
      reconcile: {
        title: "இருப்பு வங்கியுடன் பொருந்தவில்லையா?",
        body: "செயல்கள், பின் இருப்பைச் சரிபார் என்பதைத் திறந்து வங்கி காட்டும் தொகையை உள்ளிடவும். இரண்டும் பொருந்த ஒரு சரிசெய்தல் சேர்க்கப்படும்.",
      },
      transfers: {
        title: "உங்கள் கணக்குகளுக்கு இடையிலான பணம்",
        body: "உங்கள் கணக்குகளுக்கு இடையே பணம் மாற்றுவது செலவு அல்ல, பரிமாற்றம். செயல்கள், பின் பரிமாற்றங்களை கண்டறி, அவற்றை இணைத்து மொத்தத்தைச் சரியாக வைக்கும்.",
      },
      scheduled: {
        title: "வரவிருக்கும் கட்டணங்கள் எப்படி வேலை செய்கின்றன",
        body: "ஒரு கட்டணம், சம்பளம் அல்லது பரிமாற்றத்தை ஒருமுறை சேர்த்து எத்தனை முறை மீண்டும் வரும் என்று கூறவும். அது நாள்காட்டியிலும் முன்கணிப்பிலும் தெரியும். தானாக திட்டமிடு மீண்டும் வருபவற்றைக் கண்டறியும்.",
      },
      connectApps: {
        title: "பிற AI பயன்பாடுகளிடம் உங்கள் பணம் பற்றிக் கேளுங்கள்",
        body: "Mac பயன்பாட்டில் Claude, ChatGPT போன்றவை உங்கள் தரவைப் படிக்கவும் புதுப்பிக்கவும் அனுமதிக்கலாம். நீங்கள் இயக்கும் வரை அணைந்திருக்கும்; அவை படிப்பது அந்தப் பயன்பாட்டை உருவாக்கியவருக்குச் செல்லும்.",
      },
    },
    help: {
      readMore: "மேலும் படிக்க",
      hideTip: "புரிந்தது, மறை",
      aboutTip: "குறிப்பு: {{title}}",
    },
  },
};
