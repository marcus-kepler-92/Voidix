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
