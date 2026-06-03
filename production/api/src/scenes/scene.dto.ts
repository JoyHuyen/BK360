import { IsArray, IsBoolean, IsInt, IsNumber, IsObject, IsOptional, IsString, Matches } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateSceneDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug chỉ gồm chữ thường, số và dấu gạch ngang' })
  slug: string;

  @IsObject()
  title: Record<string, any>;

  @IsOptional() @IsString()
  pano?: string;

  @IsOptional() @IsNumber()
  yaw?: number;

  @IsOptional() @IsInt()
  order?: number;

  @IsOptional() @IsBoolean()
  enabled?: boolean;

  /** [{id, yaw, pitch, to, label?}] */
  @IsOptional() @IsArray()
  hotspots?: any[];

  @IsOptional() @IsString()
  locationId?: string | null;

  @IsOptional() @IsString()
  projectId?: string;
}

export class UpdateSceneDto extends PartialType(CreateSceneDto) {}
