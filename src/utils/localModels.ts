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

/**
 * True for an address on a home or office network (192.168.x, 10.x,
 * 172.16-31.x, *.local). Phones can't reach these: the iOS app deliberately
 * declares no local-network access, so such models are Mac-app only.
 */
export const isPrivateNetworkUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);
    return (
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
};

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
