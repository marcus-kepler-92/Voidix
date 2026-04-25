# Voidix UI Strip Phase 2 — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Remove remaining LobeChat-specific UI entry points (CommandMenu, Recents, SuggestQuestions, CommunityRecommend, Footer promotions/links, LobeChat routes).

**Spec:** `docs/superpowers/specs/2026-04-24-voidix-ui-strip-phase2.md`

---

### Task 1: useNavLayout — hide search icon + memory link

**File:** `src/hooks/useNavLayout.ts`

- [ ] **Step 1: Add `hidden: true` to the search NavItem**

In the `topNavItems` useMemo, change the search item from:

```ts
{
  icon: SearchIcon,
  key: 'search',
  onClick: () => toggleCommandMenu(true),
  title: t('tab.search'),
},
```

to:

```ts
{
  hidden: true,
  icon: SearchIcon,
  key: 'search',
  onClick: () => toggleCommandMenu(true),
  title: t('tab.search'),
},
```

- [ ] **Step 2: Set `showMemory: false`**

In the `userPanel` useMemo, change `showMemory: true` to `showMemory: false`.

- [ ] **Step 3: Type-check and commit**

```bash
bun run type-check 2>&1 | tail -5
git add src/hooks/useNavLayout.ts
git commit -m "✨ feat(nav): hide CommandMenu search icon and Memory user panel link"
```

---

### Task 2: InputArea — remove SuggestQuestions and CommunityRecommend

**File:** `src/routes/(main)/home/features/InputArea/index.tsx`

- [ ] **Step 1: Remove inputActiveMode logic and the AnimatePresence section**

Read the file. Remove:

1. `inputActiveMode` from the `useHomeStore` selector (keep other selectors)
2. `hideStarterList` computed variable
3. `showSuggestQuestions` computed variable
4. `extraActionItems` useMemo
5. `useEffect` for inputActiveMode scroll-into-view
6. The `extraActionItems` prop from `DesktopChatInput`
7. The `div` wrapper with `display: hideStarterList ? 'none' : undefined` around `<StarterList />` — replace with direct `<StarterList />`
8. The entire `AnimatePresence` block at the bottom of the return (the one containing `SuggestQuestions` and `CommunityRecommend`)

- [ ] **Step 2: Remove unused imports**

Remove: `CommunityRecommend`, `SuggestQuestions`, `ModeTag`, `AnimatePresence`, `m` from motion/react. Remove `useEffect` if no longer used. Remove `inputActiveMode` from the `useHomeStore` destructuring (keep other fields if any).

- [ ] **Step 3: Type-check and commit**

```bash
bun run type-check 2>&1 | tail -5
git add "src/routes/(main)/home/features/InputArea/index.tsx"
git commit -m "✨ feat(home): remove SuggestQuestions and CommunityRecommend from InputArea"
```

---

### Task 3: Body — remove Recents accordion

**File:** `src/routes/(main)/home/_layout/Body/index.tsx`

- [ ] **Step 1: Remove Recents from ACCORDION_KEYS and accordionComponents**

Change:

```ts
const ACCORDION_KEYS = new Set<string>([GroupKey.Recents]);
```

to:

```ts
const ACCORDION_KEYS = new Set<string>([]);
```

Remove from `accordionComponents`:

```ts
[GroupKey.Recents]: (key) => <Recents itemKey={key} key={key} />,
```

Remove `import Recents from '@/routes/(main)/home/features/Recents'`.

- [ ] **Step 2: Remove Recents from defaultExpandedKeys**

In the `<Accordion>` render, change:

```ts
defaultExpandedKeys={[GroupKey.Recents, GroupKey.Project]}
```

to:

```ts
defaultExpandedKeys={[GroupKey.Project]}
```

- [ ] **Step 3: Check if accordionComponents object is now empty**

If `accordionComponents` is now an empty object `{}`, and `ACCORDION_KEYS` is an empty set, the accordion-related logic in the render loop still works correctly (it just never enters the accordion branch). Optionally simplify, but only if it doesn't change behavior.

- [ ] **Step 4: Type-check and commit**

```bash
bun run type-check 2>&1 | tail -5
git add "src/routes/(main)/home/_layout/Body/index.tsx"
git commit -m "✨ feat(nav): remove Recents accordion from home sidebar"
```

---

### Task 4: Footer — remove promotions and LobeChat links

**File:** `src/routes/(main)/home/_layout/Footer/index.tsx`

This task requires careful reading of the file before editing. The goal is to simplify the Footer by removing all promotion-related code and LobeChat-specific menu links.

- [ ] **Step 1: Simplify `helpMenuItems`**

Replace the `helpMenuItems` useMemo with a version that only contains Settings and Feedback:

```ts
const helpMenuItems: MenuProps['items'] = useMemo(
  () => [
    ...(footer.showSettingsEntry && !isDevMode
      ? [
          {
            icon: <Icon icon={Settings2} />,
            key: 'setting',
            label: <Link to="/settings">{t('userPanel.setting')}</Link>,
          },
          {
            type: 'divider' as const,
          },
        ]
      : []),
    {
      icon: <Icon icon={Feather} />,
      key: 'feedback',
      label: t('userPanel.feedback'),
      onClick: handleOpenFeedbackModal,
    },
  ],
  [footer.showSettingsEntry, handleOpenFeedbackModal, isDevMode, t],
);
```

- [ ] **Step 2: Remove HighlightNotification and Billboard from JSX**

Remove from the return:

- The `{activePromotion && <HighlightNotification ... />}` block

- `<Billboard />`

- `<ChangelogModal ... />`

- [ ] **Step 3: Remove all now-dead code**

After removing the JSX above, remove all code that becomes unused:

- `activePromotion` useMemo

- `isAgentOnboardingCardOpen`, `isProductHuntCardOpen`, `isChangelogModalOpen`, `shouldLoadChangelog` state

- Both `useEffect` hooks (for auto-showing promotions)

- All promotion handlers: `handleCloseAgentOnboardingCard`, `handleAgentOnboardingAction`, `handleOpenProductHuntCard`, `handleCloseProductHuntCard`, `handleProductHuntActionClick`, `handleOpenChangelogModal`, `handleCloseChangelogModal`

- `trackPromotionEvent`, `markNotificationRead` callbacks

- `resolveFooterPromotionState` import and destructured result

- `shouldAutoShowAgentOnboardingPromo`, `shouldAutoShowProductHuntCard`, `shouldShowProductHuntMenuEntry`

- `AGENT_ONBOARDING_PROMO_SLUG`, `PRODUCT_HUNT_NOTIFICATION` constants

- `PromotionCard` interface

- Store subscriptions used only by promotions: `agentOnboardingFinished`, `agentOnboardingStarted`, `classicOnboardingFinished`, `isAgentOnboardingPromoRead`, `isProductHuntNotificationRead`, `updateSystemStatus`, `isWithinTimeWindow`, `enableAgentOnboarding`, `isMobile`, `serverConfigInit`

- Unused imports after cleanup: `SOCIAL_URL`, `DOCUMENTS_REFER_URL`, `Billboard`, `useBillboardMenuItems`, `HighlightNotification`, `ChangelogModal`, `FileClockIcon`, `MessageCircle`, `Rocket`, `Book`, `DiscordIcon`, `FlaskConical`, `useAnalytics`

- Keep: `Feather`, `Settings2`, `CircleHelp`, `Icon`, `ActionIcon`, `DropdownMenu`, `Flexbox`, `useNavLayout`, `ThemeButton`, `useFeedbackModal`, `useUserStore` for `isDevMode`

- [ ] **Step 4: Type-check and commit**

```bash
bun run type-check 2>&1 | tail -5
git add "src/routes/(main)/home/_layout/Footer/index.tsx"
git commit -m "✨ feat(footer): remove LobeChat promotions and irrelevant menu links"
```

---

### Task 5: Redirect LobeChat routes to home

**Files:**

- `src/routes/(main)/agent/index.tsx`

- `src/routes/(main)/group/index.tsx`

- `src/routes/(main)/community/(list)/index.tsx` (read to confirm path)

- `src/routes/(main)/tasks/index.tsx`

- `src/routes/(main)/eval/index.tsx`

- [ ] **Step 1: Add Navigate redirect to each route**

For each file: read the current content, then replace the component body with a redirect. The minimum correct pattern is:

```tsx
import { Navigate } from 'react-router-dom';

const PageName = () => <Navigate replace to="/" />;

export default PageName;
```

Keep any existing `'use client'` directive if present.

For the community route, confirm the actual file path by listing `src/routes/(main)/community/`.

- [ ] **Step 2: Type-check and commit**

```bash
bun run type-check 2>&1 | tail -5
git add "src/routes/(main)/agent/index.tsx" "src/routes/(main)/group/index.tsx" "src/routes/(main)/tasks/index.tsx" "src/routes/(main)/eval/index.tsx"
git add "src/routes/(main)/community/"
git commit -m "✨ feat(routes): redirect LobeChat-specific routes to home"
```
