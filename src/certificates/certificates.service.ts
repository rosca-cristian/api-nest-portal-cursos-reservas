import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  async generate(enrollmentId: string) {
    const code = uuidv4();

    const certificate = await this.prisma.certificate.create({
      data: {
        code,
        enrollmentId,
        issuedAt: new Date(),
      },
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            course: {
              include: {
                instructor: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return certificate;
  }

  async findByUser(userId: string) {
    const certificates = await this.prisma.certificate.findMany({
      where: {
        enrollment: {
          userId,
        },
      },
      include: {
        enrollment: {
          include: {
            course: {
              include: {
                instructor: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    return certificates.map((cert: any) => ({
      id: cert.id,
      code: cert.code,
      issuedAt: cert.issuedAt,
      course: {
        id: cert.enrollment.course.id,
        title: cert.enrollment.course.title,
        instructor: cert.enrollment.course.instructor.name,
      },
      enrollment: {
        enrolledAt: cert.enrollment.enrolledAt,
        completedAt: cert.enrollment.completedAt,
      },
    }));
  }

  async findOne(id: string, userId: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id },
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            course: {
              include: {
                instructor: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    if (certificate.enrollment.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this certificate');
    }

    return {
      id: certificate.id,
      code: certificate.code,
      issuedAt: certificate.issuedAt,
      recipient: {
        name: certificate.enrollment.user.name,
        email: certificate.enrollment.user.email,
      },
      course: {
        id: certificate.enrollment.course.id,
        title: certificate.enrollment.course.title,
        instructor: certificate.enrollment.course.instructor.name,
      },
      enrollment: {
        enrolledAt: certificate.enrollment.enrolledAt,
        completedAt: certificate.enrollment.completedAt,
      },
    };
  }

  async verifyByCode(code: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { code },
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
            course: {
              include: {
                instructor: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return {
      valid: true,
      code: certificate.code,
      recipientName: certificate.enrollment.user.name,
      courseTitle: certificate.enrollment.course.title,
      instructorName: certificate.enrollment.course.instructor.name,
      completedAt: certificate.enrollment.completedAt,
      issuedAt: certificate.issuedAt,
    };
  }
}
