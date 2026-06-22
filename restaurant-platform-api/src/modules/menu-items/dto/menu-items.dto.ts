import { z } from 'zod';

export const CreateMenuItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive('Price must be positive'),
  discountPrice: z.number().positive().optional().nullable(),
  image: z.string().optional().nullable(),
  vegType: z.enum(['VEG', 'NON_VEG', 'EGG', 'VEGAN']).default('VEG'),
  spiceLevel: z.enum(['NONE', 'MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT']).default('NONE'),
  prepTime: z.number().int().min(0).optional().nullable(),
  isAvailable: z.boolean().default(true),
  isRecommended: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  sku: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        priceAdjustment: z.number().default(0),
      }),
    )
    .optional(),
  addOns: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().min(0),
      }),
    )
    .optional(),
});

export const UpdateMenuItemSchema = CreateMenuItemSchema.partial().omit({ variants: true, addOns: true });

export const UpdateAvailabilitySchema = z.object({
  ids: z.array(z.string().uuid()),
  isAvailable: z.boolean(),
});

export type CreateMenuItemDto = z.infer<typeof CreateMenuItemSchema>;
export type UpdateMenuItemDto = z.infer<typeof UpdateMenuItemSchema>;
export type UpdateAvailabilityDto = z.infer<typeof UpdateAvailabilitySchema>;
