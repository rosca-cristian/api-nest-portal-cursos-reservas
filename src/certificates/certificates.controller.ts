import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Get current user's certificates",
    description:
      'Returns all certificates earned by the authenticated user. Certificates are automatically generated when a course is completed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Certificates retrieved successfully',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          courseId: '123e4567-e89b-12d3-a456-426614174002',
          verificationCode: 'CERT-2025-ABCD1234',
          issuedAt: '2025-11-17T15:00:00.000Z',
          course: {
            title: 'JavaScript Fundamentals',
            description: 'Learn the basics of JavaScript',
            duration: 20,
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findMyCertificates(@CurrentUser() user: any) {
    return this.certificatesService.findByUser(user.userId);
  }

  @Get('verify/:code')
  @ApiOperation({
    summary: 'Verify certificate by code (PUBLIC)',
    description:
      'Public endpoint to verify certificate authenticity using verification code. No authentication required. Returns certificate details including user and course information.',
  })
  @ApiParam({
    name: 'code',
    description: 'Certificate verification code (e.g., CERT-2025-ABCD1234)',
    example: 'CERT-2025-ABCD1234',
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate verified successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        courseId: '123e4567-e89b-12d3-a456-426614174002',
        verificationCode: 'CERT-2025-ABCD1234',
        issuedAt: '2025-11-17T15:00:00.000Z',
        user: {
          name: 'John Doe',
          email: 'student@example.com',
        },
        course: {
          title: 'JavaScript Fundamentals',
          description: 'Learn the basics of JavaScript',
          duration: 20,
          instructor: {
            name: 'Jane Smith',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Certificate not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async verify(@Param('code') code: string) {
    return this.certificatesService.verifyByCode(code);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get specific certificate by ID',
    description:
      'Returns details of a specific certificate by ID. Only the certificate owner can access their certificate.',
  })
  @ApiParam({
    name: 'id',
    description: 'Certificate ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate retrieved successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        courseId: '123e4567-e89b-12d3-a456-426614174002',
        verificationCode: 'CERT-2025-ABCD1234',
        issuedAt: '2025-11-17T15:00:00.000Z',
        course: {
          title: 'JavaScript Fundamentals',
          description: 'Learn the basics of JavaScript',
          duration: 20,
          instructor: {
            name: 'Jane Smith',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not certificate owner',
    schema: {
      example: {
        statusCode: 403,
        message: 'You can only access your own certificates',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Certificate not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.certificatesService.findOne(id, user.userId);
  }
}
