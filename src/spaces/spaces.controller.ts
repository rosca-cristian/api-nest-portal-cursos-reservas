import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SpacesService } from './spaces.service';
import { FilterSpacesDto } from './dto/filter-spaces.dto';

@ApiTags('Spaces')
@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get()
  @ApiOperation({ summary: 'List all spaces with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Spaces retrieved successfully' })
  async findAll(@Query() filters: FilterSpacesDto) {
    return this.spacesService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get space by ID' })
  @ApiResponse({ status: 200, description: 'Space retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async findOne(@Param('id') id: string) {
    return this.spacesService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get space availability by date' })
  @ApiResponse({ status: 200, description: 'Availability retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid date format' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async getAvailability(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.spacesService.getAvailability(id, date);
  }
}
