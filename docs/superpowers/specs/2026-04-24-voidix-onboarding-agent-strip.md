# Voidix Onboarding & Agent Strip — Design Spec

**Date:** 2026-04-24
**Branch:** `refactor/voidix-strip-features`
**Scope:** Skip Classic onboarding wizard on first login; remove agent/group/write starter buttons from home InputArea

---

## Goal

1. New users land directly on the home page instead of the Classic onboarding wizard.
2. The home page InputArea shows only Image and Video starter buttons (agent/group/write hidden).

---

## Out of Scope

- Modifying onboarding data model or DB state
- Deleting onboarding routes or components
- Changing the inbox agent behavior
- Any backend changes

---

## Change 1 — Skip onboarding redirect

**File:** `src/layout/GlobalProvider/useUserStateRedirect.ts`

`useWebUserStateRedirect` currently redirects to `/onboarding` when `onboardingSelectors.needsOnboarding(state)` is true. For Voidix, first-login users should bypass the wizard entirely.

Change `useWebUserStateRedirect` to return a no-op callback, matching the pattern already used by `useDesktopUserStateRedirect`:

```ts
export const useWebUserStateRedirect = () => useCallback(() => {}, []);
```

No other callers need updating: `useUserStateRedirect` already delegates between desktop and web variants; making the web variant a no-op is sufficient.

---

## Change 2 — Hide agent/group/write starter buttons

**File:** `src/routes/(main)/home/features/InputArea/StarterList.tsx`

The `items` array in `StarterList` currently has five entries: `agent`, `group`, `write`, `image`, `video`.

Remove the first three entries (`agent`, `group`, `write`) from the `items` array. Keep `image` and `video` unchanged (including their `hot` flags and navigate-on-click behavior).

After the change the `items` array should be:

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

Remove the now-unused imports: `BotIcon`, `PenLineIcon`, `GroupBotSquareIcon`.

The `useInitBuiltinAgent` calls for `agentBuilder`, `groupAgentBuilder`, `pageAgent` can remain — they are side-effect hooks that keep builtin agents seeded regardless of UI visibility.

---

## Risk Assessment

| Change                    | Difficulty | Risk                                                          |
| ------------------------- | ---------- | ------------------------------------------------------------- |
| Onboarding redirect no-op | Trivial    | None — users can still navigate to `/onboarding` manually     |
| Remove starter buttons    | Trivial    | None — image/video buttons use independent `navigate()` paths |

---

## Verification Checklist

- [ ] New user (cleared localStorage) lands on home page, not `/onboarding`
- [ ] Home InputArea shows only Image and Video buttons
- [ ] Clicking Image button navigates to `/image?model=gpt-image-2`
- [ ] Clicking Video button navigates to `/video?model=doubao-seedance-2-0-260128`
- [ ] No TypeScript errors
