import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateSceneDto, UpdateSceneDto } from './scene.dto';

@Injectable()
export class ScenesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly projects: ProjectsService,
  ) {}

  private async where(extra: any, projectSlug?: string) {
    const pid = await this.projects.resolveId(projectSlug);
    return pid ? { ...extra, projectId: pid } : extra;
  }

  async listPublic(projectSlug?: string) {
    return this.prisma.scene.findMany({
      where: await this.where({ enabled: true }, projectSlug),
      orderBy: { order: 'asc' },
    });
  }

  async listAll(projectSlug?: string, user?: any) {
    if (user) await this.projects.accessibleId(user, projectSlug);
    return this.prisma.scene.findMany({
      where: await this.where({}, projectSlug),
      orderBy: { order: 'asc' },
    });
  }

  async create(dto: CreateSceneDto, user: any, projectSlug?: string) {
    const projectId = (dto as any).projectId || (await this.projects.accessibleId(user, projectSlug));
    const scene = await this.prisma.scene.create({ data: { ...(dto as any), projectId } });
    await this.audit.log(user.sub, 'CREATE', 'Scene', scene.id, { slug: dto.slug });
    return scene;
  }

  async update(id: string, dto: UpdateSceneDto, userId: string) {
    await this.ensure(id);
    const scene = await this.prisma.scene.update({ where: { id }, data: dto as any });
    await this.audit.log(userId, 'UPDATE', 'Scene', id, dto);
    return scene;
  }

  async remove(id: string, userId: string) {
    await this.ensure(id);
    await this.prisma.scene.delete({ where: { id } });
    await this.audit.log(userId, 'DELETE', 'Scene', id);
    return { ok: true };
  }

  private async ensure(id: string) {
    const s = await this.prisma.scene.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Không tìm thấy điểm 360');
  }
}
