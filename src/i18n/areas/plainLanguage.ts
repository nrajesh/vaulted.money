import type { AreaTranslations } from "./types";

/**
 * Plain-language copy added in the pre-store polish: placeholders, page
 * subtitles and inline hints. Machine-written for es, zh, nl and ta: ask a
 * native speaker to review.
 */
export const plainLanguage: AreaTranslations = {
  en: {
    dialogs: {
      payee: {
        namePlaceholderAccount: "e.g., Joint Checking, Savings, Visa Card",
        namePlaceholderPayee: "e.g., SuperMart, Salary",
      },
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
  },
  zh: {
    dialogs: {
      payee: {
        namePlaceholderAccount: "例如：联名支票账户、储蓄、Visa 卡",
        namePlaceholderPayee: "例如：SuperMart、工资",
      },
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
  },
  ta: {
    dialogs: {
      payee: {
        namePlaceholderAccount: "எ.கா., கூட்டுக் கணக்கு, சேமிப்பு, Visa அட்டை",
        namePlaceholderPayee: "எ.கா., SuperMart, சம்பளம்",
      },
    },
  },
};
