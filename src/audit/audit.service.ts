import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId: string;
    userName: string;
    userEmail: string;
    actionType: 'CREATED' | 'JOINED' | 'MODIFIED' | 'CANCELLED' | 'ADMIN_CANCELLED' | 'COMPLETED';
    resourceType: 'reservation' | 'space' | 'user';
    resourceId: string;
    details?: object;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.prisma.auditLogEntry.create({
      data: {
        userId: params.userId,
        userName: params.userName,
        userEmail: params.userEmail,
        actionType: params.actionType,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        details: JSON.stringify(params.details || {}),
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  }
}
