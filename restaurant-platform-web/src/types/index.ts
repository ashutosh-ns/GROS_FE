export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  avatar: string | null;
  platformRole: string | null;
  emailVerified: boolean;
  createdAt: string;
  memberships: RestaurantMembership[];
}

export interface RestaurantMembership {
  restaurantId: string;
  role: RestaurantRole;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
}

export type PlatformRole = 'SUPER_ADMIN' | 'PLATFORM_ADMIN';

export type RestaurantRole = 'OWNER' | 'MANAGER' | 'WAITER' | 'CASHIER' | 'KITCHEN' | 'STAFF';

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type VegType = 'VEG' | 'NON_VEG' | 'EGG' | 'VEGAN';

export type SpiceLevel = 'NONE' | 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  currency: string;
  taxRate: number;
  isActive: boolean;
  openingTime: string | null;
  closingTime: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  image: string | null;
  vegType: VegType;
  spiceLevel: SpiceLevel;
  prepTime: number | null;
  isAvailable: boolean;
  isRecommended: boolean;
  isBestseller: boolean;
  categoryId: string;
  variants: Variant[];
  addOns: AddOn[];
}

export interface Variant {
  id: string;
  name: string;
  priceAdjustment: number;
  isAvailable: boolean;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes: string | null;
  items: OrderItem[];
  placedAt: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem: { name: string };
  variantId: string | null;
  variant: { name: string } | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  addOns: { addOn: { name: string }; price: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}
