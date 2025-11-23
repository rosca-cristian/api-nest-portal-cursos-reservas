import { IsString, IsNotEmpty, IsInt, Min, IsArray, IsObject, IsUUID, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSpaceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: ['desk', 'group-room'] })
  @IsIn(['desk', 'group-room'])
  type!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  minCapacity!: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  equipment!: string[];

  @ApiProperty({
    example: {
      svgPathId: 'space-1',
      boundingBox: { x: 100, y: 100, width: 50, height: 50 },
      rotation: 0,
      config: { chairs: 4, chairsPosition: 'vertical', hasComputer: false }
    }
  })
  @IsObject()
  coordinates!: {
    svgPathId: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    rotation?: number;
    config?: {
      chairs?: number;
      chairsPosition?: string;
      hasComputer?: boolean;
    };
  };

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  photos?: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty()
  @IsUUID()
  floorId!: string;
}
