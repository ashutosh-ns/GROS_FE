import { apiClient } from './client';

export const adminApi = {
  getStats: () => apiClient.get('/admin/stats'),

  listRestaurants: (params?: Record<string, string>) =>
    apiClient.get('/admin/restaurants', { params }),

  getRestaurant: (id: string) => apiClient.get(`/admin/restaurants/${id}`),

  toggleRestaurantActive: (id: string) =>
    apiClient.patch(`/admin/restaurants/${id}/toggle-active`),

  impersonate: (id: string) => apiClient.post(`/admin/restaurants/${id}/impersonate`),

  listUsers: (params?: Record<string, string>) =>
    apiClient.get('/admin/users', { params }),

  toggleUserActive: (id: string) =>
    apiClient.patch(`/admin/users/${id}/toggle-active`),

  getAuditLogs: (params?: Record<string, string>) =>
    apiClient.get('/admin/audit-logs', { params }),
};
