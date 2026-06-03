import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { LocationsService } from './locations.service';
import { CreateLocationDto, UpdateLocationDto, VisibilityDto } from './location.dto';
import { Public } from '../common/public.decorator';
import { Roles } from '../common/roles.decorator';
import { CurrentUser, JwtUser } from '../common/current-user.decorator';

@Controller()
export class LocationsController {
  constructor(private readonly svc: LocationsService) {}

  // ----- Công khai (đọc) — bỏ throttle (khách đi chung IP) + cho phép cache 30s -----
  @Public()
  @SkipThrottle()
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
  @Get('locations')
  list(@Query('project') project?: string) {
    return this.svc.listPublic(project);
  }

  @Public()
  @SkipThrottle()
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
  @Get('locations/:slug')
  get(@Param('slug') slug: string, @Query('project') project?: string) {
    return this.svc.getPublic(slug, project);
  }

  // ----- Quản trị (EDITOR trở lên) -----
  @Roles('EDITOR')
  @Get('admin/locations')
  all(@Query('project') project?: string) {
    return this.svc.listAll(project);
  }

  @Roles('EDITOR')
  @Post('admin/locations')
  create(@Body() dto: CreateLocationDto, @CurrentUser() user: JwtUser) {
    return this.svc.create(dto, user.sub);
  }

  @Roles('EDITOR')
  @Put('admin/locations/:id')
  update(@Param('id') id: string, @Body() dto: UpdateLocationDto, @CurrentUser() user: JwtUser) {
    return this.svc.update(id, dto, user.sub);
  }

  @Roles('EDITOR')
  @Patch('admin/locations/:id/visibility')
  visibility(@Param('id') id: string, @Body() dto: VisibilityDto, @CurrentUser() user: JwtUser) {
    return this.svc.setVisibility(id, dto.isHidden, user.sub);
  }

  @Roles('EDITOR')
  @Delete('admin/locations/:id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.svc.remove(id, user.sub);
  }
}
