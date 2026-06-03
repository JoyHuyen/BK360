import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { join } from 'path';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UploadMediaDto } from './media.dto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(file: any, dto: UploadMediaDto, userId: string) {
    const base = process.env.PUBLIC_MEDIA_BASE ?? '/media';
    const dir = process.env.MEDIA_DIR ?? '/data/media';
    const url = `${base}/${file.filename}`;
    const meta: Record<string, any> = {
      originalName: file.originalname,
      size: file.size,
      mime: file.mimetype,
    };

    // Pipeline ảnh: sinh bản WebP tối ưu + ghi kích thước. Ảnh 360° resize tới 4096px,
    // ảnh thường tới 1600px. Audio/SVG/3D giữ nguyên.
    if (file.mimetype?.startsWith('image/') && file.mimetype !== 'image/svg+xml') {
      try {
        const maxW = dto.kind === 'PANO360' ? 4096 : 1600;
        const optName = file.filename.replace(/\.[^.]+$/, '') + '.web.webp';
        await sharp(file.path)
          .rotate()
          .resize({ width: maxW, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(join(dir, optName));
        const info = await sharp(file.path).metadata();
        meta.optimized = `${base}/${optName}`;
        meta.width = info.width;
        meta.height = info.height;
      } catch (e: any) {
        this.logger.warn(`Xử lý ảnh thất bại, giữ bản gốc: ${e?.message}`);
      }
    }

    const media = await this.prisma.media.create({
      data: {
        kind: dto.kind,
        locationId: dto.locationId || undefined,
        lang: dto.lang || undefined,
        url,
        meta,
      },
    });
    await this.audit.log(userId, 'CREATE', 'Media', media.id, { kind: dto.kind, url });
    return media;
  }

  async remove(id: string, userId: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Không tìm thấy media');
    await this.prisma.media.delete({ where: { id } });
    await this.audit.log(userId, 'DELETE', 'Media', id);
    return { ok: true };
  }
}
