import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import isPathNotGuarded from 'src/helpers/isPathNotGuarded';

@Injectable()
export class UsersGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (isPathNotGuarded(request.path)) {
      return true;
    } else {
      try {
        const accessToken = this.extractAccessTokenFromHeader(request);
        const accessSecret = this.configService.get<string>('ACCESS_SECRET');
        const payload = await this.jwtService.verifyAsync(accessToken, {
          secret: accessSecret,
        });
        request.user = payload;
        return true;
      } catch {
        try {
          const refreshToken = this.extractRefreshTokenFromCookies(request);
          const refreshSecret =
            this.configService.get<string>('REFRESH_SECRET');
          const payload = await this.jwtService.verifyAsync(refreshToken, {
            secret: refreshSecret,
          });
          request.user = payload;
          return true;
        } catch {
          throw new UnauthorizedException('Not authorized');
        }
      }
    }
  }
  extractAccessTokenFromHeader(request: Request): string | undefined {
    const [type, accessToken] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? accessToken : undefined;
  }

  // extractRefreshTokenFromHeader(request: Request): string | undefined {
  //     const refreshToken = request.headers['refresh-token'] as string || undefined;
  //     return refreshToken;
  // }

  extractRefreshTokenFromCookies(request: Request): string | undefined {
    const refreshToken =
      (request.cookies['refresh-token'] as string) || undefined;
    return refreshToken;
  }
}
