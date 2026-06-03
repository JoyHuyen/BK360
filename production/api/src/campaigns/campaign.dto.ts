import { IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, Matches } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateCampaignDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug chỉ gồm chữ thường, số và dấu gạch ngang' })
  slug: string;

  @IsOptional() @IsString()
  icon?: string;

  @IsOptional() @IsBoolean()
  enabled?: boolean;

  /** { vi: {name, description}, en: {...} } */
  @IsObject()
  i18n: Record<string, any>;

  /** [{ time, loc, live, title:{vi,en} }] */
  @IsOptional() @IsArray()
  schedule?: any[];

  @IsOptional() @IsInt()
  order?: number;

  @IsOptional() @IsString()
  projectId?: string;
}

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {}

export class ToggleDto {
  @IsBoolean()
  enabled: boolean;
}
