# Generation Routing Redesign Spec

## Background

Current behavior: `/image?topic=xxx` — route stays the same, a query param switches the view inside `CreateGenerationPage`. This feels like a view toggle, not a page navigation.

Desired behavior (like 即梦): submit prompt on home page → navigate to a **new URL** (`/image/:topicId`) — a real page change with browser history.

**Global Zustand state (imageStore prompt/model/params) is NOT changing.** It is already global and shared. This spec is purely about routing architecture.

---

## Goal

Convert image and video generation from query-param routing to path-based routing:

| Before                  | After                                             |
| ----------------------- | ------------------------------------------------- |
| `/image` + `?topic=xxx` | `/image` (home) and `/image/:topicId` (workspace) |
| `/video` + `?topic=xxx` | `/video` (home) and `/video/:topicId` (workspace) |

---

## User Flow

```
1. User lands on /image
   → Shows: centered PromptInput + GalleryGrid waterfall below

2. User types prompt, clicks generate
   → imageStore.createImage() called
   → Topic created via TRPC (returns topicId)
   → navigate('/image/' + topicId)   ← real pushState navigation

3. Browser navigates to /image/:topicId
   → ImageWorkspacePage mounts
   → Reads topicId from useParams
   → Calls imageStore.switchGenerationTopic(topicId)
   → Shows: GenerationFeed (results) + bottom PromptInput
   → User can keep generating in same topic

4. User clicks browser Back
   → Returns to /image home page
   → imageStore state retained (prompt text, model, params)
   → GalleryGrid visible again
```

---

## What Changes

### 1. Router configs (both files must stay in sync)

**`src/spa/router/desktopRouter.config.tsx`**
**`src/spa/router/desktopRouter.config.desktop.tsx`**

Image route changes from flat to nested:

```
/image
  index     → ImageHomePage (currently: CreateGenerationPage with isHome)
  :topicId  → ImageWorkspacePage (new)
```

Same for video.

### 2. TopicUrlSync → TopicNavigator

**File:** `src/routes/(main)/(create)/features/GenerationLayout/Body/List/TopicUrlSync.tsx`

Currently: subscribes to `activeGenerationTopicId` in store, calls `setTopic(id)` which updates `?topic=` query param (replace history).

After: calls `navigate('/image/' + topicId)` or `navigate('/video/' + topicId)` (push history). Receives the base path (`/image` or `/video`) as a prop.

Reverse sync (URL → store on mount): removed from here, handled by the workspace page.

### 3. New ImageWorkspacePage

**File:** `src/routes/(main)/(create)/image/workspace.tsx` (new)

- Reads `topicId` from `useParams()`
- On mount: calls `imageStore.switchGenerationTopic(topicId)` to sync store with URL
- Renders: `ImageWorkspace` (the generation feed) + bottom `PromptInput`
- This is essentially what `CreateGenerationPage` rendered when `!isHome`

### 4. ImageHomePage simplified

**File:** `src/routes/(main)/(create)/image/index.tsx`

Currently renders `<CreateGenerationPage ... />` which handles both home and topic views.

After: just renders the home view — centered `PromptInput` + `GalleryGrid`. Remove the topic/isHome toggle entirely. This component is always the home page.

### 5. CreateGenerationPage simplified or removed

**File:** `src/routes/(main)/(create)/features/CreateGenerationPage.tsx`

Currently manages the isHome/topic toggle via `useQueryState('topic')`.

After: this toggle logic is no longer needed. The file can be simplified to just render the home layout (PromptInput centered + GalleryGrid), or removed entirely if the home page logic moves inline.

### 6. GenerationWorkspace: remove query param read

**File:** `src/routes/(main)/(create)/features/GenerationWorkspace/index.tsx`

Currently reads `useQueryState('topic')` to decide whether to show EmptyState or Content.

After: the workspace page only renders when a topicId exists (it's in the URL), so this component always has a topic. The `useQueryState` check can be replaced with reading `activeGenerationTopicId` from the store (which is set by the workspace page on mount).

### 7. Store initialization

**File:** `src/store/image/slices/generationTopic/initialState.ts`

Currently initializes `activeGenerationTopicId` from `?topic=` URL search param (for browser refresh on a topic URL).

After: initialization from URL is handled by the workspace page component on mount. Remove the URL parsing from the store initializer.

Same changes apply to the video store equivalent.

---

## What Does NOT Change

- `imageStore` / `videoStore` — prompt text, model, parameters, all global state untouched
- `PromptInput` component — same component, same store bindings
- `ImageWorkspace` / `VideoWorkspace` components — same feed/generation logic
- `GalleryGrid` — unchanged
- Gallery admin/DB layer — unchanged
- The TRPC `createTopic` call — unchanged

---

## Scope Boundary

This spec covers Image and Video routes only. Chat/agent routes are not touched.

The gallery waterfall (masonry layout) is a separate visual improvement, not part of this spec.

---

## Files Summary

| File                                                                              | Change                                                      |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/spa/router/desktopRouter.config.tsx`                                         | Add `image/:topicId` and `video/:topicId` child routes      |
| `src/spa/router/desktopRouter.config.desktop.tsx`                                 | Same (must stay in sync)                                    |
| `src/routes/(main)/(create)/image/workspace.tsx`                                  | Create: ImageWorkspacePage                                  |
| `src/routes/(main)/(create)/video/workspace.tsx`                                  | Create: VideoWorkspacePage                                  |
| `src/routes/(main)/(create)/image/index.tsx`                                      | Simplify to home-only (remove CreateGenerationPage wrapper) |
| `src/routes/(main)/(create)/video/index.tsx`                                      | Same                                                        |
| `src/routes/(main)/(create)/features/CreateGenerationPage.tsx`                    | Simplify or remove isHome toggle                            |
| `src/routes/(main)/(create)/features/GenerationLayout/Body/List/TopicUrlSync.tsx` | Use navigate() instead of setTopic query param              |
| `src/routes/(main)/(create)/features/GenerationWorkspace/index.tsx`               | Remove useQueryState dependency                             |
| `src/store/image/slices/generationTopic/initialState.ts`                          | Remove URL param initialization                             |
| `src/store/video/slices/generationTopic/initialState.ts`                          | Same                                                        |
