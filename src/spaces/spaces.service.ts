import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { FilterSpacesDto } from './dto/filter-spaces.dto';

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  // Story 2.3: List and filter spaces with pagination
  async findAll(filters: FilterSpacesDto) {
    const { page = 1, limit = 10, type, search, floor, minCapacity, equipment } = filters;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (type) where.type = type;
    if (floor) where.floorId = floor;
    if (minCapacity) where.capacity = { gte: minCapacity };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [spaces, total] = await Promise.all([
      this.prisma.space.findMany({
        where,
        skip,
        take: limit,
        include: { floor: { select: { id: true, name: true, building: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.space.count({ where }),
    ]);

    let filteredSpaces = spaces;
    if (equipment) {
      const requiredEquipment = equipment.split(',').map(e => e.trim());
      filteredSpaces = spaces.filter(space => {
        const spaceEquipment = JSON.parse(space.equipment);
        return requiredEquipment.every(req => spaceEquipment.includes(req));
      });
    }

    const parsedSpaces = filteredSpaces.map(space => ({
      ...space,
      equipment: JSON.parse(space.equipment),
      coordinates: JSON.parse(space.coordinates),
      photos: JSON.parse(space.photos),
    }));

    return { data: parsedSpaces, meta: { page, limit, total: equipment ? parsedSpaces.length : total } };
  }

  // Story 2.4: Get space by ID
  async findOne(id: string) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: { floor: { select: { id: true, name: true, building: true, svgPath: true } } },
    });

    if (!space) {
      throw new NotFoundException({ statusCode: 404, message: 'Space not found', error: 'SPACE_NOT_FOUND' });
    }

    return {
      data: {
        ...space,
        equipment: JSON.parse(space.equipment),
        coordinates: JSON.parse(space.coordinates),
        photos: JSON.parse(space.photos),
      },
    };
  }

  // Story 2.5: Get space availability by date
  async getAvailability(id: string, date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException({ statusCode: 400, message: 'Invalid date format. Use YYYY-MM-DD', error: 'INVALID_DATE_FORMAT' });
    }

    const space = await this.prisma.space.findUnique({ where: { id } });
    if (!space) {
      throw new NotFoundException({ statusCode: 404, message: 'Space not found', error: 'SPACE_NOT_FOUND' });
    }

    // Parse the date
    const targetDate = new Date(date + 'T00:00:00');
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Get all reservations for this space on this date
    const reservations = await this.prisma.reservation.findMany({
      where: {
        spaceId: id,
        status: 'confirmed',
        OR: [
          {
            AND: [
              { startTime: { gte: dayStart } },
              { startTime: { lt: dayEnd } },
            ],
          },
          {
            AND: [
              { endTime: { gt: dayStart } },
              { endTime: { lte: dayEnd } },
            ],
          },
          {
            AND: [
              { startTime: { lte: dayStart } },
              { endTime: { gte: dayEnd } },
            ],
          },
        ],
      },
    });

    // Check if space is temporarily unavailable
    const isUnavailable =
      space.unavailabilityStart &&
      space.unavailabilityEnd &&
      new Date(space.unavailabilityStart) <= dayEnd &&
      new Date(space.unavailabilityEnd) >= dayStart;

    // Generate hourly slots from 8 AM to 9 PM (21:00)
    const slots = [];
    for (let hour = 8; hour < 22; hour++) {
      const slotStart = new Date(targetDate);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(targetDate);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Check if this slot overlaps with any reservation
      const isOccupied = reservations.some((reservation) => {
        const resStart = new Date(reservation.startTime);
        const resEnd = new Date(reservation.endTime);
        // Check for overlap
        return resStart < slotEnd && resEnd > slotStart;
      });

      let status = 'AVAILABLE';
      if (isUnavailable) {
        status = 'UNAVAILABLE';
      } else if (isOccupied) {
        status = 'OCCUPIED';
      }

      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        status,
      });
    }

    return { data: { spaceId: id, date, slots } };
  }

  // Story 5.7: Automatic availability status updates
  private readonly logger = new Logger(SpacesService.name);

  @Cron(CronExpression.EVERY_HOUR)
  async updateExpiredUnavailability() {
    const now = new Date();
    
    const result = await this.prisma.space.updateMany({
      where: {
        availabilityStatus: 'UNAVAILABLE',
        unavailabilityEnd: {
          lte: now,
        },
      },
      data: {
        availabilityStatus: 'AVAILABLE',
        unavailabilityReason: null,
        unavailabilityStart: null,
        unavailabilityEnd: null,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Updated ${result.count} space(s) with expired unavailability period`);
    }
  }
}
