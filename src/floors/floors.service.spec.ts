import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FloorsService } from './floors.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FloorsService', () => {
  let service: FloorsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    floor: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FloorsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FloorsService>(FloorsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all floors', async () => {
      const mockFloors = [
        {
          id: 'floor-1',
          name: 'Floor 1',
          svgPath: '/assets/floors/floor-1.svg',
          building: 'Engineering',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'floor-2',
          name: 'Floor 2',
          svgPath: '/assets/floors/floor-2.svg',
          building: 'Science',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.floor.findMany.mockResolvedValue(mockFloors);

      const result = await service.findAll();

      expect(result).toEqual({
        data: mockFloors,
        meta: { total: 2 },
      });
      expect(mockPrismaService.floor.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
      });
    });

    it('should filter floors by building', async () => {
      const mockFloors = [
        {
          id: 'floor-1',
          name: 'Floor 1',
          svgPath: '/assets/floors/floor-1.svg',
          building: 'Engineering',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.floor.findMany.mockResolvedValue(mockFloors);

      const result = await service.findAll('Engineering');

      expect(result).toEqual({
        data: mockFloors,
        meta: { total: 1 },
      });
      expect(mockPrismaService.floor.findMany).toHaveBeenCalledWith({
        where: { building: 'Engineering' },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no floors exist', async () => {
      mockPrismaService.floor.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual({
        data: [],
        meta: { total: 0 },
      });
    });
  });

  describe('findOne', () => {
    it('should return floor by ID', async () => {
      const mockFloor = {
        id: 'floor-1',
        name: 'Floor 1',
        svgPath: '/assets/floors/floor-1.svg',
        building: 'Engineering',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.floor.findUnique.mockResolvedValue(mockFloor);

      const result = await service.findOne('floor-1');

      expect(result).toEqual({ data: mockFloor });
      expect(mockPrismaService.floor.findUnique).toHaveBeenCalledWith({
        where: { id: 'floor-1' },
      });
    });

    it('should throw NotFoundException when floor not found', async () => {
      mockPrismaService.floor.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        'Floor not found',
      );
    });

    it('should throw NotFoundException with correct error code', async () => {
      mockPrismaService.floor.findUnique.mockResolvedValue(null);

      try {
        await service.findOne('nonexistent-id');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.response.error).toBe('FLOOR_NOT_FOUND');
      }
    });
  });
});
