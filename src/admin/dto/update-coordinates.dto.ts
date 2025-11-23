import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCoordinatesDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  x!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  y!: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  width!: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  height!: number;
}
