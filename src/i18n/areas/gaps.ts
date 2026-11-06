import type { AreaTranslations } from "./types";

/**
 * Text that English (and Dutch) have but the other bundled languages were missing. Machine-written: ask a native speaker to review.
 */
export const gaps: AreaTranslations = {
  es: {
    transactions: {
      toasts: {
        scheduleNotFound: {
          title: "Programación no encontrada",
          description: "Parece que la programación original fue eliminada.",
        },
        cleanupComplete: {
          title: "Limpieza completada",
          description: "Se eliminaron {{count}} transacciones duplicadas.",
        },
        noDuplicates: {
          title: "Sin duplicados",
          description: "No se encontraron transacciones duplicadas.",
        },
        cleanupFailed: {
          title: "Error al limpiar",
          description: "Ocurrió un error al eliminar los duplicados.",
        },
        nothingToCategorize: {
          title: "Nada que categorizar",
          description: "No se encontraron proveedores sin categoría.",
        },
        aiNotConfigured: {
          title: "IA sin configurar",
          description: "Configura tu proveedor de IA y tu clave de API",
          action: "Ir a la configuración de IA",
        },
        bulkCategorization: {
          title: "Categorización masiva",
          description:
            "Se categorizaron {{count}} transacciones correctamente.",
        },
        noChanges: {
          title: "Sin cambios",
          description:
            "La IA no pudo categorizar ningún elemento con seguridad o no se devolvieron asignaciones válidas.",
        },
        categorizationFailed: {
          title: "Error de categorización",
          apiKeyHint: "Revisa tu clave de API o la configuración del endpoint.",
          genericHint: "Ocurrió un error inesperado durante la categorización.",
        },
        unlinked: {
          title: "Transacciones desvinculadas",
          description: "Se quitó el vínculo de transferencia.",
        },
        linked: {
          title: "Transacciones vinculadas",
          description:
            "Las transacciones se emparejaron como una transferencia.",
        },
        filterUpdated: {
          title: "Filtro actualizado",
          description:
            'Se añadió "{{accountName}}" a tu vista para que puedas ver la nueva transacción.',
        },
        scheduleUpdated: {
          title: "Programación actualizada",
          description: "La transacción recurrente se actualizó.",
        },
        scheduleCreated: {
          title: "Programación creada",
          description: "Se programó una nueva transacción recurrente.",
        },
        scheduleSaveError: {
          title: "Error",
          description: "No se pudo guardar la programación.",
        },
      },
      confirmations: {
        removeDuplicatesTitle: "¿Eliminar transacciones duplicadas?",
        removeDuplicatesDescription:
          "Busca transacciones con el mismo ID de recurrencia en la misma fecha y elimina los duplicados. Esta acción no se puede deshacer.",
        cleaning: "Limpiando...",
        removeDuplicatesAction: "Eliminar duplicados",
        unlinkTitle: "¿Desvincular transacciones?",
        unlinkDescription:
          "¿Seguro que quieres romper el vínculo entre estas transacciones? Dejarán de tratarse como un par de transferencia.",
        unlinkAction: "Desvincular",
      },
    },
  },
  zh: {
    transactions: {
      toasts: {
        scheduleNotFound: {
          title: "未找到计划",
          description: "原始计划似乎已被删除。",
        },
        cleanupComplete: {
          title: "清理完成",
          description: "已删除 {{count}} 笔重复交易。",
        },
        noDuplicates: {
          title: "没有重复项",
          description: "未发现重复交易。",
        },
        cleanupFailed: {
          title: "清理失败",
          description: "删除重复项时发生错误。",
        },
        nothingToCategorize: {
          title: "没有需要分类的项目",
          description: "未发现未分类的商家。",
        },
        aiNotConfigured: {
          title: "未配置 AI",
          description: "请配置您的 AI 提供商和 API 密钥",
          action: "前往 AI 设置",
        },
        bulkCategorization: {
          title: "批量分类",
          description: "已成功分类 {{count}} 笔交易。",
        },
        noChanges: {
          title: "没有更改",
          description: "AI 无法确信地为任何项目分类，或未返回有效的映射。",
        },
        categorizationFailed: {
          title: "分类失败",
          apiKeyHint: "请检查您的 API 密钥或端点配置。",
          genericHint: "分类过程中发生意外错误。",
        },
        unlinked: {
          title: "交易已取消关联",
          description: "转账关联已移除。",
        },
        linked: {
          title: "交易已关联",
          description: "这些交易已配对为一笔转账。",
        },
        filterUpdated: {
          title: "筛选已更新",
          description: "已将“{{accountName}}”添加到您的视图，以便查看新交易。",
        },
        scheduleUpdated: {
          title: "计划已更新",
          description: "定期交易已更新。",
        },
        scheduleCreated: {
          title: "计划已创建",
          description: "已安排一笔新的定期交易。",
        },
        scheduleSaveError: {
          title: "错误",
          description: "无法保存计划。",
        },
      },
      confirmations: {
        removeDuplicatesTitle: "删除重复交易？",
        removeDuplicatesDescription:
          "此操作会扫描同一日期具有相同定期编号的交易并删除重复项。此操作无法撤销。",
        cleaning: "正在清理...",
        removeDuplicatesAction: "删除重复项",
        unlinkTitle: "取消关联交易？",
        unlinkDescription:
          "确定要断开这些交易之间的关联吗？它们将不再被视为一对转账。",
        unlinkAction: "取消关联",
      },
    },
    layout: {
      groups: {
        dashboards: "仪表盘",
        management: "管理",
        configure: "配置",
        setup: "初始设置",
      },
    },
    dialogs: {
      addEditTransaction: {
        tabs: {
          expense: "支出",
          income: "收入",
        },
        actions: {
          autoCategorize: "自动分类",
          add: "添加交易",
          save: "保存更改",
        },
        fields: {
          date: "日期",
          vendorReceiving: "商家 / 账户（收款）",
          category: "分类",
          subCategory: "子分类",
          amountSending: "金额（转出）",
          amountReceiving: "金额（转入）",
          remarks: "备注",
          recurrenceFrequency: "重复频率",
          recurrenceEndDate: "重复结束日期",
        },
        placeholders: {
          selectAccount: "选择账户...",
          searchAccounts: "搜索账户...",
          noAccountFound: "未找到账户。",
          selectVendorOrAccount: "选择商家或账户...",
          searchGeneric: "搜索...",
          noResults: "未找到结果。",
          selectCategory: "选择分类...",
          searchCategories: "搜索分类...",
          noCategoryFound: "未找到分类。",
          selectOrCreate: "选择或创建...",
          searchSubCategories: "搜索子分类...",
          noSubCategoryFound: "未找到子分类。",
          amount: "0.00",
          recurrence: "选择重复频率",
        },
        recurrenceOptions: {
          none: "无",
          daily: "每天",
          weekly: "每周",
          monthly: "每月",
          quarterly: "每季度",
          yearly: "每年",
        },
        helper: {
          recurrenceFrequency: "设置此交易的重复频率。",
          recurrenceEndDate: "此交易在该日期之后不再重复。",
        },
        description: {
          add: "快速向记录中添加一笔新交易。",
          edit: "修改这笔交易的详细信息。",
        },
      },
    },
    settings: {
      cards: {
        currency: {
          title: "默认货币",
          description: "选择您偏好的显示货币。",
        },
        ledger: {
          title: "账本设置",
          description: "管理当前账本详情或创建新账本。",
          edit: "编辑当前账本",
          create: "创建新账本",
        },
        future: {
          title: "未来交易",
          description: "设置显示未来多少个月的计划交易。",
          months: "个月",
        },
        language: {
          title: "语言与本地化",
          description:
            "使用一种主要语言（母语）。可通过语言代码和翻译 JSON 添加自定义语言。",
          active: "当前语言",
          enabled: "已启用语言",
          customTitle: "添加自定义语言",
          codePlaceholder: "语言代码（例如 de、ja、hi）",
          namePlaceholder: "显示名称（例如 German）",
          jsonLabel: "此语言的翻译 JSON（根节点 = 翻译键）",
          jsonPlaceholder: '{"layout":{"nav":{"dashboard":"..."}}}',
          save: "保存自定义语言",
          deleteActiveHint:
            "可使用垃圾桶图标删除自定义语言。如果删除当前使用的语言，应用将切换到备用语言（有英语时用英语，否则使用与浏览器匹配的其他受支持语言）。",
        },
      },
    },
    tour: {
      home: {
        "0": {
          content: "这是您的主仪表盘摘要，可一目了然地查看您的财务状况。",
        },
      },
    },
  },
  ta: {
    transactions: {
      toasts: {
        scheduleNotFound: {
          title: "திட்டம் கிடைக்கவில்லை",
          description: "அசல் திட்டம் நீக்கப்பட்டதாகத் தெரிகிறது.",
        },
        cleanupComplete: {
          title: "சுத்தம் செய்தல் முடிந்தது",
          description: "{{count}} நகல் பரிவர்த்தனைகள் அகற்றப்பட்டன.",
        },
        noDuplicates: {
          title: "நகல்கள் இல்லை",
          description: "நகல் பரிவர்த்தனைகள் எதுவும் கண்டறியப்படவில்லை.",
        },
        cleanupFailed: {
          title: "சுத்தம் செய்தல் தோல்வியடைந்தது",
          description: "நகல்களை அகற்றும்போது பிழை ஏற்பட்டது.",
        },
        nothingToCategorize: {
          title: "வகைப்படுத்த எதுவும் இல்லை",
          description: "வகைப்படுத்தப்படாத விற்பனையாளர்கள் இல்லை.",
        },
        aiNotConfigured: {
          title: "AI கட்டமைக்கப்படவில்லை",
          description: "உங்கள் AI வழங்குநரையும் API விசையையும் அமைக்கவும்",
          action: "AI அமைப்புகளுக்குச் செல்",
        },
        bulkCategorization: {
          title: "மொத்த வகைப்படுத்தல்",
          description:
            "{{count}} பரிவர்த்தனைகள் வெற்றிகரமாக வகைப்படுத்தப்பட்டன.",
        },
        noChanges: {
          title: "மாற்றங்கள் இல்லை",
          description:
            "AI எந்த உருப்படியையும் நம்பிக்கையுடன் வகைப்படுத்த முடியவில்லை அல்லது செல்லுபடியாகும் இணைப்புகள் எதுவும் திருப்பி அனுப்பப்படவில்லை.",
        },
        categorizationFailed: {
          title: "வகைப்படுத்தல் தோல்வியடைந்தது",
          apiKeyHint:
            "உங்கள் API விசை அல்லது எண்ட்பாயிண்ட் உள்ளமைவைச் சரிபார்க்கவும்.",
          genericHint: "வகைப்படுத்தும்போது எதிர்பாராத பிழை ஏற்பட்டது.",
        },
        unlinked: {
          title: "பரிவர்த்தனைகள் இணைப்பு நீக்கப்பட்டன",
          description: "பரிமாற்ற இணைப்பு அகற்றப்பட்டது.",
        },
        linked: {
          title: "பரிவர்த்தனைகள் இணைக்கப்பட்டன",
          description: "பரிவர்த்தனைகள் ஒரு பரிமாற்றமாக இணைக்கப்பட்டன.",
        },
        filterUpdated: {
          title: "வடிகட்டி புதுப்பிக்கப்பட்டது",
          description:
            'புதிய பரிவர்த்தனையைக் காண "{{accountName}}" உங்கள் பார்வையில் சேர்க்கப்பட்டது.',
        },
        scheduleUpdated: {
          title: "திட்டம் புதுப்பிக்கப்பட்டது",
          description: "தொடர் பரிவர்த்தனை புதுப்பிக்கப்பட்டது.",
        },
        scheduleCreated: {
          title: "திட்டம் உருவாக்கப்பட்டது",
          description: "புதிய தொடர் பரிவர்த்தனை திட்டமிடப்பட்டது.",
        },
        scheduleSaveError: {
          title: "பிழை",
          description: "திட்டத்தைச் சேமிக்க முடியவில்லை.",
        },
      },
      confirmations: {
        removeDuplicatesTitle: "நகல் பரிவர்த்தனைகளை அகற்றவா?",
        removeDuplicatesDescription:
          "ஒரே தேதியில் ஒரே தொடர் அடையாளத்தைக் கொண்ட பரிவர்த்தனைகளைத் தேடி நகல்களை அகற்றும். இந்தச் செயலைச் செயல்தவிர்க்க முடியாது.",
        cleaning: "சுத்தம் செய்கிறது...",
        removeDuplicatesAction: "நகல்களை அகற்று",
        unlinkTitle: "பரிவர்த்தனைகளின் இணைப்பை நீக்கவா?",
        unlinkDescription:
          "இந்தப் பரிவர்த்தனைகளுக்கு இடையிலான இணைப்பை நீக்க விரும்புகிறீர்களா? அவை இனி பரிமாற்ற ஜோடியாகக் கருதப்படாது.",
        unlinkAction: "இணைப்பை நீக்கு",
      },
    },
    dialogs: {
      common: {
        cancel: "ரத்து செய்",
        continue: "தொடரவும்",
        close: "மூடு",
        confirmAndImport: "உறுதிசெய்து இறக்குமதி செய்",
      },
      password: {
        label: "கடவுச்சொல்",
        placeholder: "கடவுச்சொல்லை உள்ளிடவும்",
        confirm: "உறுதிப்படுத்து",
      },
      recurrence: {
        titleEdit: "தொடர் பரிவர்த்தனையைத் திருத்து",
        titleDeleteOne: "தொடர் பரிவர்த்தனையை நீக்கு",
        titleDeleteMany: "தொடர் பரிவர்த்தனைகளை நீக்கு",
        titleDeleteSelected: "தேர்ந்தெடுத்த பரிவர்த்தனைகளை நீக்கு",
        descriptionEdit:
          "இந்தப் பரிவர்த்தனை ஒரு தொடரின் பகுதியாகும். மாற்றங்களை இந்த நிகழ்வுக்கு மட்டும் சேமிக்க விரும்புகிறீர்களா அல்லது எதிர்கால அட்டவணையையும் புதுப்பிக்க விரும்புகிறீர்களா?",
        descriptionDeleteOne:
          "இந்தப் பரிவர்த்தனை ஒரு தொடரின் பகுதியாகும். இந்த நிகழ்வை மட்டும் நீக்க விரும்புகிறீர்களா அல்லது இதையும் எதிர்கால நிகழ்வுகள் அனைத்தையும் நீக்க விரும்புகிறீர்களா?",
        descriptionDeleteMany:
          "நீங்கள் {{count}} தொடர் பரிவர்த்தனைகளைத் தேர்ந்தெடுத்துள்ளீர்கள். இந்த நிகழ்வுகளை மட்டும் நீக்க விரும்புகிறீர்களா அல்லது அவற்றின் எதிர்கால அட்டவணைகளையும் ரத்து செய்ய விரும்புகிறீர்களா?",
        descriptionDeleteSelected:
          "நீங்கள் {{count}} பரிவர்த்தனைகளைத் தேர்ந்தெடுத்துள்ளீர்கள். சில ஒரு தொடரின் பகுதியாகும். தேர்ந்தெடுத்த நிகழ்வுகளை மட்டும் (தற்போதையது மட்டும்) நீக்க விரும்புகிறீர்களா அல்லது தொடர் பரிவர்த்தனைகளின் எதிர்கால அட்டவணைகளையும் (தற்போதையது & எதிர்காலம்) சேர்க்க விரும்புகிறீர்களா?",
        currentOnly: "தற்போதையது மட்டும்",
        currentAndFuture: "தற்போதையது & எதிர்காலம்",
      },
      missingCurrency: {
        title: "புதிய கணக்குகளுக்கு நாணயத்தைத் தேர்ந்தெடுக்கவும்",
        description:
          "சில கணக்குகள் புதியவை, அவற்றின் நாணயத்தைத் தீர்மானிக்க முடியவில்லை. ஒவ்வொன்றுக்கும் சரியான நாணயத்தைத் தேர்ந்தெடுக்கவும்.",
        selectCurrency: "நாணயத்தைத் தேர்ந்தெடுக்கவும்",
      },
      globalProgress: {
        processing: "செயலாக்கப்படுகிறது...",
        waitDescription: "உங்கள் கோரிக்கையைச் செயலாக்கும் வரை காத்திருக்கவும்.",
        initializing: "தொடங்குகிறது...",
        complete: "முடிந்தது",
      },
    },
  },
};
