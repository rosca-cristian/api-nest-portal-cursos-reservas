/**
 * Role Mapper Unit Tests (Story 1.2)
 */

import { Role } from '@prisma/client';
import {
  mapRoleToApiFormat,
  mapApiFormatToRole,
  isValidApiRole,
} from './role-mapper';

describe('Role Mapper', () => {
  describe('mapRoleToApiFormat', () => {
    it('should map STUDENT to student', () => {
      expect(mapRoleToApiFormat(Role.STUDENT)).toBe('student');
    });

    it('should map INSTRUCTOR to faculty', () => {
      expect(mapRoleToApiFormat(Role.INSTRUCTOR)).toBe('faculty');
    });

    it('should map ADMIN to admin', () => {
      expect(mapRoleToApiFormat(Role.ADMIN)).toBe('admin');
    });

    it('should handle all enum values', () => {
      const roles: Role[] = [Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN];
      const mappedRoles = roles.map(mapRoleToApiFormat);

      expect(mappedRoles).toEqual(['student', 'faculty', 'admin']);
    });
  });

  describe('mapApiFormatToRole', () => {
    it('should map student to STUDENT', () => {
      expect(mapApiFormatToRole('student')).toBe(Role.STUDENT);
    });

    it('should map faculty to INSTRUCTOR', () => {
      expect(mapApiFormatToRole('faculty')).toBe(Role.INSTRUCTOR);
    });

    it('should map admin to ADMIN', () => {
      expect(mapApiFormatToRole('admin')).toBe(Role.ADMIN);
    });

    it('should handle uppercase input', () => {
      expect(mapApiFormatToRole('STUDENT')).toBe(Role.STUDENT);
      expect(mapApiFormatToRole('FACULTY')).toBe(Role.INSTRUCTOR);
      expect(mapApiFormatToRole('ADMIN')).toBe(Role.ADMIN);
    });

    it('should handle mixed case input', () => {
      expect(mapApiFormatToRole('Student')).toBe(Role.STUDENT);
      expect(mapApiFormatToRole('Faculty')).toBe(Role.INSTRUCTOR);
      expect(mapApiFormatToRole('Admin')).toBe(Role.ADMIN);
    });

    it('should throw error for invalid role string', () => {
      expect(() => mapApiFormatToRole('invalid')).toThrow('Invalid role: invalid');
    });

    it('should throw error for empty string', () => {
      expect(() => mapApiFormatToRole('')).toThrow();
    });

    it('should throw error for instructor (old API format)', () => {
      expect(() => mapApiFormatToRole('instructor')).toThrow('Invalid role: instructor');
    });
  });

  describe('isValidApiRole', () => {
    it('should return true for student', () => {
      expect(isValidApiRole('student')).toBe(true);
    });

    it('should return true for faculty', () => {
      expect(isValidApiRole('faculty')).toBe(true);
    });

    it('should return true for admin', () => {
      expect(isValidApiRole('admin')).toBe(true);
    });

    it('should return true for uppercase', () => {
      expect(isValidApiRole('STUDENT')).toBe(true);
      expect(isValidApiRole('FACULTY')).toBe(true);
      expect(isValidApiRole('ADMIN')).toBe(true);
    });

    it('should return false for invalid roles', () => {
      expect(isValidApiRole('invalid')).toBe(false);
      expect(isValidApiRole('instructor')).toBe(false);
      expect(isValidApiRole('')).toBe(false);
      expect(isValidApiRole('teacher')).toBe(false);
    });
  });

  describe('Bidirectional mapping integrity', () => {
    it('should maintain consistency for STUDENT <-> student', () => {
      const apiRole = mapRoleToApiFormat(Role.STUDENT);
      const dbRole = mapApiFormatToRole(apiRole);
      expect(dbRole).toBe(Role.STUDENT);
    });

    it('should maintain consistency for INSTRUCTOR <-> faculty', () => {
      const apiRole = mapRoleToApiFormat(Role.INSTRUCTOR);
      const dbRole = mapApiFormatToRole(apiRole);
      expect(dbRole).toBe(Role.INSTRUCTOR);
    });

    it('should maintain consistency for ADMIN <-> admin', () => {
      const apiRole = mapRoleToApiFormat(Role.ADMIN);
      const dbRole = mapApiFormatToRole(apiRole);
      expect(dbRole).toBe(Role.ADMIN);
    });

    it('should correctly round-trip all roles', () => {
      const allRoles: Role[] = [Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN];

      allRoles.forEach(role => {
        const apiFormat = mapRoleToApiFormat(role);
        const backToDb = mapApiFormatToRole(apiFormat);
        expect(backToDb).toBe(role);
      });
    });
  });
});
