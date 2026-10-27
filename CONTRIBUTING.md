# Contributing to Vaulted Money

First off, thank you for considering contributing to Vaulted Money It's people like you that make Vaulted Money such a great tool for personal finance.

## How to Contribute

Only repository collaborators can open pull requests. If you are not a collaborator, start with an issue:

1. [Open a bug report or feature request](https://github.com/nrajesh/vaulted.money/issues/new/choose). Describe the problem and the change you have in mind, with enough detail for a maintainer to reproduce or build it.
2. A maintainer will reply on the issue. If the change is accepted, a maintainer will make it and credit your issue.

You are welcome to fork Vaulted Money for your own use, or to adapt it for your language and region.

## Getting Started (collaborators)

1. **Clone the project** to your own machine.
2. **Install dependencies** using `pnpm install`. Use `pnpm`, not `npm`: an npm install creates a different dependency tree, and the build then regenerates `src/data/acknowledgments.generated.ts` with the wrong package list.
3. **Create a branch** from `pre-prod` for your feature or bug fix: `git checkout -b feature/my-new-feature` or `git checkout -b bugfix/issue-description`.

## Code Standard and Review

We strongly encourage you to read our [Code Review Guidelines](documentation/CODE_REVIEW.md), which detail our expectations around:
- Coding Standards (ESLint, Prettier)
- Refactoring and Maintainability
- Testing
- Accessibility (a11y)

### Validating Your Changes

Before committing your changes, please run the following checks locally:

```bash
# Check formatting
pnpm format:check

# Run linter
pnpm lint

# Run type check
pnpm exec tsc --noEmit

# Ensure the project builds
pnpm build
```

We also provide a handy `pnpm validate` script that runs type checking and linting.

### Mobile Changes

If your change affects Capacitor assets, native icons, splash screens, or mobile-only behavior, refresh both native targets before asking for review:

```bash
pnpm run mobile:refresh
```

For simulator/emulator verification, use a clean reinstall so cached launcher assets do not hide the result:

```bash
# iOS
xcrun simctl uninstall booted com.vaultedmoney.app || true

# Android
adb uninstall com.vaultedmoney.app || true
cd android
./gradlew clean
```

## Submitting a Pull Request
- Open the pull request against the `pre-prod` branch. Maintainers promote `pre-prod` to `main` for releases.
- Ensure your code is thoroughly tested.
- Fill out the Pull Request template comprehensively.
- Link the Pull Request to any relevant issues.
- Keep the diff small and focused; if your PR is doing too much, consider breaking it into smaller PRs.
- Wait for a maintainer to review your code. Do not push force updates unless requested.

Once your PR is approved and all CI checks pass, it will be merged by a maintainer!
