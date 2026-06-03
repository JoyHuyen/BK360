import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto, UpdateUserDto } from './users.dto';

const SELECT = { id: true, email: true, name: true, role: true, lastLogin: true, createdAt: true };

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.user.findMany({ select: SELECT, orderBy: { createdAt: 'asc' } });
  }

  async create(dto: CreateUserDto, actorId: string) {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email đã tồn tại');
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, name: dto.name?.trim() || null, role: dto.role || Role.EDITOR },
      select: SELECT,
    });
    await this.audit.log(actorId, 'CREATE', 'User', user.id, { email, role: user.role });
    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Không tìm thấy người dùng');

    // Không cho hạ cấp SUPERADMIN cuối cùng (tránh tự khoá mình ra ngoài).
    if (target.role === Role.SUPERADMIN && dto.role && dto.role !== Role.SUPERADMIN) {
      const supers = await this.prisma.user.count({ where: { role: Role.SUPERADMIN } });
      if (supers <= 1) throw new BadRequestException('Phải còn ít nhất một SUPERADMIN');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name?.trim() || null;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.password) data.passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.update({ where: { id }, data, select: SELECT });
    await this.audit.log(actorId, 'UPDATE', 'User', id, { fields: Object.keys(data) });
    return user;
  }

  async remove(id: string, actorId: string) {
    if (id === actorId) throw new BadRequestException('Không thể tự xoá tài khoản của bạn');
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Không tìm thấy người dùng');
    if (target.role === Role.SUPERADMIN) {
      const supers = await this.prisma.user.count({ where: { role: Role.SUPERADMIN } });
      if (supers <= 1) throw new BadRequestException('Phải còn ít nhất một SUPERADMIN');
    }
    await this.prisma.user.delete({ where: { id } });
    await this.audit.log(actorId, 'DELETE', 'User', id, { email: target.email });
    return { ok: true };
  }
}
