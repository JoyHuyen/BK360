import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Hỗ trợ multi-project. Hiện chạy 1 project mặc định (slug 'bk360').
 * Khi bật UI multi-project sau này chỉ cần truyền ?project=<slug>.
 */
@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  defaultSlug(): string {
    return this.config.get<string>('DEFAULT_PROJECT_SLUG') || 'bk360';
  }

  async resolveId(slug?: string): Promise<string | null> {
    const s = (slug && slug.trim()) || this.defaultSlug();
    const p = await this.prisma.project.findUnique({ where: { slug: s } });
    return p?.id ?? null;
  }

  defaultId() {
    return this.resolveId();
  }

  list() {
    return this.prisma.project.findMany({ where: { enabled: true }, orderBy: { order: 'asc' } });
  }
}
