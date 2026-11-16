/**
 * electron-builder `afterAllArtifactBuild` hook: signs and notarizes each
 * macOS .dmg, then staples Apple's ticket to it.
 *
 * electron-builder already signs, notarizes and staples the app inside the
 * DMG. Doing the same for the DMG lets Gatekeeper approve the download as
 * soon as it is opened, even offline.
 *
 * Skips quietly when it can't do the work, so unsigned builds (CI, forks,
 * Windows/Linux) still finish:
 * - no "Developer ID Application" certificate in the keychain: no signing;
 * - no Apple credentials in the environment: signed, but not notarized.
 *
 * Credentials (the same ones electron-builder uses for the app), one of:
 * - APPLE_API_KEY, APPLE_API_KEY_ID, APPLE_API_ISSUER
 * - APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID
 * - APPLE_KEYCHAIN_PROFILE (and optionally APPLE_KEYCHAIN)
 */
const { execFileSync } = require("node:child_process");

const log = (message) => console.log(`  • notarize-dmg: ${message}`);

/** SHA-1 of the Developer ID Application identity (CSC_NAME narrows it). */
function findDeveloperIdIdentity() {
  let output = "";
  try {
    output = execFileSync(
      "security",
      ["find-identity", "-v", "-p", "codesigning"],
      { encoding: "utf8" },
    );
  } catch {
    return null;
  }
  const wanted = process.env.CSC_NAME;
  for (const line of output.split("\n")) {
    const match = line.match(/^\s*\d+\)\s+([0-9A-F]{40})\s+"(.+)"$/);
    if (!match) continue;
    const [, hash, name] = match;
    if (!name.startsWith("Developer ID Application:")) continue;
    if (wanted && !name.includes(wanted)) continue;
    return { hash, name };
  }
  return null;
}

/** notarytool arguments from the environment, or null when none are set. */
function notaryCredentials() {
  const env = process.env;
  if (env.APPLE_API_KEY && env.APPLE_API_KEY_ID && env.APPLE_API_ISSUER) {
    return [
      "--key",
      env.APPLE_API_KEY,
      "--key-id",
      env.APPLE_API_KEY_ID,
      "--issuer",
      env.APPLE_API_ISSUER,
    ];
  }
  if (env.APPLE_ID && env.APPLE_APP_SPECIFIC_PASSWORD && env.APPLE_TEAM_ID) {
    return [
      "--apple-id",
      env.APPLE_ID,
      "--password",
      env.APPLE_APP_SPECIFIC_PASSWORD,
      "--team-id",
      env.APPLE_TEAM_ID,
    ];
  }
  if (env.APPLE_KEYCHAIN_PROFILE) {
    return [
      "--keychain-profile",
      env.APPLE_KEYCHAIN_PROFILE,
      ...(env.APPLE_KEYCHAIN ? ["--keychain", env.APPLE_KEYCHAIN] : []),
    ];
  }
  return null;
}

async function notarizeDmgs(buildResult) {
  if (process.platform !== "darwin") return [];
  const dmgs = (buildResult.artifactPaths || []).filter((file) =>
    file.endsWith(".dmg"),
  );
  if (dmgs.length === 0) return [];

  const identity = findDeveloperIdIdentity();
  if (!identity) {
    log("no Developer ID Application certificate; DMGs left unsigned");
    return [];
  }
  const credentials = notaryCredentials();

  for (const dmg of dmgs) {
    log(`signing ${dmg}`);
    execFileSync(
      "codesign",
      ["--force", "--timestamp", "--sign", identity.hash, dmg],
      { stdio: "inherit" },
    );

    if (!credentials) {
      log("no Apple credentials set; DMG signed but not notarized");
      continue;
    }

    log(`notarizing ${dmg} (usually a few minutes)`);
    const result = JSON.parse(
      execFileSync(
        "xcrun",
        [
          "notarytool",
          "submit",
          dmg,
          ...credentials,
          "--wait",
          "--output-format",
          "json",
        ],
        { encoding: "utf8" },
      ),
    );
    if (result.status !== "Accepted") {
      throw new Error(
        `Notarization of ${dmg} ended as "${result.status}". ` +
          `See: xcrun notarytool log ${result.id} <credentials>`,
      );
    }

    execFileSync("xcrun", ["stapler", "staple", dmg], { stdio: "inherit" });
    log(`notarized and stapled ${dmg}`);
  }
  return [];
}

module.exports = notarizeDmgs;
module.exports.default = notarizeDmgs;
