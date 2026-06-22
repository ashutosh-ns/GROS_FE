import { z } from 'zod';

export const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        variantId: z.string().uuid().optional().nullable(),
        quantity: z.number().int().min(1).max(50),
        notes: z.string().max(200).optional(),
        addOnIds: z.array(z.string().uuid()).optional(),
      }),
    )
    .min(1, 'At least one item is required'),
  notes: z.string().max(500).optional(),
  offerId: z.string().uuid().optional().nullable(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED']),
  cancelReason: z.string().max(500).optional(),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusSchema>;
