import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) throw new BadRequestException('Passwords do not match');
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('Phone number already registered');
    const referrer = await this.prisma.user.findUnique({ where: { invitationCode: dto.invitationCode } });
    if (!referrer) throw new BadRequestException('Invalid invitation code');
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const hashedPin = await bcrypt.hash(dto.securityPin, 12);
    const newInvitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const defaultVip = await this.prisma.vipLevel.findFirst({ orderBy: { sortOrder: 'asc' } });
    if (!defaultVip) throw new BadRequestException('System not configured. Contact admin.');
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone, nickname: dto.nickname, password: hashedPassword,
        withdrawPassword: hashedPin, invitationCode: newInvitationCode,
        referrerId: referrer.id, vipLevelId: defaultVip.id,
      },
      select: { id: true, phone: true, nickname: true, invitationCode: true, creditScore: true, vipLevelId: true },
    });
    const token = this.jwtService.sign({ sub: user.id, phone: user.phone });
    return { user, token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone }, include: { vipLevel: true } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.status === 'BANNED') throw new UnauthorizedException('Account is banned');
    if (user.status === 'DISABLED') throw new UnauthorizedException('Account is disabled');
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = this.jwtService.sign({ sub: user.id, phone: user.phone });
    return {
      token,
      user: {
        id: user.id, phone: user.phone, nickname: user.nickname,
        invitationCode: user.invitationCode, creditScore: user.creditScore,
        balance: user.balance, vipLevel: user.vipLevel, dailyOrderCount: user.dailyOrderCount,
      },
    };
  }
}
