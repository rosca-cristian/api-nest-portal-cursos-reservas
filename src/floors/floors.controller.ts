import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FloorsService } from './floors.service';

@ApiTags('Floors')
@Controller('floors')
export class FloorsController {
  constructor(private readonly floorsService: FloorsService) {}

  // Story 2.2: GET /floors - List all floors with optional building filter
  @Get()
  @ApiOperation({
    summary: 'Get all floors',
    description: 'Returns all floors with optional building filter. No authentication required.',
  })
  @ApiQuery({ name: 'building', required: false, description: 'Filter by building name' })
  @ApiResponse({
    status: 200,
    description: 'Floors retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'floor-uuid-1',
            name: 'Floor 1',
            svgPath: '/assets/floors/floor-1.svg',
            building: 'Engineering',
            createdAt: '2025-11-21T10:00:00.000Z',
            updatedAt: '2025-11-21T10:00:00.000Z',
          },
        ],
        meta: {
          total: 1,
        },
      },
    },
  })
  async findAll(@Query('building') building?: string) {
    return this.floorsService.findAll(building);
  }

  // Story 2.2: GET /floors/:id - Get floor by ID
  @Get(':id')
  @ApiOperation({
    summary: 'Get floor by ID',
    description: 'Returns detailed information about a specific floor',
  })
  @ApiResponse({
    status: 200,
    description: 'Floor retrieved successfully',
    schema: {
      example: {
        data: {
          id: 'floor-uuid-1',
          name: 'Floor 1',
          svgPath: '/assets/floors/floor-1.svg',
          building: 'Engineering',
          createdAt: '2025-11-21T10:00:00.000Z',
          updatedAt: '2025-11-21T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Floor not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Floor not found',
        error: 'FLOOR_NOT_FOUND',
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.floorsService.findOne(id);
  }
}
