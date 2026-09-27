const AI_API_KEY_PREFIX = "vaultedmoney_ai_apiKey_";
// Keys saved before the rename from Budget It. This must differ from the
// current prefix: writing removes the legacy key, so identical prefixes would
// delete every key the moment it is saved.
const LEGACY_AI_API_KEY_PREFIX = "budgetit_ai_apiKey_";

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
  localStorage.removeItem(`${LEGACY_AI_API_KEY_PREFIX}${providerId}`);
}
