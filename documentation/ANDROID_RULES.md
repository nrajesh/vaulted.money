# ANDROID_RULES.md
# Android AI Development Rules

These rules are **normative**. The AI agent that designs and implements the Android app MUST follow them unless the project spec explicitly overrides a specific rule.

---

## 0. Scope & General Principles

- The AI MUST:
  - Build a native Android app using **Kotlin** as the primary language.
  - Target the latest stable Android SDK version and support a reasonable `minSdk` specified in the project spec.
  - Prefer modern Android libraries (Jetpack, Material 3, etc.) and avoid deprecated APIs.
- The AI MUST design for:
  - **Security and privacy first**, then correctness, usability, and performance-in that order.[cite:10]
  - Accessibility, internationalization, and different screen sizes/densities.

---

## 1. Architecture & Project Structure

- The AI MUST:
  - Use a clean architecture with clear separation:
    - **UI layer** (Activities/Fragments/Compose screens)
    - **Presentation layer** (ViewModels)
    - **Domain layer** (use-cases / business logic, where applicable)
    - **Data layer** (repositories, local & remote data sources)
  - Manage dependencies and library versions using **Gradle Version Catalogs** (`libs.versions.toml`).
  - Avoid placing business logic or networking directly in Activities/Fragments/Composables.
- The AI SHOULD:
  - Prefer a **single-activity architecture** with the **Jetpack Navigation** component unless the spec requires multiple activities.
  - Use **dependency injection** (e.g., Hilt) for shared services (repositories, API clients, databases).
- The AI MUST structure modules to support testability:
  - Core business logic in plain Kotlin modules with no Android UI dependency.
  - UI logic testable via unit tests and UI tests.

---

## 2. UI/UX & Platform Conventions

### 2.1 Design System & Layout

- The AI MUST:
  - Follow **Material Design 3** guidelines and use **Material Components** / **Compose Material 3** for UI widgets and layouts.[cite:15][cite:3]
  - Use `dp` for layout dimensions and `sp` for text size.
  - Support **light and dark themes** and respect system theme.
  - Use system fonts and icons where applicable for a native feel.
- The AI SHOULD:
  - Use dynamic color (Material You) when compatible and when not in conflict with branding.

### 2.2 Navigation & Interaction

- The AI MUST:
  - Implement navigation using:
    - Top-level sections via **Bottom Navigation** (3–5 destinations) or **NavigationRail** / Drawer when appropriate.
    - Up/back navigation consistent with Android patterns (app bar up button vs. system back).[cite:3]
  - Ensure every tappable target is at least ~48dp in touch size.
  - Keep a visible button for every action a gesture offers. Card swipes and long presses (`SwipeableCard`) are shortcuts, never the only route, because TalkBack users cannot swipe a card.
  - Make haptics with `@capacitor/haptics` (`src/utils/haptics.ts`), never a custom plugin. It is a native plugin: run `cap sync android` after `pnpm build:app`, and the change needs a new Google Play build.
- The AI MUST NOT:
  - Override the system back behavior in ways that surprise users (e.g., exiting the app unexpectedly from a deep screen).

### 2.3 Accessibility

- The AI MUST:
  - Support system **font scaling** and avoid fixed text sizes.
  - Provide **content descriptions** for important non-text UI elements for TalkBack users.
  - Maintain sufficient color contrast between text and background.
- The AI SHOULD:
  - Test layouts for common language directions (LTR/RTL) and multiple screen sizes.
  - Avoid relying solely on color to convey information.

---

## 3. Permissions, Security & Privacy

### 3.1 Permissions

- The AI MUST:
  - Request the **minimum set of permissions** needed, and **only at the time of use**, not at app launch.[cite:10][cite:4]
  - Provide a clear, human-readable explanation to the user (in UI copy) when requesting sensitive permissions (location, camera, microphone, contacts, etc.).
  - Handle permission denial gracefully and provide degraded but functional behavior where possible.
- The AI MUST NOT:
  - Request broad permissions when a narrower permission or OS feature suffices.
  - Bypass or discourage users from denying permissions.

### 3.2 Data Storage & Cryptography

- The AI MUST:
  - Store sensitive data (tokens, passwords, secrets, personal identifiers) only in:
    - **Android Keystore** or
    - **Jetpack Security** encrypted storage (e.g., `EncryptedSharedPreferences`, `EncryptedFile`).[cite:10][cite:7]
  - Avoid storing secrets in source code, resources, or version control (no hard-coded API keys, secrets, or credentials).
  - Use well-reviewed cryptography provided by the Android framework or standard libraries (no custom crypto).
- The AI MUST NOT:
  - Store sensitive data on external storage (e.g., SD card) unless strictly necessary and encrypted.
  - Log sensitive data (passwords, tokens, personal info) to Logcat or analytics.[cite:4]

### 3.3 Network Security

- The AI MUST:
  - Use **HTTPS/TLS** for all network communication and rely on modern TLS settings.[cite:1][cite:10]
  - Validate SSL certificates using the platform defaults and consider certificate pinning for highly sensitive apps (e.g., banking).
  - Implement robust error handling for network failures and timeouts.
- The AI MUST NOT:
  - Use plain HTTP for production traffic.
  - Disable certificate validation or ignore errors in release builds.

### 3.4 Authentication & Sessions

- The AI MUST:
  - Use secure authentication mechanisms such as:
    - OAuth 2.0 / OpenID Connect, or
    - Passkeys / biometric auth via Android’s authentication APIs.[cite:10][cite:4]
  - Utilize Google's **Play Integrity API** to protect against tampering, illegitimate devices, and unauthorized app modifications.
  - Store tokens securely (see 3.2) and implement token expiration and refresh correctly.
  - Implement rate-limiting logic on sensitive operations where supported by backend (login, password reset).
- The AI SHOULD:
  - Support biometric authentication (fingerprint/face) as a convenience layer on top of secure credential storage.

### 3.5 Privacy & Data Minimization

- The AI MUST:
  - Apply **data minimization**: only collect data strictly required for features.[cite:10][cite:13]
  - Clearly document, in code comments and spec annotations, what data is collected, why, and where it is sent.
  - Implement a clear user path for:
    - Viewing stored personal data (where feasible) and
    - Requesting deletion or account closure.
  - Ensure Play Store **Data safety** section and any in-app privacy disclosures accurately reflect actual behavior.[cite:10]
- The AI MUST NOT:
  - Collect or share personal data with third parties without explicit disclosure and consent where required.
  - Use device identifiers or advertising IDs for tracking in ways that violate Google Play policies or local law (e.g., GDPR).

---

## 4. Performance & Resource Management

### 4.1 Main Thread & Concurrency

- The AI MUST:
  - Keep all heavy work **off the main thread** using Kotlin coroutines, `Dispatchers.IO`, or other async mechanisms.
  - Ensure database operations, network calls, and large file I/O do not block UI.
  - Deprecate `LiveData` in favor of **`StateFlow`** and **`SharedFlow`** for state and event emission from ViewModels to Compose/Views.
- The AI SHOULD:
  - Use structured concurrency and cancellation to avoid leaked jobs and background work.

### 4.2 Rendering & UI Performance

- The AI MUST:
  - Use efficient list components (`RecyclerView` or `LazyColumn` / `LazyGrid` in Compose) for large or dynamic lists.
  - Avoid unnecessary layout nesting and overdraw (e.g., deep view hierarchies).
  - Optimize Compose recomposition by using `@Stable` and `@Immutable` annotations, and hoisting state properly.
- The AI SHOULD:
  - Use image loading libraries (e.g., Coil, Glide) with caching, placeholders, and proper image resizing.

### 4.3 Battery, Memory, and Background Work

- The AI MUST:
  - Use **WorkManager** or job scheduling APIs for deferrable background tasks.
  - Avoid long-running background services unless truly necessary and follow foreground service guidelines.
  - Release references to Activities/Fragments in long-lived objects to prevent memory leaks.
- The AI SHOULD:
  - Use Android Studio profilers (CPU, memory, network) during development to identify bottlenecks and leaks.

---

## 5. Networking & Offline Behavior

- The AI MUST:
  - Use a well-structured networking layer (e.g., Retrofit/OkHttp or Ktor) with:
    - Centralized configuration for base URL, interceptors, and authentication.
    - Reasonable timeouts and retry logic (with exponential backoff where appropriate).
  - Handle network loss gracefully:
    - Show understandable messages.
    - Allow user to retry actions.
- The AI SHOULD:
  - Implement offline caching where appropriate (e.g., Room as local cache).
  - Queue write operations and sync with the server when connectivity is restored if the product spec requires offline behavior.

---

## 6. Analytics, Logging & Third-Party SDKs

- The AI MUST:
  - Collect only analytics data strictly required for improving the app or understanding usage.
  - Ensure no PII (personally identifiable information) is placed into analytics events by default.
  - Maintain a list of all third-party SDKs and:
    - Document what data each SDK collects.
    - Ensure this list matches the Play Data safety disclosure and internal documentation.[cite:10]
- The AI MUST NOT:
  - Integrate SDKs that conflict with project privacy requirements or major app store privacy policies.
  - Enable verbose logging in production builds; logs must be minimized and sanitized.

---

## 7. Testing, Debug Builds & Release

- The AI MUST:
  - Provide unit tests for critical business logic and data parsing.
  - Provide UI tests for critical user flows (auth, checkout, main task flows).
  - Use different build types (`debug`, `release`) with:
    - Debug-only logging and tooling.
    - Release builds with **strict minification/obfuscation** (R8/ProGuard) and code shrinking enabled.
  - Sign release builds with the proper signing config, and ensure signing keys are not stored in source control.
- The AI SHOULD:
  - Integrate continuous integration (CI) to run tests and lint checks on each change.
  - Use static analysis tools (e.g., Android Lint, detekt) to catch issues early.

---

## 8. Store Compliance & Legal Considerations

- The AI MUST:
  - Comply with Google Play policies related to:
    - Safety and security
    - Restrictions on permissions and background access
    - User data and privacy disclosures
  - Ensure the app includes:
    - A clear **Privacy Policy** URL in the Play Console when required.
    - In-app access (e.g., settings screen) to privacy information and account deletion where accounts are supported.
- The AI SHOULD:
  - Consider regional regulations (e.g., GDPR) by:
    - Providing appropriate consent flows.
    - Implementing data export and deletion mechanisms where required.

---

## 9. Documentation & Spec Annotations

- The AI MUST:
  - Document:
    - Each permission usage.
    - Each data store (what it holds and why).
    - Each third-party SDK (purpose, data collected).
  - Keep comments and README sections up to date with actual behavior so that privacy and security reviews are straightforward.
