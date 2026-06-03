import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { LocationType } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';

export class CreateLocationDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug chỉ gồm chữ thường, số và dấu gạch ngang' })
  slug: string;

  @IsOptional() @IsEnum(LocationType)
  type?: LocationType;

  @IsOptional() @IsInt()
  mapX?: number;

  @IsOptional() @IsInt()
  mapY?: number;

  @IsOptional() @IsObject()
  shape?: Record<string, any>;

  @IsOptional() @IsObject()
  palette?: Record<string, any>;

  /** { vrExclude, vrYaw } — cấu hình riêng cho VR360 */
  @IsOptional() @IsObject()
  settings?: Record<string, any>;

  /** { old, now, pano360, audio } — link ảnh/audio */
  @IsOptional() @IsObject()
  links?: Record<string, any>;

  /** { vi: {name, short, year, description, voiceText}, en: {...} } */
  @IsObject()
  i18n: Record<string, any>;

  /** [{ year, content }] */
  @IsOptional() @IsArray()
  history?: any[];

  @IsOptional() @IsBoolean()
  isHidden?: boolean;

  @IsOptional() @IsInt()
  order?: number;

  @IsOptional() @IsString()
  projectId?: string;
}

export class UpdateLocationDto extends PartialType(CreateLocationDto) {}

export class VisibilityDto {
  @IsBoolean()
  isHidden: boolean;
}
