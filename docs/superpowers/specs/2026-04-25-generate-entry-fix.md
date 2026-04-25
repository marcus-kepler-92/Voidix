# Generate Entry Fix

**Date:** 2026-04-25

## Problem

Two things were implemented incorrectly:

1. `GenerateHomePage` (`/generate`, no topicId) was made to look like a chat homepage — centered `WelcomeText` + generation input. It should look like the generation workspace empty state.
2. The root home page (`/`) still uses the chat `InputArea`. It should use the generation prompt input, since Voidix is generation-focused.

## Design

### Two entry points for generation

Users can start a new generation from two places:

- **Root home page `/`** — generation prompt input in the center of the page
- **Generate page `/generate` (no topicId)** — generation prompt input at the bottom, empty content area above

Both behave identically on submit: `createImage()` or `createVideo()` → navigate to `/generate/:topicId`.

### Container pattern (no new component needed)

Both pages use the existing container pattern already in `workspace.tsx`:

```tsx
const PromptInputComponent = mode === 'video' ? VideoPromptInput : ImagePromptInput;
```

The container reads `generationMode` from global store and selects the right component. No wrapper needed — `ImagePromptInput` and `VideoPromptInput` already handle navigation and mode switching internally via `GenerationMediaModeSegment`.

## Changes

### 1. `src/routes/(main)/home/features/index.tsx`

Replace `<InputArea />` (chat input) with mode-based generation input:

```tsx
const PromptInputComponent = mode === 'video' ? VideoPromptInput : ImagePromptInput;
// render: <PromptInputComponent disableAnimation showTitle={false} />
```

`StarterList` (inside `InputArea`, navigates to outdated `/image` and `/video` routes) is removed automatically. `WelcomeText` and `GalleryGrid` are kept.

### 2. `src/routes/(main)/(create)/generate/index.tsx`

Replace the current centered WelcomeText + input layout with the same structure as `workspace.tsx`:

- `NavHeader` at top
- Empty content area (middle) — `ImageWorkspace`/`VideoWorkspace` naturally shows empty state when `activeGenerationTopicId` is null
- `PromptInputComponent` at bottom (same container pattern)

No `useEffect` needed — unlike `workspace.tsx`, there is no topicId to sync.

### 3. `src/routes/(main)/(create)/generate/workspace.tsx`

No changes. Already correct.

## What is NOT changing

- `GenerateTopicSidebar` — already correct
- `GenerateLayout` (`_layout/index.tsx`) — already correct
- `workspace.tsx` — already correct
- Desktop router configs — no new routes
- i18n keys — no new keys needed
