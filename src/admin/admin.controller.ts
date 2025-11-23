import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CoursesService } from '../courses/courses.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { UpdateCoordinatesDto } from './dto/update-coordinates.dto';
import { MarkUnavailableDto } from './dto/mark-unavailable.dto';
import { FilterAdminReservationsDto } from './dto/filter-admin-reservations.dto';
import { AdminCancelReservationDto } from './dto/admin-cancel-reservation.dto';
import { FilterAuditLogDto } from './dto/filter-audit-log.dto';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly coursesService: CoursesService,
  ) { }

  @Get('courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Get all courses (Admin only)',
    description:
      'Returns all courses in the system with complete details including instructor information and enrollment counts. Admin-only endpoint for platform management.',
  })
  @ApiResponse({
    status: 200,
    description: 'Courses retrieved successfully',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'JavaScript Fundamentals',
          description: 'Learn the basics of JavaScript',
          duration: 20,
          category: 'Programming',
          instructorId: '123e4567-e89b-12d3-a456-426614174001',
          instructor: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Jane Smith',
            email: 'instructor@example.com',
          },
          enrollmentCount: 42,
          createdAt: '2025-11-17T10:00:00.000Z',
          updatedAt: '2025-11-17T10:00:00.000Z',
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
  async getAllCourses() {
    return this.coursesService.findAll();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Get platform statistics (Admin only)',
    description:
      'Returns comprehensive platform statistics including total users by role, courses, enrollments by status, certificates, and completion rates.',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform statistics retrieved successfully',
    schema: {
      example: {
        users: {
          total: 150,
          byRole: {
            STUDENT: 120,
            INSTRUCTOR: 25,
            ADMIN: 5,
          },
        },
        courses: {
          total: 50,
          byCategory: {
            Programming: 20,
            Design: 15,
            Business: 15,
          },
        },
        enrollments: {
          total: 500,
          active: 350,
          completed: 120,
          cancelled: 30,
        },
        certificates: {
          total: 120,
        },
        completionRate: 24.0,
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
    status: 500,
    description: 'Internal server error',
  })
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Check system health (Admin only)',
    description:
      'Performs a health check of the system including database connectivity. Returns operational status and timestamp.',
  })
  @ApiResponse({
    status: 200,
    description: 'System operational',
    schema: {
      example: {
        status: 'ok',
        database: 'connected',
        timestamp: '2025-11-17T12:00:00.000Z',
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
    status: 503,
    description: 'Service unavailable - database connection failed',
    schema: {
      example: {
        status: 'error',
        database: 'error',
        message: 'Database connection failed',
        timestamp: '2025-11-17T12:00:00.000Z',
      },
    },
  })
  async getHealth() {
    try {
      return await this.adminService.checkHealth();
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          database: 'error',
          message: 'Database connection failed',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('space-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Get space reservation statistics (Admin only)',
    description: 'Returns statistics for the space reservation system including total spaces, active reservations, and today\'s bookings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Space reservation statistics retrieved successfully',
    schema: {
      example: {
        totalSpaces: 50,
        activeReservations: 25,
        todayBookings: 15,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getSpaceStats() {
    return { data: await this.adminService.getSpaceReservationStats() };
  }

  @Get('spaces')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'List all spaces (Admin only)',
    description: 'Returns all spaces without filters for administrative management.',
  })
  @ApiResponse({ status: 200, description: 'Spaces retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllSpaces() {
    return this.adminService.getAllSpaces();
  }

  @Post('spaces')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Create new space (Admin only)',
    description: 'Creates a new space with all details.',
  })
  @ApiResponse({ status: 201, description: 'Space created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async createSpace(@Body() dto: CreateSpaceDto) {
    return this.adminService.createSpace(dto);
  }

  @Patch('spaces/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update space (Admin only)' })
  @ApiResponse({ status: 200, description: 'Space updated successfully' })
  async updateSpace(@Param('id') id: string, @Body() dto: UpdateSpaceDto) {
    return this.adminService.updateSpace(id, dto);
  }

  @Patch('spaces/:id/coordinates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update space coordinates (Admin only)' })
  @ApiResponse({ status: 200, description: 'Coordinates updated successfully' })
  async updateCoordinates(@Param('id') id: string, @Body() dto: UpdateCoordinatesDto) {
    return this.adminService.updateCoordinates(id, dto);
  }

  @Get('floors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all floors (Admin only)' })
  @ApiResponse({ status: 200, description: 'Floors retrieved successfully' })
  async getAllFloors() {
    return this.adminService.getAllFloors();
  }

  @Post('floors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new floor (Admin only)' })
  @ApiResponse({ status: 201, description: 'Floor created successfully' })
  async createFloor(@Body() dto: CreateFloorDto) {
    return this.adminService.createFloor(dto);
  }

  @Patch('floors/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update floor (Admin only)' })
  @ApiResponse({ status: 200, description: 'Floor updated successfully' })
  async updateFloor(@Param('id') id: string, @Body() dto: UpdateFloorDto) {
    return this.adminService.updateFloor(id, dto);
  }

  @Post('spaces/:id/unavailability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Mark space unavailable (Admin only)' })
  @ApiResponse({ status: 200, description: 'Space marked unavailable' })
  async markUnavailable(@Param('id') id: string, @Body() dto: MarkUnavailableDto) {
    return this.adminService.markUnavailable(id, dto);
  }

  @Delete('spaces/:id/unavailability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Mark space available (Admin only)' })
  @ApiResponse({ status: 200, description: 'Space marked available' })
  async markAvailable(@Param('id') id: string) {
    return this.adminService.markAvailable(id);
  }

  @Get('reservations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all reservations (Admin only)' })
  @ApiResponse({ status: 200, description: 'Reservations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllReservations(@Query() filters: FilterAdminReservationsDto) {
    return this.adminService.getAllReservations(filters);
  }

  @Get('reservations/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export reservations to CSV (Admin only)' })
  @ApiResponse({ status: 200, description: 'CSV file generated' })
  async exportReservations(@Query() filters: FilterAdminReservationsDto, @Res() res: any) {
    const csv = await this.adminService.exportReservations(filters);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="reservations-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('reservations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get reservation detail (Admin only)' })
  @ApiResponse({ status: 200, description: 'Reservation details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async getReservationDetail(@Param('id') id: string) {
    return this.adminService.getReservationDetail(id);
  }

  @Delete('reservations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cancel reservation (Admin only)' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid state' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async cancelReservation(@Param('id') id: string, @Body() dto: AdminCancelReservationDto) {
    return this.adminService.cancelReservation(id, dto);
  }

  @Get('audit-log')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Query audit log (Admin only)' })
  @ApiResponse({ status: 200, description: 'Audit log entries retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAuditLog(@Query() filters: FilterAuditLogDto) {
    return this.adminService.getAuditLog(filters);
  }

  @Get('analytics/utilization')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get space utilization analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getUtilizationAnalytics() {
    return this.adminService.getUtilizationAnalytics();
  }
}
