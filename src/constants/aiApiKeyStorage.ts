const AI_API_KEY_PREFIX = "vaultedmoney_ai_apiKey_";
const LEGACY_AI_API_KEY_PREFIX = "vaultedmoney_ai_apiKey_";

export function readAiApiKeyFromStorage(providerId: string): string {
  const key = `${AI_API_KEY_PREFIX}${providerId}`;
  const value = localStorage.getItem(key);
  if (value) return value;
  const legacyKey = `${LEGACY_AI_API_KEY_PREFIX}${providerId}`;
  const legacy = localStorage.getItem(legacyKey);
  if (legacy) {
    localStorage.setItem(key, legacy);
    localStorage.removeItem(legacyKey);
    return legacy;
  }
  return "";
}

export function writeAiApiKeyToStorage(providerId: string, apiKey: string) {
  localStorage.setItem(`${AI_API_KEY_PREFIX}${providerId}`, apiKey);
  // The legacy and current prefixes are currently identical; removing the
  // legacy key unconditionally would delete the value that was just written.
  if (LEGACY_AI_API_KEY_PREFIX !== AI_API_KEY_PREFIX) {
    localStorage.removeItem(`${LEGACY_AI_API_KEY_PREFIX}${providerId}`);
  }
}

export function removeAiApiKeyFromStorage(providerId: string) {
  localStorage.removeItem(`${AI_API_KEY_PREFIX}${providerId}`);
  localStorage.removeItem(`${LEGACY_AI_API_KEY_PREFIX}${providerId}`);
}
