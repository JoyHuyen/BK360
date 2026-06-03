import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

const RANK: Record<string, number> = { VIEWER: 0, EDITOR: 1, SUPERADMIN: 2 };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const { user } = ctx.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Chưa xác thực');
    const min = Math.min(...roles.map((r) => RANK[r] ?? 99));
    if ((RANK[user.role] ?? -1) < min) {
      throw new ForbiddenException('Không đủ quyền thực hiện thao tác này');
    }
    return true;
  }
}
