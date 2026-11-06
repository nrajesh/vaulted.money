import type { AreaTranslations } from "./types";

/**
 * The AI providers screen and its add/edit dialog. Machine-written: ask a native speaker to review.
 */
export const aiProviderScreens: AreaTranslations = {
  en: {
    aiProviders: {
      page: {
        title: "AI Providers",
        subtitle:
          "Bring Your Own Key (BYOK) for AI analysis. Manage your endpoints and configurations here.",
        settingsLink: "Go to Settings to manage API keys →",
        singular: "AI Provider",
        plural: "AI providers",
      },
      columns: {
        name: "Name",
        type: "Type",
        model: "Model",
        endpoint: "Endpoint",
        default: "Default",
        noModel: "(None)",
      },
      dialog: {
        titleEdit: "Edit AI Provider",
        titleAdd: "Add AI Provider",
        descriptionEdit: "Update the configuration for this AI model provider.",
        descriptionAdd: "Add a new AI endpoint for auto-categorization.",
        name: "Provider Name",
        namePlaceholder: "e.g., Local Llama, Mistral Beta",
        apiType: "API Type",
        customOption: "Custom (OpenAI Compatible)",
        docs: "View Documentation & Models →",
        model: "Model ID (Optional)",
        modelPlaceholder: "e.g., gpt-4o, llama3",
        baseUrl: "Base URL (Endpoint)",
        baseUrlHint:
          "Ensure this URL is allowed in the CSP or proxy if required.",
        description: "Description (Optional)",
        descriptionPlaceholder: "Notes about this endpoint...",
        setDefault: "Set as default provider",
        testConnection: "Test Connection",
        save: "Save Provider",
        needKey:
          "Please save the provider and set an API key in Settings first to test.",
        testOk: "Connection test successful!",
        corsBlocked:
          "Connection failed: Likely a CORS block. Some providers restricted direct browser access. Consider a proxy or another provider.",
        testFailed: "Connection failed: {{message}}",
        updated: "AI Provider updated successfully!",
        added: "AI Provider added successfully!",
        error: "Error: {{message}}",
        errors: {
          name: "Name is required",
          url: "Must be a valid URL",
        },
      },
    },
  },
  es: {
    aiProviders: {
      page: {
        title: "Proveedores de IA",
        subtitle:
          "Trae tu propia clave (BYOK) para el análisis con IA. Gestiona aquí tus puntos de conexión y configuraciones.",
        settingsLink: "Ve a Ajustes para gestionar las claves de API →",
        singular: "Proveedor de IA",
        plural: "proveedores de IA",
      },
      columns: {
        name: "Nombre",
        type: "Tipo",
        model: "Modelo",
        endpoint: "Punto de conexión",
        default: "Predeterminado",
        noModel: "(Ninguno)",
      },
      dialog: {
        titleEdit: "Editar proveedor de IA",
        titleAdd: "Añadir proveedor de IA",
        descriptionEdit:
          "Actualiza la configuración de este proveedor de modelos de IA.",
        descriptionAdd:
          "Añade un nuevo punto de conexión de IA para la categorización automática.",
        name: "Nombre del proveedor",
        namePlaceholder: "p. ej., Llama local, Mistral Beta",
        apiType: "Tipo de API",
        customOption: "Personalizado (compatible con OpenAI)",
        docs: "Ver documentación y modelos →",
        model: "ID del modelo (opcional)",
        modelPlaceholder: "p. ej., gpt-4o, llama3",
        baseUrl: "URL base (punto de conexión)",
        baseUrlHint:
          "Asegúrate de que esta URL esté permitida en la CSP o el proxy si es necesario.",
        description: "Descripción (opcional)",
        descriptionPlaceholder: "Notas sobre este punto de conexión...",
        setDefault: "Establecer como proveedor predeterminado",
        testConnection: "Probar conexión",
        save: "Guardar proveedor",
        needKey:
          "Guarda primero el proveedor y define una clave de API en Ajustes para probar.",
        testOk: "¡Prueba de conexión correcta!",
        corsBlocked:
          "Conexión fallida: probablemente un bloqueo de CORS. Algunos proveedores restringen el acceso directo desde el navegador. Considera un proxy u otro proveedor.",
        testFailed: "Conexión fallida: {{message}}",
        updated: "¡Proveedor de IA actualizado correctamente!",
        added: "¡Proveedor de IA añadido correctamente!",
        error: "Error: {{message}}",
        errors: {
          name: "El nombre es obligatorio",
          url: "Debe ser una URL válida",
        },
      },
    },
  },
  zh: {
    aiProviders: {
      page: {
        title: "AI 提供商",
        subtitle: "自带密钥（BYOK）进行 AI 分析。在此管理您的接口和配置。",
        settingsLink: "前往设置管理 API 密钥 →",
        singular: "AI 提供商",
        plural: "AI 提供商",
      },
      columns: {
        name: "名称",
        type: "类型",
        model: "模型",
        endpoint: "接口地址",
        default: "默认",
        noModel: "（无）",
      },
      dialog: {
        titleEdit: "编辑 AI 提供商",
        titleAdd: "添加 AI 提供商",
        descriptionEdit: "更新此 AI 模型提供商的配置。",
        descriptionAdd: "添加用于自动分类的新 AI 接口。",
        name: "提供商名称",
        namePlaceholder: "例如：本地 Llama、Mistral Beta",
        apiType: "API 类型",
        customOption: "自定义（兼容 OpenAI）",
        docs: "查看文档和模型 →",
        model: "模型 ID（可选）",
        modelPlaceholder: "例如：gpt-4o、llama3",
        baseUrl: "基础 URL（接口地址）",
        baseUrlHint: "如有需要，请确保此 URL 已在 CSP 或代理中被允许。",
        description: "描述（可选）",
        descriptionPlaceholder: "关于此接口的备注...",
        setDefault: "设为默认提供商",
        testConnection: "测试连接",
        save: "保存提供商",
        needKey: "请先保存提供商，并在设置中设置 API 密钥后再测试。",
        testOk: "连接测试成功！",
        corsBlocked:
          "连接失败：很可能是 CORS 拦截。部分提供商限制浏览器直接访问。请考虑使用代理或其他提供商。",
        testFailed: "连接失败：{{message}}",
        updated: "AI 提供商更新成功！",
        added: "AI 提供商添加成功！",
        error: "错误：{{message}}",
        errors: {
          name: "必须填写名称",
          url: "必须是有效的 URL",
        },
      },
    },
  },
  nl: {
    aiProviders: {
      page: {
        title: "AI-aanbieders",
        subtitle:
          "Gebruik je eigen sleutel (BYOK) voor AI-analyse. Beheer hier je eindpunten en configuraties.",
        settingsLink: "Ga naar Instellingen om API-sleutels te beheren →",
        singular: "AI-aanbieder",
        plural: "AI-aanbieders",
      },
      columns: {
        name: "Naam",
        type: "Type",
        model: "Model",
        endpoint: "Eindpunt",
        default: "Standaard",
        noModel: "(Geen)",
      },
      dialog: {
        titleEdit: "AI-aanbieder bewerken",
        titleAdd: "AI-aanbieder toevoegen",
        descriptionEdit: "Werk de configuratie van deze AI-modelaanbieder bij.",
        descriptionAdd:
          "Voeg een nieuw AI-eindpunt toe voor automatisch categoriseren.",
        name: "Naam van aanbieder",
        namePlaceholder: "bijv. Lokale Llama, Mistral Beta",
        apiType: "API-type",
        customOption: "Aangepast (OpenAI-compatibel)",
        docs: "Documentatie en modellen bekijken →",
        model: "Model-ID (optioneel)",
        modelPlaceholder: "bijv. gpt-4o, llama3",
        baseUrl: "Basis-URL (eindpunt)",
        baseUrlHint:
          "Zorg dat deze URL is toegestaan in de CSP of proxy, indien nodig.",
        description: "Beschrijving (optioneel)",
        descriptionPlaceholder: "Notities over dit eindpunt...",
        setDefault: "Instellen als standaardaanbieder",
        testConnection: "Verbinding testen",
        save: "Aanbieder opslaan",
        needKey:
          "Sla eerst de aanbieder op en stel een API-sleutel in bij Instellingen om te testen.",
        testOk: "Verbindingstest geslaagd!",
        corsBlocked:
          "Verbinding mislukt: waarschijnlijk een CORS-blokkade. Sommige aanbieders beperken directe browsertoegang. Overweeg een proxy of een andere aanbieder.",
        testFailed: "Verbinding mislukt: {{message}}",
        updated: "AI-aanbieder succesvol bijgewerkt!",
        added: "AI-aanbieder succesvol toegevoegd!",
        error: "Fout: {{message}}",
        errors: {
          name: "Naam is verplicht",
          url: "Moet een geldige URL zijn",
        },
      },
    },
  },
  ta: {
    aiProviders: {
      page: {
        title: "AI வழங்குநர்கள்",
        subtitle:
          "AI பகுப்பாய்வுக்கு உங்கள் சொந்த விசையைப் (BYOK) பயன்படுத்தவும். உங்கள் முனையங்களையும் கட்டமைப்புகளையும் இங்கே நிர்வகிக்கவும்.",
        settingsLink: "API விசைகளை நிர்வகிக்க அமைப்புகளுக்குச் செல் →",
        singular: "AI வழங்குநர்",
        plural: "AI வழங்குநர்கள்",
      },
      columns: {
        name: "பெயர்",
        type: "வகை",
        model: "மாதிரி",
        endpoint: "முனையம்",
        default: "இயல்புநிலை",
        noModel: "(எதுவுமில்லை)",
      },
      dialog: {
        titleEdit: "AI வழங்குநரைத் திருத்து",
        titleAdd: "AI வழங்குநரைச் சேர்",
        descriptionEdit:
          "இந்த AI மாதிரி வழங்குநரின் கட்டமைப்பைப் புதுப்பிக்கவும்.",
        descriptionAdd:
          "தானியங்கி வகைப்படுத்தலுக்கு புதிய AI முனையத்தைச் சேர்க்கவும்.",
        name: "வழங்குநர் பெயர்",
        namePlaceholder: "எ.கா. உள்ளூர் Llama, Mistral Beta",
        apiType: "API வகை",
        customOption: "தனிப்பயன் (OpenAI இணக்கமானது)",
        docs: "ஆவணங்களையும் மாதிரிகளையும் காண் →",
        model: "மாதிரி ID (விருப்பம்)",
        modelPlaceholder: "எ.கா. gpt-4o, llama3",
        baseUrl: "அடிப்படை URL (முனையம்)",
        baseUrlHint:
          "தேவைப்பட்டால், இந்த URL CSP அல்லது ப்ராக்ஸியில் அனுமதிக்கப்பட்டுள்ளதா என்று உறுதிசெய்யவும்.",
        description: "விளக்கம் (விருப்பம்)",
        descriptionPlaceholder: "இந்த முனையம் பற்றிய குறிப்புகள்...",
        setDefault: "இயல்புநிலை வழங்குநராக அமை",
        testConnection: "இணைப்பைச் சோதி",
        save: "வழங்குநரைச் சேமி",
        needKey:
          "சோதிக்க, முதலில் வழங்குநரைச் சேமித்து அமைப்புகளில் API விசையை அமைக்கவும்.",
        testOk: "இணைப்புச் சோதனை வெற்றி!",
        corsBlocked:
          "இணைப்பு தோல்வியடைந்தது: CORS தடையாக இருக்கலாம். சில வழங்குநர்கள் உலாவியின் நேரடி அணுகலைக் கட்டுப்படுத்துகின்றனர். ப்ராக்ஸி அல்லது வேறொரு வழங்குநரைப் பரிசீலிக்கவும்.",
        testFailed: "இணைப்பு தோல்வியடைந்தது: {{message}}",
        updated: "AI வழங்குநர் வெற்றிகரமாகப் புதுப்பிக்கப்பட்டது!",
        added: "AI வழங்குநர் வெற்றிகரமாகச் சேர்க்கப்பட்டது!",
        error: "பிழை: {{message}}",
        errors: {
          name: "பெயர் அவசியம்",
          url: "சரியான URL ஆக இருக்க வேண்டும்",
        },
      },
    },
  },
};
