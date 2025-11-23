import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FloorsService {
  constructor(private readonly prisma: PrismaService) {}

  // Story 2.2: Get all floors with optional building filter
  async findAll(building?: string) {
    const where = building ? { building } : {};

    const floors = await this.prisma.floor.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    return {
      data: floors,
      meta: {
        total: floors.length,
      },
    };
  }

  // Story 2.2: Get floor by ID
  async findOne(id: string) {
    const floor = await this.prisma.floor.findUnique({
      where: { id },
    });

    if (!floor) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Floor not found',
        error: 'FLOOR_NOT_FOUND',
      });
    }

    return { data: floor };
  }
}
