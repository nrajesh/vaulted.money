import type { AIProvider } from "@/types/dataProvider";

/**
 * One-time permission before payee names go to a third-party AI provider
 * (App Review 5.1.2(i): disclose and get explicit permission before sharing
 * personal data with a third-party AI).
 *
 * Asked once per provider *destination*: the provider id plus its address,
 * so pointing an existing provider at a different service asks again.
 * Remembered per device in localStorage (guarded; if storage is blocked the
 * question is simply asked again next time).
 */
const STORAGE_KEY = "vm.aiConsent";

export class AiConsentDeclinedError extends Error {
  constructor() {
    super("Sending data to the AI provider was not allowed.");
    this.name = "AiConsentDeclinedError";
  }
}

export const isAiConsentDeclined = (error: unknown) =>
  error instanceof AiConsentDeclinedError;

type ConsentProvider = Pick<AIProvider, "id" | "name" | "baseUrl">;

const consentKey = (provider: ConsentProvider) =>
  `${provider.id}|${provider.baseUrl ?? ""}`;

const readGranted = (): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGranted = (keys: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // Not remembered; the person is asked again next time.
  }
};

export const hasAiConsent = (provider: ConsentProvider) =>
  readGranted().includes(consentKey(provider));

/** Forgets every answer (used when the AI features switch is turned off). */
export const clearAiConsent = () => writeGranted([]);

export interface PendingAiConsent {
  providerName: string;
  answer: (allowed: boolean) => void;
}

let pending: PendingAiConsent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const subscribeAiConsent = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getPendingAiConsent = () => pending;

/**
 * Resolves true when sending is allowed: immediately if already granted for
 * this provider, otherwise after the person answers the dialog
 * (`AiConsentDialog`, mounted at the app root).
 */
export const requestAiConsent = (
  provider: ConsentProvider,
): Promise<boolean> => {
  if (hasAiConsent(provider)) return Promise.resolve(true);
  // A second request while one is open shares the same answer.
  if (pending) {
    const previous = pending;
    return new Promise((resolve) => {
      const previousAnswer = previous.answer;
      previous.answer = (allowed) => {
        previousAnswer(allowed);
        resolve(allowed);
      };
    });
  }
  return new Promise((resolve) => {
    let answered = false;
    pending = {
      providerName: provider.name,
      answer: (allowed) => {
        // The dialog's button and its close event can both answer.
        if (answered) return;
        answered = true;
        if (allowed) {
          writeGranted([...readGranted(), consentKey(provider)]);
        }
        pending = null;
        notify();
        resolve(allowed);
      },
    };
    notify();
  });
};

/** Throws AiConsentDeclinedError unless sending to this provider is allowed. */
export const ensureAiConsent = async (provider: ConsentProvider) => {
  if (!(await requestAiConsent(provider))) throw new AiConsentDeclinedError();
};
