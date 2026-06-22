import { z } from 'zod';

export const CreateTableSchema = z.object({
  number: z.number().int().positive('Table number must be positive'),
  name: z.string().max(50).optional(),
  capacity: z.number().int().min(1).max(20).default(4),
});

export const UpdateTableSchema = z.object({
  name: z.string().max(50).optional(),
  capacity: z.number().int().min(1).max(20).optional(),
  isActive: z.boolean().optional(),
});

export type CreateTableDto = z.infer<typeof CreateTableSchema>;
export type UpdateTableDto = z.infer<typeof UpdateTableSchema>;
