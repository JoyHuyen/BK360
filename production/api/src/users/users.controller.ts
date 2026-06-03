import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './users.dto';
import { Roles } from '../common/roles.decorator';
import { CurrentUser, JwtUser } from '../common/current-user.decorator';

// Quản lý tài khoản — chỉ SUPERADMIN. Guards (Jwt + Roles) đã đăng ký global.
@Roles('SUPERADMIN')
@Controller('admin/users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtUser) {
    return this.svc.create(dto, user.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: JwtUser) {
    return this.svc.update(id, dto, user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.svc.remove(id, user.sub);
  }
}
