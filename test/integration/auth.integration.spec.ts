import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Logger } from 'nestjs-pino';
import { MongooseModule } from '@nestjs/mongoose';

describe('Auth (integration)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          useFactory: () => ({
            uri: uri,
          }),
        }),
        AppModule,
      ],
    })
      .overrideProvider(Logger)
      .useValue({
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 60000);

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  }, 60000);

  describe('POST /auth/signup', () => {
    it('should create a new user', async () => {
      const signUpDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signUpDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
    });

    it('should return 409 if email already exists', async () => {
      const signUpDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signUpDto)
        .expect(409);
    });
  });

  describe('POST /auth/signin', () => {
    it('should authenticate user and return tokens', async () => {
      const signInDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(signInDto)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
    });

    it('should return 401 for invalid credentials', async () => {
      const signInDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/signin')
        .send(signInDto)
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens', async () => {
      // First, sign in to get a refresh token
      const signInDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const signInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(signInDto);

      const refreshToken = signInResponse.body.refresh_token;

      // Now, use the refresh token to get new tokens
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
    });

    it('should return 401 for invalid refresh token', async () => {
      const invalidRefreshToken = 'invalid_refresh_token';

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: invalidRefreshToken })
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile when authenticated', async () => {
      const signUpDto = {
        email: 'profile@example.com',
        password: 'password123',
        name: 'Profile User',
      };
      const signUpResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signUpDto)
        .expect(201);

      const { access_token } = signUpResponse.body;

      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('userId');
      expect(profileResponse.body.email).toBe(signUpDto.email);
      expect(profileResponse.body.name).toBe(signUpDto.name);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });
});
