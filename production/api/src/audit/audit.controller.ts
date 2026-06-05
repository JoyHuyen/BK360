import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../common/roles.decorator';
import { AuditService } from './audit.service';

// Guards (JwtAuthGuard + RolesGuard) đã đăng ký GLOBAL qua APP_GUARD trong AuthModule,
// nên KHÔNG dùng @UseGuards ở đây (AuditModule không import JwtModule → sẽ lỗi DI JwtService).
@Controller('admin/audit')
@Roles('SUPERADMIN')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query('limit') limit?: string) {
    return this.audit.list(limit ? parseInt(limit, 10) : 100);
  }
}
