import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

// PrismaModule & AuditModule là @Global nên không cần import lại.
@Module({
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
