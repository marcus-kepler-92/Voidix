import { boolean, index, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

import { idGenerator } from '../utils/idGenerator';
import { timestamps } from './_helpers';

export const galleryItems = pgTable(
  'gallery_items',
  {
    id: text('id')
      .$defaultFn(() => idGenerator('galleryItems'))
      .notNull()
      .primaryKey(),

    url: text('url').notNull(),

    type: varchar('type', { length: 16 }).notNull().default('image').$type<'image' | 'video'>(),

    title: text('title'),

    sortOrder: integer('sort_order').notNull().default(0),

    visible: boolean('visible').notNull().default(true),

    ...timestamps,
  },
  (t) => [
    index('gallery_items_type_idx').on(t.type),
    index('gallery_items_sort_idx').on(t.sortOrder),
  ],
);

export const insertGalleryItemSchema = createInsertSchema(galleryItems);

export type NewGalleryItem = typeof galleryItems.$inferInsert;
export type GalleryItemRecord = typeof galleryItems.$inferSelect;
