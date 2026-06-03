import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ghi nhật ký thao tác. Không chặn luồng chính nếu ghi log lỗi. */
  async log(
    userId: string | null,
    action: string,
    entity: string,
    entityId?: string | null,
    diff?: unknown,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: userId ?? undefined,
          action,
          entity,
          entityId: entityId ?? undefined,
          diff: (diff as object) ?? undefined,
        },
      });
    } catch {
      /* nuốt lỗi log để không ảnh hưởng nghiệp vụ */
    }
  }

  list(limit = 100) {
    return this.prisma.auditLog.findMany({
      orderBy: { at: 'desc' },
      take: Math.min(limit, 500),
      include: { user: { select: { email: true, name: true } } },
    });
  }
}
