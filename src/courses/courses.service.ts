import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { FilterCoursesDto } from './dto/filter-courses.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: FilterCoursesDto) {
    if (filters?.minDuration !== undefined && filters?.maxDuration !== undefined) {
      if (filters.minDuration > filters.maxDuration) {
        throw new BadRequestException(
          'minDuration cannot be greater than maxDuration',
        );
      }
    }

    const where: Prisma.CourseWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    if (filters?.category) {
      where.category = { equals: filters.category };
    }

    if (filters?.instructor) {
      where.instructor = {
        name: { contains: filters.instructor },
      };
    }

    if (filters?.minDuration !== undefined || filters?.maxDuration !== undefined) {
      where.duration = {};
      if (filters.minDuration !== undefined) {
        where.duration.gte = filters.minDuration;
      }
      if (filters.maxDuration !== undefined) {
        where.duration.lte = filters.maxDuration;
      }
    }

    return this.prisma.course.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async create(dto: CreateCourseDto, userId: string) {
    return this.prisma.course.create({
      data: {
        ...dto,
        instructorId: userId,
      },
      include: {
        instructor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    dto: UpdateCourseDto,
    userId: string,
    userRole: string,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to edit this course');
    }

    return this.prisma.course.update({
      where: { id },
      data: dto,
      include: {
        instructor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });
  }

  async delete(id: string, userId: string, userRole: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to delete this course');
    }

    await this.prisma.course.delete({
      where: { id },
    });
  }

  async findByInstructor(userId: string) {
    return this.prisma.course.findMany({
      where: {
        instructorId: userId,
      },
      include: {
        instructor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getCourseEnrollments(
    courseId: string,
    userId: string,
    userRole: string,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to view enrollments');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });

    const completedCount = enrollments.filter(
      (e: { status: string }) => e.status === 'COMPLETED',
    ).length;
    const completionRate =
      enrollments.length > 0 ? (completedCount / enrollments.length) * 100 : 0;

    return {
      enrollments,
      stats: {
        total: enrollments.length,
        completed: completedCount,
        completionRate: Math.round(completionRate * 10) / 10,
      },
    };
  }

  async getInstructorStats(userId: string) {
    const courses = await this.prisma.course.findMany({
      where: { instructorId: userId },
      include: {
        enrollments: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    const totalCourses = courses.length;

    let totalEnrollments = 0;
    let completedEnrollments = 0;
    let topCourse = null;
    let maxEnrollments = 0;

    courses.forEach((course: any) => {
      const enrollmentCount = course.enrollments.length;
      totalEnrollments += enrollmentCount;

      const completed = course.enrollments.filter(
        (e: { status: string }) => e.status === 'COMPLETED',
      ).length;
      completedEnrollments += completed;

      if (enrollmentCount > maxEnrollments) {
        maxEnrollments = enrollmentCount;
        topCourse = {
          id: course.id,
          title: course.title,
          enrollments: enrollmentCount,
        };
      }
    });

    const completionRate =
      totalEnrollments > 0
        ? (completedEnrollments / totalEnrollments) * 100
        : 0;

    return {
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      completionRate: Math.round(completionRate * 10) / 10,
      topCourse,
    };
  }
}
