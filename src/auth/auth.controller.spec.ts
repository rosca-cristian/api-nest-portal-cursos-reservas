import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    validateUser: jest.fn(),
    login: jest.fn(),
  };

  const mockUsersService = {
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const registeredUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
      };

      const expectedResult = {
        data: {
          user: registeredUser,
        },
      };

      mockAuthService.register.mockResolvedValue(registeredUser);

      const result = await controller.register(createUserDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    it('should return token and user data on successful login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
      };

      const loginResult = {
        token: 'jwt-token',
        user,
      };

      const expectedResult = {
        data: loginResult,
      };

      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockReturnValue(loginResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(user);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile when authenticated', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        role: 'student',
      };

      const result = controller.getProfile(user);

      expect(result).toEqual(user);
    });

    it('should return user object with id, email, and role', () => {
      const user = {
        id: 'user-123',
        email: 'another@example.com',
        role: 'teacher',
      };

      const result = controller.getProfile(user);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
      expect(result.id).toBe('user-123');
      expect(result.email).toBe('another@example.com');
      expect(result.role).toBe('teacher');
    });
  });

  describe('updateProfile', () => {
    it('should update user name', async () => {
      const user = { id: 'user-123' };
      const updateDto = { name: 'Updated Name' };
      const updatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Updated Name',
        role: 'STUDENT',
      };

      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(user, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(
        user.id,
        updateDto,
      );
    });

    it('should update user email', async () => {
      const user = { id: 'user-123' };
      const updateDto = { email: 'newemail@example.com' };
      const updatedUser = {
        id: 'user-123',
        email: 'newemail@example.com',
        name: 'Test User',
        role: 'STUDENT',
      };

      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(user, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(
        user.id,
        updateDto,
      );
    });

    it('should update both name and email', async () => {
      const user = { id: 'user-123' };
      const updateDto = { name: 'New Name', email: 'new@example.com' };
      const updatedUser = {
        id: 'user-123',
        email: 'new@example.com',
        name: 'New Name',
        role: 'STUDENT',
      };

      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(user, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(
        user.id,
        updateDto,
      );
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const user = { id: 'user-123' };
      const changePasswordDto = {
        oldPassword: 'oldpass123',
        newPassword: 'newpass123',
      };

      mockUsersService.changePassword.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT',
      });

      const result = await controller.changePassword(user, changePasswordDto);

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(mockUsersService.changePassword).toHaveBeenCalledWith(
        user.id,
        changePasswordDto.oldPassword,
        changePasswordDto.newPassword,
      );
    });
  });

  // Story 1.4: Logout and /me endpoint tests
  describe('logout', () => {
    it('should return success message on logout', async () => {
      const user = { id: 'user-123' };
      const expectedResult = {
        data: {
          message: 'Logged out successfully',
        },
      };

      const result = await controller.logout(user);

      expect(result).toEqual(expectedResult);
    });

    it('should return logout message for any authenticated user', async () => {
      const user = { id: 'different-user-456' };

      const result = await controller.logout(user);

      expect(result.data.message).toBe('Logged out successfully');
    });
  });

  describe('getMe', () => {
    it('should return user profile in new format', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT',
        major: 'Computer Science',
        department: null,
        photoUrl: null,
        createdAt: new Date('2025-11-17T10:00:00.000Z'),
      };

      const result = await controller.getMe(user);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('user');
      expect(result.data.user.id).toBe(user.id);
      expect(result.data.user.email).toBe(user.email);
      expect(result.data.user.name).toBe(user.name);
      expect(result.data.user.role).toBe('student'); // Mapped from STUDENT
      expect(result.data.user.major).toBe('Computer Science');
    });

    it('should map INSTRUCTOR role to faculty', async () => {
      const user = {
        id: 'user-456',
        email: 'faculty@example.com',
        name: 'Faculty User',
        role: 'INSTRUCTOR',
        major: null,
        department: 'Engineering',
        photoUrl: null,
        createdAt: new Date('2025-11-17T10:00:00.000Z'),
      };

      const result = await controller.getMe(user);

      expect(result.data.user.role).toBe('faculty');
      expect(result.data.user.department).toBe('Engineering');
    });

    it('should include all reservation fields', async () => {
      const user = {
        id: 'user-789',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        major: null,
        department: 'IT',
        photoUrl: 'https://example.com/photo.jpg',
        createdAt: new Date('2025-11-17T10:00:00.000Z'),
      };

      const result = await controller.getMe(user);

      expect(result.data.user).toHaveProperty('major');
      expect(result.data.user).toHaveProperty('department');
      expect(result.data.user).toHaveProperty('photoUrl');
      expect(result.data.user).toHaveProperty('createdAt');
      expect(result.data.user.department).toBe('IT');
      expect(result.data.user.photoUrl).toBe('https://example.com/photo.jpg');
    });
  });
});
