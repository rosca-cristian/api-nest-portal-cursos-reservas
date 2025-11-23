import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Course title',
    example: 'JavaScript Fundamentals',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Course description',
    example: 'Learn the fundamentals of JavaScript programming',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'Course duration in hours',
    example: 10,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  duration!: number;

  @ApiProperty({
    description: 'Course category',
    example: 'web',
  })
  @IsString()
  @IsNotEmpty()
  category!: string;
}
