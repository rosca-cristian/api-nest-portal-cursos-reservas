import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ReservationsService } from './reservations/reservations.service';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get real-time space availability',
    description: 'Public endpoint. Returns availability status for all spaces at a specific time.',
  })
  @ApiQuery({ name: 'datetime', required: false, description: 'ISO 8601 datetime (defaults to now)' })
  @ApiResponse({ status: 200, description: 'Availability retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid datetime format' })
  async getAvailability(@Query('datetime') datetime?: string) {
    return this.reservationsService.getAvailability(datetime);
  }
}
