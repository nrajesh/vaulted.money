import type { AreaTranslations } from "./types";

/**
 * Phone card gestures (swipe to reveal, long press for the menu): the name of
 * a card's "…" menu. The revealed buttons reuse each list's own Delete, Edit
 * and Duplicate text.
 * Machine-written for es, zh, nl and ta: ask a native speaker to review.
 */
export const cardGestures: AreaTranslations = {
  en: {
    cardGestures: {
      moreActions: "More actions",
      moreActionsFor: "More actions for {{name}}",
    },
  },
  es: {
    cardGestures: {
      moreActions: "Más acciones",
      moreActionsFor: "Más acciones para {{name}}",
    },
  },
  zh: {
    cardGestures: {
      moreActions: "更多操作",
      moreActionsFor: "{{name}} 的更多操作",
    },
  },
  nl: {
    cardGestures: {
      moreActions: "Meer acties",
      moreActionsFor: "Meer acties voor {{name}}",
    },
  },
  ta: {
    cardGestures: {
      moreActions: "மேலும் செயல்கள்",
      moreActionsFor: "{{name}} க்கான கூடுதல் செயல்கள்",
    },
  },
};
