import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class FindAllUsersDto {
  @IsOptional()
  @IsEnum(Role)
  @ApiProperty({
    enum: Role,
    required: false,
    description: 'Filter users by role',
  })
  role?: Role;
}
