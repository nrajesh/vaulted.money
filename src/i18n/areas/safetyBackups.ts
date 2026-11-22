import type { AreaTranslations } from "./types";

/**
 * Automatic safety copies (made before imports, AI changes, sync, restores
 * and demo data): the messages shown when a copy could not be made, and the
 * "Automatic safety copies" section on the Backup screen.
 * Machine-written for es, zh, nl and ta: ask a native speaker to review.
 */
export const safetyBackups: AreaTranslations = {
  en: {
    safetyBackups: {
      failedWarning:
        "No safety copy could be made first, but the change went ahead.",
      continueWithoutCopyTitle: "Continue without a safety copy?",
      continueWithoutCopyBody:
        "A safety copy of your current data couldn't be made, so this change can't be undone. Continue anyway?",
      title: "Automatic safety copies",
      about: "Made before imports, AI changes and sync. The last 5 are kept.",
      empty:
        "No safety copies yet. One is made automatically before an import, an AI change or a sync.",
      loadFailed: "Couldn't load the safety copies.",
      reasons: {
        ai_categorize: "Before an AI change",
        csv_import: "Before CSV import",
        csv_import_entity: "Before CSV import: {{entity}}",
        sync: "Before sync",
        demo_data: "Before generating demo data",
        restore_file: "Before restoring a backup file",
        restore_safety_copy: "Before restoring a safety copy",
      },
      entities: {
        transactions: "transactions",
        accounts: "accounts",
        payees: "payees",
        categories: "categories",
        sub_categories: "sub-categories",
        budgets: "budgets",
        scheduled_transactions: "scheduled transactions",
      },
      ledgerCount_one: "{{count}} ledger",
      ledgerCount_other: "{{count}} ledgers",
      details: "{{date}}, {{time}} · {{ledgers}}",
      restore: "Restore",
      restoreConfirmTitle: "Restore this safety copy?",
      restoreConfirmBody:
        "All your current data will be replaced with this copy. A safety copy of your current data is made first, so you can undo this.",
      restored: "Safety copy restored.",
      restoreFailed: "Couldn't restore the safety copy.",
      saveAsFile: "Save as file",
      saveDescription: "Vaulted Money safety copy",
      saveFailed: "Couldn't save the safety copy as a file.",
      moreActions: "More actions for {{name}}, {{details}}",
      delete: "Delete",
      select: "Select",
      selectOne: "Select {{name}}, {{details}}",
      deleteCount: "Delete ({{count}})",
      deleteConfirmTitle_one: "Delete this safety copy?",
      deleteConfirmTitle_other: "Delete safety copies?",
      deleteConfirmBody_one:
        "This safety copy will be deleted. This can't be undone.",
      deleteConfirmBody_other:
        "{{count}} safety copies will be deleted. This can't be undone.",
      deleted_one: "Safety copy deleted.",
      deleted_other: "{{count}} safety copies deleted.",
      deleteFailed: "Couldn't delete the safety copies.",
    },
  },
  es: {
    safetyBackups: {
      failedWarning:
        "No se pudo hacer una copia de seguridad antes, pero el cambio se realizó.",
      continueWithoutCopyTitle: "¿Continuar sin copia de seguridad?",
      continueWithoutCopyBody:
        "No se pudo hacer una copia de seguridad de tus datos actuales, así que este cambio no se podrá deshacer. ¿Continuar de todos modos?",
      title: "Copias de seguridad automáticas",
      about:
        "Se hacen antes de importaciones, cambios de la IA y sincronizaciones. Se guardan las 5 últimas.",
      empty:
        "Aún no hay copias de seguridad. Se hace una automáticamente antes de una importación, un cambio de la IA o una sincronización.",
      loadFailed: "No se pudieron cargar las copias de seguridad.",
      reasons: {
        ai_categorize: "Antes de un cambio de la IA",
        csv_import: "Antes de importar un CSV",
        csv_import_entity: "Antes de importar un CSV: {{entity}}",
        sync: "Antes de sincronizar",
        demo_data: "Antes de generar datos de demostración",
        restore_file: "Antes de restaurar un archivo de copia",
        restore_safety_copy: "Antes de restaurar una copia de seguridad",
      },
      entities: {
        transactions: "transacciones",
        accounts: "cuentas",
        payees: "beneficiarios",
        categories: "categorías",
        sub_categories: "subcategorías",
        budgets: "presupuestos",
        scheduled_transactions: "transacciones programadas",
      },
      ledgerCount_one: "{{count}} libro",
      ledgerCount_other: "{{count}} libros",
      details: "{{date}}, {{time}} · {{ledgers}}",
      restore: "Restaurar",
      restoreConfirmTitle: "¿Restaurar esta copia de seguridad?",
      restoreConfirmBody:
        "Todos tus datos actuales se sustituirán por esta copia. Antes se hace una copia de seguridad de tus datos actuales, así que podrás deshacerlo.",
      restored: "Copia de seguridad restaurada.",
      restoreFailed: "No se pudo restaurar la copia de seguridad.",
      saveAsFile: "Guardar como archivo",
      saveDescription: "Copia de seguridad de Vaulted Money",
      saveFailed: "No se pudo guardar la copia de seguridad como archivo.",
      moreActions: "Más acciones para {{name}}, {{details}}",
      delete: "Eliminar",
      select: "Seleccionar",
      selectOne: "Seleccionar {{name}}, {{details}}",
      deleteCount: "Eliminar ({{count}})",
      deleteConfirmTitle_one: "¿Eliminar esta copia de seguridad?",
      deleteConfirmTitle_other: "¿Eliminar las copias de seguridad?",
      deleteConfirmBody_one:
        "Se eliminará esta copia de seguridad. No se puede deshacer.",
      deleteConfirmBody_other:
        "Se eliminarán {{count}} copias de seguridad. No se puede deshacer.",
      deleted_one: "Copia de seguridad eliminada.",
      deleted_other: "{{count}} copias de seguridad eliminadas.",
      deleteFailed: "No se pudieron eliminar las copias de seguridad.",
    },
  },
  zh: {
    safetyBackups: {
      failedWarning: "未能先创建安全副本，但更改已完成。",
      continueWithoutCopyTitle: "不创建安全副本继续？",
      continueWithoutCopyBody:
        "无法为当前数据创建安全副本，因此此更改将无法撤销。仍要继续吗？",
      title: "自动安全副本",
      about: "在导入、AI 更改和同步之前创建。保留最近 5 个。",
      empty: "还没有安全副本。在导入、AI 更改或同步之前会自动创建一个。",
      loadFailed: "无法加载安全副本。",
      reasons: {
        ai_categorize: "AI 更改之前",
        csv_import: "CSV 导入之前",
        csv_import_entity: "CSV 导入之前：{{entity}}",
        sync: "同步之前",
        demo_data: "生成演示数据之前",
        restore_file: "恢复备份文件之前",
        restore_safety_copy: "恢复安全副本之前",
      },
      entities: {
        transactions: "交易",
        accounts: "账户",
        payees: "收款方",
        categories: "类别",
        sub_categories: "子类别",
        budgets: "预算",
        scheduled_transactions: "定期交易",
      },
      ledgerCount_one: "{{count}} 个账本",
      ledgerCount_other: "{{count}} 个账本",
      details: "{{date}} {{time}} · {{ledgers}}",
      restore: "恢复",
      restoreConfirmTitle: "恢复此安全副本？",
      restoreConfirmBody:
        "您当前的所有数据将被此副本替换。系统会先为当前数据创建安全副本，因此您可以撤销此操作。",
      restored: "安全副本已恢复。",
      restoreFailed: "无法恢复安全副本。",
      saveAsFile: "另存为文件",
      saveDescription: "Vaulted Money 安全副本",
      saveFailed: "无法将安全副本保存为文件。",
      moreActions: "{{name}}（{{details}}）的更多操作",
      delete: "删除",
      select: "选择",
      selectOne: "选择 {{name}}（{{details}}）",
      deleteCount: "删除（{{count}}）",
      deleteConfirmTitle_one: "删除此安全副本？",
      deleteConfirmTitle_other: "删除安全副本？",
      deleteConfirmBody_one: "此安全副本将被删除。此操作无法撤销。",
      deleteConfirmBody_other: "将删除 {{count}} 个安全副本。此操作无法撤销。",
      deleted_one: "安全副本已删除。",
      deleted_other: "已删除 {{count}} 个安全副本。",
      deleteFailed: "无法删除安全副本。",
    },
  },
  nl: {
    safetyBackups: {
      failedWarning:
        "Er kon vooraf geen veiligheidskopie worden gemaakt, maar de wijziging is doorgevoerd.",
      continueWithoutCopyTitle: "Doorgaan zonder veiligheidskopie?",
      continueWithoutCopyBody:
        "Er kon geen veiligheidskopie van je huidige gegevens worden gemaakt, dus deze wijziging kan niet ongedaan worden gemaakt. Toch doorgaan?",
      title: "Automatische veiligheidskopieën",
      about:
        "Gemaakt vóór imports, AI-wijzigingen en synchronisatie. De laatste 5 worden bewaard.",
      empty:
        "Nog geen veiligheidskopieën. Er wordt er automatisch een gemaakt vóór een import, een AI-wijziging of een synchronisatie.",
      loadFailed: "De veiligheidskopieën konden niet worden geladen.",
      reasons: {
        ai_categorize: "Vóór een AI-wijziging",
        csv_import: "Vóór CSV-import",
        csv_import_entity: "Vóór CSV-import: {{entity}}",
        sync: "Vóór synchronisatie",
        demo_data: "Vóór het maken van demogegevens",
        restore_file: "Vóór het herstellen van een back-upbestand",
        restore_safety_copy: "Vóór het herstellen van een veiligheidskopie",
      },
      entities: {
        transactions: "transacties",
        accounts: "rekeningen",
        payees: "begunstigden",
        categories: "categorieën",
        sub_categories: "subcategorieën",
        budgets: "budgetten",
        scheduled_transactions: "geplande transacties",
      },
      ledgerCount_one: "{{count}} grootboek",
      ledgerCount_other: "{{count}} grootboeken",
      details: "{{date}}, {{time}} · {{ledgers}}",
      restore: "Herstellen",
      restoreConfirmTitle: "Deze veiligheidskopie herstellen?",
      restoreConfirmBody:
        "Al je huidige gegevens worden vervangen door deze kopie. Eerst wordt een veiligheidskopie van je huidige gegevens gemaakt, zodat je dit ongedaan kunt maken.",
      restored: "Veiligheidskopie hersteld.",
      restoreFailed: "De veiligheidskopie kon niet worden hersteld.",
      saveAsFile: "Opslaan als bestand",
      saveDescription: "Vaulted Money-veiligheidskopie",
      saveFailed: "De veiligheidskopie kon niet als bestand worden opgeslagen.",
      moreActions: "Meer acties voor {{name}}, {{details}}",
      delete: "Verwijderen",
      select: "Selecteren",
      selectOne: "{{name}} ({{details}}) selecteren",
      deleteCount: "Verwijderen ({{count}})",
      deleteConfirmTitle_one: "Deze veiligheidskopie verwijderen?",
      deleteConfirmTitle_other: "Veiligheidskopieën verwijderen?",
      deleteConfirmBody_one:
        "Deze veiligheidskopie wordt verwijderd. Dit kan niet ongedaan worden gemaakt.",
      deleteConfirmBody_other:
        "{{count}} veiligheidskopieën worden verwijderd. Dit kan niet ongedaan worden gemaakt.",
      deleted_one: "Veiligheidskopie verwijderd.",
      deleted_other: "{{count}} veiligheidskopieën verwijderd.",
      deleteFailed: "De veiligheidskopieën konden niet worden verwijderd.",
    },
  },
  ta: {
    safetyBackups: {
      failedWarning:
        "முதலில் பாதுகாப்பு நகலை உருவாக்க முடியவில்லை, ஆனால் மாற்றம் செய்யப்பட்டது.",
      continueWithoutCopyTitle: "பாதுகாப்பு நகல் இல்லாமல் தொடரவா?",
      continueWithoutCopyBody:
        "உங்கள் தற்போதைய தரவின் பாதுகாப்பு நகலை உருவாக்க முடியவில்லை, எனவே இந்த மாற்றத்தைச் செயல்தவிர்க்க முடியாது. இருந்தாலும் தொடரவா?",
      title: "தானியங்கி பாதுகாப்பு நகல்கள்",
      about:
        "இறக்குமதி, AI மாற்றங்கள் மற்றும் ஒத்திசைவுக்கு முன் உருவாக்கப்படும். கடைசி 5 வைக்கப்படும்.",
      empty:
        "இன்னும் பாதுகாப்பு நகல்கள் இல்லை. இறக்குமதி, AI மாற்றம் அல்லது ஒத்திசைவுக்கு முன் ஒன்று தானாக உருவாக்கப்படும்.",
      loadFailed: "பாதுகாப்பு நகல்களை ஏற்ற முடியவில்லை.",
      reasons: {
        ai_categorize: "AI மாற்றத்துக்கு முன்",
        csv_import: "CSV இறக்குமதிக்கு முன்",
        csv_import_entity: "CSV இறக்குமதிக்கு முன்: {{entity}}",
        sync: "ஒத்திசைவுக்கு முன்",
        demo_data: "டெமோ தரவை உருவாக்கும் முன்",
        restore_file: "காப்புப் பிரதி கோப்பை மீட்டெடுக்கும் முன்",
        restore_safety_copy: "பாதுகாப்பு நகலை மீட்டெடுக்கும் முன்",
      },
      entities: {
        transactions: "பரிவர்த்தனைகள்",
        accounts: "கணக்குகள்",
        payees: "பெறுநர்கள்",
        categories: "வகைகள்",
        sub_categories: "துணை வகைகள்",
        budgets: "பட்ஜெட்டுகள்",
        scheduled_transactions: "திட்டமிட்ட பரிவர்த்தனைகள்",
      },
      ledgerCount_one: "{{count}} லெட்ஜர்",
      ledgerCount_other: "{{count}} லெட்ஜர்கள்",
      details: "{{date}}, {{time}} · {{ledgers}}",
      restore: "மீட்டெடு",
      restoreConfirmTitle: "இந்தப் பாதுகாப்பு நகலை மீட்டெடுக்கவா?",
      restoreConfirmBody:
        "உங்கள் தற்போதைய தரவு அனைத்தும் இந்த நகலால் மாற்றப்படும். முதலில் உங்கள் தற்போதைய தரவின் பாதுகாப்பு நகல் உருவாக்கப்படும், எனவே இதைச் செயல்தவிர்க்கலாம்.",
      restored: "பாதுகாப்பு நகல் மீட்டெடுக்கப்பட்டது.",
      restoreFailed: "பாதுகாப்பு நகலை மீட்டெடுக்க முடியவில்லை.",
      saveAsFile: "கோப்பாகச் சேமி",
      saveDescription: "Vaulted Money பாதுகாப்பு நகல்",
      saveFailed: "பாதுகாப்பு நகலைக் கோப்பாகச் சேமிக்க முடியவில்லை.",
      moreActions: "{{name}} ({{details}}) க்கான கூடுதல் செயல்கள்",
      delete: "நீக்கு",
      select: "தேர்ந்தெடு",
      selectOne: "{{name}} ({{details}}) ஐத் தேர்ந்தெடு",
      deleteCount: "நீக்கு ({{count}})",
      deleteConfirmTitle_one: "இந்தப் பாதுகாப்பு நகலை நீக்கவா?",
      deleteConfirmTitle_other: "பாதுகாப்பு நகல்களை நீக்கவா?",
      deleteConfirmBody_one:
        "இந்தப் பாதுகாப்பு நகல் நீக்கப்படும். இதைச் செயல்தவிர்க்க முடியாது.",
      deleteConfirmBody_other:
        "{{count}} பாதுகாப்பு நகல்கள் நீக்கப்படும். இதைச் செயல்தவிர்க்க முடியாது.",
      deleted_one: "பாதுகாப்பு நகல் நீக்கப்பட்டது.",
      deleted_other: "{{count}} பாதுகாப்பு நகல்கள் நீக்கப்பட்டன.",
      deleteFailed: "பாதுகாப்பு நகல்களை நீக்க முடியவில்லை.",
    },
  },
};
