import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  private signTokens(user: { id: string; email: string; role: string; name: string | null; projectIds?: string[] }) {
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name, projectIds: user.projectIds ?? [] };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('ACCESS_TTL') ?? '15m',
    });
    const refreshToken = this.jwt.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('REFRESH_TTL') ?? '7d',
      },
    );
    return { accessToken, refreshToken };
  }

  private publicUser(u: { id: string; email: string; role: string; name: string | null; projectIds?: string[] }) {
    return { id: u.id, email: u.email, role: u.role, name: u.name, projectIds: u.projectIds ?? [] };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    await this.audit.log(user.id, 'LOGIN', 'Auth', user.id);
    return { user: this.publicUser(user), ...this.signTokens(user) };
  }

  async refresh(token?: string) {
    if (!token) throw new UnauthorizedException('Thiếu refresh token');
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Người dùng không tồn tại');
    return { user: this.publicUser(user), ...this.signTokens(user) };
  }
}
