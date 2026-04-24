import { TRPCError } from '@trpc/server';
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
    const result = await ctx.galleryItemModel.update(id, data);
    if (!result)
      throw new TRPCError({ code: 'NOT_FOUND', message: `Gallery item ${id} not found` });
    return result;
  }),

  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.galleryItemModel.delete(input.id);
  }),
});

export type GalleryItemRouter = typeof galleryItemRouter;
