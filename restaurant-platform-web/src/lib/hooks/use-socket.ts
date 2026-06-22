'use client';

import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { connectAsStaff, connectAsCustomer, disconnectSocket } from '../socket/client';
import { useAuthStore } from '../stores/auth-store';

export function useStaffSocket(restaurantId: string | null) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token || !restaurantId) return;

    const socket = connectAsStaff(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join:restaurant', { restaurantId });
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    return () => {
      disconnectSocket();
      setConnected(false);
    };
  }, [token, restaurantId]);

  return { socket: socketRef.current, connected };
}

export function useKitchenSocket(restaurantId: string | null) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token || !restaurantId) return;

    const socket = connectAsStaff(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join:kitchen', { restaurantId });
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    return () => {
      disconnectSocket();
      setConnected(false);
    };
  }, [token, restaurantId]);

  return { socket: socketRef.current, connected };
}

export function useCustomerSocket(sessionToken: string | null) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!sessionToken) return;

    const socket = connectAsCustomer(sessionToken);
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    return () => {
      disconnectSocket();
      setConnected(false);
    };
  }, [sessionToken]);

  return { socket: socketRef.current, connected };
}
