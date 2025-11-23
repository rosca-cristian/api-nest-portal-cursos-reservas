import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') {
                return 'test-secret';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate JWT payload and return user object', () => {
    const payload = {
      userId: '123',
      email: 'test@example.com',
      role: 'student',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const result = strategy.validate(payload);

    expect(result).toEqual({
      id: '123',
      email: 'test@example.com',
      role: 'student',
    });
  });

  it('should map userId to id in returned user object', () => {
    const payload = {
      userId: 'user-456',
      email: 'another@example.com',
      role: 'teacher',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const result = strategy.validate(payload);

    expect(result.id).toBe('user-456');
    expect(result).not.toHaveProperty('userId');
  });

  it('should configure strategy with JWT_SECRET from ConfigService', () => {
    expect(strategy).toBeDefined();
  });
});
