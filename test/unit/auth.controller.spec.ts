import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { UserService } from '../../src/user/user.service';
import { getConnectionToken, mockMongoConnection } from '../mocks/mongo-connection.mock';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signUp: jest.fn(),
            signIn: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {},
        },
        {
          provide: getConnectionToken(),
          useValue: mockMongoConnection,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('signUp', () => {
    it('should call authService.signUp with signUpDto', async () => {
      const signUpDto = { email: 'test@example.com', password: 'password', name: 'Test User' };
      await authController.signUp(signUpDto);
      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
    });
  });

  describe('signIn', () => {
    it('should call authService.signIn with user from request', async () => {
      const req = { user: { _id: 'userId', email: 'test@example.com' } };
      await authController.signIn(req);
      expect(authService.signIn).toHaveBeenCalledWith(req.user);
    });
  });

  describe('refreshToken', () => {
    it('should call authService.refreshToken with refreshTokenDto', async () => {
      const refreshTokenDto = { refreshToken: 'refreshToken' };
      await authController.refreshToken(refreshTokenDto);
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
    });
  });

  describe('getProfile', () => {
    it('should return user from request', () => {
      const req = { user: { userId: 'userId', email: 'test@example.com' } };
      const result = authController.getProfile(req);
      expect(result).toEqual(req.user);
    });
  });
});
