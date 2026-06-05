import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto, ToggleDto } from './campaign.dto';
import { Public } from '../common/public.decorator';
import { Roles } from '../common/roles.decorator';
import { CurrentUser, JwtUser } from '../common/current-user.decorator';

@Controller()
export class CampaignsController {
  constructor(private readonly svc: CampaignsService) {}

  // ----- Công khai: chỉ trả sự kiện đang bật — bỏ throttle + cache 30s -----
  @Public()
  @SkipThrottle()
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
  @Get('campaigns')
  active(@Query('project') project?: string) {
    return this.svc.listActive(project);
  }

  // ----- Quản trị -----
  @Roles('EDITOR')
  @Get('admin/campaigns')
  all(@Query('project') project: string, @CurrentUser() user: JwtUser) {
    return this.svc.listAll(project, user);
  }

  @Roles('EDITOR')
  @Post('admin/campaigns')
  create(@Body() dto: CreateCampaignDto, @Query('project') project: string, @CurrentUser() user: JwtUser) {
    return this.svc.create(dto, user, project);
  }

  @Roles('EDITOR')
  @Put('admin/campaigns/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto, @CurrentUser() user: JwtUser) {
    return this.svc.update(id, dto, user.sub);
  }

  @Roles('EDITOR')
  @Patch('admin/campaigns/:id/toggle')
  toggle(@Param('id') id: string, @Body() dto: ToggleDto, @CurrentUser() user: JwtUser) {
    return this.svc.toggle(id, dto.enabled, user.sub);
  }

  @Roles('EDITOR')
  @Delete('admin/campaigns/:id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.svc.remove(id, user.sub);
  }
}
