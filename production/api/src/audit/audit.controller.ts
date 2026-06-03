import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { AuditService } from './audit.service';

@Controller('admin/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EDITOR')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query('limit') limit?: string) {
    return this.audit.list(limit ? parseInt(limit, 10) : 100);
  }
}
