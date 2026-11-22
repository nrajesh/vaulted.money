# IOS_RULES.md
# iOS AI Development Rules

These rules are **normative**. The AI agent that designs and implements the iOS app MUST follow them unless the project spec explicitly overrides a specific rule.

---

## 0. Scope & General Principles

- The AI MUST:
  - Build a native iOS app using **Swift** as the primary language.
  - Prefer **SwiftUI** for new screens; use UIKit only when required (e.g., for specific legacy integrations).
  - Use modern Swift 5.9+ features, preferring `@Observable` over `ObservableObject` for state management where supported.
- The AI MUST design for:
  - **Security and privacy first**, then correctness, usability, and performance.[cite:8][cite:11]
  - Alignment with Apple’s **Human Interface Guidelines (HIG)** for iOS 17+.[cite:6][cite:12]
  - Accessibility (VoiceOver, Dynamic Type), multiple device sizes, orientations, and display scales.

---

## 1. Architecture & Project Structure

- The AI MUST:
  - Use a modular, testable architecture:
    - **UI layer** (SwiftUI views / UIKit view controllers)
    - **Presentation layer** (ViewModels or Presenters)
    - **Domain layer** (business logic)
    - **Data layer** (repositories, local & remote data sources)
  - Keep network and persistence logic out of Views/ViewControllers.
  - Use **Swift Package Manager (SPM)** for modularizing the app into local packages instead of Xcode targets, where possible.
- The AI SHOULD:
  - Use patterns like **MVVM** (Model–View–ViewModel).
  - Use **dependency injection** (constructor injection, environment objects) to reduce global state.
- The AI MUST support:
  - **Async/await** and/or Combine for asynchronous operations, avoiding blocking the main thread.

---

## 2. UI/UX & Platform Conventions

### 2.1 Design System & Layout

- The AI MUST:
  - Follow iOS 17 **Human Interface Guidelines** for layout, typography, and component usage.[cite:6][cite:12]
  - Use **points (pt)** for all layout and typography.[cite:3]
  - Respect device **safe areas** and adaptive layouts on iPhone and iPad.
  - Support **light and dark modes** and system-wide text size via Dynamic Type.
  - Use **SF Symbols** for icons where possible to ensure consistent weight, scale, and appearance.
- The AI SHOULD:
  - Use system fonts (San Francisco variants) and standard controls for a native look and feel.

### 2.2 Navigation & Interaction

- The AI MUST:
  - Use standard navigation patterns:
    - **NavigationStack / NavigationView** for hierarchical navigation.
    - **TabView / UITabBarController** for top-level sections (3–5 tabs).
  - Place primary actions in locations users expect:
    - On iOS, common actions appear in the **top-right** (e.g., “Add”) or bottom in toolbars, not via floating buttons.[cite:3]
  - Ensure tappable targets are at least **44x44pt** to be easily tapped.[cite:12]
  - Keep a visible button for every action a gesture offers. Card swipes and long presses (`SwipeableCard`) are shortcuts, never the only route, because VoiceOver and Voice Control users cannot swipe a card.
  - Make haptics with `@capacitor/haptics` (`src/utils/haptics.ts`), never a custom plugin. It is a native plugin: run `cap sync ios` after `pnpm build:app`, and the change needs a new App Store build.
- The AI MUST NOT:
  - Copy Android interaction paradigms (e.g., FAB as primary action) unless adapted to feel native to iOS.

### 2.3 Accessibility

- The AI MUST:
  - Support **Dynamic Type** by using system text styles and avoiding fixed text sizes.
  - Provide **accessibility labels** and hints for non-text controls for VoiceOver.
  - Maintain sufficient color contrast for text and important UI elements.
- The AI SHOULD:
  - Test UI with larger text sizes and VoiceOver.
  - Avoid relying solely on color to convey information.

---

## 3. Permissions, Security & Privacy

### 3.1 Permissions

- The AI MUST:
  - Request only permissions that are strictly necessary (camera, microphone, photos, location, contacts, etc.).
  - Provide **clear, specific usage descriptions** in `Info.plist` keys (e.g., `NSCameraUsageDescription`) that explain why data is needed in user-friendly language, consistent with actual use.
  - Defer permission requests until the user initiates a relevant action (e.g., tap “Take Photo”).
- The AI MUST NOT:
  - Request sensitive permissions on app launch purely for convenience.
  - Misrepresent permission usage in prompts or App Store metadata.

### 3.2 Data Storage & Cryptography

- The AI MUST:
  - Store sensitive data (tokens, passwords, secrets, PII) only in:
    - The **Keychain**, or
    - Secure containers backed by **Secure Enclave** when appropriate (e.g., keys for biometric-protected items).
  - Strongly consider **App Attest** and DeviceCheck to verify app and device integrity before communicating with sensitive backends.
  - Avoid storing secrets in source code, plist files, or UserDefaults.
  - Use Apple-provided or well-established cryptographic libraries (e.g., CryptoKit); no custom crypto.
- The AI MUST NOT:
  - Store sensitive data unencrypted on disk, in caches, or in logs.
  - Expose sensitive data in crash reports or analytics.

### 3.3 Network Security

- The AI MUST:
  - Use **HTTPS/TLS** for all network traffic and comply with **App Transport Security (ATS)**.[cite:14]
  - Avoid ATS exceptions unless strictly required; if used, they MUST be documented and justified in the spec.
  - Implement robust handling for network errors (offline, timeouts, server errors).
- The AI MUST NOT:
  - Use non-TLS protocols for personal or sensitive data.
  - Disable certificate validation or use insecure networking options in production.

### 3.4 Authentication & Sessions

- The AI MUST:
  - Use secure authentication protocols (e.g., OAuth 2.0 / OIDC) via URLSession or appropriate frameworks.
  - Store authentication tokens in the **Keychain** and handle expiration and refresh properly.
  - Use **Sign in with Apple** when social login/sign-in options are provided, in accordance with App Store guidelines.[cite:14]
  - Implement **Screen Shielding** features to hide sensitive data when the app is backgrounded or in the App Switcher.
- The AI SHOULD:
  - Offer biometric authentication (Face ID / Touch ID) as a convenience layer over secure credential storage.
  - Implement server-side and client-side rate limiting for authentication flows when supported.

### 3.5 Privacy Manifests & Nutrition Labels

- The AI MUST:
  - Maintain an up-to-date **Privacy Manifest** for the app and integrated third-party SDKs, declaring:
    - `NSPrivacyCollectedDataTypes` (what data is collected and why) and
    - `NSPrivacyAccessedAPITypes` (which privacy-sensitive APIs are used and the reasons).[cite:5]
  - Ensure the privacy manifest is complete and correct; starting May 1, 2024, apps lacking proper manifests can be rejected from App Store Connect.[cite:5]
  - Ensure **App Store Privacy Nutrition Labels** accurately reflect:
    - The categories of data collected,
    - Whether they are linked to the user or used for tracking.[cite:5][cite:11]
- The AI MUST:
  - Follow Apple’s privacy pillars: data minimization, on-device processing where possible, transparency, and user control.[cite:8][cite:11]

### 3.6 Tracking & Regulatory Compliance

- The AI MUST:
  - Respect **App Tracking Transparency (ATT)**:
    - Only access the IDFA or track users across apps after obtaining explicit ATT consent when required.
  - Implement data minimization and clear consent flows to align with privacy regulations (e.g., GDPR, CCPA where applicable).
- The AI MUST NOT:
  - Implement fingerprinting or hidden tracking mechanisms forbidden by Apple policies.[cite:14]

---

## 4. Performance & Resource Management

### 4.1 Main Thread & Concurrency

- The AI MUST:
  - Keep heavy work off the main thread using **async/await**, **GCD** (`DispatchQueue`), or **OperationQueue**.
  - Ensure network calls, JSON parsing, database operations, and image processing do not block UI.
- The AI SHOULD:
  - Use structured concurrency (task groups, task cancellation) to avoid orphaned tasks and memory leaks.

### 4.2 Rendering, Lists & Images

- The AI MUST:
  - Use efficient list views (e.g., SwiftUI `List`, UICollectionView/UITableView) with cell reuse and lazy loading.
  - Avoid complex, deeply nested layout structures where possible.
- The AI SHOULD:
  - Use an image loading & caching mechanism (e.g., `AsyncImage` with caching strategy or a library) to avoid repeated downloads.
  - Use appropriately sized images and scale them to device resolution.

### 4.3 Memory, Battery, and Background Work

- The AI MUST:
  - Avoid retain cycles by using `[weak self]` in closures where appropriate.
  - Release heavy resources (e.g., large caches, open file handles) when not needed.
  - Use **BackgroundTasks** (`BGTaskScheduler`) for background refresh and processing instead of long-running background work.[cite:14]
- The AI SHOULD:
  - Use **Instruments** (Time Profiler, Allocations, Leaks, Energy Log) during development to identify hotspots and memory issues.

---

## 5. Networking & Offline Behavior

- The AI MUST:
  - Implement a dedicated networking layer based on `URLSession` (or a well-maintained wrapper) with:
    - Centralized request building and response handling.
    - Standard error mapping and retry logic where appropriate.
  - Handle network connectivity loss gracefully with user-friendly messaging and retry options.
- The AI SHOULD:
  - Support offline capabilities where the product spec requires it, using:
    - Local persistence (Core Data, SQLite, or other storage) as a cache or offline store.
    - Background syncing when network returns.

---

## 6. Analytics, Logging & Third-Party SDKs

- The AI MUST:
  - Collect analytics using:
    - Minimal data required for product metrics and diagnostics.
    - No PII in analytics events by default.
  - Maintain a list of all third-party SDKs and:
    - Document what data each collects and how it is used.
    - Ensure each SDK is correctly represented in the Privacy Manifest and Privacy Nutrition Labels.[cite:5][cite:11]
- The AI MUST NOT:
  - Integrate SDKs that violate Apple’s App Review Guidelines related to user privacy, security, or tracking.[cite:14]
  - Log sensitive data in production builds.
- The AI SHOULD:
  - Provide in-app controls (where appropriate) for:
    - Opting out of analytics or personalized experiences.
    - Viewing and managing privacy preferences.

---

## 7. Testing, Debug Builds & Release

- The AI MUST:
  - Provide unit tests for core business logic and data transformations.
  - Provide UI tests for critical flows (sign in, purchase, main feature flows) using XCTest / XCUITest.
  - Configure separate build configurations for:
    - **Debug**: verbose logging, feature flags, dev endpoints.
    - **Release**: minimal logging, production endpoints, full optimizations.
  - Ensure the app builds with no critical warnings and passes static analysis (Xcode’s analyzer).
- The AI SHOULD:
  - Integrate CI to run tests and checks on each change.
  - Use code coverage and crash reporting tools to monitor quality post-release (while respecting privacy constraints).

---

## 8. App Store Compliance & Legal Considerations

- The AI MUST:
  - Comply with Apple’s **App Review Guidelines** in the areas of:
    - Safety (no malicious behavior, proper handling of user-generated content).
    - Performance (apps must be stable and responsive).
    - Business (transparent subscriptions and in-app purchases).
    - Design (use of standard UI patterns and behavior).
    - Legal (privacy, intellectual property, content restrictions).[cite:14]
  - Ensure the app includes:
    - A clear **Privacy Policy** URL in App Store Connect where required.
    - A visible in-app location (e.g., Settings screen) to access privacy information.
    - An **in-app account deletion** path if users can create accounts, as required by Apple.[cite:14]
- The AI SHOULD:
  - Provide localized privacy/legal text where the app targets multiple locales.
  - Align actual data handling strictly with declared policies to avoid App Store rejections and regulatory issues.

---

## 9. Documentation & Spec Annotations

- The AI MUST:
  - Document:
    - Each permission and its rationale.
    - Each data store (Keychain items, on-device databases) and what they contain.
    - Each third-party SDK, including:
      - Its purpose,
      - Data it collects,
      - Whether it uses tracking or identifies users.
  - Keep app documentation synchronized with:
    - The Privacy Manifest,
    - App Store Privacy Nutrition Labels,
    - App Review submissions.
- The AI SHOULD:
  - Add inline comments for any non-obvious implementation where privacy, security, or performance trade-offs are made, to aid future review.

