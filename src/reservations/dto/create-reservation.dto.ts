import { IsUUID, IsDateString, IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty()
  @IsUUID()
  spaceId!: string;

  @ApiProperty()
  @IsDateString()
  startTime!: string;

  @ApiProperty()
  @IsDateString()
  endTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: ['individual', 'group'] })
  @IsOptional()
  @IsIn(['individual', 'group'])
  type?: 'individual' | 'group';

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  groupSize?: number;

  @ApiPropertyOptional({ enum: ['public', 'private'] })
  @IsOptional()
  @IsIn(['public', 'private'])
  privacyOption?: 'public' | 'private';
}
