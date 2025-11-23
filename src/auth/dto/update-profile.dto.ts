import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Updated user full name',
    example: 'John Updated',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated user email address',
    example: 'newemail@example.com',
    format: 'email',
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}
