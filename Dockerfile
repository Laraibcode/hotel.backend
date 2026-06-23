import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret',
    });
  }

  async validate(payload: { sub: number; phone: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { vipLevel: true },
    });
    if (!user || user.status === 'BANNED' || user.status === 'DISABLED') {
      throw new UnauthorizedException();
    }
    return user;
  }
}
