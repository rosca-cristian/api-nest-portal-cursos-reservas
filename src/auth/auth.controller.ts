import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { mapRoleToApiFormat } from '../common/utils/role-mapper';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account with email, name, and password. Password is hashed with bcrypt. Default role is STUDENT.',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'student@example.com',
        name: 'John Doe',
        role: 'STUDENT',
        createdAt: '2025-11-17T10:00:00.000Z',
        updatedAt: '2025-11-17T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or email already exists',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be an email', 'password must be longer than or equal to 8 characters'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
      },
    },
  })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);
    // Story 1.3: Wrap response in { data: { user } } format
    return { data: { user } };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticates user with email and password. Returns JWT access token on success.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns access token',
    schema: {
      example: {
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'student@example.com',
            name: 'John Doe',
            role: 'student',
            major: 'Computer Science',
            department: null,
            photoUrl: null,
            createdAt: '2025-11-17T10:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be an email'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const result = this.authService.login(user);
    // Story 1.3: Wrap response in { data: { token, user } } format
    return { data: result };
  }

  // Story 1.4: Logout endpoint
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'User logout',
    description:
      'Logs out the current user. Since JWT is stateless, this is an acknowledgment endpoint. Token remains valid until expiry.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      example: {
        data: {
          message: 'Logged out successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async logout(@CurrentUser() user: { id: string }) {
    // Story 1.4: Stateless JWT - no server-side action needed
    // Future enhancement: Add token to blacklist/revocation list
    return {
      data: {
        message: 'Logged out successfully',
      },
    };
  }

  // Story 1.4: /me endpoint alias
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile (alias for /profile)',
    description:
      'Returns the profile of the currently authenticated user. Alias endpoint for /profile with new response format.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      example: {
        data: {
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'student@example.com',
            name: 'John Doe',
            role: 'student',
            major: 'Computer Science',
            department: null,
            photoUrl: null,
            createdAt: '2025-11-17T10:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  getMe(@CurrentUser() user: any) {
    // Story 1.4: Return user with API-formatted role
    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: mapRoleToApiFormat(user.role),
          major: user.major,
          department: user.department,
          photoUrl: user.photoUrl,
          createdAt: user.createdAt,
        },
      },
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the profile of the currently authenticated user. Requires valid JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'student@example.com',
        role: 'STUDENT',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  getProfile(@CurrentUser() user: { id: string; email: string; role: string }) {
    return user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user profile',
    description:
      'Updates the current user profile. Allows updating name and email. Requires valid JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'newemail@example.com',
        name: 'John Updated',
        role: 'STUDENT',
        createdAt: '2025-11-17T10:00:00.000Z',
        updatedAt: '2025-11-17T11:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be an email'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Change user password',
    description:
      'Changes the password for the current user. Requires old password for verification. New password must be at least 8 characters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        message: 'Password changed successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or incorrect old password',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid old password',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(
      user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }

  @Post('demo-login/:role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Demo login for portfolio reviewers',
    description:
      'Allows quick switching between roles using demo accounts. For portfolio demonstration purposes only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Demo login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'student@demo.com',
          name: 'Demo Student',
          role: 'STUDENT',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid role parameter',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid role. Must be: student, instructor, or admin',
        error: 'Bad Request',
      },
    },
  })
  async demoLogin(@Param('role') role: string) {
    const demoAccounts: Record<string, { email: string; password: string }> = {
      student: { email: 'student@demo.com', password: 'password' },
      instructor: { email: 'instructor@demo.com', password: 'password' },
      admin: { email: 'admin@demo.com', password: 'password' },
    };

    const normalizedRole = role.toLowerCase();
    const account = demoAccounts[normalizedRole];

    if (!account) {
      throw new BadRequestException(
        'Invalid role. Must be: student, instructor, or admin',
      );
    }

    const user = await this.authService.validateUser(
      account.email,
      account.password,
    );

    if (!user) {
      throw new UnauthorizedException('Demo account not found');
    }

    return this.authService.login(user);
  }
}
