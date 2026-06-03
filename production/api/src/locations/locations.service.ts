import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateLocationDto, UpdateLocationDto } from './location.dto';

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly projects: ProjectsService,
  ) {}

  // lọc theo project (nếu giải được id); ngược lại trả tất cả (tương thích ngược)
  private async where(extra: any, projectSlug?: string) {
    const pid = await this.projects.resolveId(projectSlug);
    return pid ? { ...extra, projectId: pid } : extra;
  }

  async listPublic(projectSlug?: string) {
    return this.prisma.location.findMany({
      where: await this.where({ isHidden: false }, projectSlug),
      orderBy: { order: 'asc' },
      include: { media: true },
    });
  }

  async getPublic(slug: string, projectSlug?: string) {
    const loc = await this.prisma.location.findFirst({
      where: await this.where({ slug, isHidden: false }, projectSlug),
      include: { media: true },
    });
    if (!loc) throw new NotFoundException('Không tìm thấy địa điểm');
    return loc;
  }

  async listAll(projectSlug?: string) {
    return this.prisma.location.findMany({
      where: await this.where({}, projectSlug),
      orderBy: { order: 'asc' },
      include: { media: true },
    });
  }

  async create(dto: CreateLocationDto, userId: string) {
    const projectId = (dto as any).projectId || (await this.projects.defaultId());
    const loc = await this.prisma.location.create({ data: { ...(dto as any), projectId } });
    await this.audit.log(userId, 'CREATE', 'Location', loc.id, dto);
    return loc;
  }

  async update(id: string, dto: UpdateLocationDto, userId: string) {
    await this.ensure(id);
    const loc = await this.prisma.location.update({ where: { id }, data: dto as any });
    await this.audit.log(userId, 'UPDATE', 'Location', id, dto);
    return loc;
  }

  async setVisibility(id: string, isHidden: boolean, userId: string) {
    await this.ensure(id);
    const loc = await this.prisma.location.update({ where: { id }, data: { isHidden } });
    await this.audit.log(userId, 'TOGGLE', 'Location', id, { isHidden });
    return loc;
  }

  async remove(id: string, userId: string) {
    await this.ensure(id);
    await this.prisma.location.delete({ where: { id } });
    await this.audit.log(userId, 'DELETE', 'Location', id);
    return { ok: true };
  }

  private async ensure(id: string) {
    const exists = await this.prisma.location.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Không tìm thấy địa điểm');
  }
}
