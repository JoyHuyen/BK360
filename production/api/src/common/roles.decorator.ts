import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
/** Yêu cầu vai trò tối thiểu (lấy quyền cao nhất trong danh sách). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
