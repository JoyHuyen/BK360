import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MediaService } from './media.service';
import { UploadMediaDto } from './media.dto';
import { Roles } from '../common/roles.decorator';
import { CurrentUser, JwtUser } from '../common/current-user.decorator';

@Controller('admin/media')
export class MediaController {
  constructor(private readonly svc: MediaService) {}

  @Roles('EDITOR')
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.MEDIA_DIR ?? '/data/media',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 64 * 1024 * 1024 },
    }),
  )
  upload(
    @UploadedFile() file: any,
    @Body() dto: UploadMediaDto,
    @CurrentUser() user: JwtUser,
  ) {
    if (!file) throw new BadRequestException('Thiếu file tải lên');
    return this.svc.create(file, dto, user.sub);
  }

  @Roles('EDITOR')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.svc.remove(id, user.sub);
  }
}
