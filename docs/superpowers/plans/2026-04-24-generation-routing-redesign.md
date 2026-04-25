# Generation Routing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace query-param routing (`/image?topic=xxx`) with path-based routing (`/image/:topicId`) so submitting a generation prompt navigates to a real new page.

**Architecture:** The image/video home pages (`/image`, `/video`) always show the prompt input + gallery. Submitting navigates via `useNavigate` to `/image/:topicId` (or `/video/:topicId`), which are new workspace page components that initialize the Zustand store from the URL param and render the generation feed. The global Zustand stores (imageStore/videoStore) are unchanged in structure — they already hold prompt/model/params globally.

**Tech Stack:** React Router v6 (`useNavigate`, `useParams`), Zustand, TypeScript, React

---

## Current Bug (Context for Implementer)

`TopicUrlSync` — the component that previously synced `?topic=` ↔ store — was removed when we stripped the generation sidebar. As a result, when a user submits a prompt today, the topic is created in the store but the URL never changes, so `CreateGenerationPage` always stays in the "home" view. The generation results are invisible. This plan fixes that by switching to path-based routing.

---

## File Map

| File                                                                | Action | Responsibility                                           |
| ------------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| `src/store/image/slices/generationTopic/initialState.ts`            | Modify | Remove `?topic=` URL param initialization                |
| `src/store/video/slices/generationTopic/initialState.ts`            | Modify | Same for video                                           |
| `src/routes/(main)/(create)/features/GenerationWorkspace/index.tsx` | Modify | Remove `useQueryState('topic')` guard                    |
| `src/routes/(main)/(create)/features/CreateGenerationPage.tsx`      | Modify | Remove isHome/topic toggle, always render home layout    |
| `src/routes/(main)/(create)/image/index.tsx`                        | Modify | Remove `path` prop (no longer needed)                    |
| `src/routes/(main)/(create)/video/index.tsx`                        | Modify | Same                                                     |
| `src/routes/(main)/(create)/image/workspace.tsx`                    | Create | ImageWorkspacePage: reads topicId from URL, renders feed |
| `src/routes/(main)/(create)/video/workspace.tsx`                    | Create | VideoWorkspacePage: same for video                       |
| `src/routes/(main)/(create)/image/features/PromptInput/index.tsx`   | Modify | Navigate to `/image/:topicId` after new topic created    |
| `src/routes/(main)/(create)/video/features/PromptInput/index.tsx`   | Modify | Navigate to `/video/:topicId` after new topic created    |
| `src/spa/router/desktopRouter.config.tsx`                           | Modify | Add `:topicId` child route under image and video         |
| `src/spa/router/desktopRouter.config.desktop.tsx`                   | Modify | Same (must stay in sync per CLAUDE.md)                   |

---

### Task 1: Store Init Cleanup + GenerationWorkspace Fix

**Files:**

- Modify: `src/store/image/slices/generationTopic/initialState.ts`

- Modify: `src/store/video/slices/generationTopic/initialState.ts`

- Modify: `src/routes/(main)/(create)/features/GenerationWorkspace/index.tsx`

- [ ] **Step 1: Fix image store initialState**

Read `src/store/image/slices/generationTopic/initialState.ts`. It currently initializes `activeGenerationTopicId` by parsing `?topic=` from the URL. Replace the entire file content with:

```typescript
import { type ImageGenerationTopic } from '@/types/generation';

export interface GenerationTopicState {
  activeGenerationTopicId: string | null;
  loadingGenerationTopicIds: string[];
  generationTopics: ImageGenerationTopic[];
}

export const initialGenerationTopicState: GenerationTopicState = {
  activeGenerationTopicId: null,
  loadingGenerationTopicIds: [],
  generationTopics: [],
};
```

- [ ] **Step 2: Fix video store initialState**

Read `src/store/video/slices/generationTopic/initialState.ts`. Apply identical change — same interface, same `activeGenerationTopicId: null` initialization.

- [ ] **Step 3: Fix GenerationWorkspace**

Read `src/routes/(main)/(create)/features/GenerationWorkspace/index.tsx`. It currently reads `const [topic] = useQueryState('topic')` and guards with `if (!topic || isCreatingWithNewTopic)`.

The workspace page only mounts when a topicId is in the URL (handled by Task 3). So the `topic` guard is redundant. Replace the component body with:

```tsx
const GenerationWorkspace = ({
  embedInput = true,
  useStore,
  selectors,
  PromptInput,
  GenerationFeed,
  SkeletonList,
}: GenerationWorkspaceProps) => {
  const isCreatingWithNewTopic = useStore((s: any) => s.isCreatingWithNewTopic);

  if (isCreatingWithNewTopic) {
    return <EmptyState PromptInput={PromptInput} embedInput={embedInput} />;
  }

  return (
    <Content
      EmptyStateComponent={EmptyState}
      GenerationFeed={GenerationFeed}
      PromptInput={PromptInput}
      SkeletonList={SkeletonList}
      embedInput={embedInput}
      selectors={selectors}
      useStore={useStore}
    />
  );
};
```

Also remove the `useQueryState` import from this file if it is no longer used.

- [ ] **Step 4: Type check**

```bash
cd /Users/idah/code/Voidix && bun run type-check 2>&1 | grep "error TS" | head -20
```

Expected: No errors (removing the query param read shouldn't break types).

- [ ] **Step 5: Commit**

```bash
git add \
  src/store/image/slices/generationTopic/initialState.ts \
  src/store/video/slices/generationTopic/initialState.ts \
  "src/routes/(main)/(create)/features/GenerationWorkspace/index.tsx"
git commit -m "refactor(generation): remove ?topic= query-param dependency from store and workspace"
```

---

### Task 2: Workspace Page Components

**Files:**

- Create: `src/routes/(main)/(create)/image/workspace.tsx`
- Create: `src/routes/(main)/(create)/video/workspace.tsx`

These pages render when the user navigates to `/image/:topicId`. They initialize the store with the topicId from the URL, render the generation feed, and keep the prompt input at the bottom.

- [ ] **Step 1: Create ImageWorkspacePage**

Read `src/routes/(main)/(create)/features/CreateGenerationPage.tsx` to copy the layout structure (NavHeader, WideScreenContainer, etc.).

Create `src/routes/(main)/(create)/image/workspace.tsx`:

```tsx
'use client';

import { Flexbox } from '@lobehub/ui';
import { memo, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import NavHeader from '@/features/NavHeader';
import WideScreenContainer from '@/features/WideScreenContainer';
import WideScreenButton from '@/features/WideScreenContainer/WideScreenButton';
import { useImageStore } from '@/store/image';

import ImageWorkspace from './features/ImageWorkspace';
import PromptInput from './features/PromptInput';

const ImageWorkspacePage = memo(() => {
  const { topicId } = useParams<{ topicId: string }>();

  useEffect(() => {
    if (topicId) useImageStore.setState({ activeGenerationTopicId: topicId });
    return () => {
      useImageStore.setState({ activeGenerationTopicId: null });
    };
  }, [topicId]);

  return (
    <>
      <NavHeader
        right={<WideScreenButton />}
        styles={{
          center: {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            minWidth: 0,
          },
          left: { flex: 1, minWidth: 0 },
          right: { flex: 1, minWidth: 0 },
        }}
      />
      <Flexbox
        height={'100%'}
        style={{ flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
        width={'100%'}
      >
        <Flexbox flex={1} style={{ minHeight: 0, overflowY: 'auto' }} width={'100%'}>
          <WideScreenContainer wrapperStyle={{ minHeight: '100%' }}>
            <ImageWorkspace embedInput={false} />
          </WideScreenContainer>
        </Flexbox>
        <WideScreenContainer style={{ marginTop: -8, paddingBlockEnd: 12 }}>
          <PromptInput disableAnimation showTitle={false} />
        </WideScreenContainer>
      </Flexbox>
    </>
  );
});

ImageWorkspacePage.displayName = 'ImageWorkspacePage';
export default ImageWorkspacePage;
```

- [ ] **Step 2: Create VideoWorkspacePage**

Create `src/routes/(main)/(create)/video/workspace.tsx` — identical structure to ImageWorkspacePage but using video equivalents:

```tsx
'use client';

import { Flexbox } from '@lobehub/ui';
import { memo, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import NavHeader from '@/features/NavHeader';
import WideScreenContainer from '@/features/WideScreenContainer';
import WideScreenButton from '@/features/WideScreenContainer/WideScreenButton';
import { useVideoStore } from '@/store/video';

import PromptInput from './features/PromptInput';
import VideoWorkspace from './features/VideoWorkspace';

const VideoWorkspacePage = memo(() => {
  const { topicId } = useParams<{ topicId: string }>();

  useEffect(() => {
    if (topicId) useVideoStore.setState({ activeGenerationTopicId: topicId });
    return () => {
      useVideoStore.setState({ activeGenerationTopicId: null });
    };
  }, [topicId]);

  return (
    <>
      <NavHeader
        right={<WideScreenButton />}
        styles={{
          center: {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            minWidth: 0,
          },
          left: { flex: 1, minWidth: 0 },
          right: { flex: 1, minWidth: 0 },
        }}
      />
      <Flexbox
        height={'100%'}
        style={{ flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
        width={'100%'}
      >
        <Flexbox flex={1} style={{ minHeight: 0, overflowY: 'auto' }} width={'100%'}>
          <WideScreenContainer wrapperStyle={{ minHeight: '100%' }}>
            <VideoWorkspace embedInput={false} />
          </WideScreenContainer>
        </Flexbox>
        <WideScreenContainer style={{ marginTop: -8, paddingBlockEnd: 12 }}>
          <PromptInput disableAnimation showTitle={false} />
        </WideScreenContainer>
      </Flexbox>
    </>
  );
});

VideoWorkspacePage.displayName = 'VideoWorkspacePage';
export default VideoWorkspacePage;
```

Note: `useVideoStore` import path — check `src/store/video/index.ts` to confirm the export name before writing.

- [ ] **Step 3: Type check**

```bash
cd /Users/idah/code/Voidix && bun run type-check 2>&1 | grep "error TS" | head -20
```

Fix any type errors (likely: VideoWorkspace `embedInput` prop if it differs from ImageWorkspace).

- [ ] **Step 4: Commit**

```bash
git add \
  "src/routes/(main)/(create)/image/workspace.tsx" \
  "src/routes/(main)/(create)/video/workspace.tsx"
git commit -m "feat(routing): add ImageWorkspacePage and VideoWorkspacePage for path-based topic routing"
```

---

### Task 3: Update Router Configs

**Files:**

- Modify: `src/spa/router/desktopRouter.config.tsx`
- Modify: `src/spa/router/desktopRouter.config.desktop.tsx`

Both files must stay in sync (per CLAUDE.md — updating only one causes blank screens).

- [ ] **Step 1: Update desktopRouter.config.tsx**

Read the file. Find the image route block:

```tsx
// Image routes
{
  children: [
    {
      element: dynamicElement(
        () => import('@/routes/(main)/(create)/image'),
        'Desktop > Image',
      ),
      index: true,
    },
  ],
  element: dynamicLayout(
    () => import('@/routes/(main)/(create)/image/_layout'),
    'Desktop > Image > Layout',
  ),
  errorElement: <ErrorBoundary />,
  path: 'image',
},
```

Replace with:

```tsx
// Image routes
{
  children: [
    {
      element: dynamicElement(
        () => import('@/routes/(main)/(create)/image'),
        'Desktop > Image',
      ),
      index: true,
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/(create)/image/workspace'),
        'Desktop > Image > Workspace',
      ),
      path: ':topicId',
    },
  ],
  element: dynamicLayout(
    () => import('@/routes/(main)/(create)/image/_layout'),
    'Desktop > Image > Layout',
  ),
  errorElement: <ErrorBoundary />,
  path: 'image',
},
```

Do the same for the video route block — add a `:topicId` child route pointing to `@/routes/(main)/(create)/video/workspace`.

- [ ] **Step 2: Update desktopRouter.config.desktop.tsx**

Read the file. Find the image route block (uses direct imports instead of `dynamicElement`):

```tsx
// Image routes
{
  children: [
    {
      element: <ImagePage />,
      index: true,
    },
  ],
  element: <DesktopImageLayout />,
  errorElement: <ErrorBoundary />,
  path: 'image',
},
```

Add the import at the top:

```tsx
import ImageWorkspacePage from '@/routes/(main)/(create)/image/workspace';
import VideoWorkspacePage from '@/routes/(main)/(create)/video/workspace';
```

Replace the image route block with:

```tsx
{
  children: [
    {
      element: <ImagePage />,
      index: true,
    },
    {
      element: <ImageWorkspacePage />,
      path: ':topicId',
    },
  ],
  element: <DesktopImageLayout />,
  errorElement: <ErrorBoundary />,
  path: 'image',
},
```

Apply same change to the video route block using `VideoWorkspacePage`.

- [ ] **Step 3: Type check**

```bash
cd /Users/idah/code/Voidix && bun run type-check 2>&1 | grep "error TS" | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add \
  src/spa/router/desktopRouter.config.tsx \
  src/spa/router/desktopRouter.config.desktop.tsx
git commit -m "feat(routing): add /image/:topicId and /video/:topicId routes"
```

---

### Task 4: Fix PromptInput Navigation

**Files:**

- Modify: `src/routes/(main)/(create)/image/features/PromptInput/index.tsx`
- Modify: `src/routes/(main)/(create)/video/features/PromptInput/index.tsx`

When the user submits on the home page and a NEW topic is created, navigate to the workspace page.

- [ ] **Step 1: Fix Image PromptInput**

Read `src/routes/(main)/(create)/image/features/PromptInput/index.tsx`.

Add `useNavigate` import:

```tsx
import { useNavigate } from 'react-router-dom';
```

Add inside the component (near other hooks):

```tsx
const navigate = useNavigate();
```

Find `handleGenerate`:

```tsx
const handleGenerate = async () => {
  if (!isLogin) {
    loginRequired.redirect({ timeout: 2000 });
    return;
  }
  await createImage();
};
```

Replace with:

```tsx
const handleGenerate = async () => {
  if (!isLogin) {
    loginRequired.redirect({ timeout: 2000 });
    return;
  }
  const prevTopicId = useImageStore.getState().activeGenerationTopicId;
  await createImage();
  if (!prevTopicId) {
    const newTopicId = useImageStore.getState().activeGenerationTopicId;
    if (newTopicId) navigate(`/image/${newTopicId}`);
  }
};
```

Note: `useImageStore` is already imported in this file (check top of file). `getState()` is a Zustand API available on the store object — it does not require a hook call.

- [ ] **Step 2: Fix Video PromptInput**

Read `src/routes/(main)/(create)/video/features/PromptInput/index.tsx`.

Apply the same pattern — find `handleGenerate`, add `useNavigate`, add the navigate logic:

```tsx
const navigate = useNavigate();
```

Find `handleGenerate` (around line 245). It calls `await createVideo()`. Replace:

```tsx
const handleGenerate = async () => {
  if (!isLogin) {
    loginRequired.redirect({ timeout: 2000 });
    return;
  }
  const prevTopicId = useVideoStore.getState().activeGenerationTopicId;
  await createVideo();
  if (!prevTopicId) {
    const newTopicId = useVideoStore.getState().activeGenerationTopicId;
    if (newTopicId) navigate(`/video/${newTopicId}`);
  }
};
```

Note: check that `useVideoStore` is imported. If not, add: `import { useVideoStore } from '@/store/video';`

- [ ] **Step 3: Type check**

```bash
cd /Users/idah/code/Voidix && bun run type-check 2>&1 | grep "error TS" | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add \
  "src/routes/(main)/(create)/image/features/PromptInput/index.tsx" \
  "src/routes/(main)/(create)/video/features/PromptInput/index.tsx"
git commit -m "feat(routing): navigate to workspace page after new generation topic created"
```

---

### Task 5: Simplify Home Pages

**Files:**

- Modify: `src/routes/(main)/(create)/features/CreateGenerationPage.tsx`
- Modify: `src/routes/(main)/(create)/image/index.tsx`
- Modify: `src/routes/(main)/(create)/video/index.tsx`

`CreateGenerationPage` previously toggled between home and workspace views. Now it only ever renders the home view.

- [ ] **Step 1: Simplify CreateGenerationPage**

Read `src/routes/(main)/(create)/features/CreateGenerationPage.tsx`.

Replace the entire file with:

```tsx
'use client';

import { Flexbox } from '@lobehub/ui';
import type { ComponentType } from 'react';
import { memo } from 'react';

import NavHeader from '@/features/NavHeader';
import WideScreenContainer from '@/features/WideScreenContainer';
import WideScreenButton from '@/features/WideScreenContainer/WideScreenButton';

import GalleryGrid from './GalleryGrid';

interface CreateGenerationPageProps {
  PromptInput: ComponentType<{ disableAnimation?: boolean; showTitle?: boolean }>;
}

const CreateGenerationPage = memo<CreateGenerationPageProps>(({ PromptInput }) => (
  <>
    <NavHeader
      right={<WideScreenButton />}
      styles={{
        center: {
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
          minWidth: 0,
        },
        left: { flex: 1, minWidth: 0 },
        right: { flex: 1, minWidth: 0 },
      }}
    />
    <Flexbox
      height={'100%'}
      style={{ flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
      width={'100%'}
    >
      <Flexbox flex={1} style={{ minHeight: 0, overflowY: 'auto' }} width={'100%'}>
        <WideScreenContainer wrapperStyle={{ minHeight: '100%' }}>
          <Flexbox
            align={'center'}
            direction={'vertical'}
            style={{ minHeight: 'calc(100vh - 180px)', paddingBlockStart: 80 }}
            width={'100%'}
          >
            <PromptInput disableAnimation showTitle />
            <GalleryGrid />
          </Flexbox>
        </WideScreenContainer>
      </Flexbox>
    </Flexbox>
  </>
));

CreateGenerationPage.displayName = 'CreateGenerationPage';
export default CreateGenerationPage;
```

Removed: `useMatch`, `useQueryState`, `AnimatePresence`, `motion`, `Workspace` prop, `path` prop, `isHome`/topic logic, bottom PromptInput (workspace handles that).

- [ ] **Step 2: Update image index page**

Read `src/routes/(main)/(create)/image/index.tsx`. It currently passes `Workspace` and `path` props to `CreateGenerationPage`. Both are now removed.

Replace with:

```tsx
'use client';

import { memo } from 'react';

import CreateGenerationPage from '@/routes/(main)/(create)/features/CreateGenerationPage';

import PromptInput from './features/PromptInput';

const ImageHomePage = memo(() => <CreateGenerationPage PromptInput={PromptInput} />);

ImageHomePage.displayName = 'ImageHomePage';
export default ImageHomePage;
```

- [ ] **Step 3: Update video index page**

Read `src/routes/(main)/(create)/video/index.tsx`. Apply same change — remove `Workspace` and `path` props:

```tsx
'use client';

import { memo } from 'react';

import CreateGenerationPage from '@/routes/(main)/(create)/features/CreateGenerationPage';

import PromptInput from './features/PromptInput';

const VideoHomePage = memo(() => <CreateGenerationPage PromptInput={PromptInput} />);

VideoHomePage.displayName = 'VideoHomePage';
export default VideoHomePage;
```

- [ ] **Step 4: Type check**

```bash
cd /Users/idah/code/Voidix && bun run type-check 2>&1 | grep "error TS" | head -20
```

Fix any errors — likely unused import warnings from the old `Workspace`/`path` props being removed from `CreateGenerationPageProps`.

- [ ] **Step 5: Commit**

```bash
git add \
  "src/routes/(main)/(create)/features/CreateGenerationPage.tsx" \
  "src/routes/(main)/(create)/image/index.tsx" \
  "src/routes/(main)/(create)/video/index.tsx"
git commit -m "refactor(routing): simplify home pages — remove isHome toggle from CreateGenerationPage"
```

---

## Verification

After all tasks complete:

1. Start dev: `bun run dev:spa`
2. Navigate to `/image` — see: centered PromptInput + GalleryGrid below
3. Type a prompt and click generate — URL should change to `/image/gt_xxxxxxxx`
4. The workspace page shows: generation feed (results) + bottom PromptInput
5. Press browser Back — returns to `/image` home page, store state cleared
6. Navigate to `/video` — same pattern works
7. Manually visit `/image/gt_some_real_id` — workspace loads correctly (store initialized from URL)

```bash
bun run type-check
```
