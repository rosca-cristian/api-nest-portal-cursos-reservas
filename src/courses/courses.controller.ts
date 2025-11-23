import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CourseResponseDto } from './dto/course-response.dto';
import { FilterCoursesDto } from './dto/filter-courses.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all courses with optional filters',
    description:
      'Returns all courses. Supports filtering by search keyword, category, instructor name, and duration range. All filters are optional and can be combined.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search keyword for title and description (case-insensitive)',
    type: String,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by exact category match',
    type: String,
  })
  @ApiQuery({
    name: 'instructor',
    required: false,
    description: 'Filter by instructor name (partial match)',
    type: String,
  })
  @ApiQuery({
    name: 'minDuration',
    required: false,
    description: 'Minimum course duration in hours',
    type: Number,
  })
  @ApiQuery({
    name: 'maxDuration',
    required: false,
    description: 'Maximum course duration in hours',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns array of courses (empty array if no matches)',
    type: [CourseResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (invalid filter values)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'minDuration cannot be greater than maxDuration',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async findAll(@Query() filters: FilterCoursesDto) {
    return this.coursesService.findAll(filters);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new course',
    description: 'Instructor or admin creates a new course',
  })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not an instructor or admin',
  })
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.create(createCourseDto, user.id);
  }

  @Get('my-courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Get instructor's courses",
    description: 'Returns all courses created by the current instructor',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns array of instructor courses',
    type: [CourseResponseDto],
  })
  async findMyCourses(@CurrentUser() user: any) {
    return this.coursesService.findByInstructor(user.id);
  }

  @Get('my-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get instructor statistics',
    description:
      'Returns aggregated statistics for instructor: total courses, enrollments, completion rate',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns instructor statistics',
  })
  async getMyStats(@CurrentUser() user: any) {
    return this.coursesService.getInstructorStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Course ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns course details with instructor info and enrollment count',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Course with ID {id} not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ID format',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed (uuid is expected)' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a course',
    description: 'Update course details. Only course owner or admin can update.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Course ID (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not course owner or admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.update(id, updateCourseDto, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a course',
    description:
      'Delete a course. Only course owner or admin can delete. Cascades to enrollments.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Course ID (UUID)',
  })
  @ApiResponse({
    status: 204,
    description: 'Course deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not course owner or admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    await this.coursesService.delete(id, user.id, user.role);
  }

  @Get(':id/students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get course enrollment details',
    description:
      'Returns list of students enrolled in the course with statistics. Only course owner or admin can access.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Course ID (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns enrollment details and statistics',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not course owner or admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  async getCourseStudents(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.getCourseEnrollments(id, user.id, user.role);
  }
}
