import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsIn,
  IsOptional,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'student@example.com',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'User password (will be hashed with bcrypt)',
    example: 'SecurePass123!',
    minLength: 8,
    format: 'password',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  // Story 1.3: Space Reservation System fields
  @ApiProperty({
    description: 'User role in the system',
    example: 'student',
    enum: ['student', 'faculty', 'admin'],
  })
  @IsString()
  @IsIn(['student', 'faculty', 'admin'], {
    message: 'role must be one of: student, faculty, admin',
  })
  @IsNotEmpty()
  role!: string;

  @ApiPropertyOptional({
    description: 'Student major (required for students)',
    example: 'Computer Science',
  })
  @ValidateIf((o) => o.role === 'student')
  @IsNotEmpty({ message: 'major is required for students' })
  @IsString()
  major?: string;

  @ApiPropertyOptional({
    description: 'Department (required for faculty/admin)',
    example: 'Engineering',
  })
  @ValidateIf((o) => o.role === 'faculty' || o.role === 'admin')
  @IsNotEmpty({ message: 'department is required for faculty/admin' })
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'Profile photo URL',
    example: 'https://example.com/photo.jpg',
  })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}
