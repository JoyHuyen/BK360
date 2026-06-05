import { Body, Controller, Get, Post, Patch, Query } from '@nestjs/common';
import { IsBoolean, IsObject, IsOptional, IsString, Matches } from 'class-validator';
import { Public } from '../common/public.decorator';
import { Roles } from '../common/roles.decorator';
import { CurrentUser, JwtUser } from '../common/current-user.decorator';
import { ProjectsService } from './projects.service';

class UpdateProjectDto {
  @IsOptional() @IsString()
  mapBg?: string | null;

  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsBoolean()
  enabled?: boolean;

  /** Cấu hình VR360: {autorotate, speed, startSlug} */
  @IsOptional() @IsObject()
  vr360?: Record<string, any>;

  /** Cấu hình màn hình chào */
  @IsOptional() @IsObject()
  welcome?: Record<string, any>;
}

class CreateProjectDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug chỉ gồm chữ thường, số và dấu gạch ngang' })
  slug: string;

  @IsOptional() @IsString()
  name?: string;
}

@Controller('projects')
export class ProjectsController {
  constructor(private readonly svc: ProjectsService) {}

  @Public()
  @Get()
  list() {
    return this.svc.list();
  }

  // Project hiện hành (công khai) — ?project=slug, mặc định project mặc định.
  @Public()
  @Get('current')
  current(@Query('project') project?: string) {
    return this.svc.current(project);
  }

  // Cập nhật project (mapBg/vr360/welcome/name/enabled) — EDITOR trở lên, theo ?project.
  @Roles('EDITOR')
  @Patch('current')
  async update(@Body() dto: UpdateProjectDto, @Query('project') project: string, @CurrentUser() user: JwtUser) {
    await this.svc.accessibleId(user, project); // chặn editor sửa project ngoài quyền
    return this.svc.update(dto, project);
  }

  // ----- Quản lý project (SUPERADMIN) -----
  @Roles('SUPERADMIN')
  @Get('admin/all')
  all() {
    return this.svc.listAll();
  }

  @Roles('SUPERADMIN')
  @Post('admin')
  create(@Body() dto: CreateProjectDto) {
    return this.svc.create(dto);
  }
}
