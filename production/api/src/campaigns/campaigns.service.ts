import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateCampaignDto, UpdateCampaignDto } from './campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly projects: ProjectsService,
  ) {}

  private async where(extra: any, projectSlug?: string) {
    const pid = await this.projects.resolveId(projectSlug);
    return pid ? { ...extra, projectId: pid } : extra;
  }

  async listActive(projectSlug?: string) {
    return this.prisma.campaign.findMany({
      where: await this.where({ enabled: true }, projectSlug),
      orderBy: { order: 'asc' },
    });
  }

  async listAll(projectSlug?: string) {
    return this.prisma.campaign.findMany({
      where: await this.where({}, projectSlug),
      orderBy: { order: 'asc' },
    });
  }

  async create(dto: CreateCampaignDto, userId: string) {
    const projectId = (dto as any).projectId || (await this.projects.defaultId());
    const c = await this.prisma.campaign.create({ data: { ...(dto as any), projectId } });
    await this.audit.log(userId, 'CREATE', 'Campaign', c.id, dto);
    return c;
  }

  async update(id: string, dto: UpdateCampaignDto, userId: string) {
    await this.ensure(id);
    const c = await this.prisma.campaign.update({ where: { id }, data: dto as any });
    await this.audit.log(userId, 'UPDATE', 'Campaign', id, dto);
    return c;
  }

  async toggle(id: string, enabled: boolean, userId: string) {
    await this.ensure(id);
    const c = await this.prisma.campaign.update({ where: { id }, data: { enabled } });
    await this.audit.log(userId, 'TOGGLE', 'Campaign', id, { enabled });
    return c;
  }

  async remove(id: string, userId: string) {
    await this.ensure(id);
    await this.prisma.campaign.delete({ where: { id } });
    await this.audit.log(userId, 'DELETE', 'Campaign', id);
    return { ok: true };
  }

  private async ensure(id: string) {
    const exists = await this.prisma.campaign.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Không tìm thấy sự kiện');
  }
}
