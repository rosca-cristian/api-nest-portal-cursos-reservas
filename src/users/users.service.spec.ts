import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateProfile', () => {
    it('should update user name successfully', async () => {
      const userId = 'user-123';
      const updateDto = { name: 'Updated Name' };
      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Updated Name',
        role: 'STUDENT',
      };

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateDto,
        select: { id: true, email: true, name: true, role: true },
      });
    });

    it('should update user email when unique', async () => {
      const userId = 'user-123';
      const updateDto = { email: 'newemail@example.com' };
      const updatedUser = {
        id: userId,
        email: 'newemail@example.com',
        name: 'Test User',
        role: 'STUDENT',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: updateDto.email },
      });
    });

    it('should throw ConflictException when email already exists for another user', async () => {
      const userId = 'user-123';
      const updateDto = { email: 'existing@example.com' };
      const existingUser = {
        id: 'other-user-456',
        email: 'existing@example.com',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.updateProfile(userId, updateDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.updateProfile(userId, updateDto)).rejects.toThrow(
        'Email already in use',
      );
    });

    it('should allow updating email to same email (same user)', async () => {
      const userId = 'user-123';
      const updateDto = { email: 'same@example.com' };
      const existingUser = {
        id: userId,
        email: 'same@example.com',
        name: 'Test User',
        role: 'STUDENT',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(existingUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toEqual(existingUser);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully with valid old password', async () => {
      const userId = 'user-123';
      const oldPassword = 'oldpass123';
      const newPassword = 'newpass123';
      const user = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-old-password',
        role: 'STUDENT',
      };
      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.changePassword(
        userId,
        oldPassword,
        newPassword,
      );

      expect(result).toEqual(updatedUser);
      expect(bcrypt.compare).toHaveBeenCalledWith(oldPassword, user.password);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: 'hashed-new-password' },
        select: { id: true, email: true, name: true, role: true },
      });
    });

    it('should throw UnauthorizedException when old password is incorrect', async () => {
      const userId = 'user-123';
      const oldPassword = 'wrongpassword';
      const newPassword = 'newpass123';
      const user = {
        id: userId,
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'STUDENT',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(userId, oldPassword, newPassword),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.changePassword(userId, oldPassword, newPassword),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const userId = 'nonexistent-user';
      const oldPassword = 'oldpass123';
      const newPassword = 'newpass123';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword(userId, oldPassword, newPassword),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.changePassword(userId, oldPassword, newPassword),
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateRole', () => {
    it('should update user role successfully', async () => {
      const userId = 'user-123';
      const newRole = 'INSTRUCTOR';
      const existingUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        role: 'STUDENT',
      };
      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'INSTRUCTOR',
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateRole(userId, newRole as any);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { role: newRole },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const userId = 'nonexistent-user';
      const newRole = 'ADMIN';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateRole(userId, newRole as any)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateRole(userId, newRole as any)).rejects.toThrow(
        'User not found',
      );
    });

    it('should update student to instructor', async () => {
      const userId = 'user-123';
      const newRole = 'INSTRUCTOR';
      const existingUser = {
        id: userId,
        email: 'student@example.com',
        name: 'Student User',
        password: 'hashed',
        role: 'STUDENT',
      };
      const updatedUser = {
        id: userId,
        email: 'student@example.com',
        name: 'Student User',
        role: 'INSTRUCTOR',
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateRole(userId, newRole as any);

      expect(result.role).toBe('INSTRUCTOR');
    });

    it('should update instructor to admin', async () => {
      const userId = 'user-456';
      const newRole = 'ADMIN';
      const existingUser = {
        id: userId,
        email: 'instructor@example.com',
        name: 'Instructor User',
        password: 'hashed',
        role: 'INSTRUCTOR',
      };
      const updatedUser = {
        id: userId,
        email: 'instructor@example.com',
        name: 'Instructor User',
        role: 'ADMIN',
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateRole(userId, newRole as any);

      expect(result.role).toBe('ADMIN');
    });

    it('should allow admin demotion to student', async () => {
      const userId = 'user-789';
      const newRole = 'STUDENT';
      const existingUser = {
        id: userId,
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'hashed',
        role: 'ADMIN',
      };
      const updatedUser = {
        id: userId,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'STUDENT',
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateRole(userId, newRole as any);

      expect(result.role).toBe('STUDENT');
    });

    it('should not return password in response', async () => {
      const userId = 'user-123';
      const newRole = 'ADMIN';
      const existingUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: 'should-not-be-returned',
        role: 'STUDENT',
      };
      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateRole(userId, newRole as any);

      expect(result).not.toHaveProperty('password');
    });
  });

  // Story 1.1: Test new reservation system fields
  describe('updateProfile with reservation fields', () => {
    it('should update user major field for students', async () => {
      const userId = 'user-123';
      const updateDto = { major: 'Computer Science' };
      const updatedUser = {
        id: userId,
        email: 'student@example.com',
        name: 'Student User',
        role: 'STUDENT',
        major: 'Computer Science',
        department: null,
        photoUrl: null,
      };

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(result.major).toBe('Computer Science');
    });

    it('should update user department field for faculty', async () => {
      const userId = 'user-456';
      const updateDto = { department: 'Engineering' };
      const updatedUser = {
        id: userId,
        email: 'faculty@example.com',
        name: 'Faculty User',
        role: 'INSTRUCTOR',
        major: null,
        department: 'Engineering',
        photoUrl: null,
      };

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(result.department).toBe('Engineering');
    });

    it('should update user photoUrl field', async () => {
      const userId = 'user-789';
      const updateDto = { photoUrl: 'https://example.com/photo.jpg' };
      const updatedUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        role: 'STUDENT',
        major: null,
        department: null,
        photoUrl: 'https://example.com/photo.jpg',
      };

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(result.photoUrl).toBe('https://example.com/photo.jpg');
    });

    it('should accept null values for optional reservation fields (backward compatibility)', async () => {
      const userId = 'user-legacy';
      const updateDto = { name: 'Legacy User' };
      const updatedUser = {
        id: userId,
        email: 'legacy@example.com',
        name: 'Legacy User',
        role: 'STUDENT',
        major: null,
        department: null,
        photoUrl: null,
      };

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(result.major).toBeNull();
      expect(result.department).toBeNull();
      expect(result.photoUrl).toBeNull();
    });

    it('should update multiple reservation fields at once', async () => {
      const userId = 'user-multi';
      const updateDto = {
        major: 'Mathematics',
        photoUrl: 'https://example.com/math-student.jpg',
      };
      const updatedUser = {
        id: userId,
        email: 'mathstudent@example.com',
        name: 'Math Student',
        role: 'STUDENT',
        major: 'Mathematics',
        department: null,
        photoUrl: 'https://example.com/math-student.jpg',
      };

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(result.major).toBe('Mathematics');
      expect(result.photoUrl).toBe('https://example.com/math-student.jpg');
    });
  });
});
