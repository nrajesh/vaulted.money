import type { AreaTranslations } from "./types";

/**
 * The Backup screen and background backup messages. Machine-written: ask a native speaker to review.
 */
export const backupScreen: AreaTranslations = {
  en: {
    backup: {
      page: {
        title: "Backup",
        subtitle: "Configure automated backups for your peace of mind.",
      },
      unsupported: {
        title: "Browser Not Supported",
        body: "Scheduled backups require the File System Access API (Chrome/Edge/Opera), the Desktop App, or a Native Mobile App.",
      },
      create: {
        title: "Create Scheduled Backup",
        description: "Automatically back up your data to a local folder.",
        runsInBackground:
          "Backups run automatically in the background while the application is running.",
        frequency: "Frequency",
        frequencyPlaceholder: "e.g. 7m, 1h, 1 day",
        parsed: "Parsed: {{value}} (Min: 1m)",
        invalid: "Invalid",
        targetFolder: "Target Folder",
        selectFolder: "Select Folder",
        encrypt: "Encrypt Backup",
        password: "Backup Password",
        passwordPlaceholder: "Enter encryption password",
        start: "Start Scheduled Backup",
        created: "Scheduled backup created!",
        failed: "Failed to create backup schedule: {{message}}",
        folderFailed: "Failed to select folder: {{message}}",
        needFrequency:
          "Please enter a valid frequency (e.g., '1h', '1 day'). Minimum 1 minute.",
        needFolder: "Please select a folder for backups.",
        needPassword: "Please enter a password for encryption.",
      },
      active: {
        title: "Active Schedules",
        empty: "No active backups.",
        configId: "Config ID",
        frequency: "Frequency",
        folder: "Folder",
        encryption: "Encryption",
        status: "Status",
        nextRun: "Next Run",
        actions: "Actions",
        unknown: "Unknown",
        pathHidden: "Full path is hidden by browser security.",
        encrypted: "Encrypted",
        plain: "Plain",
        statusOk: "Backup active and permission granted.",
        statusOff:
          "Backup disabled. Info: Folder missing or permission denied.",
        last: "Last: {{time}}",
        notAvailable: "NA",
        verify: "Verify permission",
        delete: "Delete schedule",
      },
      permission: {
        alreadyGranted: "Permission is already granted.",
        granted: "Permission granted! Backups will resume.",
        denied: "Permission denied. Backups cannot run.",
        error: "Error checking permission: {{message}}",
      },
      undo: {
        title: "Scheduled Backup Deleted",
        description: "Backup schedule removed.",
        action: "Undo",
        done: "Deletion undone.",
      },
      run: {
        completed: "Scheduled backup completed ({{filename}})",
        folderMissing:
          "Backup folder not found for config {{id}}. Backup disabled.",
        permissionDenied:
          "Permission denied for backup config {{id}}. Backup disabled.",
      },
    },
  },
  es: {
    backup: {
      page: {
        title: "Copia de seguridad",
        subtitle:
          "Configura copias de seguridad automáticas para tu tranquilidad.",
      },
      unsupported: {
        title: "Navegador no compatible",
        body: "Las copias programadas requieren la API de acceso al sistema de archivos (Chrome/Edge/Opera), la aplicación de escritorio o una aplicación móvil nativa.",
      },
      create: {
        title: "Crear copia de seguridad programada",
        description:
          "Haz copias automáticas de tus datos en una carpeta local.",
        runsInBackground:
          "Las copias se ejecutan automáticamente en segundo plano mientras la aplicación está abierta.",
        frequency: "Frecuencia",
        frequencyPlaceholder: "p. ej. 7m, 1h, 1 day",
        parsed: "Interpretado: {{value}} (mín.: 1m)",
        invalid: "No válido",
        targetFolder: "Carpeta de destino",
        selectFolder: "Seleccionar carpeta",
        encrypt: "Cifrar copia de seguridad",
        password: "Contraseña de la copia",
        passwordPlaceholder: "Introduce la contraseña de cifrado",
        start: "Iniciar copia programada",
        created: "¡Copia programada creada!",
        failed: "No se pudo crear la programación de copias: {{message}}",
        folderFailed: "No se pudo seleccionar la carpeta: {{message}}",
        needFrequency:
          "Introduce una frecuencia válida (p. ej., '1h', '1 day'). Mínimo 1 minuto.",
        needFolder: "Selecciona una carpeta para las copias.",
        needPassword: "Introduce una contraseña para el cifrado.",
      },
      active: {
        title: "Programaciones activas",
        empty: "No hay copias activas.",
        configId: "ID de configuración",
        frequency: "Frecuencia",
        folder: "Carpeta",
        encryption: "Cifrado",
        status: "Estado",
        nextRun: "Próxima ejecución",
        actions: "Acciones",
        unknown: "Desconocido",
        pathHidden: "El navegador oculta la ruta completa por seguridad.",
        encrypted: "Cifrada",
        plain: "Sin cifrar",
        statusOk: "Copia activa y permiso concedido.",
        statusOff:
          "Copia desactivada. Info: falta la carpeta o se denegó el permiso.",
        last: "Última: {{time}}",
        notAvailable: "N/D",
        verify: "Verificar permiso",
        delete: "Eliminar programación",
      },
      permission: {
        alreadyGranted: "El permiso ya está concedido.",
        granted: "¡Permiso concedido! Las copias se reanudarán.",
        denied: "Permiso denegado. Las copias no pueden ejecutarse.",
        error: "Error al comprobar el permiso: {{message}}",
      },
      undo: {
        title: "Copia programada eliminada",
        description: "Programación de copias eliminada.",
        action: "Deshacer",
        done: "Eliminación deshecha.",
      },
      run: {
        completed: "Copia programada completada ({{filename}})",
        folderMissing:
          "No se encontró la carpeta de copias de la configuración {{id}}. Copia desactivada.",
        permissionDenied:
          "Permiso denegado para la configuración de copia {{id}}. Copia desactivada.",
      },
    },
  },
  zh: {
    backup: {
      page: {
        title: "备份",
        subtitle: "配置自动备份，让您高枕无忧。",
      },
      unsupported: {
        title: "浏览器不受支持",
        body: "定期备份需要文件系统访问 API（Chrome/Edge/Opera）、桌面应用或原生移动应用。",
      },
      create: {
        title: "创建定期备份",
        description: "自动将数据备份到本地文件夹。",
        runsInBackground: "应用运行期间，备份会在后台自动执行。",
        frequency: "频率",
        frequencyPlaceholder: "例如 7m、1h、1 day",
        parsed: "解析结果：{{value}}（最小：1m）",
        invalid: "无效",
        targetFolder: "目标文件夹",
        selectFolder: "选择文件夹",
        encrypt: "加密备份",
        password: "备份密码",
        passwordPlaceholder: "输入加密密码",
        start: "开始定期备份",
        created: "定期备份已创建！",
        failed: "创建备份计划失败：{{message}}",
        folderFailed: "选择文件夹失败：{{message}}",
        needFrequency: "请输入有效的频率（例如 '1h'、'1 day'）。最少 1 分钟。",
        needFolder: "请选择备份文件夹。",
        needPassword: "请输入加密密码。",
      },
      active: {
        title: "进行中的计划",
        empty: "没有进行中的备份。",
        configId: "配置 ID",
        frequency: "频率",
        folder: "文件夹",
        encryption: "加密",
        status: "状态",
        nextRun: "下次运行",
        actions: "操作",
        unknown: "未知",
        pathHidden: "出于浏览器安全限制，完整路径已隐藏。",
        encrypted: "已加密",
        plain: "未加密",
        statusOk: "备份已启用，权限已授予。",
        statusOff: "备份已停用。信息：文件夹缺失或权限被拒绝。",
        last: "上次：{{time}}",
        notAvailable: "不适用",
        verify: "验证权限",
        delete: "删除计划",
      },
      permission: {
        alreadyGranted: "权限已授予。",
        granted: "权限已授予！备份将恢复。",
        denied: "权限被拒绝，备份无法运行。",
        error: "检查权限时出错：{{message}}",
      },
      undo: {
        title: "定期备份已删除",
        description: "备份计划已移除。",
        action: "撤销",
        done: "已撤销删除。",
      },
      run: {
        completed: "定期备份已完成（{{filename}}）",
        folderMissing: "找不到配置 {{id}} 的备份文件夹，备份已停用。",
        permissionDenied: "备份配置 {{id}} 的权限被拒绝，备份已停用。",
      },
    },
  },
  nl: {
    backup: {
      page: {
        title: "Back-up",
        subtitle: "Stel automatische back-ups in voor je gemoedsrust.",
      },
      unsupported: {
        title: "Browser niet ondersteund",
        body: "Geplande back-ups vereisen de File System Access API (Chrome/Edge/Opera), de desktop-app of een native mobiele app.",
      },
      create: {
        title: "Geplande back-up maken",
        description:
          "Maak automatisch een back-up van je gegevens in een lokale map.",
        runsInBackground:
          "Back-ups draaien automatisch op de achtergrond zolang de app actief is.",
        frequency: "Frequentie",
        frequencyPlaceholder: "bijv. 7m, 1h, 1 day",
        parsed: "Geïnterpreteerd: {{value}} (min.: 1m)",
        invalid: "Ongeldig",
        targetFolder: "Doelmap",
        selectFolder: "Map kiezen",
        encrypt: "Back-up versleutelen",
        password: "Back-upwachtwoord",
        passwordPlaceholder: "Voer het versleutelingswachtwoord in",
        start: "Geplande back-up starten",
        created: "Geplande back-up aangemaakt!",
        failed: "Back-upplanning aanmaken mislukt: {{message}}",
        folderFailed: "Map kiezen mislukt: {{message}}",
        needFrequency:
          "Voer een geldige frequentie in (bijv. '1h', '1 day'). Minimaal 1 minuut.",
        needFolder: "Kies een map voor de back-ups.",
        needPassword: "Voer een wachtwoord voor de versleuteling in.",
      },
      active: {
        title: "Actieve planningen",
        empty: "Geen actieve back-ups.",
        configId: "Config-ID",
        frequency: "Frequentie",
        folder: "Map",
        encryption: "Versleuteling",
        status: "Status",
        nextRun: "Volgende uitvoering",
        actions: "Acties",
        unknown: "Onbekend",
        pathHidden:
          "Het volledige pad is verborgen door de beveiliging van de browser.",
        encrypted: "Versleuteld",
        plain: "Onversleuteld",
        statusOk: "Back-up actief en toestemming verleend.",
        statusOff:
          "Back-up uitgeschakeld. Info: map ontbreekt of toestemming geweigerd.",
        last: "Laatste: {{time}}",
        notAvailable: "n.v.t.",
        verify: "Toestemming controleren",
        delete: "Planning verwijderen",
      },
      permission: {
        alreadyGranted: "Toestemming is al verleend.",
        granted: "Toestemming verleend! Back-ups worden hervat.",
        denied: "Toestemming geweigerd. Back-ups kunnen niet draaien.",
        error: "Fout bij het controleren van de toestemming: {{message}}",
      },
      undo: {
        title: "Geplande back-up verwijderd",
        description: "Back-upplanning verwijderd.",
        action: "Ongedaan maken",
        done: "Verwijdering ongedaan gemaakt.",
      },
      run: {
        completed: "Geplande back-up voltooid ({{filename}})",
        folderMissing:
          "Back-upmap voor config {{id}} niet gevonden. Back-up uitgeschakeld.",
        permissionDenied:
          "Toestemming geweigerd voor back-upconfig {{id}}. Back-up uitgeschakeld.",
      },
    },
  },
  ta: {
    backup: {
      page: {
        title: "காப்புப் பிரதி",
        subtitle: "மன அமைதிக்காக தானியங்கி காப்புப் பிரதிகளை அமைக்கவும்.",
      },
      unsupported: {
        title: "உலாவி ஆதரிக்கப்படவில்லை",
        body: "திட்டமிட்ட காப்புப் பிரதிகளுக்கு File System Access API (Chrome/Edge/Opera), டெஸ்க்டாப் பயன்பாடு அல்லது நேட்டிவ் மொபைல் பயன்பாடு தேவை.",
      },
      create: {
        title: "திட்டமிட்ட காப்புப் பிரதியை உருவாக்கு",
        description:
          "உங்கள் தரவை உள்ளூர் கோப்புறையில் தானாகக் காப்புப் பிரதி எடுக்கவும்.",
        runsInBackground:
          "பயன்பாடு இயங்கும்போது காப்புப் பிரதிகள் பின்னணியில் தானாக இயங்கும்.",
        frequency: "அடிக்கடி",
        frequencyPlaceholder: "எ.கா. 7m, 1h, 1 day",
        parsed: "பகுப்பாய்வு: {{value}} (குறைந்தபட்சம்: 1m)",
        invalid: "தவறானது",
        targetFolder: "இலக்கு கோப்புறை",
        selectFolder: "கோப்புறையைத் தேர்ந்தெடு",
        encrypt: "காப்புப் பிரதியை குறியாக்கு",
        password: "காப்புப் பிரதி கடவுச்சொல்",
        passwordPlaceholder: "குறியாக்க கடவுச்சொல்லை உள்ளிடவும்",
        start: "திட்டமிட்ட காப்புப் பிரதியைத் தொடங்கு",
        created: "திட்டமிட்ட காப்புப் பிரதி உருவாக்கப்பட்டது!",
        failed: "காப்புப் பிரதி அட்டவணையை உருவாக்க முடியவில்லை: {{message}}",
        folderFailed: "கோப்புறையைத் தேர்ந்தெடுக்க முடியவில்லை: {{message}}",
        needFrequency:
          "சரியான அடிக்கடி மதிப்பை உள்ளிடவும் (எ.கா. '1h', '1 day'). குறைந்தது 1 நிமிடம்.",
        needFolder: "காப்புப் பிரதிகளுக்கான கோப்புறையைத் தேர்ந்தெடுக்கவும்.",
        needPassword: "குறியாக்கத்திற்கான கடவுச்சொல்லை உள்ளிடவும்.",
      },
      active: {
        title: "செயலில் உள்ள அட்டவணைகள்",
        empty: "செயலில் உள்ள காப்புப் பிரதிகள் இல்லை.",
        configId: "கட்டமைப்பு ID",
        frequency: "அடிக்கடி",
        folder: "கோப்புறை",
        encryption: "குறியாக்கம்",
        status: "நிலை",
        nextRun: "அடுத்த இயக்கம்",
        actions: "செயல்கள்",
        unknown: "தெரியாதது",
        pathHidden:
          "உலாவிப் பாதுகாப்பு காரணமாக முழுப் பாதை மறைக்கப்பட்டுள்ளது.",
        encrypted: "குறியாக்கப்பட்டது",
        plain: "எளிமையானது",
        statusOk: "காப்புப் பிரதி செயலில் உள்ளது; அனுமதி வழங்கப்பட்டது.",
        statusOff:
          "காப்புப் பிரதி முடக்கப்பட்டது. தகவல்: கோப்புறை இல்லை அல்லது அனுமதி மறுக்கப்பட்டது.",
        last: "கடைசி: {{time}}",
        notAvailable: "பொருந்தாது",
        verify: "அனுமதியைச் சரிபார்",
        delete: "அட்டவணையை நீக்கு",
      },
      permission: {
        alreadyGranted: "அனுமதி ஏற்கனவே வழங்கப்பட்டுள்ளது.",
        granted: "அனுமதி வழங்கப்பட்டது! காப்புப் பிரதிகள் மீண்டும் தொடங்கும்.",
        denied: "அனுமதி மறுக்கப்பட்டது. காப்புப் பிரதிகளை இயக்க முடியாது.",
        error: "அனுமதியைச் சரிபார்ப்பதில் பிழை: {{message}}",
      },
      undo: {
        title: "திட்டமிட்ட காப்புப் பிரதி நீக்கப்பட்டது",
        description: "காப்புப் பிரதி அட்டவணை அகற்றப்பட்டது.",
        action: "செயல்தவிர்",
        done: "நீக்கம் செயல்தவிர்க்கப்பட்டது.",
      },
      run: {
        completed: "திட்டமிட்ட காப்புப் பிரதி முடிந்தது ({{filename}})",
        folderMissing:
          "கட்டமைப்பு {{id}} க்கான காப்புப் பிரதி கோப்புறை கிடைக்கவில்லை. காப்புப் பிரதி முடக்கப்பட்டது.",
        permissionDenied:
          "காப்புப் பிரதி கட்டமைப்பு {{id}} க்கு அனுமதி மறுக்கப்பட்டது. காப்புப் பிரதி முடக்கப்பட்டது.",
      },
    },
  },
};
