import type { Resource } from "i18next";
import { homeTranslations } from "./homeTranslations";
import { applyAreaTranslations } from "./areas";

export const builtInLanguageOptions = [
  {
    code: "zh",
    name: "Chinese (Mandarin)",
    nativeName: "中文",
    translationKey: "language.chinese",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    translationKey: "language.english",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    translationKey: "language.spanish",
  },
  {
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    translationKey: "language.dutch",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    translationKey: "language.tamil",
  },
] as const;

export const resources: Resource = {
  en: {
    translation: {
      language: {
        label: "Language",
        english: "English",
        spanish: "Spanish",
        chinese: "Mandarin Chinese",
        tamil: "Tamil",
        dutch: "Dutch",
        removeCustomAria: "Remove {{name}}",
        removeCustomConfirm:
          'Remove custom language "{{name}}"? You can add it again from Language settings.',
        openLanguageSettings: "Language settings",
        customRemoved: "Custom language removed.",
      },
      layout: {
        nav: {
          toggleMenu: "Toggle menu",
          dashboard: "Dashboard",
          calendar: "Calendar",
          analytics: "Analytics",
          insights: "Insights",
          transactions: "Transactions",
          accounts: "Accounts",
          categories: "Categories",
          vendors: "Vendors",
          currencies: "Currencies",
          aiProviders: "AI Providers",
          scheduled: "Scheduled",
          reports: "Reports",
          reportsEssential: "Essential",
          reportsAdvanced: "Advanced",
          budgets: "Budgets",
          ledger: "Ledger",
          data: "Data",
          backup: "Backup",
          donate: "Donate",
          settings: "Settings",
          logout: "Log out",
          myLedgers: "My Ledgers",
          languages: "Languages",
        },
        groups: {
          dashboards: "Dashboards",
          management: "Management",
          configure: "Configure",
          setup: "Setup",
        },
        footer: {
          tagline: "Privacy-first | Data-local | Open-sourced",
          heartLink: "Made with ❤️ for your financial freedom",
          madeBy: "Made by ",
          withHeart: " with ❤️ for your financial ",
          freedom: "freedom",
          githubAria: "Open Vaulted Money on GitHub",
          privacyPolicy: "Privacy Policy",
        },
      },
      dialogs: {
        eraseAll: {
          warningOne:
            "1 ledger and everything in it will be permanently deleted.",
          warningMany:
            "{{total}} ledgers and everything in them will be permanently deleted.",
          prompt: "Type {{phrase}} to confirm",
        },
        common: {
          cancel: "Cancel",
          continue: "Continue",
          close: "Close",
          confirmAndImport: "Confirm & Import",
        },
        password: {
          label: "Password",
          placeholder: "Enter password",
          confirm: "Confirm",
        },
        recurrence: {
          titleEdit: "Edit Recurring Transaction",
          titleDeleteOne: "Delete Recurring Transaction",
          titleDeleteMany: "Delete Recurring Transactions",
          titleDeleteSelected: "Delete Selected Transactions",
          descriptionEdit:
            "This transaction is part of a recurring series. Do you want to save changes to just this occurrence or update the future schedule as well?",
          descriptionDeleteOne:
            "This transaction is part of a recurring series. Do you want to delete just this occurrence or this and all future occurrences?",
          descriptionDeleteMany:
            "You have selected {{count}} recurring transactions. Do you want to delete only these specific instances or also cancel their future schedules?",
          descriptionDeleteSelected:
            "You have selected {{count}} transactions. Some are part of a recurring series. Do you want to delete only selected instances (Current Only) or include future schedules for recurring ones (Current & Future)?",
          currentOnly: "Current Only",
          currentAndFuture: "Current & Future",
        },
        missingCurrency: {
          title: "Select Currency for New Accounts",
          description:
            "Some accounts are new and their currency could not be determined. Select the correct currency for each.",
          selectCurrency: "Select currency",
        },
        globalProgress: {
          processing: "Processing...",
          waitDescription: "Please wait while we process your request.",
          initializing: "Initializing...",
          complete: "Complete",
        },
        addEditTransaction: {
          tabs: {
            expense: "Expense",
            income: "Income",
          },
          actions: {
            autoCategorize: "Auto-Categorize",
            add: "Add Transaction",
            save: "Save Changes",
          },
          fields: {
            date: "Date",
            accountSending: "Account (Sending)",
            vendorReceiving: "Vendor / Account (Receiving)",
            category: "Category",
            subCategory: "Sub-category",
            amountSending: "Amount (Sending)",
            amountReceiving: "Amount (Receiving)",
            remarks: "Remarks",
            recurrenceFrequency: "Recurrence Frequency",
            recurrenceEndDate: "Recurrence End Date",
          },
          placeholders: {
            selectAccount: "Select an account...",
            searchAccounts: "Search accounts...",
            noAccountFound: "No account found.",
            selectVendorOrAccount: "Select a vendor or account...",
            searchGeneric: "Search...",
            noResults: "No results found.",
            selectCategory: "Select a category...",
            searchCategories: "Search categories...",
            noCategoryFound: "No category found.",
            selectOrCreate: "Select or create...",
            searchSubCategories: "Search sub-categories...",
            noSubCategoryFound: "No sub-category found.",
            amount: "0.00",
            recurrence: "Select recurrence frequency",
          },
          recurrenceOptions: {
            none: "None",
            daily: "Daily",
            weekly: "Weekly",
            monthly: "Monthly",
            quarterly: "Quarterly",
            yearly: "Yearly",
          },
          helper: {
            recurrenceFrequency:
              "Set how often this transaction should repeat.",
            recurrenceEndDate:
              "The date after which this transaction will no longer recur.",
          },
          title: {
            add: "Add New Transaction",
            edit: "Edit Transaction",
          },
          description: {
            add: "Quickly add a new transaction to your records.",
            edit: "Modify the details of this transaction.",
          },
        },
      },
      helpTour: {
        start: "Start Help Tour",
        next: "Next",
        back: "Back",
        last: "Done",
        skip: "Skip",
      },
      dashboard: {
        runway: {
          title: "Financial Runway",
          subtitle: "Based on fixed expenses + recent spending",
          infinite: "Infinite",
          savingsGrowing: "Savings are growing!",
          burn: "Savings cover {{amount}}/mo burn",
          monthlyStats: "Monthly Stats",
          fixedCost: "Fixed Cost",
          avgSpending: "Avg Spending",
          totalSavings: "Total Savings",
          lessThanMonth: "< 1 Month",
          month_one: "{{count}} Month",
          month_other: "{{count}} Months",
          year_one: "{{count}} Year",
          year_other: "{{count}} Years",
        },
        budgetStatus: {
          title: "Budget Status",
          subtitle: "Monthly spending vs limits",
          used: "{{percent}}% Used",
          over: "{{amount}} over budget",
          remaining: "{{amount}} remaining",
          added: "+{{amount}} Added",
          spent: "-{{amount}} Spent",
          none: "No Budgets Set",
          noneHint: "Set up spending limits to track your financial goals.",
          create: "Create Budget",
        },
        overview: {
          title: "Overview • {{month}}",
          netWorth: "Net Worth",
          income: "Income",
          expenses: "Expenses",
        },
        recentActivity: {
          title: "Recent Activity Feed",
          empty: "No recent activity",
          unknown: "Unknown",
        },
        spendingByCategory: {
          title: "Spending by Category",
          description: "Top spending categories broken down by sub-category",
          uncategorized: "Uncategorized",
        },
        header: {
          subtitle: "Overview of your financial health",
        },
        balanceChart: {
          title: "Balance Over Time",
          totalBalance: "Total balance",
          balance: "Balance",
          lineChart: "Line Chart",
          stackedBarChart: "Stacked Bar Chart",
          waterfallChart: "Waterfall Chart",
        },
      },
      analytics: {
        header: {
          subtitle:
            "Review total spending and chart trends for the selected period.",
        },
        period: {
          thisWeek: "This week",
          thisMonth: "This month",
          customDateRange: "Custom date range",
          customRange: "Custom range",
          apply: "Apply",
        },
        summary: {
          totalSpent: "Total spent",
          noChange: "No change",
          selectedPeriod: "Selected period",
        },
        chart: {
          previousPeriod: "Previous period",
          nextPeriod: "Next period",
          lineChart: "Line chart",
          barChart: "Bar chart",
          pieChart: "Pie chart",
          loading: "Loading chart data...",
          noData: "No spending data for this period",
          spent: "Spent",
          previousShort: "prev",
          avgPerPeriod: "per period",
          avgPerMonth: "avg. per month",
          avgPerWeek: "avg. per week",
          avgPerDay: "avg. per day",
          spending: "Spending",
          max: "max",
          mean: "mean",
          unknown: "Unknown",
          reset: "Reset",
          spendingByCategory: "Spending by Category",
          tapToDrillDown: "Tap to drill down",
          spendingByVendor: "Spending by Vendor",
          total: "Total",
        },
        breakdown: {
          byCategory: "By Category",
          byMerchant: "By Merchant",
          byCurrency: "By Currency",
          byAccount: "By Account",
          goBack: "Go back",
          clear: "Clear",
          all: "All",
          noTransactionsFound: "No transactions found",
          noDataForView: "No data for this view",
          transactionCount: "{{count}} transactions",
          unknown: "Unknown",
          uncategorized: "Uncategorized",
        },
      },
      calendar: {
        header: {
          subtitle:
            "Explore monthly patterns and the transactions behind each day.",
        },
      },
      scheduled: {
        header: {
          title: "Scheduled Transactions",
          subtitle: "Manage recurring payments and transfers",
          autoSchedule: "Auto-Schedule",
          addScheduled: "Add Scheduled",
        },
      },
      filters: {
        searchBar: {
          placeholder: "Filter transactions...",
          excludeTransfers: "Exclude Transfers",
          reset: "Reset",
        },
        active: {
          dateSingle: "Date: {{date}}",
          dateRange: "Date: {{from}} - {{to}}",
          account: "Account: {{name}}",
          category: "Category: {{name}}",
          subCategory: "Sub: {{name}}",
          vendor: "Payee: {{name}}",
          search: 'Search: "{{query}}"',
          noMatch: "No Match",
        },
        conversational: {
          filterType: "Filter Type",
          category: "Category",
          account: "Account",
          vendor: "Vendor / Payee",
          detectedDate: "Detected Date",
          useDate: "Use Date: {{range}}",
          timeRangeAllTime: "Time Range: All Time",
          categories: "Categories",
          accounts: "Accounts",
          vendors: "Vendors",
          search: "Search",
          allCategories: "All Categories",
          allAccounts: "All Accounts",
          allVendors: "All Vendors",
          back: "Back",
          searchText: 'Search Text "{{input}}"',
          typePlaceholder:
            "Type to filter (e.g. 'Groceries', 'Next Week', 'Checking')...",
          filterBy: "Filter by {{step}}...",
          subCategorySuffix: "(Sub)",
        },
        input: {
          searchTransactions: "Search transactions",
          clearSearch: "Clear search",
          loadingSearchResults: "Loading search results",
          loading: "Loading...",
        },
        scheduled: {
          placeholder:
            "Search future transactions (e.g. 'Rent next month', 'Netflix')...",
          filteredByReference: "Filtered by Reference",
          clearReferenceFilter: "Clear reference filter",
          reset: "Reset",
        },
      },
      transactions: {
        header: {
          title: "Transactions",
          subtitle: "Manage and track your financial activities",
          importCsv: "Import CSV",
          exportCsv: "Export CSV",
          detectTransfers: "Detect Transfers",
          cleanupDuplicates: "Cleanup Duplicates",
          categorizeMissing: "Categorize Missing",
          addTransaction: "Add Transaction",
        },
        toasts: {
          scheduleNotFound: {
            title: "Schedule Not Found",
            description: "The original schedule seems to have been deleted.",
          },
          cleanupComplete: {
            title: "Cleanup Complete",
            description: "Removed {{count}} duplicate transactions.",
          },
          noDuplicates: {
            title: "No Duplicates",
            description: "No duplicate transactions were found.",
          },
          cleanupFailed: {
            title: "Cleanup Failed",
            description: "An error occurred while removing duplicates.",
          },
          nothingToCategorize: {
            title: "Nothing to categorize",
            description: "No uncategorized vendors found.",
          },
          aiNotConfigured: {
            title: "AI Not Configured",
            description: "Please configure your AI provider and API key",
            action: "Go to AI Settings",
          },
          bulkCategorization: {
            title: "Bulk Categorization",
            description: "Categorized {{count}} transactions successfully.",
          },
          noChanges: {
            title: "No changes",
            description:
              "The AI could not confidently categorize any items or no valid mappings were returned.",
          },
          categorizationFailed: {
            title: "Categorization Failed",
            apiKeyHint: "Please check your API key or endpoint configuration.",
            genericHint: "An unexpected error occurred during categorization.",
          },
          unlinked: {
            title: "Transactions Unlinked",
            description: "The transfer link has been removed.",
          },
          linked: {
            title: "Transactions Linked",
            description: "The transactions have been paired as a transfer.",
          },
          filterUpdated: {
            title: "Filter Updated",
            description:
              'Added "{{accountName}}" to your view so you can see the new transaction.',
          },
          scheduleUpdated: {
            title: "Schedule Updated",
            description: "The recurring transaction has been updated.",
          },
          scheduleCreated: {
            title: "Schedule Created",
            description: "A new recurring transaction has been scheduled.",
          },
          scheduleSaveError: {
            title: "Error",
            description: "Failed to save schedule.",
          },
        },
        confirmations: {
          removeDuplicatesTitle: "Remove Duplicate Transactions?",
          removeDuplicatesDescription:
            "This scans for transactions with identical recurrence IDs on the same date and removes duplicates. This action cannot be undone.",
          cleaning: "Cleaning...",
          removeDuplicatesAction: "Remove Duplicates",
          unlinkTitle: "Unlink Transactions?",
          unlinkDescription:
            "Are you sure you want to break the link between these transactions? They will no longer be treated as a transfer pair.",
          unlinkAction: "Unlink",
        },
      },
      settings: {
        cards: {
          currency: {
            title: "Default Currency",
            description: "Select your preferred currency for display.",
          },
          ledger: {
            title: "Ledger Settings",
            description:
              "Manage your current ledger details or create a new one.",
            edit: "Edit Current Ledger",
            create: "Create New Ledger",
          },
          future: {
            title: "Future Transactions",
            description:
              "Define how many months of future scheduled transactions to show.",
            months: "months",
          },
          language: {
            title: "Language and Localization",
            description:
              "Use one primary language (mother tongue). Add custom languages by code and translation JSON.",
            active: "Active Language",
            enabled: "Enabled Languages",
            customTitle: "Add Custom Language",
            codePlaceholder: "Language code (e.g. de, ja, hi)",
            namePlaceholder: "Display name (e.g. German)",
            jsonLabel:
              "Translation JSON for this language (root = translation keys)",
            jsonPlaceholder: '{"layout":{"nav":{"dashboard":"..."}}}',
            save: "Save Custom Language",
            deleteActiveHint:
              "Custom languages can be deleted with the trash icon. If you remove the language you are using, the app switches to a fallback (English when available, or another supported language that matches your browser).",
          },
        },
      },
      test: {
        draftLabel: "Draft Note",
      },
      tour: {
        home: {
          "0": {
            content:
              "This is your main dashboard summary showing your financial health at a glance.",
          },
        },
        language: {
          "0": {
            content:
              "Choose how Vaulted Money speaks to you. Pick your primary language or add a custom translation bundle.",
          },
          "1": {
            content:
              "Select one built-in language as your primary UI language. The interface updates instantly without losing your data.",
          },
          "2": {
            content:
              "Need a locale we do not ship? Add a code, display name, and translation JSON to extend the app.",
          },
        },
      },
    },
  },
  es: {
    translation: {
      language: {
        label: "Idioma",
        english: "Inglés",
        spanish: "Español",
        chinese: "Chino mandarín",
        tamil: "Tamil",
        dutch: "Neerlandés",
        removeCustomAria: "Quitar {{name}}",
        removeCustomConfirm:
          '¿Quitar el idioma personalizado "{{name}}"? Puedes volver a agregarlo en Idioma.',
        openLanguageSettings: "Ajustes de idioma",
        customRemoved: "Idioma personalizado eliminado.",
      },
      layout: {
        nav: {
          toggleMenu: "Alternar menu",
          dashboard: "Tablero",
          calendar: "Calendario",
          analytics: "Analiticas",
          insights: "Ideas",
          transactions: "Transacciones",
          accounts: "Cuentas",
          categories: "Categorias",
          vendors: "Proveedores",
          currencies: "Monedas",
          aiProviders: "Proveedores de IA",
          scheduled: "Programado",
          reports: "Informes",
          reportsEssential: "Esencial",
          reportsAdvanced: "Avanzado",
          budgets: "Presupuestos",
          ledger: "Libro",
          data: "Datos",
          backup: "Copia de seguridad",
          donate: "Donar",
          settings: "Configuracion",
          logout: "Cerrar sesion",
          myLedgers: "Mis libros",
          languages: "Idiomas",
        },
        groups: {
          dashboards: "Paneles",
          management: "Gestion",
          configure: "Configurar",
          setup: "Configuracion",
        },
        footer: {
          tagline: "Privacidad primero | Datos locales | Codigo abierto",
          heartLink: "Hecho con ❤️ para tu libertad financiera",
          madeBy: "Hecho por ",
          withHeart: " con ❤️ para tu libertad ",
          freedom: "financiera",
          githubAria: "Abrir Vaulted Money en GitHub",
          privacyPolicy: "Política de privacidad",
        },
      },
      dialogs: {
        eraseAll: {
          warningOne:
            "1 libro y todo su contenido se eliminarán de forma permanente.",
          warningMany:
            "{{total}} libros y todo su contenido se eliminarán de forma permanente.",
          prompt: "Escribe {{phrase}} para confirmar",
        },
        common: {
          cancel: "Cancelar",
          continue: "Continuar",
          close: "Cerrar",
          confirmAndImport: "Confirmar e importar",
        },
        password: {
          label: "Contrasena",
          placeholder: "Ingrese contrasena",
          confirm: "Confirmar",
        },
        recurrence: {
          titleEdit: "Editar transaccion recurrente",
          titleDeleteOne: "Eliminar transaccion recurrente",
          titleDeleteMany: "Eliminar transacciones recurrentes",
          titleDeleteSelected: "Eliminar transacciones seleccionadas",
          descriptionEdit:
            "Esta transaccion forma parte de una serie recurrente. Desea guardar cambios solo para esta ocurrencia o actualizar tambien la programacion futura?",
          descriptionDeleteOne:
            "Esta transaccion forma parte de una serie recurrente. Desea eliminar solo esta ocurrencia o tambien todas las futuras?",
          descriptionDeleteMany:
            "Ha seleccionado {{count}} transacciones recurrentes. Desea eliminar solo estas instancias o tambien cancelar la programacion futura?",
          descriptionDeleteSelected:
            "Ha seleccionado {{count}} transacciones. Algunas forman parte de una serie recurrente. Desea eliminar solo las instancias seleccionadas o incluir tambien las futuras?",
          currentOnly: "Solo actual",
          currentAndFuture: "Actual y futuras",
        },
        missingCurrency: {
          title: "Seleccionar moneda para nuevas cuentas",
          description:
            "Algunas cuentas son nuevas y no se pudo determinar su moneda. Seleccione la moneda correcta para cada una.",
          selectCurrency: "Seleccionar moneda",
        },
        globalProgress: {
          processing: "Procesando...",
          waitDescription: "Espere mientras procesamos su solicitud.",
          initializing: "Inicializando...",
          complete: "Completado",
        },
        addEditTransaction: {
          tabs: {
            expense: "Gasto",
            income: "Ingreso",
          },
          actions: {
            autoCategorize: "Auto-categorizar",
            add: "Agregar transaccion",
            save: "Guardar cambios",
          },
          fields: {
            date: "Fecha",
            accountSending: "Cuenta (envio)",
            vendorReceiving: "Proveedor / Cuenta (recepcion)",
            category: "Categoria",
            subCategory: "Subcategoria",
            amountSending: "Monto (envio)",
            amountReceiving: "Monto (recepcion)",
            remarks: "Comentarios",
            recurrenceFrequency: "Frecuencia de recurrencia",
            recurrenceEndDate: "Fecha final de recurrencia",
          },
          placeholders: {
            selectAccount: "Seleccione una cuenta...",
            searchAccounts: "Buscar cuentas...",
            noAccountFound: "No se encontro una cuenta.",
            selectVendorOrAccount: "Seleccione un proveedor o cuenta...",
            searchGeneric: "Buscar...",
            noResults: "No hay resultados.",
            selectCategory: "Seleccione una categoria...",
            searchCategories: "Buscar categorias...",
            noCategoryFound: "No se encontro una categoria.",
            selectOrCreate: "Seleccionar o crear...",
            searchSubCategories: "Buscar subcategorias...",
            noSubCategoryFound: "No se encontro una subcategoria.",
            amount: "0.00",
            recurrence: "Seleccione frecuencia de recurrencia",
          },
          recurrenceOptions: {
            none: "Ninguna",
            daily: "Diaria",
            weekly: "Semanal",
            monthly: "Mensual",
            quarterly: "Trimestral",
            yearly: "Anual",
          },
          helper: {
            recurrenceFrequency:
              "Defina con que frecuencia debe repetirse esta transaccion.",
            recurrenceEndDate:
              "La fecha despues de la cual esta transaccion dejara de repetirse.",
          },
          title: {
            add: "Agregar nueva transaccion",
            edit: "Editar transaccion",
          },
          description: {
            add: "Agrega rapidamente una nueva transaccion a tus registros.",
            edit: "Modifica los detalles de esta transaccion.",
          },
        },
      },
      helpTour: {
        start: "Iniciar recorrido de ayuda",
        next: "Siguiente",
        back: "Atras",
        last: "Finalizar",
        skip: "Omitir",
      },
      dashboard: {
        runway: {
          title: "Autonomía financiera",
          subtitle: "Basado en gastos fijos + gasto reciente",
          infinite: "Infinita",
          savingsGrowing: "¡Tus ahorros están creciendo!",
          burn: "Los ahorros cubren {{amount}}/mes de gasto",
          monthlyStats: "Estadísticas mensuales",
          fixedCost: "Costo fijo",
          avgSpending: "Gasto promedio",
          totalSavings: "Ahorros totales",
          lessThanMonth: "< 1 mes",
          month_one: "{{count}} mes",
          month_other: "{{count}} meses",
          year_one: "{{count}} año",
          year_other: "{{count}} años",
        },
        budgetStatus: {
          title: "Estado del presupuesto",
          subtitle: "Gasto mensual frente a límites",
          used: "{{percent}}% usado",
          over: "{{amount}} sobre el presupuesto",
          remaining: "{{amount}} restantes",
          added: "+{{amount}} añadido",
          spent: "-{{amount}} gastado",
          none: "Sin presupuestos",
          noneHint:
            "Define límites de gasto para seguir tus metas financieras.",
          create: "Crear presupuesto",
        },
        overview: {
          title: "Resumen • {{month}}",
          netWorth: "Patrimonio neto",
          income: "Ingresos",
          expenses: "Gastos",
        },
        recentActivity: {
          title: "Actividad reciente",
          empty: "Sin actividad reciente",
          unknown: "Desconocido",
        },
        spendingByCategory: {
          title: "Gasto por categoría",
          description:
            "Principales categorías de gasto desglosadas por subcategoría",
          uncategorized: "Sin categoría",
        },
        header: {
          subtitle: "Resumen de tu salud financiera",
        },
        balanceChart: {
          title: "Saldo a lo largo del tiempo",
          totalBalance: "Saldo total",
          balance: "Saldo",
          lineChart: "Grafico de lineas",
          stackedBarChart: "Grafico de barras apiladas",
          waterfallChart: "Grafico de cascada",
        },
      },
      analytics: {
        header: {
          subtitle:
            "Revisa el gasto total y las tendencias de los graficos para el periodo seleccionado.",
        },
        period: {
          thisWeek: "Esta semana",
          thisMonth: "Este mes",
          customDateRange: "Rango personalizado",
          customRange: "Rango personalizado",
          apply: "Aplicar",
        },
        summary: {
          totalSpent: "Total gastado",
          noChange: "Sin cambios",
          selectedPeriod: "Periodo seleccionado",
        },
        chart: {
          previousPeriod: "Periodo anterior",
          nextPeriod: "Periodo siguiente",
          lineChart: "Grafico de lineas",
          barChart: "Grafico de barras",
          pieChart: "Grafico circular",
          loading: "Cargando datos del grafico...",
          noData: "No hay datos de gasto para este periodo",
          spent: "Gastado",
          previousShort: "ant.",
          avgPerPeriod: "por periodo",
          avgPerMonth: "prom. por mes",
          avgPerWeek: "prom. por semana",
          avgPerDay: "prom. por dia",
          spending: "Gasto",
          max: "max.",
          mean: "media",
          unknown: "Desconocido",
          reset: "Restablecer",
          spendingByCategory: "Gasto por categoria",
          tapToDrillDown: "Toca para profundizar",
          spendingByVendor: "Gasto por proveedor",
          total: "Total",
        },
        breakdown: {
          byCategory: "Por categoria",
          byMerchant: "Por proveedor",
          byCurrency: "Por moneda",
          byAccount: "Por cuenta",
          goBack: "Volver",
          clear: "Limpiar",
          all: "Todo",
          noTransactionsFound: "No se encontraron transacciones",
          noDataForView: "No hay datos para esta vista",
          transactionCount: "{{count}} transacciones",
          unknown: "Desconocido",
          uncategorized: "Sin categorizar",
        },
      },
      calendar: {
        header: {
          subtitle:
            "Explora los patrones mensuales y las transacciones detras de cada dia.",
        },
      },
      scheduled: {
        header: {
          title: "Transacciones programadas",
          subtitle: "Gestiona pagos y transferencias recurrentes",
          autoSchedule: "Auto-programar",
          addScheduled: "Agregar programada",
        },
      },
      filters: {
        searchBar: {
          placeholder: "Filtrar transacciones...",
          excludeTransfers: "Excluir transferencias",
          reset: "Restablecer",
        },
        active: {
          dateSingle: "Fecha: {{date}}",
          dateRange: "Fecha: {{from}} - {{to}}",
          account: "Cuenta: {{name}}",
          category: "Categoria: {{name}}",
          subCategory: "Sub: {{name}}",
          vendor: "Proveedor: {{name}}",
          search: 'Buscar: "{{query}}"',
          noMatch: "Sin coincidencia",
        },
        conversational: {
          filterType: "Tipo de filtro",
          category: "Categoria",
          account: "Cuenta",
          vendor: "Proveedor / beneficiario",
          detectedDate: "Fecha detectada",
          useDate: "Usar fecha: {{range}}",
          timeRangeAllTime: "Periodo: todo el tiempo",
          categories: "Categorias",
          accounts: "Cuentas",
          vendors: "Proveedores",
          search: "Buscar",
          allCategories: "Todas las categorias",
          allAccounts: "Todas las cuentas",
          allVendors: "Todos los proveedores",
          back: "Volver",
          searchText: 'Buscar texto "{{input}}"',
          typePlaceholder:
            "Escribe para filtrar (ej. 'Supermercado', 'La proxima semana', 'Corriente')...",
          filterBy: "Filtrar por {{step}}...",
          subCategorySuffix: "(Sub)",
        },
        input: {
          searchTransactions: "Buscar transacciones",
          clearSearch: "Borrar busqueda",
          loadingSearchResults: "Cargando resultados de busqueda",
          loading: "Cargando...",
        },
        scheduled: {
          placeholder:
            "Buscar transacciones futuras (ej. 'Alquiler el proximo mes', 'Netflix')...",
          filteredByReference: "Filtrado por referencia",
          clearReferenceFilter: "Borrar filtro de referencia",
          reset: "Restablecer",
        },
      },
      transactions: {
        header: {
          title: "Transacciones",
          subtitle: "Gestiona y sigue tus actividades financieras",
          importCsv: "Importar CSV",
          exportCsv: "Exportar CSV",
          detectTransfers: "Detectar transferencias",
          cleanupDuplicates: "Limpiar duplicados",
          categorizeMissing: "Categorizar faltantes",
          addTransaction: "Agregar transaccion",
        },
      },
      settings: {
        cards: {
          currency: {
            title: "Moneda predeterminada",
            description: "Selecciona tu moneda preferida para mostrar.",
          },
          ledger: {
            title: "Configuracion del libro",
            description:
              "Administra los detalles de tu libro actual o crea uno nuevo.",
            edit: "Editar libro actual",
            create: "Crear nuevo libro",
          },
          future: {
            title: "Transacciones futuras",
            description:
              "Define cuántos meses de transacciones programadas futuras mostrar.",
            months: "meses",
          },
          language: {
            title: "Idioma y localizacion",
            description:
              "Usa un solo idioma principal (lengua materna). Agrega idiomas personalizados con codigo y JSON de traduccion.",
            active: "Idioma activo",
            enabled: "Idiomas habilitados",
            customTitle: "Agregar idioma personalizado",
            codePlaceholder: "Codigo de idioma (ej. de, ja, hi)",
            namePlaceholder: "Nombre para mostrar (ej. Aleman)",
            jsonLabel: "JSON de traduccion para este idioma",
            jsonPlaceholder: '{"layout":{"nav":{"dashboard":"..."}}}',
            save: "Guardar idioma personalizado",
            deleteActiveHint:
              "Los idiomas personalizados se pueden eliminar con el icono de papelera. Si quitas el idioma activo, la app pasa a un idioma de respaldo (ingles si esta disponible, u otro idioma admitido segun tu navegador).",
          },
        },
      },
      test: {
        draftLabel: "Nota de borrador",
      },
      tour: {
        home: {
          "0": {
            content:
              "Este es tu resumen del tablero principal que muestra tu salud financiera de un vistazo.",
          },
        },
        language: {
          "0": {
            content:
              "Elige como te habla Vaulted Money. Selecciona tu idioma principal o agrega un paquete de traduccion personalizado.",
          },
          "1": {
            content:
              "Elige un idioma integrado como idioma principal de la interfaz. La interfaz se actualiza al instante sin perder tus datos.",
          },
          "2": {
            content:
              "¿Necesitas una variante que no incluimos? Agrega codigo, nombre visible y JSON de traduccion para ampliar la app.",
          },
        },
      },
    },
  },
  zh: {
    translation: {
      language: {
        label: "语言",
        english: "英语",
        spanish: "西班牙语",
        chinese: "中文",
        tamil: "泰米尔语",
        dutch: "荷兰语",
        removeCustomAria: "移除 {{name}}",
        removeCustomConfirm:
          "要移除自定义语言“{{name}}”吗？可在语言设置中重新添加。",
        openLanguageSettings: "语言设置",
        customRemoved: "已移除自定义语言。",
      },
      layout: {
        nav: {
          toggleMenu: "切换菜单",
          dashboard: "仪表盘",
          calendar: "日历",
          analytics: "分析",
          insights: "洞察",
          transactions: "交易",
          accounts: "账户",
          categories: "分类",
          vendors: "商家",
          currencies: "货币",
          aiProviders: "AI 提供商",
          scheduled: "计划",
          reports: "报表",
          reportsEssential: "基础",
          reportsAdvanced: "高级",
          budgets: "预算",
          ledger: "账本",
          data: "数据",
          backup: "备份",
          donate: "捐赠",
          settings: "设置",
          logout: "退出",
          myLedgers: "我的账本",
          languages: "语言",
        },
        footer: {
          tagline: "隐私优先 | 数据本地 | 开源",
          heartLink: "用 ❤️ 助你实现财务自由",
          madeBy: "由 ",
          withHeart: " 用 ❤️ 制作，助你实现财务 ",
          freedom: "自由",
          githubAria: "在 GitHub 上打开 Vaulted Money",
          privacyPolicy: "隐私政策",
        },
      },
      dialogs: {
        eraseAll: {
          warningOne: "1 个账本及其全部内容将被永久删除。",
          warningMany: "{{total}} 个账本及其全部内容将被永久删除。",
          prompt: "输入 {{phrase}} 以确认",
        },
        common: {
          cancel: "取消",
          continue: "继续",
          close: "关闭",
          confirmAndImport: "确认并导入",
        },
        password: {
          label: "密码",
          placeholder: "请输入密码",
          confirm: "确认",
        },
        recurrence: {
          titleEdit: "编辑周期性交易",
          titleDeleteOne: "删除周期性交易",
          titleDeleteMany: "删除周期性交易",
          titleDeleteSelected: "删除已选交易",
          descriptionEdit:
            "此交易属于周期性系列。仅更新当前这笔，还是同时更新未来计划？",
          descriptionDeleteOne:
            "此交易属于周期性系列。仅删除当前这笔，还是同时删除未来发生项？",
          descriptionDeleteMany:
            "你已选择 {{count}} 笔周期性交易。仅删除当前项，还是同时取消未来计划？",
          descriptionDeleteSelected:
            "你已选择 {{count}} 笔交易，其中一些属于周期性系列。仅删除当前项，还是包含未来项？",
          currentOnly: "仅当前",
          currentAndFuture: "当前及未来",
        },
        missingCurrency: {
          title: "为新账户选择币种",
          description:
            "部分账户是新建的，系统无法确定其币种。请为每个账户选择正确币种。",
          selectCurrency: "选择币种",
        },
        globalProgress: {
          processing: "处理中...",
          waitDescription: "请稍候，我们正在处理你的请求。",
          initializing: "初始化中...",
          complete: "完成",
        },
        addEditTransaction: {
          fields: {
            accountSending: "Compte (envoi)",
          },
          title: {
            add: "Ajouter une nouvelle transaction",
            edit: "Modifier la transaction",
          },
        },
      },
      helpTour: {
        start: "开始帮助引导",
        next: "下一步",
        back: "上一步",
        last: "完成",
        skip: "跳过",
      },
      dashboard: {
        runway: {
          title: "财务跑道",
          subtitle: "基于固定支出和近期消费",
          infinite: "无限",
          savingsGrowing: "储蓄正在增长！",
          burn: "储蓄可覆盖每月 {{amount}} 的消耗",
          monthlyStats: "月度统计",
          fixedCost: "固定成本",
          avgSpending: "平均支出",
          totalSavings: "储蓄总额",
          lessThanMonth: "不足 1 个月",
          month_other: "{{count}} 个月",
          year_other: "{{count}} 年",
        },
        budgetStatus: {
          title: "预算状态",
          subtitle: "每月支出与限额",
          used: "已使用 {{percent}}%",
          over: "超出预算 {{amount}}",
          remaining: "剩余 {{amount}}",
          added: "已添加 +{{amount}}",
          spent: "已支出 -{{amount}}",
          none: "未设置预算",
          noneHint: "设置支出限额以追踪您的财务目标。",
          create: "创建预算",
        },
        overview: {
          title: "概览 • {{month}}",
          netWorth: "净资产",
          income: "收入",
          expenses: "支出",
        },
        recentActivity: {
          title: "最近活动",
          empty: "暂无最近活动",
          unknown: "未知",
        },
        spendingByCategory: {
          title: "按类别支出",
          description: "按子类别细分的主要支出类别",
          uncategorized: "未分类",
        },
        header: {
          subtitle: "概览你的财务健康状况",
        },
        balanceChart: {
          title: "余额变化",
          totalBalance: "总余额",
          balance: "余额",
          lineChart: "折线图",
          stackedBarChart: "堆叠柱状图",
          waterfallChart: "瀑布图",
        },
      },
      analytics: {
        header: {
          subtitle: "查看所选期间的总支出和图表趋势。",
        },
        period: {
          thisWeek: "本周",
          thisMonth: "本月",
          customDateRange: "自定义日期范围",
          customRange: "自定义范围",
          apply: "应用",
        },
        summary: {
          totalSpent: "总支出",
          noChange: "无变化",
          selectedPeriod: "所选期间",
        },
        chart: {
          previousPeriod: "上一个期间",
          nextPeriod: "下一个期间",
          lineChart: "折线图",
          barChart: "柱状图",
          pieChart: "饼图",
          loading: "正在加载图表数据...",
          noData: "此期间没有支出数据",
          spent: "支出",
          previousShort: "上期",
          avgPerPeriod: "每个期间",
          avgPerMonth: "月均",
          avgPerWeek: "周均",
          avgPerDay: "日均",
          spending: "支出",
          max: "最大",
          mean: "平均",
          unknown: "未知",
          reset: "重置",
          spendingByCategory: "按分类支出",
          tapToDrillDown: "点击下钻",
          spendingByVendor: "按商家支出",
          total: "总计",
        },
        breakdown: {
          byCategory: "按分类",
          byMerchant: "按商家",
          byCurrency: "按币种",
          byAccount: "按账户",
          goBack: "返回",
          clear: "清除",
          all: "全部",
          noTransactionsFound: "未找到交易",
          noDataForView: "此视图没有数据",
          transactionCount: "{{count}} 笔交易",
          unknown: "未知",
          uncategorized: "未分类",
        },
      },
      calendar: {
        header: {
          subtitle: "查看每个月的模式以及每天背后的交易。",
        },
      },
      scheduled: {
        header: {
          title: "定期交易",
          subtitle: "管理重复付款和转账",
          autoSchedule: "自动安排",
          addScheduled: "添加定期交易",
        },
      },
      filters: {
        searchBar: {
          placeholder: "筛选交易...",
          excludeTransfers: "排除转账",
          reset: "重置",
        },
        active: {
          dateSingle: "日期：{{date}}",
          dateRange: "日期：{{from}} - {{to}}",
          account: "账户：{{name}}",
          category: "分类：{{name}}",
          subCategory: "子类：{{name}}",
          vendor: "收款方：{{name}}",
          search: '搜索："{{query}}"',
          noMatch: "无匹配",
        },
        conversational: {
          filterType: "筛选类型",
          category: "分类",
          account: "账户",
          vendor: "商家/收款方",
          detectedDate: "检测到的日期",
          useDate: "使用日期：{{range}}",
          timeRangeAllTime: "时间范围：全部时间",
          categories: "分类",
          accounts: "账户",
          vendors: "商家",
          search: "搜索",
          allCategories: "所有分类",
          allAccounts: "所有账户",
          allVendors: "所有商家",
          back: "返回",
          searchText: '搜索文本 "{{input}}"',
          typePlaceholder: "输入以筛选（例如 '杂货'、'下周'、'支票账户'）...",
          filterBy: "按{{step}}筛选...",
          subCategorySuffix: "（子类）",
        },
        input: {
          searchTransactions: "搜索交易",
          clearSearch: "清除搜索",
          loadingSearchResults: "正在加载搜索结果",
          loading: "加载中...",
        },
        scheduled: {
          placeholder: "搜索未来交易（例如 '下个月房租'、'Netflix'）...",
          filteredByReference: "按引用筛选",
          clearReferenceFilter: "清除引用筛选",
          reset: "重置",
        },
      },
      transactions: {
        header: {
          title: "交易",
          subtitle: "管理并跟踪你的财务活动",
          importCsv: "导入 CSV",
          exportCsv: "导出 CSV",
          detectTransfers: "检测转账",
          cleanupDuplicates: "清理重复项",
          categorizeMissing: "整理未分类项",
          addTransaction: "添加交易",
        },
      },
      test: {
        draftLabel: "草稿备注",
      },
      tour: {
        language: {
          "0": {
            content: "在此选择 Vaulted Money 的界面语言，或添加自定义翻译包。",
          },
          "1": {
            content:
              "选择一个内置语言作为界面主语言；切换会立即生效，不会丢失数据。",
          },
          "2": {
            content:
              "需要未内置的语言？填写语言代码、显示名称和翻译 JSON 即可扩展应用。",
          },
        },
      },
    },
  },
  nl: {
    translation: {
      language: {
        label: "Taal",
        english: "Engels",
        spanish: "Spaans",
        chinese: "Mandarijn",
        tamil: "Tamil",
        dutch: "Nederlands",
        removeCustomAria: "{{name}} verwijderen",
        removeCustomConfirm:
          'Aangepaste taal "{{name}}" verwijderen? Je kunt deze opnieuw toevoegen via Taalinstellingen.',
        openLanguageSettings: "Taalinstellingen",
        customRemoved: "Aangepaste taal verwijderd.",
      },
      layout: {
        nav: {
          toggleMenu: "Menu wisselen",
          dashboard: "Dashboard",
          calendar: "Kalender",
          analytics: "Analytics",
          insights: "Inzichten",
          transactions: "Transacties",
          accounts: "Rekeningen",
          categories: "Categorieën",
          vendors: "Leveranciers",
          currencies: "Valuta",
          aiProviders: "AI-providers",
          scheduled: "Gepland",
          reports: "Rapporten",
          reportsEssential: "Essentieel",
          reportsAdvanced: "Geavanceerd",
          budgets: "Budgetten",
          ledger: "Grootboek",
          data: "Gegevens",
          backup: "Back-up",
          donate: "Doneren",
          settings: "Instellingen",
          logout: "Afmelden",
          myLedgers: "Mijn grootboeken",
          languages: "Talen",
        },
        groups: {
          dashboards: "Dashboards",
          management: "Beheer",
          configure: "Configureren",
          setup: "Instellen",
        },
        footer: {
          tagline: "Privacy eerst | Gegevens lokaal | Open source",
          heartLink: "Met ❤️ gemaakt voor jouw financiële vrijheid",
          madeBy: "Gemaakt door ",
          withHeart: " met ❤️ voor jouw financiële ",
          freedom: "vrijheid",
          githubAria: "Vaulted Money openen op GitHub",
          privacyPolicy: "Privacybeleid",
        },
      },
      dialogs: {
        eraseAll: {
          warningOne: "1 grootboek en alles erin wordt permanent verwijderd.",
          warningMany:
            "{{total}} grootboeken en alles erin worden permanent verwijderd.",
          prompt: "Typ {{phrase}} om te bevestigen",
        },
        common: {
          cancel: "Annuleren",
          continue: "Doorgaan",
          close: "Sluiten",
          confirmAndImport: "Bevestigen en importeren",
        },
        password: {
          label: "Wachtwoord",
          placeholder: "Voer wachtwoord in",
          confirm: "Bevestigen",
        },
        recurrence: {
          titleEdit: "Terugkerende transactie bewerken",
          titleDeleteOne: "Terugkerende transactie verwijderen",
          titleDeleteMany: "Terugkerende transacties verwijderen",
          titleDeleteSelected: "Geselecteerde transacties verwijderen",
          descriptionEdit:
            "Deze transactie maakt deel uit van een terugkerende reeks. Wil je wijzigingen alleen voor deze keer opslaan of ook het toekomstige schema bijwerken?",
          descriptionDeleteOne:
            "Deze transactie maakt deel uit van een terugkerende reeks. Wil je alleen deze keer verwijderen of ook alle toekomstige keren?",
          descriptionDeleteMany:
            "Je hebt {{count}} terugkerende transacties geselecteerd. Wil je alleen deze specifieke instanties verwijderen of ook hun toekomstige schema's annuleren?",
          descriptionDeleteSelected:
            "Je hebt {{count}} transacties geselecteerd. Sommige maken deel uit van een terugkerende reeks. Wil je alleen de geselecteerde instanties verwijderen (Alleen huidige) of ook toekomstige schema's voor terugkerende transacties (Huidig en toekomstig)?",
          currentOnly: "Alleen huidige",
          currentAndFuture: "Huidig en toekomstig",
        },
        missingCurrency: {
          title: "Valuta selecteren voor nieuwe rekeningen",
          description:
            "Sommige rekeningen zijn nieuw en hun valuta kon niet worden bepaald. Selecteer voor elke rekening de juiste valuta.",
          selectCurrency: "Valuta selecteren",
        },
        globalProgress: {
          processing: "Bezig met verwerken...",
          waitDescription: "Even geduld terwijl we je verzoek verwerken.",
          initializing: "Initialiseren...",
          complete: "Voltooid",
        },
        addEditTransaction: {
          tabs: {
            expense: "Uitgave",
            income: "Inkomsten",
          },
          actions: {
            autoCategorize: "Automatisch categoriseren",
            add: "Transactie toevoegen",
            save: "Wijzigingen opslaan",
          },
          fields: {
            date: "Datum",
            accountSending: "Rekening (afzender)",
            vendorReceiving: "Leverancier / rekening (ontvanger)",
            category: "Categorie",
            subCategory: "Subcategorie",
            amountSending: "Bedrag (afzender)",
            amountReceiving: "Bedrag (ontvanger)",
            remarks: "Opmerkingen",
            recurrenceFrequency: "Herhalingsfrequentie",
            recurrenceEndDate: "Einddatum herhaling",
          },
          placeholders: {
            selectAccount: "Selecteer een rekening...",
            searchAccounts: "Zoek rekeningen...",
            noAccountFound: "Geen rekening gevonden.",
            selectVendorOrAccount: "Selecteer leverancier of rekening...",
            searchGeneric: "Zoeken...",
            noResults: "Geen resultaten gevonden.",
            selectCategory: "Selecteer een categorie...",
            searchCategories: "Zoek categorieën...",
            noCategoryFound: "Geen categorie gevonden.",
            selectOrCreate: "Selecteer of maak...",
            searchSubCategories: "Zoek subcategorieën...",
            noSubCategoryFound: "Geen subcategorie gevonden.",
            amount: "0,00",
            recurrence: "Selecteer herhalingsfrequentie",
          },
          recurrenceOptions: {
            none: "Geen",
            daily: "Dagelijks",
            weekly: "Wekelijks",
            monthly: "Maandelijks",
            quarterly: "Per kwartaal",
            yearly: "Jaarlijks",
          },
          helper: {
            recurrenceFrequency:
              "Stel in hoe vaak deze transactie moet worden herhaald.",
            recurrenceEndDate:
              "De datum na welke deze transactie niet meer wordt herhaald.",
          },
          title: {
            add: "Nieuwe transactie toevoegen",
            edit: "Transactie bewerken",
          },
          description: {
            add: "Voeg snel een nieuwe transactie toe aan je administratie.",
            edit: "Pas de gegevens van deze transactie aan.",
          },
        },
      },
      helpTour: {
        start: "Hulp-rondleiding starten",
        next: "Volgende",
        back: "Terug",
        last: "Klaar",
        skip: "Overslaan",
      },
      dashboard: {
        runway: {
          title: "Financiële looptijd",
          subtitle: "Gebaseerd op vaste lasten + recente uitgaven",
          infinite: "Oneindig",
          savingsGrowing: "Je spaargeld groeit!",
          burn: "Spaargeld dekt {{amount}}/mnd aan uitgaven",
          monthlyStats: "Maandstatistieken",
          fixedCost: "Vaste kosten",
          avgSpending: "Gem. uitgaven",
          totalSavings: "Totaal spaargeld",
          lessThanMonth: "< 1 maand",
          month_one: "{{count}} maand",
          month_other: "{{count}} maanden",
          year_one: "{{count}} jaar",
          year_other: "{{count}} jaar",
        },
        budgetStatus: {
          title: "Budgetstatus",
          subtitle: "Maandelijkse uitgaven t.o.v. limieten",
          used: "{{percent}}% gebruikt",
          over: "{{amount}} over budget",
          remaining: "{{amount}} resterend",
          added: "+{{amount}} toegevoegd",
          spent: "-{{amount}} uitgegeven",
          none: "Geen budgetten ingesteld",
          noneHint:
            "Stel bestedingslimieten in om je financiële doelen te volgen.",
          create: "Budget maken",
        },
        overview: {
          title: "Overzicht • {{month}}",
          netWorth: "Netto vermogen",
          income: "Inkomsten",
          expenses: "Uitgaven",
        },
        recentActivity: {
          title: "Recente activiteit",
          empty: "Geen recente activiteit",
          unknown: "Onbekend",
        },
        spendingByCategory: {
          title: "Uitgaven per categorie",
          description:
            "Belangrijkste uitgavencategorieën uitgesplitst per subcategorie",
          uncategorized: "Zonder categorie",
        },
        header: {
          subtitle: "Overzicht van je financiele gezondheid",
        },
        balanceChart: {
          title: "Saldo door de tijd",
          totalBalance: "Totaal saldo",
          balance: "Saldo",
          lineChart: "Lijngrafiek",
          stackedBarChart: "Gestapelde staafgrafiek",
          waterfallChart: "Watervalgrafiek",
        },
      },
      analytics: {
        header: {
          subtitle:
            "Bekijk de totale uitgaven en grafiektrends voor de geselecteerde periode.",
        },
        period: {
          thisWeek: "Deze week",
          thisMonth: "Deze maand",
          customDateRange: "Aangepast datumbereik",
          customRange: "Aangepast bereik",
          apply: "Toepassen",
        },
        summary: {
          totalSpent: "Totaal uitgegeven",
          noChange: "Geen verandering",
          selectedPeriod: "Geselecteerde periode",
        },
        chart: {
          previousPeriod: "Vorige periode",
          nextPeriod: "Volgende periode",
          lineChart: "Lijngrafiek",
          barChart: "Staafgrafiek",
          pieChart: "Cirkeldiagram",
          loading: "Grafiekgegevens laden...",
          noData: "Geen uitgaven voor deze periode",
          spent: "Uitgegeven",
          previousShort: "vorig",
          avgPerPeriod: "per periode",
          avgPerMonth: "gem. per maand",
          avgPerWeek: "gem. per week",
          avgPerDay: "gem. per dag",
          spending: "Uitgaven",
          max: "max",
          mean: "gem.",
          unknown: "Onbekend",
          reset: "Reset",
          spendingByCategory: "Uitgaven per categorie",
          tapToDrillDown: "Tik om verder te kijken",
          spendingByVendor: "Uitgaven per leverancier",
          total: "Totaal",
        },
        breakdown: {
          byCategory: "Per categorie",
          byMerchant: "Per leverancier",
          byCurrency: "Per valuta",
          byAccount: "Per rekening",
          goBack: "Ga terug",
          clear: "Wissen",
          all: "Alles",
          noTransactionsFound: "Geen transacties gevonden",
          noDataForView: "Geen gegevens voor deze weergave",
          transactionCount: "{{count}} transacties",
          unknown: "Onbekend",
          uncategorized: "Ongecategoriseerd",
        },
      },
      calendar: {
        header: {
          subtitle: "Bekijk maandpatronen en de transacties achter elke dag.",
        },
      },
      scheduled: {
        header: {
          title: "Geplande transacties",
          subtitle: "Beheer terugkerende betalingen en overschrijvingen",
          autoSchedule: "Automatisch plannen",
          addScheduled: "Gepland toevoegen",
        },
      },
      filters: {
        searchBar: {
          placeholder: "Transacties filteren...",
          excludeTransfers: "Overboekingen uitsluiten",
          reset: "Opnieuw instellen",
        },
        active: {
          dateSingle: "Datum: {{date}}",
          dateRange: "Datum: {{from}} - {{to}}",
          account: "Rekening: {{name}}",
          category: "Categorie: {{name}}",
          subCategory: "Sub: {{name}}",
          vendor: "Begunstigde: {{name}}",
          search: 'Zoeken: "{{query}}"',
          noMatch: "Geen overeenkomst",
        },
        conversational: {
          filterType: "Filtertype",
          category: "Categorie",
          account: "Rekening",
          vendor: "Leverancier / begunstigde",
          detectedDate: "Gedetecteerde datum",
          useDate: "Gebruik datum: {{range}}",
          timeRangeAllTime: "Tijdsbereik: altijd",
          categories: "Categorieën",
          accounts: "Rekeningen",
          vendors: "Leveranciers",
          search: "Zoeken",
          allCategories: "Alle categorieën",
          allAccounts: "Alle rekeningen",
          allVendors: "Alle leveranciers",
          back: "Terug",
          searchText: 'Zoektekst "{{input}}"',
          typePlaceholder:
            "Typ om te filteren (bijv. 'Boodschappen', 'Volgende week', 'Rekening')...",
          filterBy: "Filter op {{step}}...",
          subCategorySuffix: "(sub)",
        },
        input: {
          searchTransactions: "Zoek transacties",
          clearSearch: "Zoekopdracht wissen",
          loadingSearchResults: "Zoekresultaten laden",
          loading: "Laden...",
        },
        scheduled: {
          placeholder:
            "Zoek toekomstige transacties (bijv. 'Huur volgende maand', 'Netflix')...",
          filteredByReference: "Gefilterd op referentie",
          clearReferenceFilter: "Referentiefilter wissen",
          reset: "Opnieuw instellen",
        },
      },
      transactions: {
        header: {
          title: "Transacties",
          subtitle: "Beheer en volg je financiële activiteiten",
          importCsv: "CSV importeren",
          exportCsv: "CSV exporteren",
          detectTransfers: "Overschrijvingen detecteren",
          cleanupDuplicates: "Duplicaten opschonen",
          categorizeMissing: "Ontbrekende categoriseren",
          addTransaction: "Transactie toevoegen",
        },
        toasts: {
          scheduleNotFound: {
            title: "Schema niet gevonden",
            description: "Het oorspronkelijke schema lijkt te zijn verwijderd.",
          },
          cleanupComplete: {
            title: "Opschonen voltooid",
            description: "{{count}} dubbele transacties verwijderd.",
          },
          noDuplicates: {
            title: "Geen duplicaten",
            description: "Er zijn geen dubbele transacties gevonden.",
          },
          cleanupFailed: {
            title: "Opschonen mislukt",
            description:
              "Er is een fout opgetreden bij het verwijderen van duplicaten.",
          },
          nothingToCategorize: {
            title: "Niets te categoriseren",
            description: "Geen niet-gecategoriseerde leveranciers gevonden.",
          },
          aiNotConfigured: {
            title: "AI niet geconfigureerd",
            description: "Configureer je AI-provider en API-sleutel",
            action: "Naar AI-instellingen",
          },
          bulkCategorization: {
            title: "Bulkcategorisatie",
            description: "{{count}} transacties succesvol gecategoriseerd.",
          },
          noChanges: {
            title: "Geen wijzigingen",
            description:
              "De AI kon geen items met vertrouwen categoriseren of er werden geen geldige koppelingen teruggestuurd.",
          },
          categorizationFailed: {
            title: "Categorisatie mislukt",
            apiKeyHint: "Controleer je API-sleutel of endpointconfiguratie.",
            genericHint:
              "Er is een onverwachte fout opgetreden bij categorisatie.",
          },
          unlinked: {
            title: "Transacties ontkoppeld",
            description: "De overschrijvingskoppeling is verwijderd.",
          },
          linked: {
            title: "Transacties gekoppeld",
            description: "De transacties zijn als overschrijving gekoppeld.",
          },
          filterUpdated: {
            title: "Filter bijgewerkt",
            description:
              '"{{accountName}}" toegevoegd aan je weergave zodat je de nieuwe transactie ziet.',
          },
          scheduleUpdated: {
            title: "Schema bijgewerkt",
            description: "De terugkerende transactie is bijgewerkt.",
          },
          scheduleCreated: {
            title: "Schema aangemaakt",
            description: "Er is een nieuwe terugkerende transactie gepland.",
          },
          scheduleSaveError: {
            title: "Fout",
            description: "Schema opslaan mislukt.",
          },
        },
        confirmations: {
          removeDuplicatesTitle: "Dubbele transacties verwijderen?",
          removeDuplicatesDescription:
            "Zoekt transacties met dezelfde terugkerings-ID op dezelfde datum en verwijdert duplicaten. Deze actie kan niet ongedaan worden gemaakt.",
          cleaning: "Opschonen...",
          removeDuplicatesAction: "Duplicaten verwijderen",
          unlinkTitle: "Transacties ontkoppelen?",
          unlinkDescription:
            "Weet je zeker dat je de koppeling tussen deze transacties wilt verbreken? Ze worden niet meer als overschrijvingspaar behandeld.",
          unlinkAction: "Ontkoppelen",
        },
      },
      settings: {
        cards: {
          currency: {
            title: "Standaardvaluta",
            description: "Selecteer je voorkeursvaluta voor weergave.",
          },
          ledger: {
            title: "Grootboekinstellingen",
            description:
              "Beheer de gegevens van je huidige grootboek of maak een nieuw grootboek.",
            edit: "Huidig grootboek bewerken",
            create: "Nieuw grootboek maken",
          },
          future: {
            title: "Toekomstige transacties",
            description:
              "Bepaal hoeveel maanden aan toekomstige geplande transacties worden getoond.",
            months: "maanden",
          },
          language: {
            title: "Taal en lokalisatie",
            description:
              "Gebruik één primaire taal (moedertaal). Voeg aangepaste talen toe via code en vertaal-JSON.",
            active: "Actieve taal",
            enabled: "Ingeschakelde talen",
            customTitle: "Aangepaste taal toevoegen",
            codePlaceholder: "Taalcode (bijv. de, ja, hi)",
            namePlaceholder: "Weergavenaam (bijv. Duits)",
            jsonLabel: "Vertaal-JSON voor deze taal (root = vertaalsleutels)",
            jsonPlaceholder: '{"layout":{"nav":{"dashboard":"..."}}}',
            save: "Aangepaste taal opslaan",
            deleteActiveHint:
              "Aangepaste talen kun je met het prullenbakpictogram verwijderen. Als je de taal die je gebruikt verwijdert, schakelt de app over naar een reserve (Engels als beschikbaar, of een andere ondersteunde taal die bij je browser past).",
          },
        },
      },
      test: {
        draftLabel: "Conceptnotitie",
      },
      tour: {
        home: {
          "0": {
            content:
              "Dit is je hoofd-dashboardoverzicht met in één oogopslag je financiële gezondheid.",
          },
        },
        language: {
          "0": {
            content:
              "Kies hoe Vaulted Money met je communiceert. Kies je primaire taal of voeg een aangepast vertaalpakket toe.",
          },
          "1": {
            content:
              "Kies één ingebouwde taal als primaire interface-taal. De interface wordt direct bijgewerkt zonder je gegevens te verliezen.",
          },
          "2": {
            content:
              "Heb je een locale die we niet meeleveren? Voeg een code, weergavenaam en vertaal-JSON toe om de app uit te breiden.",
          },
        },
      },
    },
  },
  ta: {
    translation: {
      language: {
        label: "மொழி",
        english: "ஆங்கிலம்",
        spanish: "ஸ்பானிஷ்",
        chinese: "மாண்டரின் சீனம்",
        tamil: "தமிழ்",
        dutch: "டச்",
        removeCustomAria: "{{name}} ஐ நீக்கு",
        removeCustomConfirm:
          'தனிப்பயன் மொழி "{{name}}" ஐ நீக்கவா? மொழி அமைப்புகளில் மீண்டும் சேர்க்கலாம்.',
        openLanguageSettings: "மொழி அமைப்புகள்",
        customRemoved: "தனிப்பயன் மொழி நீக்கப்பட்டது.",
      },
      layout: {
        nav: {
          toggleMenu: "மெனுவை மாற்று",
          dashboard: "டாஷ்போர்டு",
          calendar: "காலண்டர்",
          analytics: "பகுப்பாய்வு",
          insights: "உள்ளடக்கம்",
          transactions: "பரிவர்த்தனைகள்",
          accounts: "கணக்குகள்",
          categories: "வகைகள்",
          vendors: "விற்பனையாளர்கள்",
          currencies: "நாணயங்கள்",
          aiProviders: "AI வழங்குநர்கள்",
          scheduled: "திட்டமிடப்பட்டது",
          reports: "அறிக்கைகள்",
          reportsEssential: "அடிப்படை",
          reportsAdvanced: "மேம்பட்டது",
          budgets: "பட்ஜெட்டுகள்",
          ledger: "லெட்ஜர்",
          data: "தரவு",
          backup: "காப்புப்பிரதி",
          donate: "நன்கொடை",
          settings: "அமைப்புகள்",
          logout: "வெளியேறு",
          myLedgers: "என் லெட்ஜர்கள்",
          languages: "மொழிகள்",
        },
        groups: {
          dashboards: "சுருக்கங்கள்",
          management: "மேலாண்மை",
          configure: "அமைவு",
          setup: "தொடக்கம்",
        },
        footer: {
          tagline: "தனியுரிமை முதலில் | தரவு உள்ளமை | திறந்த மூலம்",
          heartLink: "உங்கள் நிதி சுதந்திரத்திற்காக ❤️ உடன் உருவாக்கப்பட்டது",
          madeBy: "உருவாக்கியவர்: ",
          withHeart: " (உங்கள் நிதி சுதந்திரத்திற்காக ❤️ உடன்) ",
          freedom: "நிதி சுதந்திரம்",
          githubAria: "GitHub இல் Vaulted Money ஐ திறக்கவும்",
          privacyPolicy: "தனியுரிமைக் கொள்கை",
        },
      },
      dialogs: {
        eraseAll: {
          warningOne: "1 லெட்ஜரும் அதிலுள்ள அனைத்தும் நிரந்தரமாக நீக்கப்படும்.",
          warningMany:
            "{{total}} லெட்ஜர்களும் அவற்றிலுள்ள அனைத்தும் நிரந்தரமாக நீக்கப்படும்.",
          prompt: "உறுதிப்படுத்த {{phrase}} என தட்டச்சு செய்யவும்",
        },
        addEditTransaction: {
          tabs: {
            expense: "செலவு",
            income: "வருமானம்",
          },
          actions: {
            autoCategorize: "தானியங்கு வகைப்படுத்து",
            add: "பரிவர்த்தனை சேர்க்கவும்",
            save: "மாற்றங்களை சேமிக்கவும்",
          },
          fields: {
            date: "தேதி",
            accountSending: "கணக்கு (அனுப்புவது)",
            vendorReceiving: "விற்பனையாளர் / கணக்கு (பெறுவது)",
            category: "வகை",
            subCategory: "துணை வகை",
            amountSending: "தொகை (அனுப்புவது)",
            amountReceiving: "தொகை (பெறுவது)",
            remarks: "குறிப்புகள்",
            recurrenceFrequency: "மீள்வது எத்தனை முறை",
            recurrenceEndDate: "மீளும் இறுதி தேதி",
          },
          placeholders: {
            selectAccount: "கணக்கை தேர்ந்தெடுக்கவும்...",
            searchAccounts: "கணக்குகளை தேடவும்...",
            noAccountFound: "கணக்கு கிடைக்கவில்லை.",
            selectVendorOrAccount:
              "விற்பனையாளர் அல்லது கணக்கை தேர்ந்தெடுக்கவும்...",
            searchGeneric: "தேடவும்...",
            noResults: "முடிவுகள் இல்லை.",
            selectCategory: "வகையை தேர்ந்தெடுக்கவும்...",
            searchCategories: "வகைகளை தேடவும்...",
            noCategoryFound: "வகை கிடைக்கவில்லை.",
            selectOrCreate: "தேர்ந்தெடுக்கவும் அல்லது உருவாக்கவும்...",
            searchSubCategories: "துணை வகைகளை தேடவும்...",
            noSubCategoryFound: "துணை வகை கிடைக்கவில்லை.",
            amount: "0.00",
            recurrence: "மீள்வதை தேர்ந்தெடுக்கவும்",
          },
          recurrenceOptions: {
            none: "இல்லை",
            daily: "தினசரி",
            weekly: "வாராந்திர",
            monthly: "மாதாந்திர",
            quarterly: "காலாண்டு",
            yearly: "வருடாந்திர",
          },
          helper: {
            recurrenceFrequency:
              "இந்த பரிவர்த்தனை எவ்வளவு அடிக்கடி மீள வேண்டும் என்பதை அமைக்கவும்.",
            recurrenceEndDate: "இந்த தேதிக்குப் பிறகு இந்த பரிவர்த்தனை மீளாது.",
          },
          title: {
            add: "புதிய பரிவர்த்தனை சேர்க்கவும்",
            edit: "பரிவர்த்தனையை திருத்தவும்",
          },
          description: {
            add: "உங்கள் பதிவுகளில் புதிய பரிவர்த்தனையை விரைவாக சேர்க்கவும்.",
            edit: "இந்த பரிவர்த்தனையின் விவரங்களை மாற்றவும்.",
          },
        },
      },
      helpTour: {
        start: "உதவி சுற்றுப்பயணம் தொடங்கு",
        next: "அடுத்து",
        back: "பின்பு",
        last: "முடி",
        skip: "தவிர்",
      },
      dashboard: {
        runway: {
          title: "நிதி இருப்புக் காலம்",
          subtitle: "நிலையான செலவுகள் + சமீபத்திய செலவுகளின் அடிப்படையில்",
          infinite: "வரம்பற்றது",
          savingsGrowing: "சேமிப்பு அதிகரித்து வருகிறது!",
          burn: "சேமிப்பு மாதத்திற்கு {{amount}} செலவை ஈடுசெய்கிறது",
          monthlyStats: "மாதாந்திர புள்ளிவிவரங்கள்",
          fixedCost: "நிலையான செலவு",
          avgSpending: "சராசரி செலவு",
          totalSavings: "மொத்த சேமிப்பு",
          lessThanMonth: "1 மாதத்திற்கும் குறைவு",
          month_one: "{{count}} மாதம்",
          month_other: "{{count}} மாதங்கள்",
          year_one: "{{count}} ஆண்டு",
          year_other: "{{count}} ஆண்டுகள்",
        },
        budgetStatus: {
          title: "பட்ஜெட் நிலை",
          subtitle: "மாதாந்திர செலவு vs வரம்புகள்",
          used: "{{percent}}% பயன்படுத்தப்பட்டது",
          over: "பட்ஜெட்டை விட {{amount}} அதிகம்",
          remaining: "{{amount}} மீதம்",
          added: "+{{amount}} சேர்க்கப்பட்டது",
          spent: "-{{amount}} செலவானது",
          none: "பட்ஜெட் அமைக்கப்படவில்லை",
          noneHint:
            "உங்கள் நிதி இலக்குகளைக் கண்காணிக்க செலவு வரம்புகளை அமைக்கவும்.",
          create: "பட்ஜெட் உருவாக்கு",
        },
        overview: {
          title: "கண்ணோட்டம் • {{month}}",
          netWorth: "நிகர மதிப்பு",
          income: "வருமானம்",
          expenses: "செலவுகள்",
        },
        recentActivity: {
          title: "சமீபத்திய செயல்பாடு",
          empty: "சமீபத்திய செயல்பாடு இல்லை",
          unknown: "தெரியாதது",
        },
        spendingByCategory: {
          title: "வகை வாரியான செலவு",
          description: "துணை வகை வாரியாகப் பிரிக்கப்பட்ட முக்கிய செலவு வகைகள்",
          uncategorized: "வகைப்படுத்தப்படாதது",
        },
        header: {
          subtitle: "உங்கள் நிதி நிலையின் ஒரு பார்வை.",
        },
        balanceChart: {
          title: "காலப்போக்கில் இருப்பு",
          totalBalance: "மொத்த இருப்பு",
          balance: "இருப்பு",
          lineChart: "வரி வரைபடம்",
          stackedBarChart: "குவிக்கப்பட்ட பட்டை வரைபடம்",
          waterfallChart: "வாட்டர்ஃபால் வரைபடம்",
        },
      },
      analytics: {
        header: {
          subtitle:
            "தேர்ந்தெடுத்த காலத்திற்கு மொத்த செலவு மற்றும் வரைபட போக்குகளைப் பாருங்கள்.",
        },
        period: {
          thisWeek: "இந்த வாரம்",
          thisMonth: "இந்த மாதம்",
          customDateRange: "தனிப்பயன் தேதி வரம்பு",
          customRange: "தனிப்பயன் வரம்பு",
          apply: "பயன்படுத்து",
        },
        summary: {
          totalSpent: "மொத்த செலவு",
          noChange: "மாற்றம் இல்லை",
          selectedPeriod: "தேர்ந்தெடுக்கப்பட்ட காலம்",
        },
        chart: {
          previousPeriod: "முந்தைய காலம்",
          nextPeriod: "அடுத்த காலம்",
          lineChart: "வரி வரைபடம்",
          barChart: "பட்டை வரைபடம்",
          pieChart: "வட்ட வரைபடம்",
          loading: "வரைபடத் தரவு ஏற்றப்படுகிறது...",
          noData: "இந்த காலத்திற்கு செலவு தரவு இல்லை",
          spent: "செலவு",
          previousShort: "முந்.",
          avgPerPeriod: "ஒவ்வொரு காலத்திற்கும்",
          avgPerMonth: "மாத சராசரி",
          avgPerWeek: "வார சராசரி",
          avgPerDay: "நாள் சராசரி",
          spending: "செலவு",
          max: "அதிகபட்சம்",
          mean: "சராசரி",
          unknown: "தெரியவில்லை",
          reset: "மீட்டமை",
          spendingByCategory: "வகை வாரியான செலவு",
          tapToDrillDown: "உள்ளே சென்று பார்க்க தட்டவும்",
          spendingByVendor: "விற்பனையாளர் வாரியான செலவு",
          total: "மொத்தம்",
        },
        breakdown: {
          byCategory: "வகை வாரியாக",
          byMerchant: "விற்பனையாளர் வாரியாக",
          byCurrency: "நாணய வாரியாக",
          byAccount: "கணக்கு வாரியாக",
          goBack: "திரும்ப",
          clear: "அழி",
          all: "அனைத்தும்",
          noTransactionsFound: "பரிவர்த்தனைகள் எதுவும் கிடைக்கவில்லை",
          noDataForView: "இந்த பார்வைக்கு தரவு இல்லை",
          transactionCount: "{{count}} பரிவர்த்தனைகள்",
          unknown: "தெரியவில்லை",
          uncategorized: "வகைப்படுத்தப்படவில்லை",
        },
      },
      calendar: {
        header: {
          subtitle:
            "மாதாந்திர வடிவங்களையும் ஒவ்வொரு நாளுக்குப் பின்னுள்ள பரிவர்த்தனைகளையும் பார்க்கவும்.",
        },
      },
      scheduled: {
        header: {
          title: "அட்டவணைப்படுத்தப்பட்ட பரிவர்த்தனைகள்",
          subtitle: "மீளும் கட்டணங்கள் மற்றும் பரிமாற்றங்களை நிர்வகிக்கவும்",
          autoSchedule: "தானாக திட்டமிடு",
          addScheduled: "அட்டவணை சேர்க்கவும்",
        },
      },
      filters: {
        searchBar: {
          placeholder: "பரிவர்த்தனைகளை வடிகட்டு...",
          excludeTransfers: "பரிமாற்றங்களை நீக்கு",
          reset: "மீட்டமை",
        },
        active: {
          dateSingle: "தேதி: {{date}}",
          dateRange: "தேதி: {{from}} - {{to}}",
          account: "கணக்கு: {{name}}",
          category: "வகை: {{name}}",
          subCategory: "துணை: {{name}}",
          vendor: "விற்பனையாளர்: {{name}}",
          search: 'தேடு: "{{query}}"',
          noMatch: "பொருந்தவில்லை",
        },
        conversational: {
          filterType: "வடிகட்டி வகை",
          category: "வகை",
          account: "கணக்கு",
          vendor: "விற்பனையாளர் / பெறுநர்",
          detectedDate: "கண்டறிந்த தேதி",
          useDate: "தேதியைப் பயன்படுத்து: {{range}}",
          timeRangeAllTime: "கால வரம்பு: அனைத்து நேரமும்",
          categories: "வகைகள்",
          accounts: "கணக்குகள்",
          vendors: "விற்பனையாளர்கள்",
          search: "தேடு",
          allCategories: "அனைத்து வகைகள்",
          allAccounts: "அனைத்து கணக்குகள்",
          allVendors: "அனைத்து விற்பனையாளர்கள்",
          back: "பின்னால்",
          searchText: 'உரை தேடு "{{input}}"',
          typePlaceholder:
            "வடிகட்ட தட்டச்சிடவும் (எ.கா. 'சந்தை', 'அடுத்த வாரம்', 'செக்கிங்')...",
          filterBy: "{{step}} மூலம் வடிகட்டு...",
          subCategorySuffix: "(துணை)",
        },
        input: {
          searchTransactions: "பரிவர்த்தனைகளை தேடு",
          clearSearch: "தேடலை அழி",
          loadingSearchResults: "தேடல் முடிவுகள் ஏற்றப்படுகிறது",
          loading: "ஏற்றுகிறது...",
        },
        scheduled: {
          placeholder:
            "எதிர்கால பரிவர்த்தனைகளைத் தேடு (எ.கா. 'அடுத்த மாத வாடகை', 'Netflix')...",
          filteredByReference: "குறிப்பின் அடிப்படையில் வடிகட்டப்பட்டது",
          clearReferenceFilter: "குறிப்பு வடிகட்டியை அழி",
          reset: "மீட்டமை",
        },
      },
      transactions: {
        header: {
          title: "பரிவர்த்தனைகள்",
          subtitle: "உங்கள் நிதி செயல்பாடுகளை நிர்வகித்து கண்காணிக்கவும்",
          importCsv: "CSV இறக்குமதி",
          exportCsv: "CSV ஏற்றுமதி",
          detectTransfers: "பரிமாற்றங்களை கண்டறி",
          cleanupDuplicates: "நகல்களை அகற்று",
          categorizeMissing: "வகைப்படுத்தப்படாதவற்றை வகைப்படுத்து",
          addTransaction: "பரிவர்த்தனை சேர்க்கவும்",
        },
      },
      settings: {
        cards: {
          currency: {
            title: "இயல்புநிலை நாணயம்",
            description: "காட்சிக்கு விருப்பமான நாணயத்தை தேர்ந்தெடுக்கவும்.",
          },
          ledger: {
            title: "லெட்ஜர் அமைப்புகள்",
            description:
              "தற்போதைய லெட்ஜர் விவரங்களை நிர்வகிக்கவும் அல்லது புதியதை உருவாக்கவும்.",
            edit: "தற்போதைய லெட்ஜரை திருத்து",
            create: "புதிய லெட்ஜர் உருவாக்கு",
          },
          future: {
            title: "எதிர்கால பரிவர்த்தனைகள்",
            description:
              "எத்தனை மாத எதிர்கால திட்டமிட்ட பரிவர்த்தனைகள் காட்ட வேண்டும் என்பதைக் குறிப்பிடவும்.",
            months: "மாதங்கள்",
          },
          language: {
            title: "மொழி மற்றும் உள்ளூர்மயமாக்கல்",
            description:
              "ஒரே முதன்மை மொழியை (தாய்மொழி) பயன்படுத்தவும். மொழிக் குறியீடு மற்றும் மொழிபெயர்ப்பு JSON மூலம் தனிப்பயன் மொழிகளை சேர்க்கலாம்.",
            active: "செயலில் உள்ள மொழி",
            enabled: "இயக்கப்பட்ட மொழிகள்",
            customTitle: "தனிப்பயன் மொழி சேர்க்கவும்",
            codePlaceholder: "மொழிக் குறியீடு (எ.கா. de, ja, hi)",
            namePlaceholder: "காட்சி பெயர் (எ.கா. ஜெர்மன்)",
            jsonLabel: "இந்த மொழிக்கான மொழிபெயர்ப்பு JSON",
            jsonPlaceholder: '{"layout":{"nav":{"dashboard":"..."}}}',
            save: "தனிப்பயன் மொழியை சேமி",
            deleteActiveHint:
              "தனிப்பயன் மொழிகளை குப்பை ஐகான் மூலம் நீக்கலாம். நீங்கள் பயன்படுத்தும் மொழியை நீக்கினால், பயன்பாடு கிடைக்கும் மொழிக்கு மாறும் (ஆங்கிலம் கிடைத்தால் அது, இல்லையெனில் உலாவி மொழிக்கு பொருந்தும் ஆதரவு மொழி).",
          },
        },
      },
      test: {
        draftLabel: "வரைவு குறிப்பு",
      },
      tour: {
        home: {
          "0": {
            content:
              "இது உங்கள் முக்கிய டாஷ்போர்டு சுருக்கம், உங்கள் நிதி நிலையை ஒரு பார்வையில் காட்டுகிறது.",
          },
        },
        language: {
          "0": {
            content:
              "Vaulted Money உங்களிடம் எப்படி பேச வேண்டும் என்பதை இங்கே தேர்ந்தெடுக்கவும். முதன்மை மொழியைத் தேர்ந்தெடுக்கவும் அல்லது தனிப்பயன் மொழிபெயர்ப்பைச் சேர்க்கவும்.",
          },
          "1": {
            content:
              "உள்ளமைக்கப்பட்ட மொழிகளில் ஒன்றை முதன்மை இடைமுக மொழியாகத் தேர்ந்தெடுக்கவும். தரவு இழப்பின்றி உடனடியாக புதுப்பிக்கப்படும்.",
          },
          "2": {
            content:
              "நாங்கள் வழங்காத மொழி வேண்டுமா? குறியீடு, காட்சி பெயர் மற்றும் மொழிபெயர்ப்பு JSON மூலம் பயன்பாட்டை விரிவாக்கலாம்.",
          },
        },
      },
    },
  },
};

// Merge home page translations into each language bundle at module load time
for (const [lang, homeKeys] of Object.entries(homeTranslations)) {
  const bundle = resources[lang];
  if (bundle?.translation && typeof bundle.translation === "object") {
    (bundle.translation as Record<string, unknown>).home = homeKeys;
  }
}

applyAreaTranslations(resources);

export const supportedLanguages = ["en", "es", "zh", "nl", "ta"] as const;
export type SupportedLanguage = string;
