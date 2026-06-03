import { Body, Controller, Get, Patch } from '@nestjs/common';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { Public } from '../common/public.decorator';
import { Roles } from '../common/roles.decorator';
import { ProjectsService } from './projects.service';

class UpdateProjectDto {
  @IsOptional() @IsString()
  mapBg?: string | null;

  @IsOptional() @IsString()
  name?: string;

  /** Cấu hình VR360: {autorotate, speed, startSlug} */
  @IsOptional() @IsObject()
  vr360?: Record<string, any>;

  /** Cấu hình màn hình chào */
  @IsOptional() @IsObject()
  welcome?: Record<string, any>;
}

@Controller('projects')
export class ProjectsController {
  constructor(private readonly svc: ProjectsService) {}

  @Public()
  @Get()
  list() {
    return this.svc.list();
  }

  // Project hiện hành (công khai) — để bản đồ người xem biết ảnh nền 2D.
  @Public()
  @Get('current')
  current() {
    return this.svc.current();
  }

  // Cập nhật project (đặt/đổi ảnh nền 2D mapBg) — EDITOR trở lên.
  @Roles('EDITOR')
  @Patch('current')
  update(@Body() dto: UpdateProjectDto) {
    return this.svc.update(dto);
  }
}
