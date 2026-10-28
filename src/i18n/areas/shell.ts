import type { AreaTranslations } from "./types";

/**
 * Keys that code referenced with a default value but no bundle defined, so every language showed English. Machine-written: ask a native speaker to review.
 */
export const shell: AreaTranslations = {
  en: {
    home: {
      actions: {
        home: "Home",
      },
    },
    layout: {
      toggleTheme: "Toggle theme",
      addTransaction: "Add Transaction",
      nav: {
        primary: "Primary",
        more: "More",
      },
      footer: {
        forYourFinancial: "For your financial ",
      },
    },
    dialogs: {
      addEditTransaction: {
        fields: {
          mobileAccount: "Account",
          mobilePayeeAccount: "Payee or Account",
          mobilePayee: "Payee",
          mobileAmount: "Amount",
          mobileReceivingAmount: "Receiving",
          mobileNotes: "Notes",
          mobileRepeat: "Repeat",
          mobileRecurrenceEnds: "Ends",
        },
      },
    },
    settings: {
      api: {
        title: "Local API",
        outdatedDesktop:
          "This desktop build does not include the Local API. Update or rebuild the desktop app to use it.",
        desktopOnly:
          "The Local API is available in the desktop app only. The web and mobile apps cannot host a local server.",
        tokenRegenerated:
          "New token generated. Update any client using the old one.",
        description:
          "Let scripts and tools on this computer manage your data over HTTP. Nothing leaves your device: the API only listens on 127.0.0.1.",
        enable: "Enable local API",
        started: "API enabled",
        stopped: "API disabled",
        port: "Port",
        portChanged: "Port updated",
        baseUrl: "Base URL",
        copyUrl: "Copy base URL",
        token: "Access token",
        showToken: "Show or hide token",
        copyToken: "Copy token",
        regenerate: "Generate new token",
        usageTitle: "Try it",
      },
    },
    common: {
      save: "Save",
    },
    management: {
      manageYour: "Manage Your {{name}}",
    },
  },
  es: {
    home: {
      actions: {
        home: "Inicio",
      },
    },
    layout: {
      toggleTheme: "Cambiar tema",
      addTransaction: "Añadir transacción",
      nav: {
        primary: "Principal",
        more: "Más",
      },
      footer: {
        forYourFinancial: "Para tu libertad ",
      },
    },
    dialogs: {
      addEditTransaction: {
        fields: {
          mobileAccount: "Cuenta",
          mobilePayeeAccount: "Beneficiario o cuenta",
          mobilePayee: "Beneficiario",
          mobileAmount: "Importe",
          mobileReceivingAmount: "Recibe",
          mobileNotes: "Notas",
          mobileRepeat: "Repetir",
          mobileRecurrenceEnds: "Termina",
        },
      },
    },
    settings: {
      api: {
        title: "API local",
        outdatedDesktop:
          "Esta versión de escritorio no incluye la API local. Actualiza o recompila la aplicación de escritorio para usarla.",
        desktopOnly:
          "La API local solo está disponible en la aplicación de escritorio. Las apps web y móviles no pueden alojar un servidor local.",
        tokenRegenerated:
          "Se generó un token nuevo. Actualiza cualquier cliente que use el anterior.",
        description:
          "Permite que scripts y herramientas de este equipo gestionen tus datos por HTTP. Nada sale de tu dispositivo: la API solo escucha en 127.0.0.1.",
        enable: "Activar API local",
        started: "API activada",
        stopped: "API desactivada",
        port: "Puerto",
        portChanged: "Puerto actualizado",
        baseUrl: "URL base",
        copyUrl: "Copiar URL base",
        token: "Token de acceso",
        showToken: "Mostrar u ocultar token",
        copyToken: "Copiar token",
        regenerate: "Generar token nuevo",
        usageTitle: "Pruébalo",
      },
    },
    common: {
      save: "Guardar",
    },
    management: {
      manageYour: "Gestionar {{name}}",
    },
  },
  zh: {
    home: {
      actions: {
        home: "首页",
      },
    },
    layout: {
      toggleTheme: "切换主题",
      addTransaction: "添加交易",
      nav: {
        primary: "主导航",
        more: "更多",
      },
      footer: {
        forYourFinancial: "助你实现财务 ",
      },
    },
    dialogs: {
      addEditTransaction: {
        fields: {
          mobileAccount: "账户",
          mobilePayeeAccount: "收款方或账户",
          mobilePayee: "收款方",
          mobileAmount: "金额",
          mobileReceivingAmount: "转入",
          mobileNotes: "备注",
          mobileRepeat: "重复",
          mobileRecurrenceEnds: "结束",
        },
      },
    },
    settings: {
      api: {
        title: "本地 API",
        outdatedDesktop:
          "此桌面版本不包含本地 API。请更新或重新构建桌面应用以使用它。",
        desktopOnly:
          "本地 API 仅在桌面应用中可用。网页版和移动版应用无法托管本地服务器。",
        tokenRegenerated: "已生成新令牌。请更新所有使用旧令牌的客户端。",
        description:
          "允许此电脑上的脚本和工具通过 HTTP 管理您的数据。数据不会离开您的设备：该 API 仅监听 127.0.0.1。",
        enable: "启用本地 API",
        started: "API 已启用",
        stopped: "API 已停用",
        port: "端口",
        portChanged: "端口已更新",
        baseUrl: "基础 URL",
        copyUrl: "复制基础 URL",
        token: "访问令牌",
        showToken: "显示或隐藏令牌",
        copyToken: "复制令牌",
        regenerate: "生成新令牌",
        usageTitle: "试一试",
      },
    },
    common: {
      save: "保存",
    },
    management: {
      manageYour: "管理{{name}}",
    },
  },
  nl: {
    home: {
      actions: {
        home: "Home",
      },
    },
    layout: {
      toggleTheme: "Thema wisselen",
      addTransaction: "Transactie toevoegen",
      nav: {
        primary: "Hoofdnavigatie",
        more: "Meer",
      },
      footer: {
        forYourFinancial: "Voor jouw financiële ",
      },
    },
    dialogs: {
      addEditTransaction: {
        fields: {
          mobileAccount: "Rekening",
          mobilePayeeAccount: "Begunstigde of rekening",
          mobilePayee: "Begunstigde",
          mobileAmount: "Bedrag",
          mobileReceivingAmount: "Ontvangt",
          mobileNotes: "Notities",
          mobileRepeat: "Herhalen",
          mobileRecurrenceEnds: "Eindigt",
        },
      },
    },
    settings: {
      api: {
        title: "Lokale API",
        outdatedDesktop:
          "Deze desktopversie bevat de lokale API niet. Werk de desktop-app bij of bouw hem opnieuw om hem te gebruiken.",
        desktopOnly:
          "De lokale API is alleen beschikbaar in de desktop-app. De web- en mobiele apps kunnen geen lokale server hosten.",
        tokenRegenerated:
          "Nieuw token gegenereerd. Werk elke client bij die het oude gebruikt.",
        description:
          "Laat scripts en tools op deze computer je gegevens beheren via HTTP. Er verlaat niets je apparaat: de API luistert alleen op 127.0.0.1.",
        enable: "Lokale API inschakelen",
        started: "API ingeschakeld",
        stopped: "API uitgeschakeld",
        port: "Poort",
        portChanged: "Poort bijgewerkt",
        baseUrl: "Basis-URL",
        copyUrl: "Basis-URL kopiëren",
        token: "Toegangstoken",
        showToken: "Token tonen of verbergen",
        copyToken: "Token kopiëren",
        regenerate: "Nieuw token genereren",
        usageTitle: "Probeer het",
      },
    },
    common: {
      save: "Opslaan",
    },
    management: {
      manageYour: "{{name}} beheren",
    },
  },
  ta: {
    home: {
      actions: {
        home: "முகப்பு",
      },
    },
    layout: {
      toggleTheme: "தீமை மாற்று",
      addTransaction: "பரிவர்த்தனை சேர்க்கவும்",
      nav: {
        primary: "முதன்மை",
        more: "மேலும்",
      },
      footer: {
        forYourFinancial: "உங்கள் ",
      },
    },
    dialogs: {
      addEditTransaction: {
        fields: {
          mobileAccount: "கணக்கு",
          mobilePayeeAccount: "பெறுநர் அல்லது கணக்கு",
          mobilePayee: "பெறுநர்",
          mobileAmount: "தொகை",
          mobileReceivingAmount: "பெறுவது",
          mobileNotes: "குறிப்புகள்",
          mobileRepeat: "மீண்டும்",
          mobileRecurrenceEnds: "முடிவு",
        },
      },
    },
    settings: {
      api: {
        title: "உள்ளூர் API",
        outdatedDesktop:
          "இந்த டெஸ்க்டாப் பதிப்பில் உள்ளூர் API இல்லை. அதைப் பயன்படுத்த டெஸ்க்டாப் பயன்பாட்டைப் புதுப்பிக்கவும் அல்லது மீண்டும் உருவாக்கவும்.",
        desktopOnly:
          "உள்ளூர் API டெஸ்க்டாப் பயன்பாட்டில் மட்டுமே கிடைக்கும். வலை மற்றும் மொபைல் பயன்பாடுகள் உள்ளூர் சேவையகத்தை இயக்க முடியாது.",
        tokenRegenerated:
          "புதிய டோக்கன் உருவாக்கப்பட்டது. பழையதைப் பயன்படுத்தும் கிளையன்ட்களைப் புதுப்பிக்கவும்.",
        description:
          "இந்தக் கணினியில் உள்ள ஸ்கிரிப்ட்களும் கருவிகளும் HTTP வழியாக உங்கள் தரவை நிர்வகிக்க அனுமதிக்கவும். எதுவும் உங்கள் சாதனத்தை விட்டு வெளியேறாது: API 127.0.0.1 இல் மட்டுமே கேட்கும்.",
        enable: "உள்ளூர் API ஐ இயக்கு",
        started: "API இயக்கப்பட்டது",
        stopped: "API முடக்கப்பட்டது",
        port: "போர்ட்",
        portChanged: "போர்ட் புதுப்பிக்கப்பட்டது",
        baseUrl: "அடிப்படை URL",
        copyUrl: "அடிப்படை URL ஐ நகலெடு",
        token: "அணுகல் டோக்கன்",
        showToken: "டோக்கனைக் காட்டு அல்லது மறை",
        copyToken: "டோக்கனை நகலெடு",
        regenerate: "புதிய டோக்கனை உருவாக்கு",
        usageTitle: "முயற்சித்துப் பார்",
      },
    },
    common: {
      save: "சேமி",
    },
    management: {
      manageYour: "{{name}} நிர்வகி",
    },
  },
};
