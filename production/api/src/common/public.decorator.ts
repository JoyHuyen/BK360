import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';
/** Đánh dấu route công khai (bỏ qua xác thực JWT). */
export const Public = () => SetMetadata(IS_PUBLIC, true);
