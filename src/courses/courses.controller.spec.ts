import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: CoursesService;

  const mockCoursesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
    service = module.get<CoursesService>(CoursesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of courses', async () => {
      const mockCourses = [
        {
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
            enrollments: 5,
          },
        },
      ];

      mockCoursesService.findAll.mockResolvedValue(mockCourses);

      const result = await controller.findAll();

      expect(result).toEqual(mockCourses);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no courses exist', async () => {
      mockCoursesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should call service.findAll()', async () => {
      mockCoursesService.findAll.mockResolvedValue([]);

      await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockCoursesService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(
        'Database connection failed',
      );
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
      createdAt: new Date(),
      updatedAt: new Date(),
      instructor: {
        id: 'instructor-uuid-1',
        name: 'Test Instructor',
        email: 'instructor@test.com',
      },
      _count: {
        enrollments: 5,
      },
    };

    it('should return a course by id', async () => {
      mockCoursesService.findOne.mockResolvedValue(mockCourse);

      const result = await controller.findOne('test-uuid-123');

      expect(result).toEqual(mockCourse);
      expect(service.findOne).toHaveBeenCalledWith('test-uuid-123');
    });

    it('should call service.findOne() with correct id', async () => {
      mockCoursesService.findOne.mockResolvedValue(mockCourse);

      await controller.findOne('test-uuid-123');

      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(service.findOne).toHaveBeenCalledWith('test-uuid-123');
    });

    it('should return course with all required fields', async () => {
      mockCoursesService.findOne.mockResolvedValue(mockCourse);

      const result = await controller.findOne('test-uuid-123');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('instructor');
      expect(result).toHaveProperty('_count');
    });

    it('should propagate NotFoundException from service', async () => {
      mockCoursesService.findOne.mockRejectedValue(
        new NotFoundException('Course with ID non-existent-uuid not found'),
      );

      await expect(controller.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne('non-existent-uuid')).rejects.toThrow(
        'Course with ID non-existent-uuid not found',
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockCoursesService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('test-uuid-123')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
