import { z } from 'zod';

export const CreateRestaurantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  currency: z.string().default('INR'),
  taxRate: z.number().min(0).max(100).default(0),
  gstNumber: z.string().optional(),
  fssaiNumber: z.string().optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
});

export const UpdateRestaurantSchema = CreateRestaurantSchema.partial();

export const InviteMemberSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['MANAGER', 'WAITER', 'CASHIER', 'KITCHEN', 'STAFF']),
});

export type CreateRestaurantDto = z.infer<typeof CreateRestaurantSchema>;
export type UpdateRestaurantDto = z.infer<typeof UpdateRestaurantSchema>;
export type InviteMemberDto = z.infer<typeof InviteMemberSchema>;
