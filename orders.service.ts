import { Controller, Get, Put, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@UseGuards(AuthGuard('jwt'))
@Controller('user')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    const user = req.user;
    const today = new Date(); today.setHours(0,0,0,0);
    const todayProfit = await this.prisma.order.aggregate({
      where: { userId: user.id, status: 'COMPLETE', settledAt: { gte: today } },
      _sum: { commission: true },
    });
    return {
      id: user.id, phone: user.phone, nickname: user.nickname,
      invitationCode: user.invitationCode, creditScore: user.creditScore,
      balance: user.balance, frozenBalance: user.frozenBalance,
      totalDeposits: user.totalDeposits, totalWithdrawals: user.totalWithdrawals,
      totalCommissions: user.totalCommissions, dailyOrderCount: user.dailyOrderCount,
      vipLevel: user.vipLevel,
      todayProfit: Number(todayProfit._sum.commission || 0),
    };
  }

  @Put('change-password')
  async changePassword(@Request() req: any, @Body() body: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(body.oldPassword, user.password);
    if (!valid) throw new Error('Current password is incorrect');
    if (body.newPassword !== body.confirmPassword) throw new Error('Passwords do not match');
    await this.prisma.user.update({
      where: { id: req.user.id },
      data: { password: await bcrypt.hash(body.newPassword, 12) },
    });
    return { success: true };
  }

  @Put('change-security-pin')
  async changeSecurityPin(@Request() req: any, @Body() body: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(body.oldPin, user.withdrawPassword);
    if (!valid) throw new Error('Current PIN is incorrect');
    await this.prisma.user.update({
      where: { id: req.user.id },
      data: { withdrawPassword: await bcrypt.hash(body.newPin, 12) },
    });
    return { success: true };
  }

  @Get('withdrawal-accounts')
  async getWithdrawalAccounts(@Request() req: any) {
    return this.prisma.withdrawalAccount.findMany({ where: { userId: req.user.id } });
  }

  @Post('withdrawal-accounts')
  async addWithdrawalAccount(@Request() req: any, @Body() body: any) {
    return this.prisma.withdrawalAccount.create({
      data: { userId: req.user.id, method: body.method, details: body.details },
    });
  }

  @Get('settings')
  async getSettings() {
    const settings = await this.prisma.siteSettings.findFirst();
    const customerService = await this.prisma.customerServiceLink.findMany({ where: { isActive: true } });
    return { settings, customerService };
  }

  @Get('vip-levels')
  async getVipLevels() {
    return this.prisma.vipLevel.findMany({ orderBy: { sortOrder: 'asc' } });
  }
}
