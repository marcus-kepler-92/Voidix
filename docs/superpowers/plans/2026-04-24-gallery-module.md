# Gallery Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-configured gallery (image/video showcase) that displays below the generation prompt input on the image/video home view, with a settings page for admin management.

**Architecture:** Global `gallery_items` table (no userId — admin-curated content), a TRPC router with a public `list` query and authed CRUD mutations, a grid display component injected into the generation home view, and a new settings tab for admin management.

**Tech Stack:** Drizzle ORM + PostgreSQL, TRPC (lambda router), React/TypeScript, @lobehub/ui, react-i18next

---

## File Map

| File                                                           | Action | Responsibility                              |
| -------------------------------------------------------------- | ------ | ------------------------------------------- |
| `packages/database/src/utils/idGenerator.ts`                   | Modify | Add `galleryItems: 'gal'` prefix            |
| `packages/database/src/schemas/galleryItem.ts`                 | Create | Drizzle table definition                    |
| `packages/database/src/schemas/index.ts`                       | Modify | Export new schema                           |
| `packages/database/src/models/galleryItem.ts`                  | Create | CRUD model (global, no userId)              |
| `src/server/routers/lambda/galleryItem.ts`                     | Create | TRPC router (public list + authed CRUD)     |
| `src/server/routers/lambda/index.ts`                           | Modify | Register galleryItemRouter                  |
| `src/routes/(main)/(create)/features/GalleryGrid/index.tsx`    | Create | Gallery grid display component              |
| `src/routes/(main)/(create)/features/CreateGenerationPage.tsx` | Modify | Add GalleryGrid below prompt in isHome view |
| `src/store/global/initialState.ts`                             | Modify | Add `SettingsTabs.Gallery = 'gallery'`      |
| `src/routes/(main)/settings/features/componentMap.ts`          | Modify | Register Gallery settings component         |
| `src/routes/(main)/settings/gallery/index.tsx`                 | Create | Admin gallery management UI                 |

---

### Task 1: DB Schema + idGenerator Prefix

**Files:**

- Modify: `packages/database/src/utils/idGenerator.ts`

- Create: `packages/database/src/schemas/galleryItem.ts`

- Modify: `packages/database/src/schemas/index.ts`

- [ ] **Step 1: Add `galleryItems` prefix to idGenerator**

In `packages/database/src/utils/idGenerator.ts`, find the `prefixes` object and add:

```typescript
// After existing entries, in alphabetical order
galleryItems: 'gal',
```

- [ ] **Step 2: Create gallery schema**

Create `packages/database/src/schemas/galleryItem.ts`:

```typescript
import { boolean, index, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

import { idGenerator } from '../utils/idGenerator';
import { createdAt, updatedAt } from './_helpers';

export const galleryItems = pgTable(
  'gallery_items',
  {
    id: text('id')
      .$defaultFn(() => idGenerator('galleryItems'))
      .notNull()
      .primaryKey(),

    url: text('url').notNull(),

    /** 'image' | 'video' */
    type: varchar('type', { length: 16 }).notNull().default('image'),

    title: text('title'),

    /** Display order — lower numbers appear first */
    sortOrder: integer('sort_order').notNull().default(0),

    /** Whether to show this item in the public gallery */
    visible: boolean('visible').notNull().default(true),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('gallery_items_type_idx').on(t.type),
    index('gallery_items_sort_idx').on(t.sortOrder),
  ],
);

export const insertGalleryItemSchema = createInsertSchema(galleryItems);

export type NewGalleryItem = typeof galleryItems.$inferInsert;
export type GalleryItemRecord = typeof galleryItems.$inferSelect;
```

- [ ] **Step 3: Export from schema index**

In `packages/database/src/schemas/index.ts`, add at the end (maintaining alphabetical order with other exports):

```typescript
export * from './galleryItem';
```

- [ ] **Step 4: Generate migration**

```bash
bun run db:generate
```

Expected: New migration file created in `packages/database/migrations/` with `CREATE TABLE gallery_items`.

- [ ] **Step 5: Run migration**

```bash
bun run db:migrate
```

Expected: Migration applied, `gallery_items` table created in the database.

- [ ] **Step 6: Commit**

```bash
git add packages/database/src/utils/idGenerator.ts packages/database/src/schemas/galleryItem.ts packages/database/src/schemas/index.ts packages/database/migrations/
git commit -m "feat(db): add gallery_items table schema and migration"
```

---

### Task 2: Gallery Model

**Files:**

- Create: `packages/database/src/models/galleryItem.ts`

- [ ] **Step 1: Create model**

Create `packages/database/src/models/galleryItem.ts`:

```typescript
import { asc, eq } from 'drizzle-orm';

import type { GalleryItemRecord, NewGalleryItem } from '../schemas/galleryItem';
import { galleryItems } from '../schemas/galleryItem';
import type { LobeChatDatabase } from '../type';

export class GalleryItemModel {
  private db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  create = async (data: Omit<NewGalleryItem, 'id'>): Promise<GalleryItemRecord> => {
    const [result] = await this.db.insert(galleryItems).values(data).returning();
    return result;
  };

  listVisible = async (): Promise<GalleryItemRecord[]> => {
    return this.db
      .select()
      .from(galleryItems)
      .where(eq(galleryItems.visible, true))
      .orderBy(asc(galleryItems.sortOrder), asc(galleryItems.createdAt));
  };

  listAll = async (): Promise<GalleryItemRecord[]> => {
    return this.db
      .select()
      .from(galleryItems)
      .orderBy(asc(galleryItems.sortOrder), asc(galleryItems.createdAt));
  };

  update = async (
    id: string,
    data: Partial<Omit<NewGalleryItem, 'id'>>,
  ): Promise<GalleryItemRecord> => {
    const [result] = await this.db
      .update(galleryItems)
      .set(data)
      .where(eq(galleryItems.id, id))
      .returning();
    return result;
  };

  delete = async (id: string): Promise<void> => {
    await this.db.delete(galleryItems).where(eq(galleryItems.id, id));
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/database/src/models/galleryItem.ts
git commit -m "feat(db): add GalleryItemModel"
```

---

### Task 3: TRPC Router

**Files:**

- Create: `src/server/routers/lambda/galleryItem.ts`

- Modify: `src/server/routers/lambda/index.ts`

- [ ] **Step 1: Create gallery router**

Create `src/server/routers/lambda/galleryItem.ts`:

```typescript
import { z } from 'zod';

import { GalleryItemModel } from '@/database/models/galleryItem';
import { authedProcedure, publicProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';

const adminProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: { galleryItemModel: new GalleryItemModel(ctx.serverDB) },
  });
});

const createItemSchema = z.object({
  url: z.string().url(),
  type: z.enum(['image', 'video']).default('image'),
  title: z.string().optional(),
  sortOrder: z.number().int().default(0),
  visible: z.boolean().default(true),
});

const updateItemSchema = z.object({
  id: z.string(),
  url: z.string().url().optional(),
  type: z.enum(['image', 'video']).optional(),
  title: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  visible: z.boolean().optional(),
});

export const galleryItemRouter = router({
  list: publicProcedure.use(serverDatabase).query(async ({ ctx }) => {
    const model = new GalleryItemModel(ctx.serverDB);
    return model.listVisible();
  }),

  listAll: adminProcedure.query(async ({ ctx }) => {
    return ctx.galleryItemModel.listAll();
  }),

  create: adminProcedure.input(createItemSchema).mutation(async ({ ctx, input }) => {
    return ctx.galleryItemModel.create(input);
  }),

  update: adminProcedure.input(updateItemSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    return ctx.galleryItemModel.update(id, data);
  }),

  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.galleryItemModel.delete(input.id);
  }),
});

export type GalleryItemRouter = typeof galleryItemRouter;
```

- [ ] **Step 2: Register router in lambda index**

In `src/server/routers/lambda/index.ts`, add the import (maintain alphabetical order):

```typescript
import { galleryItemRouter } from './galleryItem';
```

And add to the router object (alphabetical order, after `file`):

```typescript
galleryItem: galleryItemRouter,
```

- [ ] **Step 3: Run type check**

```bash
bun run type-check 2>&1 | grep -E "galleryItem|GalleryItem" | head -20
```

Expected: No errors related to the new router.

- [ ] **Step 4: Commit**

```bash
git add src/server/routers/lambda/galleryItem.ts src/server/routers/lambda/index.ts
git commit -m "feat(trpc): add galleryItem router with public list and authed admin CRUD"
```

---

### Task 4: Gallery Grid Component

**Files:**

- Create: `src/routes/(main)/(create)/features/GalleryGrid/index.tsx`

- [ ] **Step 1: Create gallery grid component**

Create `src/routes/(main)/(create)/features/GalleryGrid/index.tsx`:

```tsx
'use client';

import { Flexbox } from '@lobehub/ui';
import { Skeleton } from 'antd';
import { memo, useEffect, useState } from 'react';
import { createStyles } from 'antd-style';

import { lambdaClient } from '@/libs/trpc/client';
import type { GalleryItemRecord } from '@/database/schemas/galleryItem';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    width: 100%;
    padding: 24px 0 40px;
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px;
    width: 100%;
  `,
  item: css`
    position: relative;
    aspect-ratio: 1;
    border-radius: ${token.borderRadiusLG}px;
    overflow: hidden;
    cursor: pointer;
    background: ${token.colorFillTertiary};

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.2s ease;
    }

    &:hover img {
      transform: scale(1.04);
    }
  `,
  title: css`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 8px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
    color: #fff;
    font-size: 12px;
    line-height: 1.4;
  `,
  videoItem: css`
    & video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
}));

const GalleryGrid = memo(() => {
  const { styles, cx } = useStyles();
  const [items, setItems] = useState<GalleryItemRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lambdaClient.galleryItem.list
      .query()
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton.Image
              active
              key={i}
              style={{ width: '100%', height: '100%', aspectRatio: '1' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {items.map((item) => (
          <div className={cx(styles.item, item.type === 'video' && styles.videoItem)} key={item.id}>
            {item.type === 'video' ? (
              <video autoPlay loop muted playsInline src={item.url} />
            ) : (
              <img alt={item.title ?? ''} src={item.url} />
            )}
            {item.title && <div className={styles.title}>{item.title}</div>}
          </div>
        ))}
      </div>
    </div>
  );
});

GalleryGrid.displayName = 'GalleryGrid';
export default GalleryGrid;
```

- [ ] **Step 2: Run type check**

```bash
bun run type-check 2>&1 | grep -E "GalleryGrid|galleryGrid" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add "src/routes/(main)/(create)/features/GalleryGrid/index.tsx"
git commit -m "feat(ui): add GalleryGrid component for showcase display"
```

---

### Task 5: Inject Gallery into Generation Home View

**Files:**

- Modify: `src/routes/(main)/(create)/features/CreateGenerationPage.tsx`

The current isHome view centers `<PromptInput>` in a full-height flex container. We need to change the layout to: prompt at top-center, gallery below.

- [ ] **Step 1: Modify CreateGenerationPage.tsx**

Read the file first. Then replace the `isHome` motion.div content:

Replace this block (inside the `isHome` motion.div):

```tsx
<Flexbox
  align={'center'}
  justify={'center'}
  style={{ minHeight: 'calc(100vh - 180px)' }}
  width={'100%'}
>
  <PromptInput disableAnimation showTitle />
</Flexbox>
```

With:

```tsx
<Flexbox
  align={'center'}
  direction={'vertical'}
  style={{ minHeight: 'calc(100vh - 180px)', paddingBlockStart: 80 }}
  width={'100%'}
>
  <PromptInput disableAnimation showTitle />
  <GalleryGrid />
</Flexbox>
```

And add the import at the top of the file:

```tsx
import GalleryGrid from './GalleryGrid';
```

- [ ] **Step 2: Run type check**

```bash
bun run type-check 2>&1 | grep -E "CreateGenerationPage|GalleryGrid" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add "src/routes/(main)/(create)/features/CreateGenerationPage.tsx"
git commit -m "feat(ui): inject GalleryGrid below prompt input on generation home view"
```

---

### Task 6: Admin Gallery Settings Tab

**Files:**

- Modify: `src/store/global/initialState.ts`

- Create: `src/routes/(main)/settings/gallery/index.tsx`

- Modify: `src/routes/(main)/settings/features/componentMap.ts`

- [ ] **Step 1: Add Gallery to SettingsTabs enum**

In `src/store/global/initialState.ts`, find `export enum SettingsTabs` and add (alphabetical order between `Credits` and `Hotkey`):

```typescript
Gallery = 'gallery',
```

- [ ] **Step 2: Create admin gallery management page**

Create `src/routes/(main)/settings/gallery/index.tsx`:

```tsx
'use client';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Modal, Select, Space, Switch, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { memo, useCallback, useEffect, useState } from 'react';

import { lambdaClient } from '@/libs/trpc/client';
import type { GalleryItemRecord } from '@/database/schemas/galleryItem';

const Gallery = memo(() => {
  const [items, setItems] = useState<GalleryItemRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await lambdaClient.galleryItem.listAll.query();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = useCallback(
    async (id: string) => {
      await lambdaClient.galleryItem.delete.mutate({ id });
      fetchItems();
    },
    [fetchItems],
  );

  const handleToggleVisible = useCallback(
    async (id: string, visible: boolean) => {
      await lambdaClient.galleryItem.update.mutate({ id, visible });
      fetchItems();
    },
    [fetchItems],
  );

  const handleCreate = useCallback(async () => {
    const values = await form.validateFields();
    await lambdaClient.galleryItem.create.mutate(values);
    form.resetFields();
    setModalOpen(false);
    fetchItems();
  }, [form, fetchItems]);

  const columns: ColumnsType<GalleryItemRecord> = [
    {
      dataIndex: 'url',
      key: 'url',
      render: (url: string, record) =>
        record.type === 'video' ? (
          <video src={url} style={{ height: 60, objectFit: 'cover', width: 80 }} />
        ) : (
          <img alt="" src={url} style={{ height: 60, objectFit: 'cover', width: 80 }} />
        ),
      title: 'Preview',
      width: 100,
    },
    { dataIndex: 'title', key: 'title', title: 'Title' },
    { dataIndex: 'type', key: 'type', title: 'Type', width: 80 },
    { dataIndex: 'sortOrder', key: 'sortOrder', title: 'Order', width: 80 },
    {
      dataIndex: 'visible',
      key: 'visible',
      render: (visible: boolean, record) => (
        <Switch checked={visible} onChange={(v) => handleToggleVisible(record.id, v)} />
      ),
      title: 'Visible',
      width: 80,
    },
    {
      key: 'actions',
      render: (_, record) => (
        <Button danger onClick={() => handleDelete(record.id)} size="small">
          Delete
        </Button>
      ),
      title: 'Actions',
      width: 80,
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Button icon={<PlusOutlined />} onClick={() => setModalOpen(true)} type="primary">
        Add Item
      </Button>

      <Table columns={columns} dataSource={items} loading={loading} rowKey="id" size="small" />

      <Modal
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        open={modalOpen}
        title="Add Gallery Item"
      >
        <Form
          form={form}
          initialValues={{ sortOrder: 0, type: 'image', visible: true }}
          layout="vertical"
        >
          <Form.Item label="URL" name="url" rules={[{ required: true, type: 'url' }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="Type" name="type">
            <Select
              options={[
                { label: 'Image', value: 'image' },
                { label: 'Video', value: 'video' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Title" name="title">
            <Input placeholder="Optional title" />
          </Form.Item>
          <Form.Item label="Sort Order" name="sortOrder">
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item label="Visible" name="visible" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
});

Gallery.displayName = 'Gallery';
export default Gallery;
```

- [ ] **Step 3: Register in componentMap**

In `src/routes/(main)/settings/features/componentMap.ts`, add import and entry (alphabetical order):

Add import:

```typescript
import { SettingsTabs } from '@/store/global/initialState';
```

(already imported — just add the new entry to `componentMap`)

Add to `componentMap`:

```typescript
[SettingsTabs.Gallery]: dynamic(() => import('../gallery'), {
  loading: loading('Settings > Gallery'),
}),
```

- [ ] **Step 4: Run type check**

```bash
bun run type-check 2>&1 | grep -E "Gallery|gallery" | grep -v "node_modules" | head -20
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/store/global/initialState.ts "src/routes/(main)/settings/gallery/index.tsx" "src/routes/(main)/settings/features/componentMap.ts"
git commit -m "feat(settings): add Gallery admin management tab"
```

---

## Verification

After all tasks are complete:

1. Start dev server: `bun run dev:spa`
2. Navigate to `/image` — gallery grid should appear below the prompt input (will be empty until items are added)
3. Navigate to `/settings/gallery` — admin table should load, add button should open modal
4. Add an image item via the modal, verify it appears in the gallery on `/image`
5. Toggle visibility off, verify item disappears from public gallery

Run type check for the full feature:

```bash
bun run type-check
```
