import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Tenant Isolation (Integration)', () => {
  let app: INestApplication;
  let userAToken: string;
  let userBToken: string;
  let restaurantAId: string;
  let restaurantBId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    // Register user A and create restaurant
    const resA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: `tenant-a-${Date.now()}@example.com`, password: 'Test@123456', firstName: 'UserA' });
    userAToken = resA.body.data.accessToken;

    const restA = await request(app.getHttpServer())
      .post('/api/v1/restaurants')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Restaurant A', slug: `rest-a-${Date.now()}` });
    restaurantAId = restA.body.data.id;

    // Register user B and create restaurant
    const resB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: `tenant-b-${Date.now()}@example.com`, password: 'Test@123456', firstName: 'UserB' });
    userBToken = resB.body.data.accessToken;

    const restB = await request(app.getHttpServer())
      .post('/api/v1/restaurants')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'Restaurant B', slug: `rest-b-${Date.now()}` });
    restaurantBId = restB.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should not allow User B to access Restaurant A tables', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/restaurants/${restaurantAId}/tables`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(403);
  });

  it('should not allow User A to access Restaurant B categories', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/restaurants/${restaurantBId}/categories`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(403);
  });

  it('should not allow User B to create menu items in Restaurant A', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/restaurants/${restaurantAId}/menu-items`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'Hacked Item', price: 100, categoryId: 'fake-id' });

    expect(res.status).toBe(403);
  });

  it('should not allow User A to view Restaurant B orders', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/restaurants/${restaurantBId}/orders`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(403);
  });

  it('should allow User A to access their own restaurant', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/restaurants/${restaurantAId}/tables`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
  });
});
