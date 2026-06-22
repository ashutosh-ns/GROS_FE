import { apiClient } from './client';

export const restaurantsApi = {
  getMyRestaurants: () => apiClient.get('/users/me/restaurants'),

  getRestaurant: (restaurantId: string) => apiClient.get(`/restaurants/${restaurantId}`),

  updateRestaurant: (restaurantId: string, data: Record<string, unknown>) =>
    apiClient.patch(`/restaurants/${restaurantId}`, data),

  // Members
  getMembers: (restaurantId: string) => apiClient.get(`/restaurants/${restaurantId}`),

  inviteMember: (restaurantId: string, data: { email: string; role: string }) =>
    apiClient.post(`/restaurants/${restaurantId}/members`, data),

  removeMember: (restaurantId: string, memberId: string) =>
    apiClient.delete(`/restaurants/${restaurantId}/members/${memberId}`),

  updateMemberRole: (restaurantId: string, memberId: string, role: string) =>
    apiClient.patch(`/restaurants/${restaurantId}/members/${memberId}/role`, { role }),

  // Tables
  getTables: (restaurantId: string) => apiClient.get(`/restaurants/${restaurantId}/tables`),

  createTable: (restaurantId: string, data: { number: number; name?: string; capacity?: number }) =>
    apiClient.post(`/restaurants/${restaurantId}/tables`, data),

  updateTable: (restaurantId: string, tableId: string, data: Record<string, unknown>) =>
    apiClient.patch(`/restaurants/${restaurantId}/tables/${tableId}`, data),

  deleteTable: (restaurantId: string, tableId: string) =>
    apiClient.delete(`/restaurants/${restaurantId}/tables/${tableId}`),

  // QR
  generateQr: (restaurantId: string, tableId: string) =>
    apiClient.post(`/restaurants/${restaurantId}/qr/tables/${tableId}`),

  generateAllQr: (restaurantId: string) =>
    apiClient.post(`/restaurants/${restaurantId}/qr/generate-all`),

  // Categories
  getCategories: (restaurantId: string) =>
    apiClient.get(`/restaurants/${restaurantId}/categories`),

  createCategory: (restaurantId: string, data: { name: string; sortOrder?: number }) =>
    apiClient.post(`/restaurants/${restaurantId}/categories`, data),

  updateCategory: (restaurantId: string, categoryId: string, data: Record<string, unknown>) =>
    apiClient.patch(`/restaurants/${restaurantId}/categories/${categoryId}`, data),

  deleteCategory: (restaurantId: string, categoryId: string) =>
    apiClient.delete(`/restaurants/${restaurantId}/categories/${categoryId}`),

  // Menu Items
  getMenuItems: (restaurantId: string, params?: { categoryId?: string; search?: string }) =>
    apiClient.get(`/restaurants/${restaurantId}/menu-items`, { params }),

  createMenuItem: (restaurantId: string, data: Record<string, unknown>) =>
    apiClient.post(`/restaurants/${restaurantId}/menu-items`, data),

  updateMenuItem: (restaurantId: string, itemId: string, data: Record<string, unknown>) =>
    apiClient.patch(`/restaurants/${restaurantId}/menu-items/${itemId}`, data),

  deleteMenuItem: (restaurantId: string, itemId: string) =>
    apiClient.delete(`/restaurants/${restaurantId}/menu-items/${itemId}`),

  bulkUpdateAvailability: (restaurantId: string, ids: string[], isAvailable: boolean) =>
    apiClient.patch(`/restaurants/${restaurantId}/menu-items/bulk/availability`, { ids, isAvailable }),

  // Orders
  getOrders: (restaurantId: string, params?: Record<string, string>) =>
    apiClient.get(`/restaurants/${restaurantId}/orders`, { params }),

  getOrder: (restaurantId: string, orderId: string) =>
    apiClient.get(`/restaurants/${restaurantId}/orders/${orderId}`),

  updateOrderStatus: (restaurantId: string, orderId: string, status: string, cancelReason?: string) =>
    apiClient.patch(`/restaurants/${restaurantId}/orders/${orderId}/status`, { status, cancelReason }),
};
