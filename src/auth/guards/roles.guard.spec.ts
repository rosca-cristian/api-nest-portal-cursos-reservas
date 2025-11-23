import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const mockExecutionContext = (
    user: unknown,
    roles?: string[],
  ): ExecutionContext => {
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;

    if (roles !== undefined) {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
    }

    return context;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when no @Roles() decorator is present', () => {
      const context = mockExecutionContext({
        id: '1',
        email: 'test@test.com',
        role: 'STUDENT',
      });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user role matches required role', () => {
      const user = { id: '1', email: 'admin@test.com', role: 'ADMIN' };
      const context = mockExecutionContext(user, ['ADMIN']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user role does not match required role', () => {
      const user = { id: '1', email: 'student@test.com', role: 'STUDENT' };
      const context = mockExecutionContext(user, ['ADMIN']);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow access when user role matches one of multiple required roles', () => {
      const user = {
        id: '1',
        email: 'instructor@test.com',
        role: 'INSTRUCTOR',
      };
      const context = mockExecutionContext(user, ['INSTRUCTOR', 'ADMIN']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user is admin and multiple roles are required', () => {
      const user = { id: '1', email: 'admin@test.com', role: 'ADMIN' };
      const context = mockExecutionContext(user, ['INSTRUCTOR', 'ADMIN']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user role does not match any of multiple required roles', () => {
      const user = { id: '1', email: 'student@test.com', role: 'STUDENT' };
      const context = mockExecutionContext(user, ['INSTRUCTOR', 'ADMIN']);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny access when user object is missing', () => {
      const context = mockExecutionContext(undefined, ['ADMIN']);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should call reflector.getAllAndOverride with correct arguments', () => {
      const context = mockExecutionContext(
        { id: '1', email: 'test@test.com', role: 'STUDENT' },
        ['ADMIN'],
      );
      const spy = jest.spyOn(reflector, 'getAllAndOverride');

      guard.canActivate(context);

      expect(spy).toHaveBeenCalledWith('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });
});
