import { IsString, IsInt, Min, IsArray, IsOptional, IsUUID, IsIn, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSpaceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ['desk', 'group-room'] })
  @IsOptional()
  @IsIn(['desk', 'group-room'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  minCapacity?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  equipment?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  photos?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  floorId?: string;

  @ApiPropertyOptional({ enum: ['AVAILABLE', 'OCCUPIED', 'UNAVAILABLE'] })
  @IsOptional()
  @IsIn(['AVAILABLE', 'OCCUPIED', 'UNAVAILABLE'])
  availabilityStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  coordinates?: {
    svgPathId: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    rotation?: number;
    config?: {
      chairs?: number;
      chairsPosition?: string;
      hasComputer?: boolean;
    };
  };
}
