import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ref } from 'joi';

@Injectable()
export class UsersGuard implements CanActivate {
    constructor(private configService: ConfigService, private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const accessToken = this.extractAccessTokenFromHeader(request);
        if (!accessToken) {
            throw new UnauthorizedException('Not authorized');
        }
        try {
            const accessSecret = this.configService.get<string>('ACCESS_SECRET');
            const payload = await this.jwtService.verifyAsync(accessToken, { secret: accessSecret });
            request.user = payload;
            return true;
        } catch {
            try {
                const refreshSecret = this.configService.get<string>('REFRESH_SECRET');
                const payload = await this.jwtService.verifyAsync(accessToken, { secret: refreshSecret });
                request.user = payload;
                return true;
            } catch {
                throw new UnauthorizedException();
            }
        }
    }

    extractAccessTokenFromHeader(request: Request): string | undefined {
        const [type, accessToken] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? accessToken : undefined;
    }
}