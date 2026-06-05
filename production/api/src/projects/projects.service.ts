import { ForbiddenException, Injectable } from '@nestjs/common';
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

  // Trả projectId theo slug; chặn nếu EDITOR không được gán project này.
  async accessibleId(user: { role: string; projectIds?: string[] }, slug?: string): Promise<string | null> {
    const id = await this.resolveId(slug);
    if (user.role !== 'SUPERADMIN') {
      if (!id || !(user.projectIds || []).includes(id)) {
        throw new ForbiddenException('Bạn không có quyền với dự án này');
      }
    }
    return id;
  }

  list() {
    return this.prisma.project.findMany({ where: { enabled: true }, orderBy: { order: 'asc' } });
  }

  // Admin: tất cả project (kể cả tắt)
  listAll() {
    return this.prisma.project.findMany({ orderBy: { order: 'asc' } });
  }

  async create(data: { slug: string; name?: string }) {
    const slug = data.slug.trim().toLowerCase();
    const max = await this.prisma.project.aggregate({ _max: { order: true } });
    return this.prisma.project.create({
      data: { slug, name: (data.name || slug).trim(), enabled: true, order: (max._max.order ?? 0) + 1 },
    });
  }

  // Project hiện hành (mặc định) — gồm ảnh nền bản đồ 2D (mapBg) & theme.
  async current(slug?: string) {
    const s = (slug && slug.trim()) || this.defaultSlug();
    const p = await this.prisma.project.findUnique({ where: { slug: s } });
    if (!p) return null;
    return { id: p.id, slug: p.slug, name: p.name, mapBg: p.mapBg, theme: p.theme, vr360: p.vr360, welcome: p.welcome };
  }

  async update(data: { mapBg?: string | null; name?: string; theme?: any; vr360?: any; welcome?: any; enabled?: boolean }, slug?: string) {
    const s = (slug && slug.trim()) || this.defaultSlug();
    const p = await this.prisma.project.update({ where: { slug: s }, data });
    return { id: p.id, slug: p.slug, name: p.name, mapBg: p.mapBg, theme: p.theme, vr360: p.vr360, welcome: p.welcome };
  }
}
