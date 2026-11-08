import type { AreaTranslations } from "./types";

/**
 * The "Understood as" suggestion in the filter search box, which shows what the
 * search parser made of the typed text. Machine-written: ask a native speaker to review.
 */
export const searchSuggestions: AreaTranslations = {
  en: {
    filters: {
      active: {
        dateUntil: "Date: until {{date}}",
      },
      conversational: {
        suggest: {
          heading: "Understood as",
          allTime: "All time",
          date: "Date: {{from}} – {{to}}",
          dateUntil: "Date: until {{date}}",
          accountsCount: "{{count}} accounts",
          amountBetween: "Amount: {{min}} to {{max}}",
          amountOver: "Over {{amount}}",
          amountUnder: "Under {{amount}}",
          income: "Income",
          expenses: "Expenses",
          largest: "Largest {{count}}",
          smallest: "Smallest {{count}}",
          account: "Account: {{name}}",
          category: "Category: {{name}}",
          subCategory: "Sub-category: {{name}}",
          vendor: "Vendor: {{name}}",
          typo: "{{name}} (matched “{{typed}}”)",
          text: 'Text: "{{text}}"',
        },
      },
    },
  },
  es: {
    filters: {
      active: {
        dateUntil: "Fecha: hasta {{date}}",
      },
      conversational: {
        suggest: {
          heading: "Entendido como",
          allTime: "Todo el tiempo",
          date: "Fecha: {{from}} – {{to}}",
          dateUntil: "Fecha: hasta {{date}}",
          accountsCount: "{{count}} cuentas",
          amountBetween: "Importe: de {{min}} a {{max}}",
          amountOver: "Más de {{amount}}",
          amountUnder: "Menos de {{amount}}",
          income: "Ingresos",
          expenses: "Gastos",
          largest: "Las {{count}} mayores",
          smallest: "Las {{count}} menores",
          account: "Cuenta: {{name}}",
          category: "Categoría: {{name}}",
          subCategory: "Subcategoría: {{name}}",
          vendor: "Proveedor: {{name}}",
          typo: "{{name}} (coincide con «{{typed}}»)",
          text: "Texto: «{{text}}»",
        },
      },
    },
  },
  zh: {
    filters: {
      active: {
        dateUntil: "日期：截至 {{date}}",
      },
      conversational: {
        suggest: {
          heading: "理解为",
          allTime: "全部时间",
          date: "日期：{{from}} – {{to}}",
          dateUntil: "日期：截至 {{date}}",
          accountsCount: "{{count}} 个账户",
          amountBetween: "金额：{{min}} 至 {{max}}",
          amountOver: "超过 {{amount}}",
          amountUnder: "低于 {{amount}}",
          income: "收入",
          expenses: "支出",
          largest: "最大的 {{count}} 笔",
          smallest: "最小的 {{count}} 笔",
          account: "账户：{{name}}",
          category: "类别：{{name}}",
          subCategory: "子类别：{{name}}",
          vendor: "商家：{{name}}",
          typo: "{{name}}（匹配“{{typed}}”）",
          text: "文本：“{{text}}”",
        },
      },
    },
  },
  nl: {
    filters: {
      active: {
        dateUntil: "Datum: tot {{date}}",
      },
      conversational: {
        suggest: {
          heading: "Opgevat als",
          allTime: "Alle tijd",
          date: "Datum: {{from}} – {{to}}",
          dateUntil: "Datum: tot {{date}}",
          accountsCount: "{{count}} rekeningen",
          amountBetween: "Bedrag: {{min}} tot {{max}}",
          amountOver: "Meer dan {{amount}}",
          amountUnder: "Minder dan {{amount}}",
          income: "Inkomsten",
          expenses: "Uitgaven",
          largest: "Grootste {{count}}",
          smallest: "Kleinste {{count}}",
          account: "Rekening: {{name}}",
          category: "Categorie: {{name}}",
          subCategory: "Subcategorie: {{name}}",
          vendor: "Leverancier: {{name}}",
          typo: "{{name}} (komt overeen met “{{typed}}”)",
          text: "Tekst: “{{text}}”",
        },
      },
    },
  },
  ta: {
    filters: {
      active: {
        dateUntil: "தேதி: {{date}} வரை",
      },
      conversational: {
        suggest: {
          heading: "புரிந்துகொண்டது",
          allTime: "எல்லா காலமும்",
          date: "தேதி: {{from}} – {{to}}",
          dateUntil: "தேதி: {{date}} வரை",
          accountsCount: "{{count}} கணக்குகள்",
          amountBetween: "தொகை: {{min}} முதல் {{max}} வரை",
          amountOver: "{{amount}}க்கு மேல்",
          amountUnder: "{{amount}}க்கு கீழ்",
          income: "வருமானம்",
          expenses: "செலவுகள்",
          largest: "மிகப்பெரிய {{count}}",
          smallest: "மிகச்சிறிய {{count}}",
          account: "கணக்கு: {{name}}",
          category: "வகை: {{name}}",
          subCategory: "துணை வகை: {{name}}",
          vendor: "விற்பனையாளர்: {{name}}",
          typo: "{{name}} (“{{typed}}” உடன் பொருந்தியது)",
          text: "உரை: “{{text}}”",
        },
      },
    },
  },
};
