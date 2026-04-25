# Voidix Frontend Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide all LobeChat UI entry points irrelevant to Voidix (image/video generation platform), leaving code intact.

**Architecture:** Four isolated changes: env-var feature flags (zero code), one nav hook edit, one sidebar body edit, one settings category edit. Each change is independently reversible.

**Tech Stack:** Next.js 16, React 19, TypeScript, Zustand, react-i18next. No new dependencies.

---

### Task 1: Set FEATURE_FLAGS in `.env`

**Files:**

- Modify: `.env`

- [ ] **Step 1: Append FEATURE_FLAGS to `.env`**

Open `.env` and add the following line at the end of the file (before the trailing newline):

```
# Voidix: hide LobeChat-specific features
FEATURE_FLAGS=-market,-knowledge_base,-provider_settings,-openai_api_key,-openai_proxy_url,-speech_to_text,-welcome_suggest,-changelog,-check_updates,+commercial_hide_github,+commercial_hide_docs
```

The parser (`src/config/featureFlags/utils/parser.ts`) accepts `-flag` to set false and `+flag` to set true. Each flag maps to a `featureFlags` state field used across the app.

- [ ] **Step 2: Verify the flags parse correctly**

Run:

```bash
node -e "
const {parseFeatureFlag} = require('./src/config/featureFlags/utils/parser.ts');
" 2>&1 | head -5
```

Since this is TypeScript, just do a quick sanity check that the string format is valid by reading the parser: each token must start with `+` or `-` followed by a key from `FeatureFlagsSchema`. The keys used here are all present in `src/config/featureFlags/schema.ts`.

- [ ] **Step 3: Commit**

```bash
git add .env
git commit -m "🔧 chore(env): set Voidix FEATURE_FLAGS to hide LobeChat-specific features"
```

---

### Task 2: Hide Pages, Memory, Resource nav entries

**Files:**

- Modify: `src/hooks/useNavLayout.ts`

- [ ] **Step 1: Add `hidden: true` to the Pages nav item**

In `src/hooks/useNavLayout.ts`, the `topNavItems` array has a Pages entry (around line 57). Change it to:

```ts
      {
        hidden: true,
        icon: getRouteById('page')!.icon,
        key: SidebarTabKey.Pages,
        title: t('tab.pages'),
        url: '/page',
      },
```

- [ ] **Step 2: Add `hidden: true` to the Resource and Memory nav items**

In the same file, the `bottomMenuItems` array has Resource and Memory entries (around lines 76–87). Change them to:

```ts
      {
        hidden: !showMarket,
        icon: getRouteById('community')!.icon,
        key: SidebarTabKey.Community,
        title: t('tab.community'),
        url: '/community',
      },
      {
        hidden: true,
        icon: getRouteById('resource')!.icon,
        key: SidebarTabKey.Resource,
        title: t('tab.resource'),
        url: '/resource',
      },
      {
        hidden: true,
        icon: getRouteById('memory')!.icon,
        key: SidebarTabKey.Memory,
        title: t('tab.memory'),
        url: '/memory',
      },
```

The `hidden` field is already part of the `NavItem` interface (line 12). The `Body/index.tsx` renderer already respects it at line 91: `if (!navItem || navItem.hidden) return null`.

- [ ] **Step 3: Run type-check**

```bash
bun run type-check 2>&1 | tail -5
```

Expected: no errors related to `useNavLayout.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useNavLayout.ts
git commit -m "✨ feat(nav): hide Pages, Memory, Resource entries for Voidix"
```

---

### Task 3: Hide the Agent chat list from the home sidebar

**Files:**

- Modify: `src/routes/(main)/home/_layout/Body/index.tsx`

- [ ] **Step 1: Remove `GroupKey.Agent` from `ACCORDION_KEYS`**

In `src/routes/(main)/home/_layout/Body/index.tsx`, around line 30, change:

```ts
const ACCORDION_KEYS = new Set<string>([GroupKey.Recents, GroupKey.Agent]);
```

to:

```ts
const ACCORDION_KEYS = new Set<string>([GroupKey.Recents]);
```

This stops the `<Agent>` accordion from being rendered. When the render loop encounters the `'agent'` key in `visibleKeys`, it falls through to `renderNavLink('agent')`, which returns `null` because `'agent'` is not in `topNavItems` or `bottomMenuItems`.

- [ ] **Step 2: Remove the hardcoded Agent always-visible rule from `isVisible`**

In the same file, around line 82, change:

```ts
const isVisible = useCallback(
  (k: string) => k === GroupKey.Agent || !hiddenSections.includes(k),
  [hiddenSections],
);
```

to:

```ts
const isVisible = useCallback((k: string) => !hiddenSections.includes(k), [hiddenSections]);
```

This removes the hardcoded rule that forced Agent to bypass the user's hidden-sections preference. It doesn't affect rendering outcome (step 1 already ensures nothing renders), but keeps the logic consistent.

- [ ] **Step 3: Run type-check**

```bash
bun run type-check 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/\(main\)/home/_layout/Body/index.tsx
git commit -m "✨ feat(nav): hide Agent chat list from home sidebar for Voidix"
```

---

### Task 4: Prune settings sidebar items

**Files:**

- Modify: `src/routes/(main)/settings/hooks/useCategory.tsx`

- [ ] **Step 1: Remove five items from the settings category list**

In `src/routes/(main)/settings/hooks/useCategory.tsx`, the `agentItems` array is built around line 136. Replace the entire `agentItems` block with the version below (removes `ServiceModel`, `Skill`, `Memory`, `Creds`; removes the `Stats` entry from `generalItems`):

In the **`generalItems`** array (around line 83), remove the `Stats` entry:

```ts
    const generalItems: CategoryItem[] = [
      {
        icon: avatarUrl ? <Avatar avatar={avatarUrl} shape={'square'} size={26} /> : undefined,
        key: SettingsTabs.Profile,
        label: username ? username : tAuth('tab.profile'),
      },
      {
        icon: PaletteIcon,
        key: SettingsTabs.Appearance,
        label: t('tab.appearance'),
      },
      !mobile && {
        icon: KeyboardIcon,
        key: SettingsTabs.Hotkey,
        label: t('tab.hotkey'),
      },
    ].filter(Boolean) as CategoryItem[];
```

In the **`agentItems`** array (around line 136), keep only Provider (gated on `!enableBusinessFeatures || isDevMode`) and `APIKey` (gated on `showApiKeyManage`):

```ts
const agentItems: CategoryItem[] = [
  (!enableBusinessFeatures || isDevMode) && {
    icon: Brain,
    key: SettingsTabs.Provider,
    label: t('tab.provider'),
  },
  showApiKeyManage && {
    icon: KeyIcon,
    key: SettingsTabs.APIKey,
    label: tAuth('tab.apikey'),
  },
].filter(Boolean) as CategoryItem[];
```

Remove the now-unused imports. The following four are safe to remove (verified not used anywhere else in the file):

From the `lucide-react` import block, remove: `BrainCircuit`, `KeyRound`, `Sparkles`

From the `@lobehub/ui/icons` import block, remove the entire line: `import { SkillsIcon } from '@lobehub/ui/icons';`

Do **not** remove `ChartColumnBigIcon` — it is still used for the `Usage` entry in the subscription group.

- [ ] **Step 2: Run type-check and lint**

```bash
bun run type-check 2>&1 | tail -10
bun run lint:ts 2>&1 | tail -10
```

Expected: no errors. If there are unused-import errors, remove the specific imports flagged.

- [ ] **Step 3: Commit**

```bash
git add src/routes/\(main\)/settings/hooks/useCategory.tsx
git commit -m "✨ feat(settings): remove Voidix-irrelevant settings entries"
```

---

### Task 5: Visual verification

- [ ] **Step 1: Start the dev server**

```bash
bun run dev:spa
```

Open the Debug Proxy URL printed in the terminal (format: `https://app.lobehub.com/_dangerous_local_dev_proxy?debug-host=http%3A%2F%2Flocalhost%3A9876`).

- [ ] **Step 2: Check the sidebar**

Verify all of the following are absent from the UI:

- [ ] Community tab

- [ ] Pages nav entry

- [ ] Memory nav entry

- [ ] Resource nav entry

- [ ] Agent chat list (the accordion with agent conversations)

- [ ] **Step 3: Check the footer**

- [ ] No GitHub link

- [ ] No Docs link

- [ ] No Changelog entry in the help menu

- [ ] **Step 4: Check settings**

Navigate to `/settings`. Verify the sidebar shows only:

- Profile
- Appearance
- Hotkey (desktop only)
- Storage
- Advanced
- About (if `hideDocs` is false, which it isn't for local dev — the flag hides the menu link to docs, not the About settings page itself)
- Security

Verify absent: ServiceModel, Skill, Memory, Creds, Stats, Provider (since `enableBusinessFeatures` is false in dev, Provider will still show — this is expected and intentional for dev access).

- [ ] **Step 5: Check image/video generation still works**

Navigate to `/create/image` — confirm the image generation page loads and is functional.

- [ ] **Step 6: Final commit if any fixups were needed**

```bash
git add -p
git commit -m "🐛 fix(nav): fixup after visual verification"
```
