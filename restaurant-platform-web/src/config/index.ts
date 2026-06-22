export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'RestaurantOS',
} as const;
