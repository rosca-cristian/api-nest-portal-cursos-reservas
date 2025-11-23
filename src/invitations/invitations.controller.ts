import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get(':token')
  @ApiOperation({
    summary: 'Validate invitation token',
    description: 'Public endpoint. Validates an invitation token and returns reservation details with availability status.',
  })
  @ApiParam({ name: 'token', description: 'Invitation token UUID' })
  @ApiResponse({ status: 200, description: 'Token validated successfully' })
  @ApiResponse({ status: 404, description: 'Invalid token' })
  @ApiResponse({ status: 410, description: 'Token expired' })
  async validateToken(@Param('token') token: string) {
    return this.invitationsService.validateToken(token);
  }

  @Post(':token/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Join group reservation via invitation',
    description: 'Authenticated endpoint. Allows a user to join a group reservation using an invitation token.',
  })
  @ApiParam({ name: 'token', description: 'Invitation token UUID' })
  @ApiResponse({ status: 200, description: 'Successfully joined reservation' })
  @ApiResponse({ status: 404, description: 'Invalid token' })
  @ApiResponse({ status: 409, description: 'Already joined or reservation full' })
  @ApiResponse({ status: 410, description: 'Token expired' })
  async joinReservation(@Param('token') token: string, @CurrentUser() user: any) {
    return this.invitationsService.joinReservation(token, user.id);
  }
}
