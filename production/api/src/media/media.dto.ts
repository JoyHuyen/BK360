import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MediaKind } from '@prisma/client';

export class UploadMediaDto {
  @IsEnum(MediaKind, { message: 'kind phải là PANO360 | OLD | NOW | AUDIO | MODEL3D' })
  kind: MediaKind;

  @IsOptional() @IsString()
  locationId?: string;

  @IsOptional() @IsString()
  lang?: string;
}
