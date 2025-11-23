import { Injectable, NotFoundException, GoneException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Story 4.2: Validate invitation token
  async validateToken(token: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { invitationToken: token },
      include: {
        space: true,
        user: { select: { id: true, name: true, email: true } },
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!reservation) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Invalid invitation token',
        error: 'INVALID_TOKEN',
      });
    }

    // Check if invitation is expired (30 days)
    const createdAt = new Date(reservation.createdAt);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceCreation > 30) {
      throw new GoneException({
        statusCode: 410,
        message: 'Invitation has expired (30 days)',
        error: 'EXPIRED',
      });
    }

    // Check if reservation is cancelled or completed
    const isValid = reservation.status === 'confirmed';

    // Check if there's space available
    const currentParticipants = reservation.participants.length;
    const canJoin = isValid && currentParticipants < reservation.space.capacity;

    return {
      data: {
        token,
        reservation: {
          id: reservation.id,
          spaceId: reservation.spaceId,
          userId: reservation.userId,
          startTime: reservation.startTime.toISOString(),
          endTime: reservation.endTime.toISOString(),
          status: reservation.status,
          space: {
            name: reservation.space.name,
            type: reservation.space.type,
            capacity: reservation.space.capacity,
          },
          participants: reservation.participants.map(p => ({
            userId: p.user.id,
            name: p.user.name,
            email: p.user.email,
            role: p.role,
            status: p.status,
          })),
        },
        invitationCreatedAt: createdAt.toISOString(),
        isValid,
        canJoin,
      },
    };
  }

  // Story 4.3: Join reservation via invitation
  async joinReservation(token: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { invitationToken: token },
      include: {
        space: true,
        user: { select: { id: true, name: true, email: true } },
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!reservation) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Invalid invitation token',
        error: 'INVALID_TOKEN',
      });
    }

    // Check if invitation is expired (30 days)
    const createdAt = new Date(reservation.createdAt);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceCreation > 30) {
      throw new GoneException({
        statusCode: 410,
        message: 'Invitation has expired (30 days)',
        error: 'EXPIRED',
      });
    }

    // Check if reservation is not confirmed
    if (reservation.status !== 'confirmed') {
      throw new ConflictException({
        statusCode: 409,
        message: 'Reservation is not active',
        error: 'INVALID_STATE',
      });
    }

    // Check if user is already a participant
    const existingParticipant = reservation.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      throw new ConflictException({
        statusCode: 409,
        message: 'You are already a participant in this reservation',
        error: 'ALREADY_JOINED',
      });
    }

    // Check capacity
    const currentParticipants = reservation.participants.length;
    if (currentParticipants >= reservation.space.capacity) {
      throw new ConflictException({
        statusCode: 409,
        message: 'Reservation is at full capacity',
        error: 'FULL',
      });
    }

    // Create participant record
    await this.prisma.participant.create({
      data: {
        reservationId: reservation.id,
        userId,
        role: 'participant',
        status: 'confirmed',
      },
    });

    // Fetch updated reservation with all participants
    const updatedReservation = await this.prisma.reservation.findUnique({
      where: { id: reservation.id },
      include: {
        space: true,
        user: { select: { id: true, name: true, email: true } },
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    return { data: updatedReservation };
  }
}
