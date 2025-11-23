import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('JWT Authentication (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    prismaService = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prismaService.user.deleteMany({
      where: { email: { contains: 'jwttest' } },
    });
  });

  describe('GET /auth/profile (AC: #1-5)', () => {
    let validToken: string;
    const testUser = {
      email: 'jwttest@example.com',
      password: 'Test123!',
      name: 'JWT Test User',
    };

    beforeEach(async () => {
      // Register and login to get a valid token
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      validToken = loginResponse.body.token as string;
    });

    it('should return 401 when no token is provided (AC: #2, #3)', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should return 401 when invalid token is provided (AC: #2, #3)', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });

    it('should return 401 when malformed token is provided (AC: #2, #3)', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer malformed.jwt.token')
        .expect(401);
    });

    it('should return 401 when Authorization header format is incorrect (AC: #1, #3)', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', validToken) // Missing "Bearer" prefix
        .expect(401);
    });

    it('should return 200 and user profile with valid token (AC: #2, #4, #5)', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('role');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.email).toBe(testUser.email);
    });

    it('should verify @CurrentUser() extracts correct user object (AC: #5)', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Verify the user object structure matches what JwtStrategy.validate() returns
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const body = response.body;
      expect(body).toEqual(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          id: expect.any(String),
          email: testUser.email,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          role: expect.any(String),
        }),
      );
      // Verify userId was mapped to id (not userId)
      expect(response.body).not.toHaveProperty('userId');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.id).toBeDefined();
    });

    it('should verify JwtStrategy validates JWT tokens from Authorization header (AC: #1)', async () => {
      // First request with valid token should succeed
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Request without Bearer prefix should fail
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', validToken)
        .expect(401);

      // Request with different header name should fail
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('X-Auth-Token', validToken)
        .expect(401);
    });
  });

  describe('Complete authentication flow (AC: #1-5)', () => {
    const newUser = {
      email: 'jwtflowtest@example.com',
      password: 'Flow123!',
      name: 'Flow Test User',
    };

    beforeEach(async () => {
      await prismaService.user.deleteMany({
        where: { email: newUser.email },
      });
    });

    it('should complete Register → Login → Get Profile flow', async () => {
      // Step 1: Register user
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('id');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(registerResponse.body.email).toBe(newUser.email);

      // Step 2: Login and get JWT token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: newUser.email, password: newUser.password })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body).toHaveProperty('user');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { token } = loginResponse.body;

      // Step 3: Access protected profile endpoint with token
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(profileResponse.body.email).toBe(newUser.email);
      expect(profileResponse.body).toHaveProperty('id');
      expect(profileResponse.body).toHaveProperty('role');
    });
  });

  describe('JwtAuthGuard behavior (AC: #2)', () => {
    it('should protect route with JwtAuthGuard decorator', async () => {
      // Without token, should be blocked by guard
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should allow access with valid token', async () => {
      // Register and login
      const user = {
        email: 'guardtest@example.com',
        password: 'Guard123!',
        name: 'Guard Test',
      };

      // Clean up first
      await prismaService.user.deleteMany({
        where: { email: user.email },
      });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(user)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { token } = loginResponse.body;

      // With valid token, should pass through guard
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
