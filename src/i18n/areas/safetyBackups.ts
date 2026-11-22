import type { AreaTranslations } from "./types";

/**
 * Automatic safety copies (made before imports, AI changes, sync, restores
 * and demo data). For now only the messages shown when a copy could not be
 * made; the Backup screen section adds its own keys under `safetyBackups`.
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
    },
  },
  es: {
    safetyBackups: {
      failedWarning:
        "No se pudo hacer una copia de seguridad antes, pero el cambio se realizó.",
      continueWithoutCopyTitle: "¿Continuar sin copia de seguridad?",
      continueWithoutCopyBody:
        "No se pudo hacer una copia de seguridad de tus datos actuales, así que este cambio no se podrá deshacer. ¿Continuar de todos modos?",
    },
  },
  zh: {
    safetyBackups: {
      failedWarning: "未能先创建安全副本，但更改已完成。",
      continueWithoutCopyTitle: "不创建安全副本继续？",
      continueWithoutCopyBody:
        "无法为当前数据创建安全副本，因此此更改将无法撤销。仍要继续吗？",
    },
  },
  nl: {
    safetyBackups: {
      failedWarning:
        "Er kon vooraf geen veiligheidskopie worden gemaakt, maar de wijziging is doorgevoerd.",
      continueWithoutCopyTitle: "Doorgaan zonder veiligheidskopie?",
      continueWithoutCopyBody:
        "Er kon geen veiligheidskopie van je huidige gegevens worden gemaakt, dus deze wijziging kan niet ongedaan worden gemaakt. Toch doorgaan?",
    },
  },
  ta: {
    safetyBackups: {
      failedWarning:
        "முதலில் பாதுகாப்பு நகலை உருவாக்க முடியவில்லை, ஆனால் மாற்றம் செய்யப்பட்டது.",
      continueWithoutCopyTitle: "பாதுகாப்பு நகல் இல்லாமல் தொடரவா?",
      continueWithoutCopyBody:
        "உங்கள் தற்போதைய தரவின் பாதுகாப்பு நகலை உருவாக்க முடியவில்லை, எனவே இந்த மாற்றத்தைச் செயல்தவிர்க்க முடியாது. இருந்தாலும் தொடரவா?",
    },
  },
};
