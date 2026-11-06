import type { AreaTranslations } from "./types";

/**
 * The Data management screen. Machine-written: ask a native speaker to review.
 */
export const dataManagementScreen: AreaTranslations = {
  en: {
    dataManagement: {
      title: "Data",
      subtitle: "Export, import, and schedule backups for your data.",
      manual: {
        title: "Manual Backup & Restore",
        description:
          "Export your data to a local file immediately, or restore from a previous backup.",
        importantTitle: "Important",
        importantBody:
          "Since this is a local-first app, if you clear your browser data, you will lose your records. Please export regular backups.",
        exportJson: "Export JSON",
        exportEncrypted: "Export Encrypted",
        importJson: "Import JSON",
      },
      reset: {
        title: "Reset All Data",
        description:
          "Permanently delete all transaction, vendor, and account records.",
        confirmTitle: "Are you sure you want to reset all data?",
        confirmDescription:
          "This action cannot be undone. All your transaction, vendor, and account data for ALL ledgers will be permanently deleted.",
        confirmButton: "Reset Data",
        done: "All application data has been reset.",
        failed: "Reset failed: {{message}}",
      },
      demo: {
        title: "Generate Demo Data",
        description:
          "Generate diverse demo transactions. This will clear existing data first.",
        button: "Generate Data",
        confirmTitle: "Generate new demo data?",
        confirmDescription:
          "This will clear all existing transactions and generate new diverse demo data. This action cannot be undone.",
        confirmButton: "Generate",
      },
      export: {
        description: "Vaulted Money Full Backup (All Ledgers)",
        descriptionEncrypted: "Vaulted Money Full Backup (Encrypted)",
        saved: "File saved successfully!",
        started: "Export file download started.",
        failed: "Export failed: {{message}}",
        encryptedSaved: "Encrypted file saved successfully!",
        encryptionFailed: "Encryption failed: {{message}}",
      },
      import: {
        done: "Data imported successfully!",
        encryptedDone: "Encrypted data imported successfully!",
        failed: "Import failed",
      },
      encrypt: {
        title: "Encrypt Backup",
        description:
          "Enter a password to encrypt your backup file. You will need this password to restore your data.",
        confirm: "Encrypt & Download",
      },
      decrypt: {
        title: "Decrypt Backup",
        description:
          "This file is encrypted. Please enter the password to restore your data.",
        confirm: "Decrypt & Import",
      },
    },
  },
  es: {
    dataManagement: {
      title: "Datos",
      subtitle: "Exporta, importa y programa copias de seguridad de tus datos.",
      manual: {
        title: "Copia de seguridad y restauración manual",
        description:
          "Exporta tus datos a un archivo local de inmediato o restaura desde una copia anterior.",
        importantTitle: "Importante",
        importantBody:
          "Como esta es una aplicación que prioriza lo local, si borras los datos del navegador perderás tus registros. Exporta copias de seguridad con regularidad.",
        exportJson: "Exportar JSON",
        exportEncrypted: "Exportar cifrado",
        importJson: "Importar JSON",
      },
      reset: {
        title: "Restablecer todos los datos",
        description:
          "Elimina de forma permanente todas las transacciones, proveedores y cuentas.",
        confirmTitle: "¿Seguro que quieres restablecer todos los datos?",
        confirmDescription:
          "Esta acción no se puede deshacer. Todos los datos de transacciones, proveedores y cuentas de TODOS los libros se eliminarán de forma permanente.",
        confirmButton: "Restablecer datos",
        done: "Todos los datos de la aplicación se han restablecido.",
        failed: "Error al restablecer: {{message}}",
      },
      demo: {
        title: "Generar datos de demostración",
        description:
          "Genera transacciones de demostración variadas. Antes se borrarán los datos existentes.",
        button: "Generar datos",
        confirmTitle: "¿Generar nuevos datos de demostración?",
        confirmDescription:
          "Se borrarán todas las transacciones existentes y se generarán nuevos datos de demostración variados. Esta acción no se puede deshacer.",
        confirmButton: "Generar",
      },
      export: {
        description:
          "Copia de seguridad completa de Vaulted Money (todos los libros)",
        descriptionEncrypted:
          "Copia de seguridad completa de Vaulted Money (cifrada)",
        saved: "¡Archivo guardado correctamente!",
        started: "Se inició la descarga del archivo exportado.",
        failed: "Error al exportar: {{message}}",
        encryptedSaved: "¡Archivo cifrado guardado correctamente!",
        encryptionFailed: "Error al cifrar: {{message}}",
      },
      import: {
        done: "¡Datos importados correctamente!",
        encryptedDone: "¡Datos cifrados importados correctamente!",
        failed: "Error al importar",
      },
      encrypt: {
        title: "Cifrar copia de seguridad",
        description:
          "Introduce una contraseña para cifrar tu copia de seguridad. La necesitarás para restaurar tus datos.",
        confirm: "Cifrar y descargar",
      },
      decrypt: {
        title: "Descifrar copia de seguridad",
        description:
          "Este archivo está cifrado. Introduce la contraseña para restaurar tus datos.",
        confirm: "Descifrar e importar",
      },
    },
  },
  zh: {
    dataManagement: {
      title: "数据",
      subtitle: "导出、导入并计划备份您的数据。",
      manual: {
        title: "手动备份与恢复",
        description: "立即将数据导出为本地文件，或从之前的备份恢复。",
        importantTitle: "重要提示",
        importantBody:
          "由于这是本地优先的应用，清除浏览器数据会丢失您的记录。请定期导出备份。",
        exportJson: "导出 JSON",
        exportEncrypted: "导出加密文件",
        importJson: "导入 JSON",
      },
      reset: {
        title: "重置所有数据",
        description: "永久删除所有交易、商家和账户记录。",
        confirmTitle: "确定要重置所有数据吗？",
        confirmDescription:
          "此操作无法撤销。所有账本的全部交易、商家和账户数据都将被永久删除。",
        confirmButton: "重置数据",
        done: "应用的所有数据已重置。",
        failed: "重置失败：{{message}}",
      },
      demo: {
        title: "生成演示数据",
        description: "生成多样的演示交易。这将先清除现有数据。",
        button: "生成数据",
        confirmTitle: "生成新的演示数据？",
        confirmDescription:
          "这将清除所有现有交易并生成新的多样演示数据。此操作无法撤销。",
        confirmButton: "生成",
      },
      export: {
        description: "Vaulted Money 完整备份（所有账本）",
        descriptionEncrypted: "Vaulted Money 完整备份（已加密）",
        saved: "文件保存成功！",
        started: "导出文件已开始下载。",
        failed: "导出失败：{{message}}",
        encryptedSaved: "加密文件保存成功！",
        encryptionFailed: "加密失败：{{message}}",
      },
      import: {
        done: "数据导入成功！",
        encryptedDone: "加密数据导入成功！",
        failed: "导入失败",
      },
      encrypt: {
        title: "加密备份",
        description: "输入密码以加密备份文件。恢复数据时需要此密码。",
        confirm: "加密并下载",
      },
      decrypt: {
        title: "解密备份",
        description: "此文件已加密。请输入密码以恢复数据。",
        confirm: "解密并导入",
      },
    },
  },
  nl: {
    dataManagement: {
      title: "Gegevens",
      subtitle: "Exporteer, importeer en plan back-ups van je gegevens.",
      manual: {
        title: "Handmatige back-up en herstel",
        description:
          "Exporteer je gegevens direct naar een lokaal bestand of herstel vanuit een eerdere back-up.",
        importantTitle: "Belangrijk",
        importantBody:
          "Omdat dit een lokaal-eerst-app is, raak je je gegevens kwijt als je de browsergegevens wist. Exporteer regelmatig back-ups.",
        exportJson: "JSON exporteren",
        exportEncrypted: "Versleuteld exporteren",
        importJson: "JSON importeren",
      },
      reset: {
        title: "Alle gegevens resetten",
        description:
          "Verwijder alle transacties, leveranciers en rekeningen definitief.",
        confirmTitle: "Weet je zeker dat je alle gegevens wilt resetten?",
        confirmDescription:
          "Dit kan niet ongedaan worden gemaakt. Alle transactie-, leveranciers- en rekeninggegevens van ALLE grootboeken worden definitief verwijderd.",
        confirmButton: "Gegevens resetten",
        done: "Alle gegevens van de app zijn gereset.",
        failed: "Resetten mislukt: {{message}}",
      },
      demo: {
        title: "Demogegevens genereren",
        description:
          "Genereer gevarieerde demotransacties. Bestaande gegevens worden eerst gewist.",
        button: "Gegevens genereren",
        confirmTitle: "Nieuwe demogegevens genereren?",
        confirmDescription:
          "Hiermee worden alle bestaande transacties gewist en nieuwe, gevarieerde demogegevens gegenereerd. Dit kan niet ongedaan worden gemaakt.",
        confirmButton: "Genereren",
      },
      export: {
        description: "Volledige back-up van Vaulted Money (alle grootboeken)",
        descriptionEncrypted:
          "Volledige back-up van Vaulted Money (versleuteld)",
        saved: "Bestand succesvol opgeslagen!",
        started: "Download van het exportbestand gestart.",
        failed: "Exporteren mislukt: {{message}}",
        encryptedSaved: "Versleuteld bestand succesvol opgeslagen!",
        encryptionFailed: "Versleutelen mislukt: {{message}}",
      },
      import: {
        done: "Gegevens succesvol geïmporteerd!",
        encryptedDone: "Versleutelde gegevens succesvol geïmporteerd!",
        failed: "Importeren mislukt",
      },
      encrypt: {
        title: "Back-up versleutelen",
        description:
          "Voer een wachtwoord in om je back-upbestand te versleutelen. Je hebt dit wachtwoord nodig om je gegevens te herstellen.",
        confirm: "Versleutelen en downloaden",
      },
      decrypt: {
        title: "Back-up ontsleutelen",
        description:
          "Dit bestand is versleuteld. Voer het wachtwoord in om je gegevens te herstellen.",
        confirm: "Ontsleutelen en importeren",
      },
    },
  },
  ta: {
    dataManagement: {
      title: "தரவு",
      subtitle:
        "உங்கள் தரவை ஏற்றுமதி செய்யவும், இறக்குமதி செய்யவும், காப்புப் பிரதிகளைத் திட்டமிடவும்.",
      manual: {
        title: "கைமுறை காப்புப் பிரதி & மீட்டமை",
        description:
          "உங்கள் தரவை உடனடியாக உள்ளூர் கோப்பாக ஏற்றுமதி செய்யவும் அல்லது முந்தைய காப்புப் பிரதியிலிருந்து மீட்டமைக்கவும்.",
        importantTitle: "முக்கியம்",
        importantBody:
          "இது உள்ளூர்-முதன்மைப் பயன்பாடு என்பதால், உலாவித் தரவை அழித்தால் உங்கள் பதிவுகளை இழப்பீர்கள். தொடர்ந்து காப்புப் பிரதிகளை ஏற்றுமதி செய்யுங்கள்.",
        exportJson: "JSON ஏற்றுமதி",
        exportEncrypted: "குறியாக்கத்துடன் ஏற்றுமதி",
        importJson: "JSON இறக்குமதி",
      },
      reset: {
        title: "எல்லா தரவையும் மீட்டமை",
        description:
          "அனைத்துப் பரிவர்த்தனை, விற்பனையாளர், கணக்குப் பதிவுகளையும் நிரந்தரமாக நீக்கு.",
        confirmTitle: "எல்லா தரவையும் மீட்டமைக்க விரும்புகிறீர்களா?",
        confirmDescription:
          "இந்தச் செயலைத் திரும்பப் பெற முடியாது. அனைத்துப் பேரேடுகளின் பரிவர்த்தனை, விற்பனையாளர், கணக்குத் தரவு நிரந்தரமாக நீக்கப்படும்.",
        confirmButton: "தரவை மீட்டமை",
        done: "பயன்பாட்டின் எல்லா தரவும் மீட்டமைக்கப்பட்டது.",
        failed: "மீட்டமைப்பு தோல்வியடைந்தது: {{message}}",
      },
      demo: {
        title: "டெமோ தரவை உருவாக்கு",
        description:
          "பல்வேறு டெமோ பரிவர்த்தனைகளை உருவாக்கு. இது முதலில் இருக்கும் தரவை அழிக்கும்.",
        button: "தரவை உருவாக்கு",
        confirmTitle: "புதிய டெமோ தரவை உருவாக்கவா?",
        confirmDescription:
          "இது இருக்கும் அனைத்துப் பரிவர்த்தனைகளையும் அழித்து புதிய டெமோ தரவை உருவாக்கும். இந்தச் செயலைத் திரும்பப் பெற முடியாது.",
        confirmButton: "உருவாக்கு",
      },
      export: {
        description: "Vaulted Money முழு காப்புப் பிரதி (அனைத்துப் பேரேடுகள்)",
        descriptionEncrypted: "Vaulted Money முழு காப்புப் பிரதி (குறியாக்கம்)",
        saved: "கோப்பு வெற்றிகரமாகச் சேமிக்கப்பட்டது!",
        started: "ஏற்றுமதிக் கோப்பின் பதிவிறக்கம் தொடங்கியது.",
        failed: "ஏற்றுமதி தோல்வியடைந்தது: {{message}}",
        encryptedSaved: "குறியாக்கக் கோப்பு வெற்றிகரமாகச் சேமிக்கப்பட்டது!",
        encryptionFailed: "குறியாக்கம் தோல்வியடைந்தது: {{message}}",
      },
      import: {
        done: "தரவு வெற்றிகரமாக இறக்குமதி செய்யப்பட்டது!",
        encryptedDone: "குறியாக்கத் தரவு வெற்றிகரமாக இறக்குமதி செய்யப்பட்டது!",
        failed: "இறக்குமதி தோல்வியடைந்தது",
      },
      encrypt: {
        title: "காப்புப் பிரதியை குறியாக்கு",
        description:
          "உங்கள் காப்புப் பிரதிக் கோப்பை குறியாக்க கடவுச்சொல்லை உள்ளிடவும். தரவை மீட்டமைக்க இந்தக் கடவுச்சொல் தேவை.",
        confirm: "குறியாக்கி பதிவிறக்கு",
      },
      decrypt: {
        title: "காப்புப் பிரதியை மறைநீக்கு",
        description:
          "இந்தக் கோப்பு குறியாக்கம் செய்யப்பட்டுள்ளது. தரவை மீட்டமைக்க கடவுச்சொல்லை உள்ளிடவும்.",
        confirm: "மறைநீக்கி இறக்குமதி செய்",
      },
    },
  },
};
