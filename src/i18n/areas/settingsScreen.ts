import type { AreaTranslations } from "./types";

/**
 * The Settings screen beyond the cards that were translated earlier. Machine-written: ask a native speaker to review.
 */
export const settingsScreen: AreaTranslations = {
  en: {
    settings: {
      page: {
        title: "Ledger",
        subtitle: "Manage application preferences and data",
        currencySet: "Default currency set to {{currency}}.",
        futureMonthsLabel: "Future transaction months",
        futureMonthsSet: "Future transaction view set to {{months}} months.",
      },
      ai: {
        title: "AI Integrations (BYOK)",
        description:
          "Manage your AI model providers. Keys are stored locally in your browser.",
        privacy: "Review privacy policy →",
        manageProviders: "Manage Providers",
        manageProvidersLink: "Manage Providers →",
        defaultProvider: "Default AI Provider",
        selectProvider: "Select an AI Provider",
        none: "None (Disabled)",
        noModel: "None",
        noModelParen: "(None)",
        apiKeyFor: "API Key for {{name}}",
        apiKeyPlaceholder: "Enter your {{name}} API key",
        keySaved: "API Key saved locally.",
        getKey: "Get your key:",
        model: "Model",
        endpoint: "Endpoint",
        selectHint:
          "Select a provider from the list or add a custom one in the management module to enable AI-powered features.",
        preferenceUpdated: "AI Provider preference updated.",
      },
      sync: {
        title: "Cross-Device Continuity",
        description:
          "Keep your data in sync across devices by choosing a shared location.",
        toggle: "Automatically sync across devices",
        recommendationTitle: "Recommendation",
        recommendation:
          "To ensure seamless continuity, select a folder synced by a cloud provider like iCloud, Google Drive, or Dropbox. Any local folder works, but won't sync automatically to other devices.",
        location: "Sync Location",
        selectFolder: "Select Folder",
        folderUpdated: "Sync folder location updated.",
        grantAccess: "Grant Access",
        accessRestored: "Access restored to sync folder.",
      },
      about: {
        title: "About",
        licenses: "Open Source Licenses",
        support: "Support Development",
      },
    },
  },
  es: {
    settings: {
      page: {
        title: "Libro",
        subtitle: "Gestiona las preferencias y los datos de la aplicación",
        currencySet: "Moneda predeterminada establecida en {{currency}}.",
        futureMonthsLabel: "Meses de transacciones futuras",
        futureMonthsSet:
          "La vista de transacciones futuras se estableció en {{months}} meses.",
      },
      ai: {
        title: "Integraciones de IA (BYOK)",
        description:
          "Gestiona tus proveedores de modelos de IA. Las claves se guardan localmente en tu navegador.",
        privacy: "Revisar la política de privacidad →",
        manageProviders: "Gestionar proveedores",
        manageProvidersLink: "Gestionar proveedores →",
        defaultProvider: "Proveedor de IA predeterminado",
        selectProvider: "Selecciona un proveedor de IA",
        none: "Ninguno (desactivado)",
        noModel: "Ninguno",
        noModelParen: "(Ninguno)",
        apiKeyFor: "Clave de API de {{name}}",
        apiKeyPlaceholder: "Introduce tu clave de API de {{name}}",
        keySaved: "Clave de API guardada localmente.",
        getKey: "Obtén tu clave:",
        model: "Modelo",
        endpoint: "Punto de conexión",
        selectHint:
          "Selecciona un proveedor de la lista o añade uno personalizado en el módulo de gestión para activar las funciones con IA.",
        preferenceUpdated: "Preferencia de proveedor de IA actualizada.",
      },
      sync: {
        title: "Continuidad entre dispositivos",
        description:
          "Mantén tus datos sincronizados entre dispositivos eligiendo una ubicación compartida.",
        toggle: "Sincronizar automáticamente entre dispositivos",
        recommendationTitle: "Recomendación",
        recommendation:
          "Para una continuidad fluida, elige una carpeta sincronizada por un proveedor en la nube como iCloud, Google Drive o Dropbox. Cualquier carpeta local sirve, pero no se sincronizará automáticamente con otros dispositivos.",
        location: "Ubicación de sincronización",
        selectFolder: "Seleccionar carpeta",
        folderUpdated: "Ubicación de la carpeta de sincronización actualizada.",
        grantAccess: "Conceder acceso",
        accessRestored: "Acceso a la carpeta de sincronización restaurado.",
      },
      about: {
        title: "Acerca de",
        licenses: "Licencias de código abierto",
        support: "Apoyar el desarrollo",
      },
    },
  },
  zh: {
    settings: {
      page: {
        title: "账本",
        subtitle: "管理应用偏好设置和数据",
        currencySet: "默认货币已设为 {{currency}}。",
        futureMonthsLabel: "未来交易月数",
        futureMonthsSet: "未来交易视图已设为 {{months}} 个月。",
      },
      ai: {
        title: "AI 集成（自带密钥）",
        description: "管理您的 AI 模型提供商。密钥仅保存在您浏览器的本地。",
        privacy: "查看隐私政策 →",
        manageProviders: "管理提供商",
        manageProvidersLink: "管理提供商 →",
        defaultProvider: "默认 AI 提供商",
        selectProvider: "选择 AI 提供商",
        none: "无（已禁用）",
        noModel: "无",
        noModelParen: "（无）",
        apiKeyFor: "{{name}} 的 API 密钥",
        apiKeyPlaceholder: "输入您的 {{name}} API 密钥",
        keySaved: "API 密钥已保存在本地。",
        getKey: "获取密钥：",
        model: "模型",
        endpoint: "接口地址",
        selectHint:
          "请从列表中选择提供商，或在管理模块中添加自定义提供商，以启用 AI 功能。",
        preferenceUpdated: "AI 提供商偏好已更新。",
      },
      sync: {
        title: "跨设备同步",
        description: "选择一个共享位置，让您的数据在各设备间保持同步。",
        toggle: "在设备间自动同步",
        recommendationTitle: "建议",
        recommendation:
          "为确保无缝衔接，请选择由 iCloud、Google Drive 或 Dropbox 等云服务同步的文件夹。任何本地文件夹也可使用，但不会自动同步到其他设备。",
        location: "同步位置",
        selectFolder: "选择文件夹",
        folderUpdated: "同步文件夹位置已更新。",
        grantAccess: "授予访问权限",
        accessRestored: "已恢复对同步文件夹的访问。",
      },
      about: {
        title: "关于",
        licenses: "开源许可证",
        support: "支持开发",
      },
    },
  },
  nl: {
    settings: {
      page: {
        title: "Grootboek",
        subtitle: "Beheer de voorkeuren en gegevens van de app",
        currencySet: "Standaardvaluta ingesteld op {{currency}}.",
        futureMonthsLabel: "Maanden toekomstige transacties",
        futureMonthsSet:
          "Weergave van toekomstige transacties ingesteld op {{months}} maanden.",
      },
      ai: {
        title: "AI-integraties (BYOK)",
        description:
          "Beheer je AI-modelaanbieders. Sleutels worden lokaal in je browser opgeslagen.",
        privacy: "Privacybeleid bekijken →",
        manageProviders: "Aanbieders beheren",
        manageProvidersLink: "Aanbieders beheren →",
        defaultProvider: "Standaard AI-aanbieder",
        selectProvider: "Kies een AI-aanbieder",
        none: "Geen (uitgeschakeld)",
        noModel: "Geen",
        noModelParen: "(Geen)",
        apiKeyFor: "API-sleutel voor {{name}}",
        apiKeyPlaceholder: "Voer je {{name}} API-sleutel in",
        keySaved: "API-sleutel lokaal opgeslagen.",
        getKey: "Haal je sleutel op:",
        model: "Model",
        endpoint: "Eindpunt",
        selectHint:
          "Kies een aanbieder uit de lijst of voeg er een eigen toe in de beheermodule om AI-functies in te schakelen.",
        preferenceUpdated: "Voorkeur voor AI-aanbieder bijgewerkt.",
      },
      sync: {
        title: "Continuïteit tussen apparaten",
        description:
          "Houd je gegevens synchroon tussen apparaten door een gedeelde locatie te kiezen.",
        toggle: "Automatisch synchroniseren tussen apparaten",
        recommendationTitle: "Aanbeveling",
        recommendation:
          "Kies voor een naadloze continuïteit een map die door een cloudaanbieder zoals iCloud, Google Drive of Dropbox wordt gesynchroniseerd. Elke lokale map werkt, maar wordt niet automatisch met andere apparaten gesynchroniseerd.",
        location: "Synchronisatielocatie",
        selectFolder: "Map kiezen",
        folderUpdated: "Locatie van de synchronisatiemap bijgewerkt.",
        grantAccess: "Toegang verlenen",
        accessRestored: "Toegang tot de synchronisatiemap hersteld.",
      },
      about: {
        title: "Over",
        licenses: "Open-sourcelicenties",
        support: "Ontwikkeling steunen",
      },
    },
  },
  ta: {
    settings: {
      page: {
        title: "பேரேடு",
        subtitle: "பயன்பாட்டின் விருப்பங்களையும் தரவையும் நிர்வகிக்கவும்",
        currencySet: "இயல்புநிலை நாணயம் {{currency}} ஆக அமைக்கப்பட்டது.",
        futureMonthsLabel: "எதிர்கால பரிவர்த்தனை மாதங்கள்",
        futureMonthsSet:
          "எதிர்கால பரிவர்த்தனைக் காட்சி {{months}} மாதங்களாக அமைக்கப்பட்டது.",
      },
      ai: {
        title: "AI ஒருங்கிணைப்புகள் (BYOK)",
        description:
          "உங்கள் AI மாதிரி வழங்குநர்களை நிர்வகிக்கவும். விசைகள் உங்கள் உலாவியில் உள்ளூரிலேயே சேமிக்கப்படும்.",
        privacy: "தனியுரிமைக் கொள்கையைப் பார் →",
        manageProviders: "வழங்குநர்களை நிர்வகி",
        manageProvidersLink: "வழங்குநர்களை நிர்வகி →",
        defaultProvider: "இயல்புநிலை AI வழங்குநர்",
        selectProvider: "AI வழங்குநரைத் தேர்ந்தெடு",
        none: "எதுவுமில்லை (முடக்கப்பட்டது)",
        noModel: "எதுவுமில்லை",
        noModelParen: "(எதுவுமில்லை)",
        apiKeyFor: "{{name}} க்கான API விசை",
        apiKeyPlaceholder: "உங்கள் {{name}} API விசையை உள்ளிடவும்",
        keySaved: "API விசை உள்ளூரில் சேமிக்கப்பட்டது.",
        getKey: "உங்கள் விசையைப் பெறுங்கள்:",
        model: "மாதிரி",
        endpoint: "முனையம்",
        selectHint:
          "AI அம்சங்களை இயக்க, பட்டியலிலிருந்து ஒரு வழங்குநரைத் தேர்ந்தெடுக்கவும் அல்லது மேலாண்மைப் பகுதியில் தனிப்பயன் ஒன்றைச் சேர்க்கவும்.",
        preferenceUpdated: "AI வழங்குநர் விருப்பம் புதுப்பிக்கப்பட்டது.",
      },
      sync: {
        title: "சாதனங்களுக்கு இடையிலான தொடர்ச்சி",
        description:
          "பகிரப்பட்ட இடத்தைத் தேர்ந்தெடுத்து சாதனங்கள் முழுவதும் உங்கள் தரவை ஒத்திசைவாக வைத்திருங்கள்.",
        toggle: "சாதனங்கள் முழுவதும் தானாக ஒத்திசை",
        recommendationTitle: "பரிந்துரை",
        recommendation:
          "தடையற்ற தொடர்ச்சிக்கு, iCloud, Google Drive அல்லது Dropbox போன்ற கிளவுட் சேவையால் ஒத்திசைக்கப்படும் கோப்புறையைத் தேர்ந்தெடுக்கவும். எந்த உள்ளூர் கோப்புறையும் வேலை செய்யும், ஆனால் மற்ற சாதனங்களுடன் தானாக ஒத்திசையாது.",
        location: "ஒத்திசைவு இடம்",
        selectFolder: "கோப்புறையைத் தேர்ந்தெடு",
        folderUpdated: "ஒத்திசைவு கோப்புறை இடம் புதுப்பிக்கப்பட்டது.",
        grantAccess: "அணுகலை வழங்கு",
        accessRestored: "ஒத்திசைவு கோப்புறைக்கான அணுகல் மீட்டெடுக்கப்பட்டது.",
      },
      about: {
        title: "பற்றி",
        licenses: "திறந்த மூல உரிமங்கள்",
        support: "மேம்பாட்டுக்கு ஆதரவளிக்கவும்",
      },
    },
  },
};
