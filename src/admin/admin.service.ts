import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) { }

  async getPlatformStats() {
    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    const students =
      usersByRole.find((u: { role: string; _count: number }) => u.role === 'STUDENT')?._count || 0;
    const instructors =
      usersByRole.find((u: { role: string; _count: number }) => u.role === 'INSTRUCTOR')?._count || 0;
    const admins = usersByRole.find((u: { role: string; _count: number }) => u.role === 'ADMIN')?._count || 0;
    const totalUsers = students + instructors + admins;

    const totalCourses = await this.prisma.course.count();

    const totalEnrollments = await this.prisma.enrollment.count();
    const completedEnrollments = await this.prisma.enrollment.count({
      where: { status: 'COMPLETED' },
    });

    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100 * 100) /
        100
        : 0;

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await this.prisma.user.count({
      where: { createdAt: { gte: firstDayOfMonth } },
    });

    const newCoursesThisMonth = await this.prisma.course.count({
      where: { createdAt: { gte: firstDayOfMonth } },
    });

    return {
      users: {
        total: totalUsers,
        students,
        instructors,
        admins,
      },
      courses: {
        total: totalCourses,
      },
      enrollments: {
        total: totalEnrollments,
        completed: completedEnrollments,
        completionRate: completionRate,
      },
      growth: {
        newUsersThisMonth,
        newCoursesThisMonth,
      },
    };
  }

  async checkHealth() {
    const timestamp = new Date().toISOString();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'operational',
        database: 'connected',
        timestamp,
      };
    } catch (error) {
      throw new Error('Database connection test failed');
    }
  }

  // Story 5.1: Get space reservation system stats
  async getSpaceReservationStats() {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const totalSpaces = await this.prisma.space.count();

    const activeReservations = await this.prisma.reservation.count({
      where: {
        status: 'confirmed',
        endTime: { gte: now },
      },
    });

    const todayBookings = await this.prisma.reservation.count({
      where: {
        status: 'confirmed',
        startTime: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
    });

    return {
      totalSpaces,
      activeReservations,
      todayBookings,
    };
  }

  // Story 5.2: List all spaces for admin
  async getAllSpaces() {
    const spaces = await this.prisma.space.findMany({
      include: {
        floor: { select: { id: true, name: true, building: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields
    const parsedSpaces = spaces.map(space => ({
      ...space,
      equipment: JSON.parse(space.equipment),
      coordinates: JSON.parse(space.coordinates),
      photos: JSON.parse(space.photos),
    }));

    return {
      data: parsedSpaces,
      meta: { total: spaces.length },
    };
  }
  // Story 5.3: Create new space
  async createSpace(dto: any) {
    const space = await this.prisma.space.create({
      data: {
        name: dto.name,
        type: dto.type,
        capacity: dto.capacity,
        minCapacity: dto.minCapacity,
        equipment: JSON.stringify(dto.equipment),
        coordinates: JSON.stringify(dto.coordinates),
        photos: JSON.stringify(dto.photos || []),
        description: dto.description,
        floorId: dto.floorId,
        availabilityStatus: 'AVAILABLE',
      },
      include: {
        floor: { select: { id: true, name: true, building: true } },
      },
    });

    // Parse JSON fields for response
    return {
      data: {
        ...space,
        equipment: JSON.parse(space.equipment),
        coordinates: JSON.parse(space.coordinates),
        photos: JSON.parse(space.photos),
      },
    };
  }

  // Story 5.4: Update space
  async updateSpace(id: string, dto: any) {
    const space = await this.prisma.space.findUnique({ where: { id } });
    if (!space) {
      throw new Error('Space not found');
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.type) updateData.type = dto.type;
    if (dto.capacity) updateData.capacity = dto.capacity;
    if (dto.minCapacity) updateData.minCapacity = dto.minCapacity;
    if (dto.equipment) updateData.equipment = JSON.stringify(dto.equipment);
    if (dto.photos) updateData.photos = JSON.stringify(dto.photos);
    if (dto.description) updateData.description = dto.description;
    if (dto.floorId) updateData.floorId = dto.floorId;
    if (dto.availabilityStatus) updateData.availabilityStatus = dto.availabilityStatus;
    if (dto.coordinates) updateData.coordinates = JSON.stringify(dto.coordinates);

    const updated = await this.prisma.space.update({
      where: { id },
      data: updateData,
      include: { floor: { select: { id: true, name: true, building: true } } },
    });

    return {
      data: {
        ...updated,
        equipment: JSON.parse(updated.equipment),
        coordinates: JSON.parse(updated.coordinates),
        photos: JSON.parse(updated.photos),
      },
    };
  }

  // Story 5.5: Update space coordinates
  async updateCoordinates(id: string, dto: any) {
    const space = await this.prisma.space.findUnique({ where: { id } });
    if (!space) {
      throw new Error('Space not found');
    }

    const currentCoords = JSON.parse(space.coordinates);
    const updatedCoords = {
      ...currentCoords,
      boundingBox: {
        x: dto.x,
        y: dto.y,
        width: dto.width,
        height: dto.height,
      },
    };

    const updated = await this.prisma.space.update({
      where: { id },
      data: { coordinates: JSON.stringify(updatedCoords) },
      include: { floor: { select: { id: true, name: true, building: true } } },
    });

    return {
      data: {
        ...updated,
        equipment: JSON.parse(updated.equipment),
        coordinates: JSON.parse(updated.coordinates),
        photos: JSON.parse(updated.photos),
      },
    };
  }

  // Story 5.7: Get all floors
  async getAllFloors() {
    const floors = await this.prisma.floor.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const parsedFloors = floors.map(floor => ({
      ...floor,
      dimensions: floor.dimensions ? JSON.parse(floor.dimensions) : undefined,
    }));

    return {
      data: parsedFloors,
      meta: { total: floors.length },
    };
  }

  // Story 5.7: Create new floor
  async createFloor(dto: any) {
    const floor = await this.prisma.floor.create({
      data: {
        name: dto.name,
        svgPath: dto.svgPath || '',
        imageUrl: dto.imageUrl,
        dimensions: dto.dimensions ? JSON.stringify(dto.dimensions) : undefined,
        building: dto.building,
      },
    });

    return {
      data: {
        ...floor,
        dimensions: floor.dimensions ? JSON.parse(floor.dimensions) : undefined,
      },
    };
  }

  // Story 5.8: Update floor
  async updateFloor(id: string, dto: any) {
    const floor = await this.prisma.floor.findUnique({ where: { id } });
    if (!floor) {
      throw new Error('Floor not found');
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.svgPath !== undefined) updateData.svgPath = dto.svgPath;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.dimensions) updateData.dimensions = JSON.stringify(dto.dimensions);
    if (dto.building !== undefined) updateData.building = dto.building;

    const updated = await this.prisma.floor.update({
      where: { id },
      data: updateData,
    });

    return {
      data: {
        ...updated,
        dimensions: updated.dimensions ? JSON.parse(updated.dimensions) : undefined,
      },
    };
  }

  // Story 5.6: Mark space unavailable
  async markUnavailable(id: string, dto: any) {
    const space = await this.prisma.space.findUnique({ where: { id } });
    if (!space) {
      throw new Error('Space not found');
    }

    const updated = await this.prisma.space.update({
      where: { id },
      data: {
        availabilityStatus: 'UNAVAILABLE',
        unavailabilityReason: dto.reason,
        unavailabilityStart: new Date(dto.startDate),
        unavailabilityEnd: dto.endDate ? new Date(dto.endDate) : null,
      },
      include: { floor: { select: { id: true, name: true, building: true } } },
    });

    return {
      data: {
        ...updated,
        equipment: JSON.parse(updated.equipment),
        coordinates: JSON.parse(updated.coordinates),
        photos: JSON.parse(updated.photos),
      },
    };
  }

  // Story 5.6: Mark space available
  async markAvailable(id: string) {
    const space = await this.prisma.space.findUnique({ where: { id } });
    if (!space) {
      throw new Error('Space not found');
    }

    const updated = await this.prisma.space.update({
      where: { id },
      data: {
        availabilityStatus: 'AVAILABLE',
        unavailabilityReason: null,
        unavailabilityStart: null,
        unavailabilityEnd: null,
      },
      include: { floor: { select: { id: true, name: true, building: true } } },
    });

    return {
      data: {
        ...updated,
        equipment: JSON.parse(updated.equipment),
        coordinates: JSON.parse(updated.coordinates),
        photos: JSON.parse(updated.photos),
      },
    };
  }

  // Story 6.1: List all reservations for admin
  async getAllReservations(filters: any) {
    const { page = 1, limit = 50, dateFrom, dateTo, spaceId, user, status } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by date range
    if (dateFrom || dateTo) {
      where.AND = [];
      if (dateFrom) where.AND.push({ startTime: { gte: new Date(dateFrom) } });
      if (dateTo) where.AND.push({ startTime: { lte: new Date(dateTo) } });
    }

    // Filter by space
    if (spaceId) {
      where.spaceId = spaceId;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by user (name or email)
    if (user) {
      where.user = {
        OR: [
          { name: { contains: user } },
          { email: { contains: user } },
        ],
      };
    }

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          space: { select: { id: true, name: true, type: true, capacity: true, floor: { select: { name: true } } } },
          participants: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      data: reservations,
      meta: { page, limit, total },
    };
  }

  // Story 6.2: Cancel reservation as admin
  async cancelReservation(id: string, dto: any) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status === 'cancelled') {
      throw new Error('Reservation is already cancelled');
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledBy: 'admin',
        cancellationReason: dto.reason,
        cancellationNotes: dto.notes || null,
        updatedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        space: { select: { id: true, name: true, type: true } },
      },
    });

    return {
      data: updated,
      meta: { message: 'Reservation cancelled successfully by admin' },
    };
  }

  // Story 6.3: Get reservation detail for admin
  async getReservationDetail(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        space: {
          select: {
            id: true,
            name: true,
            type: true,
            capacity: true,
            floor: { select: { id: true, name: true, building: true } },
          },
        },
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';

    return {
      data: {
        ...reservation,
        invitationInfo: reservation.invitationToken
          ? {
            token: reservation.invitationToken,
            link: `${appBaseUrl}/invite/${reservation.invitationToken}`,
            createdAt: reservation.createdAt,
          }
          : null,
        cancellationInfo: reservation.cancelledBy
          ? {
            cancelledBy: reservation.cancelledBy,
            reason: reservation.cancellationReason,
            notes: reservation.cancellationNotes,
          }
          : null,
      },
    };
  }

  // Story 6.4: Export reservations to CSV
  async exportReservations(filters: any) {
    const { dateFrom, dateTo, spaceId, user, status } = filters;

    const where: any = {};

    if (dateFrom || dateTo) {
      where.AND = [];
      if (dateFrom) where.AND.push({ startTime: { gte: new Date(dateFrom) } });
      if (dateTo) where.AND.push({ startTime: { lte: new Date(dateTo) } });
    }

    if (spaceId) {
      where.spaceId = spaceId;
    }

    if (status) {
      where.status = status;
    }

    if (user) {
      where.user = {
        OR: [
          { name: { contains: user } },
          { email: { contains: user } },
        ],
      };
    }

    const reservations = await this.prisma.reservation.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        space: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const csvHeader = 'ID,User Name,User Email,Space Name,Start Time,End Time,Status,Created At\n';
    const csvRows = reservations
      .map(
        (r) =>
          `${r.id},"${r.user.name}","${r.user.email}","${r.space.name}",${r.startTime.toISOString()},${r.endTime.toISOString()},${r.status},${r.createdAt.toISOString()}`,
      )
      .join('\n');
    const csv = csvHeader + csvRows;

    return csv;
  }

  // Story 7.3: Query audit log
  async getAuditLog(filters: any) {
    const { page = 1, limit = 50, dateFrom, dateTo, actionType, user } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by date range
    if (dateFrom || dateTo) {
      where.AND = [];
      if (dateFrom) where.AND.push({ timestamp: { gte: new Date(dateFrom) } });
      if (dateTo) where.AND.push({ timestamp: { lte: new Date(dateTo) } });
    }

    // Filter by action type
    if (actionType) {
      where.actionType = actionType;
    }

    // Filter by user (name or email)
    if (user) {
      where.OR = [
        { userName: { contains: user } },
        { userEmail: { contains: user } },
      ];
    }

    const [entries, total] = await Promise.all([
      this.prisma.auditLogEntry.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLogEntry.count({ where }),
    ]);

    // Parse details JSON field
    const parsedEntries = entries.map(entry => ({
      ...entry,
      details: JSON.parse(entry.details),
    }));

    return {
      data: parsedEntries,
      meta: { page, limit, total },
    };
  }

  // Story 7.4: Get utilization analytics
  async getUtilizationAnalytics() {
    // Calculate total reservations
    const totalReservations = await this.prisma.reservation.count({
      where: { status: 'confirmed' },
    });

    // Calculate total users
    const totalUsers = await this.prisma.user.count();

    // Get space count
    const totalSpaces = await this.prisma.space.count();

    // Get reservations grouped by space
    const reservationsBySpace = await this.prisma.reservation.groupBy({
      by: ['spaceId'],
      _count: { id: true },
      where: { status: 'confirmed' },
      orderBy: { _count: { id: 'desc' } },
    });

    // Get top 5 popular spaces
    const popularSpaceIds = reservationsBySpace.slice(0, 5).map(r => r.spaceId);
    const popularSpacesDetails = await this.prisma.space.findMany({
      where: { id: { in: popularSpaceIds } },
      select: {
        id: true,
        name: true,
        type: true,
        capacity: true,
        floor: { select: { name: true } },
      },
    });

    const popularSpaces = reservationsBySpace.slice(0, 5).map(r => {
      const space = popularSpacesDetails.find(s => s.id === r.spaceId);
      return {
        space,
        reservationCount: r._count.id,
        utilizationRate: totalSpaces > 0 ? (r._count.id / totalReservations) * 100 : 0,
      };
    });

    // Find most popular space
    const mostPopularSpace = popularSpaces.length > 0 ? popularSpaces[0].space : null;

    // Calculate utilization rate (simplified: total reservations / total spaces)
    const utilizationRate = totalSpaces > 0 ? (totalReservations / totalSpaces) : 0;

    // Find underutilized spaces (< 30% of average utilization)
    const averageReservationsPerSpace = totalSpaces > 0 ? totalReservations / totalSpaces : 0;
    const underutilizedThreshold = averageReservationsPerSpace * 0.3;

    const allSpaceReservations = new Map(
      reservationsBySpace.map(r => [r.spaceId, r._count.id])
    );

    const allSpaces = await this.prisma.space.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        capacity: true,
        floor: { select: { name: true } },
      },
    });

    const underutilizedSpaces = allSpaces
      .filter(space => {
        const count = allSpaceReservations.get(space.id) || 0;
        return count < underutilizedThreshold;
      })
      .map(space => ({
        space,
        reservationCount: allSpaceReservations.get(space.id) || 0,
        utilizationRate: averageReservationsPerSpace > 0
          ? ((allSpaceReservations.get(space.id) || 0) / averageReservationsPerSpace) * 100
          : 0,
      }));

    return {
      data: {
        totalReservations,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        mostPopularSpace,
        totalUsers,
        popularSpaces,
        underutilizedSpaces,
      },
    };
  }
}
