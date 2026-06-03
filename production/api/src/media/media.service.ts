import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ImportUrlDto, UploadMediaDto } from './media.dto';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif': 'gif', 'image/svg+xml': 'svg',
  'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a', 'audio/m4a': 'm4a',
  'audio/aac': 'aac', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-wav': 'wav',
};

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // Sinh bản WebP tối ưu cho ảnh (360° tới 4096px, ảnh thường 1600px). Ghi vào meta.
  private async optimizeImage(srcPath: string, filename: string, kind: string, base: string, dir: string, meta: Record<string, any>, mime?: string) {
    if (!mime?.startsWith('image/') || mime === 'image/svg+xml') return;
    try {
      const maxW = kind === 'PANO360' ? 4096 : 1600;
      const optName = filename.replace(/\.[^.]+$/, '') + '.web.webp';
      await sharp(srcPath).rotate().resize({ width: maxW, withoutEnlargement: true }).webp({ quality: 80 }).toFile(join(dir, optName));
      const info = await sharp(srcPath).metadata();
      meta.optimized = `${base}/${optName}`;
      meta.width = info.width;
      meta.height = info.height;
    } catch (e: any) {
      this.logger.warn(`Xử lý ảnh thất bại, giữ bản gốc: ${e?.message}`);
    }
  }

  async create(file: any, dto: UploadMediaDto, userId: string) {
    const base = process.env.PUBLIC_MEDIA_BASE ?? '/media';
    const dir = process.env.MEDIA_DIR ?? '/data/media';
    const url = `${base}/${file.filename}`;
    const meta: Record<string, any> = { originalName: file.originalname, size: file.size, mime: file.mimetype };
    await this.optimizeImage(file.path, file.filename, dto.kind, base, dir, meta, file.mimetype);

    const media = await this.prisma.media.create({
      data: { kind: dto.kind, locationId: dto.locationId || undefined, lang: dto.lang || undefined, url, meta },
    });
    await this.audit.log(userId, 'CREATE', 'Media', media.id, { kind: dto.kind, url });
    await this.cleanupOld(dto.kind, dto.locationId, media.id);
    return media;
  }

  // Kéo file từ link ngoài (Drive/OneDrive…) về host trên server: server tải 1 lần,
  // sau đó phục vụ từ /media (không phụ thuộc hạn ngạch Drive khi đông người xem).
  async importFromUrl(dto: ImportUrlDto, userId: string) {
    const src = (dto.url || '').trim();
    if (!/^https?:\/\//i.test(src)) throw new BadRequestException('Link không hợp lệ (cần http/https)');

    let res: Response;
    try {
      res = await fetch(src, { redirect: 'follow', headers: { 'User-Agent': 'BK360-MediaImporter' } });
    } catch (e: any) {
      throw new BadRequestException('Không tải được file từ link: ' + (e?.message || 'lỗi mạng'));
    }
    if (!res.ok) throw new BadRequestException(`Không tải được file (HTTP ${res.status}) — kiểm tra quyền chia sẻ "ai có link đều xem".`);

    const mime = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (mime.startsWith('text/html')) {
      throw new BadRequestException('Link trả về trang HTML, không phải file. Hãy dùng link chia sẻ ảnh/audio trực tiếp.');
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 64 * 1024 * 1024) throw new BadRequestException('File quá lớn (>64MB).');
    if (buf.length < 64) throw new BadRequestException('File tải về rỗng/không hợp lệ.');

    const base = process.env.PUBLIC_MEDIA_BASE ?? '/media';
    const dir = process.env.MEDIA_DIR ?? '/data/media';
    const ext = EXT_BY_MIME[mime] || (src.match(/\.([a-z0-9]{2,4})(?:\?|$)/i)?.[1] || 'bin').toLowerCase();
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    await writeFile(join(dir, filename), buf);
    const url = `${base}/${filename}`;
    const meta: Record<string, any> = { source: src, size: buf.length, mime };
    await this.optimizeImage(join(dir, filename), filename, dto.kind, base, dir, meta, mime);

    const media = await this.prisma.media.create({
      data: { kind: dto.kind, locationId: dto.locationId || undefined, lang: dto.lang || undefined, url, meta },
    });
    await this.audit.log(userId, 'CREATE', 'Media', media.id, { kind: dto.kind, url, source: src });
    await this.cleanupOld(dto.kind, dto.locationId, media.id);
    return media;
  }

  // Chỉ giữ media của LẦN CUỐI cho cùng (địa điểm + loại) hoặc ảnh nền 2D (MAPBG):
  // xoá file gốc + bản WebP + bản ghi cũ để tránh rác trên server.
  // Bỏ qua PANO360 không gắn địa điểm (ảnh của Scene) để không xoá nhầm cảnh khác.
  private async cleanupOld(kind: any, locationId: string | undefined, keepId: string) {
    let where: any;
    if (locationId) where = { locationId, kind, id: { not: keepId } };
    else if (kind === 'MAPBG') where = { kind: 'MAPBG', locationId: null, id: { not: keepId } };
    else return;

    const dir = process.env.MEDIA_DIR ?? '/data/media';
    const old = await this.prisma.media.findMany({ where });
    if (!old.length) return;
    for (const m of old) {
      const meta: any = m.meta || {};
      for (const u of [m.url, meta.optimized]) {
        if (typeof u === 'string') {
          const fn = u.split('/').pop();
          if (fn) await unlink(join(dir, fn)).catch(() => {});
        }
      }
    }
    await this.prisma.media.deleteMany({ where });
    this.logger.log(`Dọn ${old.length} media cũ (${kind}${locationId ? ' @' + locationId : ''}).`);
  }

  async remove(id: string, userId: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Không tìm thấy media');
    const dir = process.env.MEDIA_DIR ?? '/data/media';
    const meta: any = media.meta || {};
    for (const u of [media.url, meta.optimized]) {
      if (typeof u === 'string') {
        const fn = u.split('/').pop();
        if (fn) await unlink(join(dir, fn)).catch(() => {});
      }
    }
    await this.prisma.media.delete({ where: { id } });
    await this.audit.log(userId, 'DELETE', 'Media', id);
    return { ok: true };
  }
}
