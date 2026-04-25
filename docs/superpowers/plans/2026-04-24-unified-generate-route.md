# Unified Generate Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace separate /image and /video routes with a single /generate route — home page shows PromptInput at top + gallery, workspace shows generation records above + PromptInput below.

**Architecture:** generationMode ('image'|'video') is persisted in global Zustand status. PromptInputs set the mode before navigating to /generate/:topicId. The workspace page reads mode to determine which feed and PromptInput to render. No mode encoding in the URL.

**Tech Stack:** React Router v6, Zustand global store, TypeScript

---

## Background

Both image and video generation topics share the same ID prefix `gt_` — type cannot be determined from the URL alone. Solution: store `generationMode: 'image' | 'video'` in the global Zustand status (persistent). PromptInputs set this before navigating to `/generate/:topicId`. The workspace reads it to decide which feed to render.

`/generate/:topicId` is a URL pointing to a specific topic, with the rendering mode stored separately in global state. The mode persists across page loads because `SystemStatus` is synced to localStorage.

---

## File Map

| File                                                                                 | Action | Responsibility                                                       |
| ------------------------------------------------------------------------------------ | ------ | -------------------------------------------------------------------- |
| `src/store/global/initialState.ts`                                                   | Modify | Add `SidebarTabKey.Generate`, add `generationMode` to `SystemStatus` |
| `src/store/global/selectors/systemStatus.ts`                                         | Modify | Add `generationMode` selector, update `DEFAULT_SIDEBAR_ITEMS`        |
| `src/hooks/useNavLayout.ts`                                                          | Modify | Replace image+video nav items with single generate item              |
| `src/config/routes/index.ts`                                                         | Modify | Add `generate` route entry with Sparkles icon                        |
| `src/locales/default/common.ts`                                                      | Modify | Add `'tab.generate': 'Create'`                                       |
| `src/routes/(main)/(create)/features/GenerationInput/GenerationMediaModeSegment.tsx` | Modify | Use `updateSystemStatus` + `navigate('/generate')` on switch         |
| `src/routes/(main)/(create)/generate/_layout/index.tsx`                              | Create | Minimal `<Outlet />` passthrough                                     |
| `src/routes/(main)/(create)/generate/index.tsx`                                      | Create | GenerateHomePage: mode-aware PromptInput at top + GalleryGrid        |
| `src/routes/(main)/(create)/generate/workspace.tsx`                                  | Create | GenerateWorkspacePage: mode-aware feed + PromptInput                 |
| `src/routes/(main)/(create)/features/CreateGenerationPage.tsx`                       | Modify | Remove forced min-height, reduce paddingBlockStart to 32             |
| `src/routes/(main)/(create)/image/features/PromptInput/index.tsx`                    | Modify | Set `generationMode: 'image'` + navigate to `/generate/:topicId`     |
| `src/routes/(main)/(create)/video/features/PromptInput/index.tsx`                    | Modify | Set `generationMode: 'video'` + navigate to `/generate/:topicId`     |
| `src/spa/router/desktopRouter.config.tsx`                                            | Modify | Replace image/video routes with generate, update default redirect    |
| `src/spa/router/desktopRouter.config.desktop.tsx`                                    | Modify | Same (must stay in sync)                                             |

---

### Task 1: Add generationMode to global store + sidebar config

**Files:**

- Modify: `src/store/global/initialState.ts`

- Modify: `src/store/global/selectors/systemStatus.ts`

- Modify: `src/hooks/useNavLayout.ts`

- Modify: `src/config/routes/index.ts`

- Modify: `src/locales/default/common.ts`

- [ ] **Step 1: Add SidebarTabKey.Generate + generationMode to SystemStatus**

In `src/store/global/initialState.ts`:

Add `Generate = 'generate'` to `SidebarTabKey` enum, alphabetically between `Community` and `Home` (currently line 12):

```ts
export enum SidebarTabKey {
  Chat = 'chat',
  Community = 'community',
  Generate = 'generate',
  Home = 'home',
  Image = 'image',
  Knowledge = 'knowledge',
  Me = 'me',
  Memory = 'memory',
  Pages = 'pages',
  Resource = 'resource',
  Setting = 'settings',
  Video = 'video',
}
```

Add `generationMode?: 'image' | 'video'` to the `SystemStatus` interface, alphabetically after `fileManagerViewMode` (line 113):

```ts
  fileManagerViewMode?: 'list' | 'masonry';
  generationMode?: 'image' | 'video';
  filePanelWidth: number;
```

- [ ] **Step 2: Add generationMode selector + update DEFAULT_SIDEBAR_ITEMS**

In `src/store/global/selectors/systemStatus.ts`:

Change `DEFAULT_SIDEBAR_ITEMS` (line 37):

```ts
export const DEFAULT_SIDEBAR_ITEMS: string[] = ['generate'];
```

Add selector after `const expandInputActionbar` line:

```ts
const generationMode = (s: GlobalState): 'image' | 'video' => s.status.generationMode ?? 'image';
```

Add `generationMode` to the `systemStatusSelectors` export object (alphabetically between `filePanelWidth` and `getAgentSystemRoleExpanded`):

```ts
export const systemStatusSelectors = {
  agentBuilderPanelWidth,
  agentPageSize,
  chatInputHeight,
  disabledModelProvidersSortType,
  disabledModelsSortType,
  expandInputActionbar,
  filePanelWidth,
  generationMode,
  getAgentSystemRoleExpanded,
  // ... rest unchanged
};
```

- [ ] **Step 3: Update useNavLayout.ts**

In `src/hooks/useNavLayout.ts`, replace the entire `topNavItems` useMemo block (lines 37–54) with a single generate item:

```ts
const topNavItems = useMemo(
  () =>
    [
      {
        icon: getRouteById('generate')!.icon,
        key: SidebarTabKey.Generate,
        title: t('tab.generate'),
        url: '/generate',
      },
    ] as NavItem[],
  [t],
);
```

- [ ] **Step 4: Add generate to routes config**

In `src/config/routes/index.ts`, add `Sparkles` to the existing lucide import:

```ts
import {
  BrainCircuit,
  FilePenIcon,
  Image,
  LibraryBigIcon,
  Settings,
  ShapesIcon,
  Sparkles,
  Video,
} from 'lucide-react';
```

Add a new route object to `NAVIGATION_ROUTES` (insert before the `community` entry):

```ts
{
  cmdkKey: 'cmdk.generate',
  electronKey: 'navigation.generate',
  icon: Sparkles,
  id: 'generate',
  keywords: ['generate', 'image', 'video', 'create'],
  keywordsKey: 'cmdk.keywords.generate',
  path: '/generate',
  pathPrefix: '/generate',
},
```

Also add `'generate'` to the `getNavigableRoutes` filter array:

```ts
export const getNavigableRoutes = (): NavigationRoute[] =>
  NAVIGATION_ROUTES.filter((r) =>
    ['generate', 'community', 'video', 'image', 'resource', 'page', 'memory'].includes(r.id),
  );
```

Keep the existing `video` and `image` route entries — they are used by CMDK search.

- [ ] **Step 5: Add i18n key**

In `src/locales/default/common.ts`, add after `'tab.files'` (line 506):

```ts
'tab.generate': 'Create',
```

- [ ] **Step 6: Type check**

```bash
cd /Users/idah/code/Voidix && bun run type-check 2>&1 | grep "error TS" | head -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/idah/code/Voidix && git add \
  src/store/global/initialState.ts \
  src/store/global/selectors/systemStatus.ts \
  src/hooks/useNavLayout.ts \
  src/config/routes/index.ts \
  src/locales/default/common.ts
git commit -m "feat(store): add generationMode to global status + unify sidebar to /generate"
```

---

### Task 2: Update GenerationMediaModeSegment

**Files:**

- Modify: `src/routes/(main)/(create)/features/GenerationInput/GenerationMediaModeSegment.tsx`

- [ ] **Step 1: Add global store import**

After the existing `import { useNavigate } from 'react-router-dom'` line, add:

```ts
import { useGlobalStore } from '@/store/global';
```

- [ ] **Step 2: Add updateSystemStatus hook**

Inside `GenerationMediaModeSegment` component body, after `const navigate = useNavigate()`:

```ts
const updateSystemStatus = useGlobalStore((s) => s.updateSystemStatus);
```

- [ ] **Step 3: Replace handleChange**

```ts
// BEFORE:
const handleChange = useCallback(
  (value: string) => {
    if (value === mode) return;
    navigate(value === 'video' ? '/video' : '/image');
  },
  [mode, navigate],
);

// AFTER:
const handleChange = useCallback(
  (value: string) => {
    if (value === mode) return;
    updateSystemStatus({ generationMode: value as 'image' | 'video' });
    navigate('/generate');
  },
  [mode, navigate, updateSystemStatus],
);
```

- [ ] **Step 4: Type check**

```bash
cd /Users/idah/code/Voidix && bun run type-check 2>&1 | grep "error TS" | head -20
```

- [ ] **Step 5: Commit**

```bash
cd /Users/idah/code/Voidix && git add \
  "src/routes/(main)/(create)/features/GenerationInput/GenerationMediaModeSegment.tsx"
git commit -m "feat(generate): mode segment sets global state and navigates to /generate"
```

---

### Task 3: Create generate pages

**Files:**

- Create: `src/routes/(main)/(create)/generate/_layout/index.tsx`

- Create: `src/routes/(main)/(create)/generate/index.tsx`

- Create: `src/routes/(main)/(create)/generate/workspace.tsx`

- [ ] **Step 1: Create \_layout/index.tsx**

```tsx
'use client';

import { Outlet } from 'react-router-dom';

const GenerateLayout = () => <Outlet />;

GenerateLayout.displayName = 'GenerateLayout';
export default GenerateLayout;
```

- [ ] **Step 2: Create generate/index.tsx (GenerateHomePage)**

```tsx
'use client';

import { memo } from 'react';

import CreateGenerationPage from '@/routes/(main)/(create)/features/CreateGenerationPage';
import ImagePromptInput from '@/routes/(main)/(create)/image/features/PromptInput';
import VideoPromptInput from '@/routes/(main)/(create)/video/features/PromptInput';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors/systemStatus';

const GenerateHomePage = memo(() => {
  const mode = useGlobalStore(systemStatusSelectors.generationMode);
  const PromptInput = mode === 'video' ? VideoPromptInput : ImagePromptInput;
  return <CreateGenerationPage PromptInput={PromptInput} />;
});

GenerateHomePage.displayName = 'GenerateHomePage';
export default GenerateHomePage;
```

- [ ] **Step 3: Create generate/workspace.tsx (GenerateWorkspacePage)**

```tsx
'use client';

import { Flexbox } from '@lobehub/ui';
import { memo, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import NavHeader from '@/features/NavHeader';
import WideScreenContainer from '@/features/WideScreenContainer';
import WideScreenButton from '@/features/WideScreenContainer/WideScreenButton';
import ImageWorkspace from '@/routes/(main)/(create)/image/features/ImageWorkspace';
import ImagePromptInput from '@/routes/(main)/(create)/image/features/PromptInput';
import VideoWorkspace from '@/routes/(main)/(create)/video/features/VideoWorkspace';
import VideoPromptInput from '@/routes/(main)/(create)/video/features/PromptInput';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors/systemStatus';
import { useImageStore } from '@/store/image';
import { useVideoStore } from '@/store/video';

const GenerateWorkspacePage = memo(() => {
  const { topicId } = useParams<{ topicId: string }>();
  const mode = useGlobalStore(systemStatusSelectors.generationMode);

  useEffect(() => {
    if (!topicId) return;
    if (mode === 'image') {
      useImageStore.setState({ activeGenerationTopicId: topicId });
    } else {
      useVideoStore.setState({ activeGenerationTopicId: topicId });
    }
    return () => {
      useImageStore.setState({ activeGenerationTopicId: null });
      useVideoStore.setState({ activeGenerationTopicId: null });
    };
  }, [topicId, mode]);

  const WorkspaceComponent = mode === 'video' ? VideoWorkspace : ImageWorkspace;
  const PromptInputComponent = mode === 'video' ? VideoPromptInput : ImagePromptInput;

  return (
    <>
      <NavHeader
        right={<WideScreenButton />}
        styles={{
          center: { alignItems: 'center', display: 'flex', justifyContent: 'center', minWidth: 0 },
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
            <WorkspaceComponent embedInput={false} />
          </WideScreenContainer>
        </Flexbox>
        <WideScreenContainer style={{ marginTop: -8, paddingBlockEnd: 12 }}>
          <PromptInputComponent disableAnimation showTitle={false} />
        </WideScreenContainer>
      </Flexbox>
    </>
  );
});

GenerateWorkspacePage.displayName = 'GenerateWorkspacePage';
export default GenerateWorkspacePage;
```

- [ ] **Step 4: Type check**

```bash
cd /Users/idah/code/Voidix && bun run type-check 2>&1 | grep "error TS" | head -20
```

Fix any errors. Most likely: verify `ImageWorkspace` and `VideoWorkspace` each accept `embedInput?: boolean` prop. If the prop doesn't exist on either, remove it from the WorkspaceComponent call.

- [ ] **Step 5: Commit**

```bash
cd /Users/idah/code/Voidix && git add \
  "src/routes/(main)/(create)/generate/_layout/index.tsx" \
  "src/routes/(main)/(create)/generate/index.tsx" \
  "src/routes/(main)/(create)/generate/workspace.tsx"
git commit -m "feat(generate): create GenerateHomePage, GenerateWorkspacePage, and layout"
```

---

### Task 4: Update CreateGenerationPage layout

**Files:**

- Modify: `src/routes/(main)/(create)/features/CreateGenerationPage.tsx`

- [ ] **Step 1: Fix inner Flexbox style**

Find the inner Flexbox with both `minHeight` and `paddingBlockStart`:

```tsx
// BEFORE:
<Flexbox
  align={'center'}
  direction={'vertical'}
  style={{ minHeight: 'calc(100vh - 180px)', paddingBlockStart: 80 }}
  width={'100%'}
>

// AFTER:
<Flexbox
  align={'center'}
  direction={'vertical'}
  style={{ paddingBlockStart: 32 }}
  width={'100%'}
>
```

- [ ] **Step 2: Type check**

```bash
cd /Users/idah/code/Voidix && bun run type-check 2>&1 | grep "error TS" | head -20
```

- [ ] **Step 3: Commit**

```bash
cd /Users/idah/code/Voidix && git add \
  "src/routes/(main)/(create)/features/CreateGenerationPage.tsx"
git commit -m "style(generate): input at top of home page — remove forced min-height"
```

---

### Task 5: Update PromptInputs to navigate to /generate

**Files:**

- Modify: `src/routes/(main)/(create)/image/features/PromptInput/index.tsx`

- Modify: `src/routes/(main)/(create)/video/features/PromptInput/index.tsx`

- [ ] **Step 1: Update image PromptInput — add import**

Add global store import after the existing `useNavigate` import:

```ts
import { useGlobalStore } from '@/store/global';
```

- [ ] **Step 2: Update image PromptInput — add hook**

Inside the `PromptInput` component body, after `const navigate = useNavigate()`:

```ts
const updateSystemStatus = useGlobalStore((s) => s.updateSystemStatus);
```

- [ ] **Step 3: Update image PromptInput — fix handleGenerate**

```ts
// BEFORE:
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

// AFTER:
const handleGenerate = async () => {
  if (!isLogin) {
    loginRequired.redirect({ timeout: 2000 });
    return;
  }
  const prevTopicId = useImageStore.getState().activeGenerationTopicId;
  await createImage();
  if (!prevTopicId) {
    const newTopicId = useImageStore.getState().activeGenerationTopicId;
    if (newTopicId) {
      updateSystemStatus({ generationMode: 'image' });
      navigate(`/generate/${newTopicId}`);
    }
  }
};
```

- [ ] **Step 4: Update video PromptInput — add import**

Add global store import after the existing `useNavigate` import:

```ts
import { useGlobalStore } from '@/store/global';
```

- [ ] **Step 5: Update video PromptInput — add hook**

Inside the `PromptInput` component body, after `const navigate = useNavigate()`:

```ts
const updateSystemStatus = useGlobalStore((s) => s.updateSystemStatus);
```

- [ ] **Step 6: Update video PromptInput — fix handleGenerate**

```ts
// BEFORE:
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

// AFTER:
const handleGenerate = async () => {
  if (!isLogin) {
    loginRequired.redirect({ timeout: 2000 });
    return;
  }
  const prevTopicId = useVideoStore.getState().activeGenerationTopicId;
  await createVideo();
  if (!prevTopicId) {
    const newTopicId = useVideoStore.getState().activeGenerationTopicId;
    if (newTopicId) {
      updateSystemStatus({ generationMode: 'video' });
      navigate(`/generate/${newTopicId}`);
    }
  }
};
```

- [ ] **Step 7: Type check**

```bash
cd /Users/idah/code/Voidix && bun run type-check 2>&1 | grep "error TS" | head -20
```

- [ ] **Step 8: Commit**

```bash
cd /Users/idah/code/Voidix && git add \
  "src/routes/(main)/(create)/image/features/PromptInput/index.tsx" \
  "src/routes/(main)/(create)/video/features/PromptInput/index.tsx"
git commit -m "feat(generate): PromptInputs set generationMode and navigate to /generate/:topicId"
```

---

### Task 6: Update router configs

**Files:**

- Modify: `src/spa/router/desktopRouter.config.tsx`
- Modify: `src/spa/router/desktopRouter.config.desktop.tsx`

Both files must stay in sync — updating only one causes blank screens.

- [ ] **Step 1: Update desktopRouter.config.tsx**

Replace the `// Video routes` block (lines 428–452) AND `// Image routes` block (lines 454–478) with a single generate block:

```tsx
// Generate routes
{
  children: [
    {
      element: dynamicElement(
        () => import('@/routes/(main)/(create)/generate'),
        'Desktop > Generate',
      ),
      index: true,
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/(create)/generate/workspace'),
        'Desktop > Generate > Workspace',
      ),
      path: ':topicId',
    },
  ],
  element: dynamicLayout(
    () => import('@/routes/(main)/(create)/generate/_layout'),
    'Desktop > Generate > Layout',
  ),
  errorElement: <ErrorBoundary />,
  path: 'generate',
},
```

Change the default index redirect (line \~595):

```tsx
// BEFORE:
// Default route - redirect to image generation
{
  element: redirectElement('/image'),
  index: true,
},

// AFTER:
// Default route - redirect to generate
{
  element: redirectElement('/generate'),
  index: true,
},
```

- [ ] **Step 2: Update desktopRouter.config.desktop.tsx**

Remove these 6 import lines (lines 12–17):

```ts
import ImagePage from '@/routes/(main)/(create)/image';
import DesktopImageLayout from '@/routes/(main)/(create)/image/_layout';
import ImageWorkspacePage from '@/routes/(main)/(create)/image/workspace';
import VideoPage from '@/routes/(main)/(create)/video';
import DesktopVideoLayout from '@/routes/(main)/(create)/video/_layout';
import VideoWorkspacePage from '@/routes/(main)/(create)/video/workspace';
```

Add in their place:

```ts
import GenerateLayout from '@/routes/(main)/(create)/generate/_layout';
import GeneratePage from '@/routes/(main)/(create)/generate';
import GenerateWorkspacePage from '@/routes/(main)/(create)/generate/workspace';
```

Replace the `// Video routes` block (lines 358–373) AND `// Image routes` block (lines 375–390) with:

```tsx
// Generate routes
{
  children: [
    { element: <GeneratePage />, index: true },
    { element: <GenerateWorkspacePage />, path: ':topicId' },
  ],
  element: <GenerateLayout />,
  errorElement: <ErrorBoundary />,
  path: 'generate',
},
```

Change the default index redirect (line \~473):

```tsx
// BEFORE:
// Default route - redirect to image generation
{
  element: redirectElement('/image'),
  index: true,
},

// AFTER:
// Default route - redirect to generate
{
  element: redirectElement('/generate'),
  index: true,
},
```

- [ ] **Step 3: Type check**

```bash
cd /Users/idah/code/Voidix && bun run type-check 2>&1 | grep "error TS" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/idah/code/Voidix && git add \
  src/spa/router/desktopRouter.config.tsx \
  src/spa/router/desktopRouter.config.desktop.tsx
git commit -m "feat(router): replace /image + /video routes with unified /generate route"
```

---

## Verification

After all tasks complete:

1. Start dev: `bun run dev:spa`
2. Open the debug proxy URL
3. Sidebar shows ONE item (sparkles icon, "Create") instead of two
4. Navigate to `/generate` — see: PromptInput near top + GalleryGrid below
5. Click the mode switcher (Image ↔ Video) — stays on `/generate`, PromptInput updates
6. Generate an image — URL changes to `/generate/gt_xxxxxxxx`
7. Workspace shows: image feed above + image PromptInput below
8. Press Back — returns to `/generate`, store cleared
9. Switch to video mode, generate — workspace shows video feed + video PromptInput
10. Navigate directly to `/image` or `/video` — redirects to `/` → `/generate`

```bash
bun run type-check
```
