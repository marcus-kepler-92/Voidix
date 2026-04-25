# Voidix Onboarding & Agent Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Skip Classic onboarding wizard on first login; remove agent/group/write starter buttons from home InputArea.

**Architecture:** Two isolated changes, each in a single file. Each change is independently reversible.

**Tech Stack:** Next.js 16, React 19, TypeScript, Zustand, react-i18next. No new dependencies.

---

### Task 1: Skip onboarding redirect

**Files:**

- Modify: `src/layout/GlobalProvider/useUserStateRedirect.ts`

- [ ] **Step 1: Make `useWebUserStateRedirect` a no-op**

In `src/layout/GlobalProvider/useUserStateRedirect.ts`, replace:

```ts
export const useWebUserStateRedirect = () =>
  useCallback((state: UserInitializationState) => {
    const { pathname } = window.location;

    if (!onboardingSelectors.needsOnboarding(state)) return;

    redirectIfNotOn(pathname, '/onboarding');
  }, []);
```

with:

```ts
export const useWebUserStateRedirect = () => useCallback(() => {}, []);
```

After this change the `onboardingSelectors` import and `UserInitializationState` type import may become unused — remove them if so. The `redirectIfNotOn` helper is still used by nothing else in the file, but it is a private local function; keep it or remove it (either is acceptable). The `isDesktop` import and `useDesktopUserStateRedirect` remain unchanged.

- [ ] **Step 2: Run type-check**

```bash
bun run type-check 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/layout/GlobalProvider/useUserStateRedirect.ts
git commit -m "✨ feat(onboarding): skip Classic onboarding wizard on web for Voidix"
```

---

### Task 2: Remove agent/group/write starter buttons

**Files:**

- Modify: `src/routes/(main)/home/features/InputArea/StarterList.tsx`

- [ ] **Step 1: Remove `agent`, `group`, `write` from the `items` array**

In `src/routes/(main)/home/features/InputArea/StarterList.tsx`, replace the entire `items` useMemo (lines 63–100) with:

```ts
const items: StarterItem[] = useMemo(
  () => [
    {
      hot: true,
      icon: ImageIcon,
      key: 'image',
      titleKey: 'starter.imageGeneration',
    },
    {
      hot: true,
      icon: Jimeng.Color,
      key: 'video',
      titleKey: 'starter.videoGeneration',
    },
  ],
  [],
);
```

- [ ] **Step 2: Remove now-unused imports**

From the `lucide-react` import block, remove `BotIcon` and `PenLineIcon`.

Remove the entire `@lobehub/ui/icons` import line for `GroupBotSquareIcon`.

The `ImageIcon` import from `lucide-react` must be retained.

- [ ] **Step 3: Run type-check and lint**

```bash
bun run type-check 2>&1 | tail -5
bun run lint:ts 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/\(main\)/home/features/InputArea/StarterList.tsx
git commit -m "✨ feat(home): hide agent/group/write starter buttons for Voidix"
```

---

### Task 3: Visual verification

- [ ] **Step 1: Start the dev server**

```bash
bun run dev:spa
```

Open the Debug Proxy URL printed in the terminal.

- [ ] **Step 2: Test onboarding bypass**

Clear `localStorage` in DevTools (Application → Storage → Clear site data), then reload. Confirm the app lands on the home page instead of `/onboarding`.

- [ ] **Step 3: Check starter buttons**

Confirm the home InputArea shows only two buttons: Image 🔥 and Video 🔥.

- [ ] **Step 4: Check navigation**

- Click Image → confirm navigation to `/image?model=gpt-image-2`

- Click Video → confirm navigation to `/video?model=doubao-seedance-2-0-260128`

- [ ] **Step 5: Final commit if any fixups were needed**

```bash
git add -p
git commit -m "🐛 fix: fixup after visual verification"
```
