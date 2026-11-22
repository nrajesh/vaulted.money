/** Public repository home (README, stars, source). */
export const GITHUB_REPO_URL = "https://github.com/nrajesh/vaulted.money/";
export const GITHUB_REPO_ISSUES_URL =
  "https://github.com/nrajesh/vaulted.money/issues";
export const GITHUB_NEW_ISSUE_URL = `${GITHUB_REPO_ISSUES_URL}/new`;
export const SECURITY_POLICY_URL =
  "https://github.com/nrajesh/vaulted.money/security/policy";

export const FEEDBACK_KIND = {
  BUG: "bug",
  FEEDBACK: "feedback",
  VULNERABILITY: "vulnerability",
} as const;

export type FeedbackKind = (typeof FEEDBACK_KIND)[keyof typeof FEEDBACK_KIND];

interface FeedbackContext {
  pathname: string;
  appContext: string;
}

interface DiagnosticsContext extends FeedbackContext {
  feedbackKind: FeedbackKind;
  userAgent?: string;
  generatedAt?: string;
}

const buildBugBody = ({
  pathname,
  appContext,
}: FeedbackContext) => `**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '${pathname}'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment (please complete the following information):**
 - OS: [e.g. macOS, Windows]
 - Browser: [e.g. chrome, safari]
 - Version/Build (Desktop/Web): [${appContext}]`;

const buildFeatureBody = ({
  pathname,
  appContext,
}: FeedbackContext) => `**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Current page: ${pathname}
App context: ${appContext}`;

export const buildGitHubFeedbackUrl = (
  feedbackKind: FeedbackKind,
  context: FeedbackContext,
) => {
  if (feedbackKind === FEEDBACK_KIND.VULNERABILITY) {
    return SECURITY_POLICY_URL;
  }

  const params = new URLSearchParams();
  const isBug = feedbackKind === FEEDBACK_KIND.BUG;

  params.set("template", isBug ? "bug_report.md" : "feature_request.md");
  params.set("title", isBug ? "[Bug]: " : "[Feature Request]: ");
  params.set("body", isBug ? buildBugBody(context) : buildFeatureBody(context));

  return `${GITHUB_NEW_ISSUE_URL}?${params.toString()}`;
};

export const buildFeedbackDiagnostics = ({
  pathname,
  appContext,
  feedbackKind,
  userAgent,
  generatedAt,
}: DiagnosticsContext) => {
  const timestamp = generatedAt ?? new Date().toISOString();
  const agent =
    userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "N/A");

  return [
    "Vaulted Money Diagnostics",
    `Type: ${feedbackKind}`,
    `Route: ${pathname}`,
    `App: ${appContext}`,
    `Timestamp: ${timestamp}`,
    `User Agent: ${agent}`,
  ].join("\n");
};

/**
 * Polar checkout for the paid desktop app (EUR 9.99, VAT included). Shown on
 * the website only: the app builds compile the homepage out.
 */
export const DESKTOP_CHECKOUT_URL =
  "https://buy.polar.sh/polar_cl_E7s1fI8QHCxTneRzbXv2aSxcn0FpUuoBISI7M0cpuNB";
