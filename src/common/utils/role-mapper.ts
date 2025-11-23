/**
 * Role Mapper Utility (Story 1.2)
 *
 * Provides bidirectional mapping between:
 * - Database enum format (STUDENT, INSTRUCTOR, ADMIN)
 * - API format (student, faculty, admin)
 *
 * Purpose: Maintain backward compatibility with existing database
 * while providing API responses that match the specification format
 */

import { Role } from '@prisma/client';

/**
 * Maps database Role enum to API format string
 * @param role - Database Role enum value
 * @returns API format string (lowercase)
 *
 * @example
 * mapRoleToApiFormat(Role.STUDENT) // returns 'student'
 * mapRoleToApiFormat(Role.INSTRUCTOR) // returns 'faculty'
 */
export const mapRoleToApiFormat = (role: Role): string => {
  const roleMap: Record<Role, string> = {
    [Role.STUDENT]: 'student',
    [Role.INSTRUCTOR]: 'faculty',
    [Role.ADMIN]: 'admin',
  };
  return roleMap[role];
};

/**
 * Maps API format string to database Role enum
 * @param roleStr - API format role string
 * @returns Database Role enum value
 * @throws Error if invalid role string provided
 *
 * @example
 * mapApiFormatToRole('student') // returns Role.STUDENT
 * mapApiFormatToRole('faculty') // returns Role.INSTRUCTOR
 */
export const mapApiFormatToRole = (roleStr: string): Role => {
  const roleMap: Record<string, Role> = {
    'student': Role.STUDENT,
    'faculty': Role.INSTRUCTOR,
    'admin': Role.ADMIN,
  };

  const role = roleMap[roleStr.toLowerCase()];
  if (!role) {
    throw new Error(`Invalid role: ${roleStr}. Must be one of: student, faculty, admin`);
  }

  return role;
};

/**
 * Validates if a string is a valid API role format
 * @param roleStr - String to validate
 * @returns true if valid, false otherwise
 */
export const isValidApiRole = (roleStr: string): boolean => {
  return ['student', 'faculty', 'admin'].includes(roleStr.toLowerCase());
};
