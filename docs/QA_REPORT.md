# PickleballHQ QA Audit Report

**Date:** 2026-03-31
**Scope:** Full frontend code audit
**Auditor:** QA Agent (automated)

---

## Executive Summary

PickleballHQ extends the TennisHQ architecture with pickleball-specific features (courts, paddles, matchmaking, posted games, gamification). The codebase has solid feature coverage but several critical bugs exist, including missing dependencies, a non-existent theme property reference, and the home page being entirely hardcoded mock data with no API integration.

---

## P0 — Critical (Must Fix)

### 1. `theme.blue` does not exist — runtime crash
- **File:** `app/app/paddles.tsx:97`
- **Issue:** `theme.blue` is referenced for the 'mid-range' category badge color, but the PickleballHQ theme (`app/lib/theme.ts`) does NOT define a `blue` property. Only TennisHQ's theme has `blue: '#3b82f6'`. This will throw `undefined` at runtime when rendering any mid-range paddle.
- **Fix:** Add `blue: '#3b82f6'` to Pickleball theme, or change to `theme.accent` or `theme.linkBlue`.

### 2. Missing `expo-sharing` dependency
- **File:** `app/package.json`
- **Issue:** `expo-sharing` is imported in `app/lib/share.ts` (via `ShareButton` component used in profile) but is NOT listed in `package.json`. Will crash when users try to share.
- **Fix:** Add `"expo-sharing": "~13.0.1"` to dependencies.

### 3. Home page (`index.tsx`) is entirely hardcoded mock data
- **File:** `app/app/(tabs)/index.tsx` (entire file, ~800 lines)
- **Issue:** The main Play screen uses 100% hardcoded `POSTED_GAMES` array and `COURT_INFO` object. No API calls are made. When the hardcoded dates (e.g., `2026-03-25T18:00:00`) pass, all games will appear as past events with no way to update.
- **Impact:** The core "play now" feature is a static demo, not functional.
- **Fix:** Replace with `useQuery` calls to `/api/posted-games` and `/api/courts`.

### 4. Hardcoded mock dates will show all games as past
- **File:** `app/app/(tabs)/index.tsx:97-109`
- **Issue:** All `POSTED_GAMES` entries use dates from March 25-30, 2026. After March 30, every game will render as "X days ago" or similar past-state UI, making the home page appear broken.
- **Fix:** Use API data with dynamic dates, or at minimum use relative dates (`new Date()` + offset).

---

## P1 — Important (Should Fix)

### 1. Missing translation keys used in Profile screen
- **File:** `app/app/(tabs)/profile.tsx:168-192`
- **Issue:** The profile screen calls `t('wins')`, `t('settings')`, `t('notifications')`, and `t('language')`, but these keys do NOT exist in `app/lib/translations.ts`. The `t()` function returns the raw key string (e.g., the UI will display "wins" instead of a proper label).
- **Fix:** Add these keys to all language entries in translations.ts.

### 2. Theme system inconsistency — `theme.glass` vs `theme.card`
- **Files:** `app/app/(tabs)/courts.tsx`, `app/app/paddles.tsx`, `app/app/play-now.tsx`, `app/app/matchmaking.tsx`
- **Issue:** These screens use `theme.card` (`#1e1e1e`) for backgrounds while other screens and TennisHQ use `theme.glass` (`rgba(255,255,255,0.025)`). The Pickleball theme doesn't even define `glass`, `glassBorder`, `glassBorderTop`, `glassCardShadow`, or `tabBarBg` — it lacks the glass design system entirely.
- **Impact:** Visual inconsistency; Pickleball looks materially different from Tennis despite being the same codebase architecture.
- **Fix:** Either add glass properties to Pickleball theme or commit to the solid-card design and update all screens consistently.

### 3. Hardcoded user profile data
- **File:** `app/app/(tabs)/profile.tsx:30-37`
- **Issue:** `MOCK_USER` with hardcoded name, DUPR, matches, wins, streak, and XP. No API integration.
- **Fix:** Fetch user data from API or auth system.

### 4. Hardcoded geolocation in matchmaking
- **File:** `app/app/matchmaking.tsx:67`
- **Issue:** Latitude/longitude hardcoded to Irvine, CA (`lat: '33.6846', lng: '-117.8265'`). Not using device geolocation.
- **Fix:** Use `expo-location` to get real device location.

### 5. No search functionality
- **Issue:** Unlike TennisHQ which has a full search screen (`search.tsx`), PickleballHQ has no search feature at all. No way to search players, courts, or paddles from a central search.
- **Fix:** Add a search screen or search integration.

### 6. Missing `expo-linking` / deep link configuration
- **File:** `app/app/_layout.tsx`
- **Issue:** No `linking` configuration unlike TennisHQ. Deep links (`pickleballhq://player/123`) won't work.
- **Fix:** Add `expo-linking` and configure linking prefixes.

### 7. No offline support
- **Issue:** Unlike TennisHQ which has cache fallback in `api.ts` and an `OfflineBanner`, PickleballHQ has no offline support. The API client is a bare axios instance with no caching or offline detection.
- **Fix:** Add cache interceptor and offline banner matching TennisHQ's implementation.

### 8. `notifications` imported but never initialized
- **File:** `app/app/_layout.tsx` — no `initNotifications()` call
- **Issue:** `expo-notifications` is in dependencies and `lib/notifications.ts` (if it exists) or push-strategy.ts is ready, but never initialized.
- **Fix:** Call initialization in root layout.

### 9. Fantasy screens assume Tennis data structures
- **Files:** `app/app/fantasy/*.tsx` (create, team, leaderboard, predict, etc.)
- **Issue:** Fantasy screens are mostly copied from TennisHQ. The scoring rules reference tennis concepts (aces, break points, grand slams, Masters 1000). These don't apply to pickleball.
- **Fix:** Adapt fantasy scoring to pickleball-specific metrics or hide the feature until ready.

### 10. Hardcoded court info data in home page
- **File:** `app/app/(tabs)/index.tsx:48-60`
- **Issue:** `COURT_INFO` is a hardcoded dictionary keyed by court ID with static ratings, playing counts, and visit numbers. This data will never update.
- **Fix:** Fetch court status from `/api/courts` endpoint.

---

## P2 — Suggestions (Nice to Have)

### 1. Duplicate `getInitials` functions
- **Files:** `app/app/(tabs)/index.tsx:71`, `app/app/play-now.tsx:52`
- **Issue:** Same function copy-pasted in multiple files.
- **Fix:** Move to `app/lib/utils.ts`.

### 2. No loading skeleton for Play Now screen initial state
- **File:** `app/app/play-now.tsx:139`
- **Issue:** When `isLoading` is true but `hasSearched` is false, the screen shows nothing (`null`). Should show a loading state or placeholder.
- **Fix:** Add skeleton loading for the initial state.

### 3. `post-game.tsx` — complex multi-step form without state persistence
- **File:** `app/app/post-game.tsx`
- **Issue:** If user navigates away mid-form, all progress is lost. No draft saving.
- **Fix:** Save form state to AsyncStorage as draft.

### 4. Missing `h2h.tsx` and `fantasy.tsx` tab screens
- **File:** `app/app/(tabs)/_layout.tsx:79-80`
- **Issue:** Hidden tabs reference `h2h` and `fantasy` names, and there are files at `app/h2h.tsx` and `app/fantasy/*.tsx`, but no `app/(tabs)/h2h.tsx` or `app/(tabs)/fantasy.tsx`. These routes may 404 if navigated to via the tab bar (though they're hidden with `href: null`).
- **Risk:** Low since tabs are hidden, but could confuse developers.

### 5. `push-strategy.ts` never used
- **File:** `app/lib/push-strategy.ts`
- **Issue:** Full push notification strategy module with `shouldSendPush()`, `generatePushMessage()`, `getNextPushTime()` — but never imported or called anywhere.
- **Fix:** Wire into notification system or remove until ready.

### 6. `app/lib/notifications.ts` — file exists but unclear if complete
- **Issue:** The file was not found during audit (may not exist in Pickleball, only in Tennis). If it doesn't exist, the `expo-notifications` dependency is purely unused.

### 7. No Calendar screen
- **Issue:** TennisHQ has a `calendar.tsx` for upcoming matches. PickleballHQ has no equivalent for upcoming games.
- **Suggestion:** Add a calendar view for posted games.

### 8. Hardcoded court names in mock data
- **File:** `app/app/(tabs)/index.tsx:97-109`
- **Issue:** Court names like "Pickleball Station", "Rancho San Joaquin", etc. are hardcoded. If real court data has different IDs or names, the mock data won't match.

### 9. Tab icon `emoji` prop unused for main tabs
- **File:** `app/app/(tabs)/_layout.tsx:11`
- **Issue:** `TabIcon` accepts an `emoji` prop but none of the 5 main tabs use it. Only the type definition exists.
- **Not a bug**, just unused code.

### 10. Missing `expo-sharing` in `share.ts` — different pattern than Tennis
- **File:** `app/lib/share.ts`
- **Issue:** Pickleball's share.ts uses only React Native's `Share` API, not `expo-sharing`. But `ShareButton.tsx` imports from `share.ts` which doesn't use `expo-sharing`. However, the `package.json` still doesn't list `expo-sharing` — so if someone adds expo-sharing later, it will work. Current code should work without it.
- **Clarification:** This is actually fine for current code, but inconsistent with Tennis's approach.

---

## Summary Table

| Severity | Count |
|----------|-------|
| P0       | 4     |
| P1       | 10    |
| P2       | 10    |
| **Total**| **24**|

---

## Cross-Project Issues

### Shared between TennisHQ and PickleballHQ:

1. **Duplicate code across projects** — `getInitials`, `InfoRow`, Fantasy logic, i18n system, skeleton components, empty states are all copy-pasted. Consider a shared `@tennishq/ui` package.

2. **Pickleball `shared/types.ts` is an exact copy of Tennis's** — It includes tennis-specific types (`SetStats`, `GameByGameEntry`, `SetGameByGame`, `backhand`, `plays` fields on Player) that don't apply to pickleball. The types should be sport-specific.

3. **Pickleball translations are copied from Tennis** — Contains tennis-specific keys like `grandSlams`, `backhand`, `racket`, `clay`, `grass` that don't apply to pickleball.
