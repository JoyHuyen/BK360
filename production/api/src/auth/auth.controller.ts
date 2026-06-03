import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { Public } from '../common/public.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/current-user.decorator';

// Path cookie refresh = đường dẫn CÔNG KHAI (qua proxy). Dưới subpath đặt COOKIE_PATH=/BK360/api/auth
const RT_PATH = process.env.COOKIE_PATH || '/api/auth';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('rt', token, {
      httpOnly: true,
      secure: this.config.get<string>('COOKIE_SECURE') === 'true',
      sameSite: 'lax',
      path: RT_PATH,
      maxAge: 7 * 24 * 3600 * 1000,
    });
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // tối đa 5 lần đăng nhập/phút/IP
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...rest } = await this.auth.login(dto.email, dto.password);
    this.setRefreshCookie(res, refreshToken);
    return rest;
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req as any).cookies?.rt as string | undefined;
    const { refreshToken, ...rest } = await this.auth.refresh(token);
    this.setRefreshCookie(res, refreshToken);
    return rest;
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('rt', { path: RT_PATH });
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return user;
  }
}
