# Backlog

Work agreed for later releases. Move an item into a spec under `specs/` when it starts.

## 2.1

### Back up before risky operations

Make a backup automatically before an AI operation starts, before a CSV import (any entity) and before syncing with another device (cross-device continuity). Deferred from 2.0 so the first store release was not delayed.

### Larger Text that meets Apple's bar

The app ignores the iPhone's text-size setting, and its own "Larger" setting stops at 125%. Apple's Larger Text accessibility label needs text to grow to 200%. Follow the system text size (Dynamic Type) and allow up to 200%, check every screen on a 360px phone, then declare Larger Text in App Store Connect → App Accessibility.

### Other accessibility labels

- **Voice Control:** test every common task by voice, then declare it.
- **Differentiate Without Color Alone:** the calendar marks money in and out by colour only. Add a sign or icon, then declare it.

### Mac App Store

Try selling the desktop app on the Mac App Store, alongside or instead of Polar.

1. Build a Mac App Store version of the Electron app (`mas` target) with the App Sandbox on.
2. Check which desktop features survive the sandbox and adjust or drop the rest for that version:
   - the Local API (`electron/apiServer.ts`), which listens on localhost for scripts;
   - connecting outside AI apps (MCP, `mcp/`), which reach the app through that API;
   - cross-device sync to any folder the person picks (needs security-scoped bookmarks);
   - local AI models on the same Mac (network client entitlement).
3. Decide on pricing: a separate €9.99 Mac app, or one purchase for iPhone, iPad and Mac (universal purchase, same bundle ID).
4. Submit. If Apple approves it, decide whether Polar stays for Windows and Linux only.

Why it was not done for 2.0: the sandbox work, Apple's 15–30% fee against Polar's ~5%, and Polar covering Windows and Linux too.

## Later

- **Search in other languages:** plain-English search only understands English phrases. Extend `src/utils/searchParser.ts` to the other app languages.
- **EU trader address:** switch the App Store and Google Play trader address from the home address to the Zeist postbox, using the KvK extract as proof (a change goes back to review, so do it between releases).
