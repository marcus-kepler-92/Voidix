# Generate Entry Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two layout mistakes — replace the chat input on the home page with the generation prompt input, and change the `/generate` empty-state page from a centered homepage layout to a workspace-style layout.

**Architecture:** Both the root home page and `/generate` (no topicId) use the same container pattern already in `workspace.tsx`: read `generationMode` from global store, render `ImagePromptInput` or `VideoPromptInput` accordingly. No new components.

**Tech Stack:** React, react-router-dom, Zustand (`useGlobalStore`), antd-style

---

## File Map

| File                                            | Change                                                          |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `src/routes/(main)/home/features/index.tsx`     | Replace `InputArea` with mode-based generation PromptInput      |
| `src/routes/(main)/(create)/generate/index.tsx` | Replace centered WelcomeText layout with workspace-style layout |

---

### Task 1: Home page — replace chat InputArea with generation PromptInput

**Files:**

- Modify: `src/routes/(main)/home/features/index.tsx`

The home page currently renders `<InputArea />` (chat input). Replace it with `ImagePromptInput` or `VideoPromptInput` selected by `generationMode`. The `inputActiveMode` / `hideOtherModules` logic (which controlled chat mode tags) can be removed since it's only needed by the chat InputArea.

- [ ] **Step 1: Read the current file**

```bash
cat -n src/routes/\(main\)/home/features/index.tsx
```

- [ ] **Step 2: Rewrite the file**

Replace with:

```tsx
'use client';

import { Flexbox } from '@lobehub/ui';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import DailyBrief from '@/features/DailyBrief';
import GalleryGrid from '@/routes/(main)/(create)/features/GalleryGrid';
import ImagePromptInput from '@/routes/(main)/(create)/image/features/PromptInput';
import VideoPromptInput from '@/routes/(main)/(create)/video/features/PromptInput';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors/systemStatus';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/slices/auth/selectors';
import { userGeneralSettingsSelectors } from '@/store/user/slices/settings/selectors';

import CommunityAgents from './CommunityAgents';
import WelcomeText from './WelcomeText';

const Home = memo(() => {
  const { i18n } = useTranslation();
  const isLogin = useUserStore(authSelectors.isLogin);
  const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);
  const mode = useGlobalStore(systemStatusSelectors.generationMode);

  const PromptInputComponent = mode === 'video' ? VideoPromptInput : ImagePromptInput;

  // eslint-disable-next-line @eslint-react/no-nested-component-definitions
  const Welcome = useCallback(() => <WelcomeText />, [i18n.language]);

  return (
    <Flexbox gap={40}>
      <Welcome />
      <PromptInputComponent disableAnimation showTitle={false} />
      <GalleryGrid />
      {isLogin && (
        <Flexbox>
          <DailyBrief />
        </Flexbox>
      )}
      <Flexbox gap={40}>{isDevMode && <CommunityAgents />}</Flexbox>
    </Flexbox>
  );
});

export default Home;
```

- [ ] **Step 3: Run type-check**

```bash
bun run type-check 2>&1 | grep -E "error|warning" | grep "home/features/index" | head -20
```

Expected: no errors in this file.

- [ ] **Step 4: Run lint**

```bash
bun run lint:ts 2>&1 | grep "home/features/index" | head -10
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes/\(main\)/home/features/index.tsx
git commit -m "$(
  cat << 'EOF'
feat(home): replace chat InputArea with generation PromptInput

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: GenerateHomePage — workspace-style layout

**Files:**

- Modify: `src/routes/(main)/(create)/generate/index.tsx`

The current `GenerateHomePage` shows a centered `WelcomeText` + prompt input (homepage-style). Replace with the same structure as `workspace.tsx`: `NavHeader` at top, empty flex area in the middle, `PromptInputComponent` at the bottom. No `useEffect` needed — unlike `workspace.tsx` there is no topicId to sync into the store.

- [ ] **Step 1: Read the current file**

```bash
cat -n src/routes/\(main\)/\(create\)/generate/index.tsx
```

- [ ] **Step 2: Rewrite the file**

```tsx
'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import NavHeader from '@/features/NavHeader';
import WideScreenContainer from '@/features/WideScreenContainer';
import WideScreenButton from '@/features/WideScreenContainer/WideScreenButton';
import ImagePromptInput from '@/routes/(main)/(create)/image/features/PromptInput';
import VideoPromptInput from '@/routes/(main)/(create)/video/features/PromptInput';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors/systemStatus';

const GenerateHomePage = memo(() => {
  const mode = useGlobalStore(systemStatusSelectors.generationMode);
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
        <Flexbox flex={1} style={{ minHeight: 0 }} />
        <WideScreenContainer style={{ marginTop: -8, paddingBlockEnd: 12 }}>
          <PromptInputComponent disableAnimation showTitle={false} />
        </WideScreenContainer>
      </Flexbox>
    </>
  );
});

GenerateHomePage.displayName = 'GenerateHomePage';
export default GenerateHomePage;
```

- [ ] **Step 3: Run type-check**

```bash
bun run type-check 2>&1 | grep -E "error" | grep "generate/index" | head -20
```

Expected: no errors in this file.

- [ ] **Step 4: Run lint**

```bash
bun run lint:ts 2>&1 | grep "generate/index" | head -10
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes/\(main\)/\(create\)/generate/index.tsx
git commit -m "$(
  cat << 'EOF'
feat(generate): replace centered homepage layout with workspace-style empty state

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Spec coverage:**

- ✅ Root home page uses generation PromptInput (Task 1)
- ✅ `/generate` empty state uses workspace-style layout (Task 2)
- ✅ Both use the container pattern `mode === 'video' ? VideoPromptInput : ImagePromptInput`
- ✅ StarterList removed (was inside InputArea, gone with Task 1)
- ✅ `workspace.tsx` untouched

**Placeholder scan:** None found.

**Type consistency:** `PromptInputComponent` used consistently in both tasks. Props `disableAnimation` and `showTitle={false}` match the interface `{ disableAnimation?: boolean; showTitle?: boolean }` on both `ImagePromptInput` and `VideoPromptInput`.
