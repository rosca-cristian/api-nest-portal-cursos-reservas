import { ApiProperty } from '@nestjs/swagger';

export class InstructorDto {
  @ApiProperty({ description: 'User ID of the instructor' })
  id!: string;

  @ApiProperty({ description: 'Instructor name' })
  name!: string;

  @ApiProperty({ description: 'Instructor email' })
  email!: string;
}

export class CourseResponseDto {
  @ApiProperty({ description: 'Course ID' })
  id!: string;

  @ApiProperty({ description: 'Course title' })
  title!: string;

  @ApiProperty({ description: 'Course description' })
  description!: string;

  @ApiProperty({ description: 'Duration in hours' })
  duration!: number;

  @ApiProperty({ description: 'Course category' })
  category!: string;

  @ApiProperty({ description: 'Instructor user ID' })
  instructorId!: string;

  @ApiProperty({ type: InstructorDto, description: 'Instructor information' })
  instructor!: InstructorDto;

  @ApiProperty({ description: 'Number of enrollments' })
  enrollmentCount!: number;

  @ApiProperty({ description: 'Course creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Course last update timestamp' })
  updatedAt!: Date;
}
