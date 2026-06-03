import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { AuthModule } from './auth/auth.module';
import { LocationsModule } from './locations/locations.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { MediaModule } from './media/media.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { Public } from './common/public.decorator';

@Controller()
class HealthController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'bk360-api', time: new Date().toISOString() };
  }

  @Public()
  @Get('config')
  config() {
    return {
      langs: ['vi', 'en'],
      defaultLang: 'vi',
      anniversary: { from: 1956, to: 2026, years: 70 },
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate-limit toàn cục: 120 req/phút/IP (chống lạm dụng & DDoS nhẹ).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    ProjectsModule,
    AuditModule,
    AuthModule,
    LocationsModule,
    CampaignsModule,
    MediaModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
