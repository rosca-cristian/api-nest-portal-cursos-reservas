import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilterCoursesDto } from './dto/filter-courses.dto';

describe('CoursesService', () => {
  let service: CoursesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    course: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of courses with instructor and enrollment count', async () => {
      const mockCourses = [
        {
          id: '1',
          title: 'Test Course',
          description: 'Test Description',
          duration: 20,
          category: 'Programming',
          instructorId: 'instructor-1',
          createdAt: new Date('2025-11-17'),
          updatedAt: new Date('2025-11-17'),
          instructor: {
            id: 'instructor-1',
            name: 'Test Instructor',
            email: 'instructor@test.com',
          },
          _count: {
            enrollments: 5,
          },
        },
      ];

      mockPrismaService.course.findMany.mockResolvedValue(mockCourses);

      const result = await service.findAll();

      expect(result).toEqual(mockCourses);
      expect(prismaService.course.findMany).toHaveBeenCalledWith({
        where: {},
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
    });

    it('should return empty array when no courses exist', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should include all required course fields', async () => {
      const mockCourse = {
        id: '1',
        title: 'Test Course',
        description: 'Test Description',
        duration: 20,
        category: 'Programming',
        instructorId: 'instructor-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        instructor: {
          id: 'instructor-1',
          name: 'Test Instructor',
          email: 'instructor@test.com',
        },
        _count: {
          enrollments: 3,
        },
      };

      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);

      const result = await service.findAll();

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('duration');
      expect(result[0]).toHaveProperty('category');
      expect(result[0]).toHaveProperty('instructorId');
      expect(result[0]).toHaveProperty('instructor');
      expect(result[0]).toHaveProperty('_count');
      expect(result[0]).toHaveProperty('createdAt');
      expect(result[0]).toHaveProperty('updatedAt');
    });

    it('should include instructor with id, name, and email only (no password)', async () => {
      const mockCourse = {
        id: '1',
        title: 'Test Course',
        description: 'Test',
        duration: 20,
        category: 'Test',
        instructorId: 'instructor-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        instructor: {
          id: 'instructor-1',
          name: 'Test Instructor',
          email: 'instructor@test.com',
        },
        _count: {
          enrollments: 0,
        },
      };

      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);

      const result = await service.findAll();

      expect(result[0].instructor).toHaveProperty('id');
      expect(result[0].instructor).toHaveProperty('name');
      expect(result[0].instructor).toHaveProperty('email');
      expect(result[0].instructor).not.toHaveProperty('password');
    });

    it('should include enrollment count', async () => {
      const mockCourse = {
        id: '1',
        title: 'Test Course',
        description: 'Test',
        duration: 20,
        category: 'Test',
        instructorId: 'instructor-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        instructor: {
          id: 'instructor-1',
          name: 'Test',
          email: 'test@test.com',
        },
        _count: {
          enrollments: 10,
        },
      };

      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);

      const result = await service.findAll();

      expect(result[0]._count).toHaveProperty('enrollments');
      expect(result[0]._count.enrollments).toBe(10);
      expect(typeof result[0]._count.enrollments).toBe('number');
    });

    it('should sort courses by createdAt descending', async () => {
      const mockCourses = [
        {
          id: '1',
          title: 'Newest Course',
          description: 'Test',
          duration: 20,
          category: 'Test',
          instructorId: 'instructor-1',
          createdAt: new Date('2025-11-17'),
          updatedAt: new Date(),
          instructor: { id: '1', name: 'Test', email: 'test@test.com' },
          _count: { enrollments: 0 },
        },
        {
          id: '2',
          title: 'Older Course',
          description: 'Test',
          duration: 20,
          category: 'Test',
          instructorId: 'instructor-1',
          createdAt: new Date('2025-11-16'),
          updatedAt: new Date(),
          instructor: { id: '1', name: 'Test', email: 'test@test.com' },
          _count: { enrollments: 0 },
        },
      ];

      mockPrismaService.course.findMany.mockResolvedValue(mockCourses);

      await service.findAll();

      expect(prismaService.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    describe('with search filter', () => {
      it('should filter courses by search keyword in title', async () => {
        const filters: FilterCoursesDto = { search: 'typescript' };
        mockPrismaService.course.findMany.mockResolvedValue([]);

        await service.findAll(filters);

        expect(prismaService.course.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              OR: [
                { title: { contains: 'typescript' } },
                { description: { contains: 'typescript' } },
              ],
            },
          }),
        );
      });

      it('should filter courses by search keyword in description', async () => {
        const filters: FilterCoursesDto = { search: 'learn' };
        const mockCourse = {
          id: '1',
          title: 'Course',
          description: 'Learn programming basics',
          duration: 20,
          category: 'Programming',
          instructorId: 'instructor-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          instructor: { id: 'instructor-1', name: 'Test', email: 'test@test.com' },
          _count: { enrollments: 0 },
        };

        mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);

        const result = await service.findAll(filters);

        expect(result).toHaveLength(1);
        expect(prismaService.course.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              OR: [
                { title: { contains: 'learn' } },
                { description: { contains: 'learn' } },
              ],
            },
          }),
        );
      });

      it('should use contains operator for search (case-insensitive in SQLite)', async () => {
        const filters: FilterCoursesDto = { search: 'TYPESCRIPT' };
        mockPrismaService.course.findMany.mockResolvedValue([]);

        await service.findAll(filters);

        expect(prismaService.course.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  title: expect.objectContaining({ contains: 'TYPESCRIPT' }),
                }),
              ]),
            }),
          }),
        );
      });
    });

    describe('with category filter', () => {
      it('should filter courses by exact category match', async () => {
        const filters: FilterCoursesDto = { category: 'Programming' };
        mockPrismaService.course.findMany.mockResolvedValue([]);

        await service.findAll(filters);

        expect(prismaService.course.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              category: { equals: 'Programming' },
            },
          }),
        );
      });
    });

    describe('with instructor filter', () => {
      it('should filter courses by instructor name (partial match)', async () => {
        const filters: FilterCoursesDto = { instructor: 'Demo' };
        mockPrismaService.course.findMany.mockResolvedValue([]);

        await service.findAll(filters);

        expect(prismaService.course.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              instructor: {
                name: { contains: 'Demo' },
              },
            },
          }),
        );
      });

      it('should use contains operator for instructor filter (case-insensitive in SQLite)', async () => {
        const filters: FilterCoursesDto = { instructor: 'DEMO' };
        mockPrismaService.course.findMany.mockResolvedValue([]);

        await service.findAll(filters);

        expect(prismaService.course.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              instructor: expect.objectContaining({
                name: expect.objectContaining({ contains: 'DEMO' }),
              }),
            }),
          }),
        );
      });
    });

    describe('with duration filters', () => {
      it('should filter courses by minimum duration', async () => {
        const filters: FilterCoursesDto = { minDuration: 10 };
        mockPrismaService.course.findMany.mockResolvedValue([]);

        await service.findAll(filters);

        expect(prismaService.course.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              duration: { gte: 10 },
            },
          }),
        );
      });

      it('should filter courses by maximum duration', async () => {
        const filters: FilterCoursesDto = { maxDuration: 40 };
        mockPrismaService.course.findMany.mockResolvedValue([]);

        await service.findAll(filters);

        expect(prismaService.course.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              duration: { lte: 40 },
            },
          }),
        );
      });

      it('should filter courses by duration range (min and max)', async () => {
        const filters: FilterCoursesDto = { minDuration: 10, maxDuration: 40 };
        mockPrismaService.course.findMany.mockResolvedValue([]);

        await service.findAll(filters);

        expect(prismaService.course.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              duration: {
                gte: 10,
                lte: 40,
              },
            },
          }),
        );
      });

      it('should throw BadRequestException when minDuration > maxDuration', async () => {
        const filters: FilterCoursesDto = { minDuration: 50, maxDuration: 20 };

        await expect(service.findAll(filters)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.findAll(filters)).rejects.toThrow(
          'minDuration cannot be greater than maxDuration',
        );
      });

      it('should allow minDuration = 0', async () => {
        const filters: FilterCoursesDto = { minDuration: 0 };
        mockPrismaService.course.findMany.mockResolvedValue([]);

        await service.findAll(filters);

        expect(prismaService.course.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              duration: { gte: 0 },
            },
          }),
        );
      });
    });

    describe('with combined filters', () => {
      it('should apply multiple filters together (search + category)', async () => {
        const filters: FilterCoursesDto = {
          search: 'typescript',
          category: 'Programming',
        };
        mockPrismaService.course.findMany.mockResolvedValue([]);

        await service.findAll(filters);

        expect(prismaService.course.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              OR: [
                { title: { contains: 'typescript' } },
                { description: { contains: 'typescript' } },
              ],
              category: { equals: 'Programming' },
            },
          }),
        );
      });

      it('should apply all filters together (search + category + instructor + duration)', async () => {
        const filters: FilterCoursesDto = {
          search: 'web',
          category: 'Programming',
          instructor: 'Demo',
          minDuration: 10,
          maxDuration: 40,
        };
        mockPrismaService.course.findMany.mockResolvedValue([]);

        await service.findAll(filters);

        expect(prismaService.course.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              OR: [
                { title: { contains: 'web' } },
                { description: { contains: 'web' } },
              ],
              category: { equals: 'Programming' },
              instructor: {
                name: { contains: 'Demo' },
              },
              duration: {
                gte: 10,
                lte: 40,
              },
            },
          }),
        );
      });
    });

    describe('with no filters (backward compatibility)', () => {
      it('should return all courses when no filters provided', async () => {
        const mockCourses = [
          {
            id: '1',
            title: 'Course 1',
            description: 'Description 1',
            duration: 20,
            category: 'Programming',
            instructorId: 'instructor-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            instructor: { id: 'instructor-1', name: 'Test', email: 'test@test.com' },
            _count: { enrollments: 5 },
          },
          {
            id: '2',
            title: 'Course 2',
            description: 'Description 2',
            duration: 30,
            category: 'Design',
            instructorId: 'instructor-2',
            createdAt: new Date(),
            updatedAt: new Date(),
            instructor: { id: 'instructor-2', name: 'Test 2', email: 'test2@test.com' },
            _count: { enrollments: 3 },
          },
        ];

        mockPrismaService.course.findMany.mockResolvedValue(mockCourses);

        const result = await service.findAll();

        expect(result).toHaveLength(2);
        expect(prismaService.course.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {},
          }),
        );
      });

      it('should return all courses when empty filters object provided', async () => {
        const filters: FilterCoursesDto = {};
        mockPrismaService.course.findMany.mockResolvedValue([]);

        await service.findAll(filters);

        expect(prismaService.course.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {},
          }),
        );
      });
    });

    describe('with no matches', () => {
      it('should return empty array when no courses match filters', async () => {
        const filters: FilterCoursesDto = { search: 'nonexistent' };
        mockPrismaService.course.findMany.mockResolvedValue([]);

        const result = await service.findAll(filters);

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('findOne', () => {
    const mockCourse = {
      id: 'test-uuid-123',
      title: 'Test Course',
      description: 'Test Description',
      duration: 20,
      category: 'Programming',
      instructorId: 'instructor-uuid-1',
      createdAt: new Date('2025-11-17'),
      updatedAt: new Date('2025-11-17'),
      instructor: {
        id: 'instructor-uuid-1',
        name: 'Test Instructor',
        email: 'instructor@test.com',
      },
      _count: {
        enrollments: 5,
      },
    };

    it('should return a course with instructor and enrollment count when found', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      const result = await service.findOne('test-uuid-123');

      expect(result).toEqual(mockCourse);
      expect(prismaService.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-uuid-123' },
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
    });

    it('should include all required course fields', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      const result = await service.findOne('test-uuid-123');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('instructorId');
      expect(result).toHaveProperty('instructor');
      expect(result).toHaveProperty('_count');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should include instructor with id, name, and email only (no password)', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      const result = await service.findOne('test-uuid-123');

      expect(result.instructor).toHaveProperty('id');
      expect(result.instructor).toHaveProperty('name');
      expect(result.instructor).toHaveProperty('email');
      expect(result.instructor).not.toHaveProperty('password');
    });

    it('should include enrollment count', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      const result = await service.findOne('test-uuid-123');

      expect(result._count).toHaveProperty('enrollments');
      expect(result._count.enrollments).toBe(5);
      expect(typeof result._count.enrollments).toBe('number');
    });

    it('should throw NotFoundException when course not found', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        'Course with ID non-existent-uuid not found',
      );
    });

    it('should throw NotFoundException with correct message format', async () => {
      const testId = 'missing-course-uuid';
      mockPrismaService.course.findUnique.mockResolvedValue(null);

      await expect(service.findOne(testId)).rejects.toThrow(
        `Course with ID ${testId} not found`,
      );
    });

    it('should call Prisma findUnique with correct parameters', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      await service.findOne('test-uuid-123');

      expect(prismaService.course.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-uuid-123' },
        include: expect.any(Object),
      });
    });
  });
});
