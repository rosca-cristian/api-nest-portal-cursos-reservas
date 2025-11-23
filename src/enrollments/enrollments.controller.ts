import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Enrollments')
@Controller('enrollments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Enroll in a course',
    description:
      'Creates a new enrollment for the authenticated user in the specified course. Users cannot enroll in the same course twice.',
  })
  @ApiResponse({
    status: 201,
    description: 'Enrollment created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        courseId: '123e4567-e89b-12d3-a456-426614174002',
        status: 'active',
        progress: 0,
        enrolledAt: '2025-11-17T10:00:00.000Z',
        completedAt: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Already enrolled in course or validation error',
    schema: {
      example: {
        statusCode: 400,
        message: 'User is already enrolled in this course',
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
    description: 'Course not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Course not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async create(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.enrollmentsService.create(user.id, createEnrollmentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get my enrollments',
    description:
      'Returns all enrollments for the authenticated user including course details, status, and progress information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all enrollments for current user',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          courseId: '123e4567-e89b-12d3-a456-426614174002',
          status: 'active',
          progress: 50,
          enrolledAt: '2025-11-17T10:00:00.000Z',
          completedAt: null,
          course: {
            id: '123e4567-e89b-12d3-a456-426614174002',
            title: 'JavaScript Fundamentals',
            description: 'Learn the basics of JavaScript',
            duration: 20,
            category: 'Programming',
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findMyEnrollments(
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.enrollmentsService.findByUser(user.id);
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Mark enrollment as complete',
    description:
      'Marks the enrollment as completed and sets the completion date. Only the enrollment owner can complete their enrollment. This action triggers certificate generation.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Enrollment ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment completed successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        courseId: '123e4567-e89b-12d3-a456-426614174002',
        status: 'completed',
        progress: 100,
        enrolledAt: '2025-11-17T10:00:00.000Z',
        completedAt: '2025-11-17T15:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Enrollment already completed',
    schema: {
      example: {
        statusCode: 400,
        message: 'Enrollment is already completed',
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
    description: 'Forbidden - not enrollment owner',
    schema: {
      example: {
        statusCode: 403,
        message: 'You can only complete your own enrollments',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Enrollment not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Enrollment not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async complete(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.enrollmentsService.completeEnrollment(id, user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel enrollment',
    description:
      'Cancels an active enrollment. Only the enrollment owner can cancel their enrollment. Completed enrollments cannot be cancelled.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Enrollment ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment cancelled successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        courseId: '123e4567-e89b-12d3-a456-426614174002',
        status: 'cancelled',
        progress: 50,
        enrolledAt: '2025-11-17T10:00:00.000Z',
        completedAt: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel completed enrollment',
    schema: {
      example: {
        statusCode: 400,
        message: 'Cannot cancel completed enrollment',
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
    description: 'Forbidden - not enrollment owner',
    schema: {
      example: {
        statusCode: 403,
        message: 'You can only cancel your own enrollments',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Enrollment not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Enrollment not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.enrollmentsService.cancelEnrollment(id, user.id);
  }
}
