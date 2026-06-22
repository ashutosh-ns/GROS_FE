import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { TablesModule } from './modules/tables/tables.module';
import { QrModule } from './modules/qr/qr.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { MenuItemsModule } from './modules/menu-items/menu-items.module';
import { OrdersModule } from './modules/orders/orders.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { HealthController } from './health.controller';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 3600000,
        limit: 100,
      },
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    RestaurantsModule,
    TablesModule,
    QrModule,
    SessionsModule,
    CategoriesModule,
    MenuItemsModule,
    OrdersModule,
    FeedbackModule,
    AnalyticsModule,
    NotificationsModule,
    AdminModule,
    WebsocketsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
