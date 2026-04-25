# Voidix UI Strip Phase 2 — Design Spec

**Date:** 2026-04-24
**Branch:** `canary`
**Scope:** Remove remaining LobeChat-specific UI entry points from Voidix

---

## Goal

Hide all remaining LobeChat features irrelevant to a focused AI image/video generation platform. Code is retained; only UI entry points are suppressed.

---

## Change 1 — `src/hooks/useNavLayout.ts`

Two changes in one file:

**1a. Hide search/CommandMenu icon**

In `topNavItems`, add `hidden: true` to the search item:

```ts
{
  hidden: true,
  icon: SearchIcon,
  key: 'search',
  onClick: () => toggleCommandMenu(true),
  title: t('tab.search'),
},
```

The CommandMenu (Cmd+K) contains agent/group/page/knowledge-base commands that don't belong in Voidix. The `NavItem` component already respects `hidden`.

**1b. Hide Memory link in user panel**

Change `showMemory: true` to `showMemory: false` in the `userPanel` useMemo. This removes the Memory link from the user dropdown menu (gated by `userPanel.showMemory` in `useMenu.tsx`).

---

## Change 2 — `src/routes/(main)/home/features/InputArea/index.tsx`

Remove SuggestQuestions, CommunityRecommend, and the now-dead inputActiveMode logic.

**State and logic to remove:**

- `inputActiveMode` store selector (no longer needed — both image/video navigate away immediately, so inputActiveMode is always null)
- `hideStarterList` computed variable (always false — simplify to remove)
- `showSuggestQuestions` computed variable (always true, but section is being removed)
- `extraActionItems` useMemo and prop to `DesktopChatInput` (always `[]` since inputActiveMode never set)
- `useEffect` that handles `inputActiveMode` scroll-into-view

**JSX to remove:**

- The entire `AnimatePresence` block (the `m.div` containing `SuggestQuestions` and `CommunityRecommend`)
- The `div` wrapper with `display: hideStarterList ? 'none' : undefined` around `StarterList` — replace with direct `<StarterList />` render

**Imports to remove after cleanup:**

- `CommunityRecommend` from `'../CommunityRecommend'`
- `SuggestQuestions` from `'../SuggestQuestions'`
- `ModeTag` from `'./ModeTag'`
- `AnimatePresence`, `m` from `'motion/react'`
- `useEffect` from `'react'` (if no longer used)
- `inputActiveMode` from `useHomeStore`

**What to keep:**

- `StarterList` rendered directly (no wrapper div needed)
- `DesktopChatInput` with `leftActions`, `sendButtonProps`, `onSend`, etc.
- All file upload / drag zone logic
- `SkillInstallBanner` and its logic

---

## Change 3 — `src/routes/(main)/home/_layout/Body/index.tsx`

Remove the Recents accordion from the home sidebar.

- Remove `GroupKey.Recents` from `ACCORDION_KEYS` set
- Remove `[GroupKey.Recents]: (key) => <Recents itemKey={key} key={key} />` from `accordionComponents`
- Remove `import Recents from '@/routes/(main)/home/features/Recents'`
- Remove `GroupKey.Recents` from `defaultExpandedKeys` array in the `<Accordion>` component

After these changes, `GroupKey.Recents = 'recents'` may still appear in `sidebarItems` from the global store but will silently render nothing (it's not in `navLinkItems` and not in `ACCORDION_KEYS`, so `renderNavLink('recents')` returns null).

---

## Change 4 — `src/routes/(main)/home/_layout/Footer/index.tsx`

Simplify the footer help menu and remove all LobeChat promotions.

**From `helpMenuItems`, remove:**

- Docs link (always visible, links to LobeChat docs)
- Discord link (LobeChat community, wrong brand)
- Changelog entry (supposed to be hidden by FEATURE_FLAGS `-changelog` but Footer doesn't respect it)

**Keep in `helpMenuItems`:**

- Settings link (gated by `footer.showSettingsEntry && !isDevMode`) ✅
- Feedback button ✅

**Remove from JSX:**

- `<HighlightNotification ... />` block (lines \~402-415) — the Product Hunt and agent onboarding promotion cards
- `<Billboard />` (line \~416) — LobeChat dynamic promotions

**After removing the HighlightNotification and Billboard, remove all now-dead code:**

- `activePromotion` useMemo
- `isAgentOnboardingCardOpen`, `isProductHuntCardOpen` state
- Two `useEffect` hooks for auto-showing promotions
- All promotion handlers: `handleCloseAgentOnboardingCard`, `handleAgentOnboardingAction`, `handleOpenProductHuntCard`, `handleCloseProductHuntCard`, `handleProductHuntActionClick`
- `resolveFooterPromotionState` import and call
- `shouldAutoShowAgentOnboardingPromo`, `shouldAutoShowProductHuntCard`, `shouldShowProductHuntMenuEntry` from the promotion useMemo
- `AGENT_ONBOARDING_PROMO_SLUG` and `PRODUCT_HUNT_NOTIFICATION` constants
- Store subscriptions only used by promotions: `agentOnboardingFinished`, `agentOnboardingStarted`, `classicOnboardingFinished`, `isAgentOnboardingPromoRead`, `isProductHuntNotificationRead`, `updateSystemStatus`, `isWithinTimeWindow`
- `ChangelogModal` component and its state (`shouldLoadChangelog`, `isChangelogModalOpen`) and handler (`handleOpenChangelogModal`, `handleCloseChangelogModal`)
- `trackPromotionEvent`, `markNotificationRead` callbacks
- `useBillboardMenuItems`, `Billboard` imports
- `HighlightNotification` import
- `ChangelogModal` import
- Unused lucide icons after cleanup: `FileClockIcon`, `MessageCircle`, `Rocket`, `Book`, `DiscordIcon`, `Feather`
- `useAnalytics` if no longer used
- `SOCIAL_URL` import
- `DOCUMENTS_REFER_URL` import
- `PromotionCard` interface
- `enableAgentOnboarding`, `isMobile`, `serverConfigInit` from server config store (if only used by promotions)

**Keep:**

- `helpMenuItems` with Settings + Feedback
- ThemeButton
- `useNavLayout` usage for `footer`
- Compact layout JSX

---

## Change 5 — Route redirects

Redirect LobeChat-specific routes to home. Add `<Navigate to="/" replace />` to the entry component of each route:

- `src/routes/(main)/agent/index.tsx`
- `src/routes/(main)/group/index.tsx`
- `src/routes/(main)/community/(list)/index.tsx` (or the community route entry)
- `src/routes/(main)/tasks/index.tsx`
- `src/routes/(main)/eval/index.tsx`

For each file: read the current content, replace the component body with just `return <Navigate to="/" replace />;`, keeping any necessary imports.

---

## Risk Assessment

| Change                             | Difficulty | Risk                                  |
| ---------------------------------- | ---------- | ------------------------------------- |
| useNavLayout (hidden + showMemory) | Trivial    | None                                  |
| InputArea cleanup                  | Easy       | Low — purely additive removal         |
| Body Recents removal               | Trivial    | None                                  |
| Footer simplification              | Medium     | Low — large but contained in one file |
| Route redirects                    | Trivial    | None                                  |
