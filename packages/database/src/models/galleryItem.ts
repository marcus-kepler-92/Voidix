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
