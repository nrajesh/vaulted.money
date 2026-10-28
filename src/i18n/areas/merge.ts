import type { NestedTranslations } from "./types";

/** Deep-merges `source` into `target`, keeping any value `target` already has. */
export function mergeMissing(
  target: Record<string, unknown>,
  source: NestedTranslations,
) {
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key];
    if (typeof value === "string") {
      if (existing === undefined) target[key] = value;
    } else if (existing && typeof existing === "object") {
      mergeMissing(existing as Record<string, unknown>, value);
    } else if (existing === undefined) {
      target[key] = structuredClone(value);
    }
  }
}
