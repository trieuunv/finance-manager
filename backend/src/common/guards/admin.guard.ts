import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthUser } from '../decorators/current-user.decorator';

/** Allows only users whose email is listed in the ADMIN_EMAILS env var (comma separated). */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const user: AuthUser | undefined = context.switchToHttp().getRequest().user;
    const admins = (this.config.get<string>('ADMIN_EMAILS') ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!user || !admins.includes(user.email.toLowerCase())) {
      throw new ForbiddenException('Chỉ quản trị viên mới được cập nhật tỷ giá');
    }
    return true;
  }
}
