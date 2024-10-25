import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UserService } from '../../src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { getConnectionToken, mockMongoConnection } from '../mocks/mongo-connection.mock';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: getConnectionToken(),
          useValue: mockMongoConnection,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('signUp', () => {
    it('should create a new user and return tokens', async () => {
      const signUpDto = { email: 'test@example.com', password: 'password', name: 'Test User' };
      const hashedPassword = 'hashedPassword';
      const user = { _id: 'userId', email: signUpDto.email, name: signUpDto.name };
      const tokens = { access_token: 'accessToken', refresh_token: 'refreshToken' };

      (userService.findByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (userService.create as jest.Mock).mockResolvedValue(user);
      (authService as any).generateTokens = jest.fn().mockReturnValue(tokens);

      const result = await authService.signUp(signUpDto);

      expect(result).toEqual({ user, ...tokens });
      expect(userService.findByEmail).toHaveBeenCalledWith(signUpDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(signUpDto.password, 10);
      expect(userService.create).toHaveBeenCalledWith({
        email: signUpDto.email,
        password: hashedPassword,
        name: signUpDto.name,
      });
      expect((authService as any).generateTokens).toHaveBeenCalledWith(user);
    });

    it('should throw ConflictException if email already exists', async () => {
      const signUpDto = { email: 'test@example.com', password: 'password', name: 'Test User' };
      (userService.findByEmail as jest.Mock).mockResolvedValue({});

      await expect(authService.signUp(signUpDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('signIn', () => {
    it('should return tokens for valid user', async () => {
      const user = { _id: 'userId', email: 'test@example.com' };
      const tokens = { access_token: 'accessToken', refresh_token: 'refreshToken' };
      (authService as any).generateTokens = jest.fn().mockReturnValue(tokens);

      const result = await authService.signIn(user);

      expect(result).toEqual(tokens);
      expect((authService as any).generateTokens).toHaveBeenCalledWith(user);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      const refreshToken = 'validRefreshToken';
      const payload = { sub: 'userId', email: 'test@example.com' };
      const user = { _id: 'userId', email: 'test@example.com' };
      const tokens = { access_token: 'newAccessToken', refresh_token: 'newRefreshToken' };

      (jwtService.verify as jest.Mock).mockReturnValue(payload);
      (userService.findById as jest.Mock).mockResolvedValue(user);
      (authService as any).generateTokens = jest.fn().mockReturnValue(tokens);

      const result = await authService.refreshToken(refreshToken);

      expect(result).toEqual(tokens);
      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, expect.any(Object));
      expect(userService.findById).toHaveBeenCalledWith(payload.sub);
      expect((authService as any).generateTokens).toHaveBeenCalledWith(user);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshToken = 'invalidRefreshToken';
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error();
      });

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password';
      const user = { email, password: 'hashedPassword', toObject: () => ({ email, password: 'hashedPassword' }) };

      (userService.findByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(email, password);

      expect(result).toEqual({ email });
      expect(userService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });

    it('should return null if user is not found', async () => {
      const email = 'test@example.com';
      const password = 'password';

      (userService.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await authService.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'password';
      const user = { email, password: 'hashedPassword' };

      (userService.findByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser(email, password);

      expect(result).toBeNull();
    });
  });
});
