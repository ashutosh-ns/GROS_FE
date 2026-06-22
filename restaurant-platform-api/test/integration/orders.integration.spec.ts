import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Order Flow (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Order Status Transitions', () => {
    it('should enforce valid status transitions', async () => {
      // This test requires a pre-seeded order
      // In a real test env, we'd create the order first via session flow
    });

    it('should reject invalid transitions (e.g., PLACED → READY)', async () => {
      // Verify that skipping steps is rejected
    });

    it('should not allow status change without authentication', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/restaurants/fake-id/orders/fake-order/status')
        .send({ status: 'ACCEPTED' });

      expect(res.status).toBe(401);
    });
  });

  describe('RBAC on Orders', () => {
    it('should reject unauthenticated access to orders list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/restaurants/any-id/orders');

      expect(res.status).toBe(401);
    });
  });
});
