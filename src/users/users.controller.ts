import { Controller, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all users (admin only)',
    description:
      'Returns all users in the system with optional role filtering. Only accessible by administrators.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'student@example.com',
          name: 'John Doe',
          role: 'STUDENT',
          createdAt: '2025-11-17T10:00:00.000Z',
          updatedAt: '2025-11-17T10:00:00.000Z',
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          email: 'instructor@example.com',
          name: 'Jane Smith',
          role: 'INSTRUCTOR',
          createdAt: '2025-11-17T09:00:00.000Z',
          updatedAt: '2025-11-17T09:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires ADMIN role',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findAll(@Query() filters: FindAllUsersDto) {
    return this.usersService.findAll(filters);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user role (admin only)',
    description:
      'Updates the role of a user. Only administrators can change user roles. Valid roles: STUDENT, INSTRUCTOR, ADMIN.',
  })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'student@example.com',
        name: 'John Doe',
        role: 'INSTRUCTOR',
        createdAt: '2025-11-17T10:00:00.000Z',
        updatedAt: '2025-11-17T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid role value',
    schema: {
      example: {
        statusCode: 400,
        message: 'Role must be one of: STUDENT, INSTRUCTOR, ADMIN',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires ADMIN role',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(id, updateRoleDto.role);
  }
}
