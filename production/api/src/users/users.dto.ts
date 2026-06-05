import { IsArray, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;

  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsEnum(Role)
  role?: Role;

  /** Project (id) mà EDITOR được quản lý */
  @IsOptional() @IsArray()
  projectIds?: string[];
}

export class UpdateUserDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsEnum(Role)
  role?: Role;

  /** Đặt lại mật khẩu (bỏ trống nếu không đổi) */
  @IsOptional() @IsString() @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password?: string;

  @IsOptional() @IsArray()
  projectIds?: string[];
}
