import { isElectron } from "@/utils/electron";

/**
 * Whether this app can reach a model server running on the same computer
 * (LM Studio, Ollama at http://localhost). Only the desktop app can.
 *
 * - A phone or tablet has no such server; "localhost" there is the phone.
 * - The website cannot either: browsers refuse to let a public site call a
 *   server on the visitor's own computer unless the visitor grants a
 *   permission and the model server is set up to allow it (CORS), so the
 *   option only ever ended in "nothing answered".
 *
 * The desktop app is not a public site, so it has neither restriction.
 */
export const canUseLocalModels = (): boolean => isElectron();

/** True for an address that points back at the device itself. */
export const isLoopbackUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === "localhost" ||
      hostname === "[::1]" ||
      hostname === "::1" ||
      /^127\./.test(hostname)
    );
  } catch {
    return false;
  }
};
