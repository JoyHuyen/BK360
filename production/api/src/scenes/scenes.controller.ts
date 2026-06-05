import { Body, Controller, Delete, Get, Header, Param, Post, Put, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ScenesService } from './scenes.service';
import { CreateSceneDto, UpdateSceneDto } from './scene.dto';
import { Public } from '../common/public.decorator';
import { Roles } from '../common/roles.decorator';
import { CurrentUser, JwtUser } from '../common/current-user.decorator';

@Controller()
export class ScenesController {
  constructor(private readonly svc: ScenesService) {}

  // ----- Công khai (đọc) -----
  @Public()
  @SkipThrottle()
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
  @Get('scenes')
  list(@Query('project') project?: string) {
    return this.svc.listPublic(project);
  }

  // ----- Quản trị -----
  @Roles('EDITOR')
  @Get('admin/scenes')
  all(@Query('project') project: string, @CurrentUser() user: JwtUser) {
    return this.svc.listAll(project, user);
  }

  @Roles('EDITOR')
  @Post('admin/scenes')
  create(@Body() dto: CreateSceneDto, @Query('project') project: string, @CurrentUser() user: JwtUser) {
    return this.svc.create(dto, user, project);
  }

  @Roles('EDITOR')
  @Put('admin/scenes/:id')
  update(@Param('id') id: string, @Body() dto: UpdateSceneDto, @CurrentUser() user: JwtUser) {
    return this.svc.update(id, dto, user.sub);
  }

  @Roles('EDITOR')
  @Delete('admin/scenes/:id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.svc.remove(id, user.sub);
  }
}
