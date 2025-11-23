import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({
    enum: Role,
    description: 'New role for the user',
    example: 'INSTRUCTOR',
  })
  @IsEnum(Role, {
    message: 'Role must be one of: STUDENT, INSTRUCTOR, ADMIN',
  })
  @IsNotEmpty()
  role!: Role;
}
