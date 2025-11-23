import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { FilterReservationsDto } from './dto/filter-reservations.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  // Story 3.2 & 4.1: Create individual or group reservation
  async create(userId: string, dto: CreateReservationDto) {
    const { spaceId, startTime, endTime, notes, type, groupSize } = dto;
    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) throw new NotFoundException({ statusCode: 404, message: 'Space not found', error: 'SPACE_NOT_FOUND' });

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) throw new BadRequestException({ statusCode: 400, message: 'Start time must be before end time', error: 'INVALID_TIME_RANGE' });

    // Story 4.1: Validate capacity for group reservations
    const isGroupReservation = type === 'group';
    if (isGroupReservation) {
      if (!groupSize) {
        throw new BadRequestException({ statusCode: 400, message: 'Group size is required for group reservations', error: 'VALIDATION_ERROR' });
      }
      if (groupSize < space.minCapacity) {
        throw new BadRequestException({ statusCode: 400, message: `This room requires at least ${space.minCapacity} participants`, error: 'INSUFFICIENT_GROUP_SIZE' });
      }
      if (groupSize > space.capacity) {
        throw new BadRequestException({ statusCode: 400, message: `This room has a maximum capacity of ${space.capacity}`, error: 'EXCEEDS_MAX_CAPACITY' });
      }
    }

    // Check for existing reservations in the same time slot
    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        spaceId,
        status: 'confirmed',
        OR: [
          { AND: [{ startTime: { lte: start } }, { endTime: { gt: start } }] },
          { AND: [{ startTime: { lt: end } }, { endTime: { gte: end } }] },
          { AND: [{ startTime: { gte: start } }, { endTime: { lte: end } }] },
        ],
      },
    });

    // Calculate current occupancy
    // Note: Assuming each existing reservation takes 1 seat for now. 
    // Ideally we should store seatCount in Reservation model.
    const currentOccupancy = existingReservations.length;
    const requestedSeats = isGroupReservation ? (groupSize || 1) : 1;

    if (currentOccupancy + requestedSeats > space.capacity) {
      throw new ConflictException({ statusCode: 409, message: 'Not enough seats available', error: 'BOOKING_CONFLICT' });
    }

    const userConflict = await this.prisma.reservation.findFirst({
      where: {
        userId,
        status: 'confirmed',
        OR: [
          { AND: [{ startTime: { lte: start } }, { endTime: { gt: start } }] },
          { AND: [{ startTime: { lt: end } }, { endTime: { gte: end } }] },
          { AND: [{ startTime: { gte: start } }, { endTime: { lte: end } }] },
        ],
      },
      include: { space: true },
    });
    if (userConflict) throw new ConflictException({ statusCode: 409, message: 'You already have a reservation at this time', error: 'BOOKING_CONFLICT' });

    // Story 4.1: Generate invitation token for group reservations
    const invitationToken = isGroupReservation ? randomUUID() : null;

    // Create reservation with invitation token if group
    const reservation = await this.prisma.reservation.create({
      data: {
        spaceId,
        userId,
        startTime: start,
        endTime: end,
        notes,
        invitationToken,
      },
      include: { space: true, participants: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });

    // Story 4.1: Create organizer participant for group reservations
    if (isGroupReservation && invitationToken) {
      await this.prisma.participant.create({
        data: {
          reservationId: reservation.id,
          userId,
          role: 'organizer',
          status: 'confirmed',
        },
      });

      // Fetch updated reservation with participants
      const updatedReservation = await this.prisma.reservation.findUnique({
        where: { id: reservation.id },
        include: { space: true, participants: { include: { user: { select: { id: true, name: true, email: true } } } } },
      });

      // Story 4.1: Return invitation link
      const appBaseUrl = this.configService.get<string>('APP_BASE_URL', 'http://localhost:3000');
      const invitationLink = `${appBaseUrl}/invite/${invitationToken}`;

      return { data: { ...updatedReservation, invitationLink } };
    }

    return { data: reservation };
  }

  // Story 3.3: List user reservations
  async findAll(userId: string, filters: FilterReservationsDto) {
    const { page = 1, limit = 10, status, startDate, endDate } = filters;
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.AND = [];
      if (startDate) where.AND.push({ startTime: { gte: new Date(startDate) } });
      if (endDate) where.AND.push({ endTime: { lte: new Date(endDate) } });
    }

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        include: { space: true, participants: { include: { user: { select: { id: true, name: true, email: true } } } } },
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.reservation.count({ where }),
    ]);
    return { data: reservations, meta: { page, limit, total } };
  }

  // Story 3.4: Get reservation by ID
  async findOne(id: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { space: true, participants: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    if (!reservation) throw new NotFoundException({ statusCode: 404, message: 'Reservation not found', error: 'RESERVATION_NOT_FOUND' });
    if (reservation.userId !== userId) throw new ForbiddenException({ statusCode: 403, message: 'Access denied', error: 'FORBIDDEN' });
    return { data: reservation };
  }

  // Story 3.4: Cancel reservation
  async cancel(id: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException({ statusCode: 404, message: 'Reservation not found', error: 'RESERVATION_NOT_FOUND' });
    if (reservation.userId !== userId) throw new ForbiddenException({ statusCode: 403, message: 'Access denied', error: 'FORBIDDEN' });
    if (reservation.status === 'cancelled') throw new BadRequestException({ statusCode: 400, message: 'Already cancelled', error: 'ALREADY_CANCELLED' });
    if (reservation.status === 'completed') throw new BadRequestException({ statusCode: 400, message: 'Cannot cancel completed', error: 'CANNOT_CANCEL_COMPLETED' });

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status: 'cancelled', cancelledBy: 'user' },
      include: { space: true, participants: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'asc' } } },
    });
    return { data: updated };
  }

  // Story 3.5: Real-time availability
  async getAvailability(datetime?: string) {
    const queryTime = datetime ? new Date(datetime) : new Date();
    if (datetime && isNaN(queryTime.getTime())) throw new BadRequestException({ statusCode: 400, message: 'Invalid datetime', error: 'INVALID_DATETIME' });

    const spaces = await this.prisma.space.findMany({
      include: { reservations: { where: { status: 'confirmed', startTime: { lte: queryTime }, endTime: { gt: queryTime } } } },
    });

    const availability = spaces.map(space => {
      if (space.unavailabilityStart && space.unavailabilityEnd) {
        const unavailStart = new Date(space.unavailabilityStart);
        const unavailEnd = new Date(space.unavailabilityEnd);
        if (queryTime >= unavailStart && queryTime <= unavailEnd) {
          return { spaceId: space.id, status: 'UNAVAILABLE', reason: space.unavailabilityReason || 'Maintenance' };
        }
      }

      const occupiedSeats = space.reservations.length;
      if (occupiedSeats >= space.capacity) {
        return { spaceId: space.id, status: 'OCCUPIED', nextAvailable: new Date(space.reservations[0].endTime).toISOString() };
      }

      return {
        spaceId: space.id,
        status: 'AVAILABLE',
        availableSeats: space.capacity - occupiedSeats,
        totalSeats: space.capacity
      };
    });

    return { data: { datetime: queryTime.toISOString(), spaces: availability } };
  }

  // Story 4.4: Remove participant from group reservation
  async removeParticipant(reservationId: string, participantId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        space: true,
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!reservation) {
      throw new NotFoundException({ statusCode: 404, message: 'Reservation not found', error: 'RESERVATION_NOT_FOUND' });
    }

    // Check if it's a group reservation
    if (!reservation.invitationToken) {
      throw new BadRequestException({ statusCode: 400, message: 'This is not a group reservation', error: 'VALIDATION_ERROR' });
    }

    // Find the organizer
    const organizer = reservation.participants.find(p => p.role === 'organizer');
    if (!organizer) {
      throw new BadRequestException({ statusCode: 400, message: 'No organizer found', error: 'VALIDATION_ERROR' });
    }

    // Check if current user is the organizer
    if (organizer.userId !== userId) {
      throw new ForbiddenException({ statusCode: 403, message: 'Only the organizer can remove participants', error: 'FORBIDDEN' });
    }

    // Find the participant to remove
    const participantToRemove = reservation.participants.find(p => p.id === participantId);
    if (!participantToRemove) {
      throw new BadRequestException({ statusCode: 400, message: 'Participant not found in this reservation', error: 'VALIDATION_ERROR' });
    }

    // Check if trying to remove the organizer
    if (participantToRemove.role === 'organizer') {
      throw new BadRequestException({ statusCode: 400, message: 'Cannot remove the organizer from the reservation', error: 'VALIDATION_ERROR' });
    }

    // Delete the participant
    await this.prisma.participant.delete({
      where: { id: participantId },
    });

    // Fetch updated reservation
    const updatedReservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        space: true,
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    return { data: updatedReservation };
  }
}
