import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../modules/redis/redis.service';

export interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
    restaurantId?: string;
    role?: string;
    sessionToken?: string;
    type: 'staff' | 'customer';
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      const sessionToken = client.handshake.auth?.sessionToken || client.handshake.query?.sessionToken;

      if (token) {
        await this.authenticateStaff(client, token as string);
      } else if (sessionToken) {
        await this.authenticateCustomer(client, sessionToken as string);
      } else {
        client.disconnect();
        return;
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    // Cleanup handled automatically by Socket.IO room management
  }

  private async authenticateStaff(client: AuthenticatedSocket, token: string) {
    const payload = this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    if (payload.type !== 'access') {
      client.disconnect();
      return;
    }

    client.data = {
      userId: payload.sub,
      type: 'staff',
    };

    // Staff joins restaurant rooms when they subscribe
  }

  private async authenticateCustomer(client: AuthenticatedSocket, sessionToken: string) {
    const sessionData = await this.redisService.get(`session:${sessionToken}`);
    if (!sessionData) {
      client.disconnect();
      return;
    }

    const session = JSON.parse(sessionData);
    client.data = {
      sessionToken,
      restaurantId: session.restaurantId,
      type: 'customer',
    };

    // Customer auto-joins their session room
    client.join(`session:${sessionToken}`);
  }

  @SubscribeMessage('join:restaurant')
  handleJoinRestaurant(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { restaurantId: string },
  ) {
    if (client.data.type !== 'staff') return;

    client.data.restaurantId = data.restaurantId;
    client.join(`restaurant:${data.restaurantId}`);
    client.join(`restaurant:${data.restaurantId}:orders`);

    return { event: 'joined', data: { room: `restaurant:${data.restaurantId}` } };
  }

  @SubscribeMessage('join:kitchen')
  handleJoinKitchen(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { restaurantId: string },
  ) {
    if (client.data.type !== 'staff') return;

    client.data.restaurantId = data.restaurantId;
    client.join(`restaurant:${data.restaurantId}:kitchen`);

    return { event: 'joined', data: { room: `restaurant:${data.restaurantId}:kitchen` } };
  }

  @SubscribeMessage('leave:restaurant')
  handleLeaveRestaurant(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { restaurantId: string },
  ) {
    client.leave(`restaurant:${data.restaurantId}`);
    client.leave(`restaurant:${data.restaurantId}:orders`);
    client.leave(`restaurant:${data.restaurantId}:kitchen`);
  }

  // --- Emit methods (called from services) ---

  emitNewOrder(restaurantId: string, order: any) {
    this.server.to(`restaurant:${restaurantId}:orders`).emit('order:new', order);
    this.server.to(`restaurant:${restaurantId}:kitchen`).emit('order:new', order);
  }

  emitOrderStatusUpdate(restaurantId: string, order: any) {
    this.server.to(`restaurant:${restaurantId}:orders`).emit('order:status', order);
    this.server.to(`restaurant:${restaurantId}:kitchen`).emit('order:status', order);

    // Notify customer if they have a session
    if (order.sessionId) {
      this.server.to(`session:${order.sessionId}`).emit('order:status', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      });
    }
  }

  emitBillRequest(restaurantId: string, data: { tableId: string; tableNumber: number; sessionId: string }) {
    this.server.to(`restaurant:${restaurantId}:orders`).emit('bill:request', data);
  }

  emitTableUpdate(restaurantId: string, table: any) {
    this.server.to(`restaurant:${restaurantId}`).emit('table:update', table);
  }
}
