import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterCoursesDto {
  @ApiPropertyOptional({
    description: 'Search keyword for title and description (case-insensitive)',
    example: 'typescript',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by course category (exact match)',
    example: 'Programming',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by instructor name (partial match, case-insensitive)',
    example: 'Demo',
  })
  @IsOptional()
  @IsString()
  instructor?: string;

  @ApiPropertyOptional({
    description: 'Minimum course duration in hours',
    example: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minDuration?: number;

  @ApiPropertyOptional({
    description: 'Maximum course duration in hours',
    example: 40,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxDuration?: number;
}
