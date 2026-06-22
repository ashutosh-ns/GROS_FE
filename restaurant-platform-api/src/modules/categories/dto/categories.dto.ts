import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const ReorderCategoriesSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    }),
  ),
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
export type ReorderCategoriesDto = z.infer<typeof ReorderCategoriesSchema>;
