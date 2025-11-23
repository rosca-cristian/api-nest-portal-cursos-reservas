import { IsString, IsNotEmpty, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class DimensionsDto {
    @ApiProperty()
    @IsNotEmpty()
    width!: number;

    @ApiProperty()
    @IsNotEmpty()
    height!: number;
}

export class CreateFloorDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    svgPath?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @ValidateNested()
    @Type(() => DimensionsDto)
    dimensions?: DimensionsDto;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    building?: string;
}
