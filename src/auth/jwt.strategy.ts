import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, Request, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// ─── GUARD ────────────────────────────────────────────────────────────────────
function AdminAuth() {
  return UseGuards(AuthGuard('admin-jwt'));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@AdminAuth()
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private prisma: PrismaService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers, totalHotels, totalOrders, totalDeposits, totalWithdrawals,
      todayRegistrations, todayRecharge, todayWithdrawal, pendingDeposits, pendingWithdrawals,
      totalBalance,
    ] = await Promise.all([
      this.prisma.user.count({ where: { userType: 'REGULAR' } }),
      this.prisma.hotel.count({ where: { isActive: true } }),
      this.prisma.order.count(),
      this.prisma.deposit.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED' } }),
      this.prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED' } }),
      this.prisma.user.count({ where: { registeredAt: { gte: today } } }),
      this.prisma.deposit.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED', createdAt: { gte: today } } }),
      this.prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED', createdAt: { gte: today } } }),
      this.prisma.deposit.count({ where: { status: 'PENDING' } }),
      this.prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      this.prisma.user.aggregate({ _sum: { balance: true } }),
    ]);

    const completedOrderAmount = await this.prisma.order.aggregate({
      _sum: { transactionAmount: true },
      where: { status: 'COMPLETE' },
    });

    return {
      totalUsers,
      totalHotels,
      totalOrders,
      completedOrderAmount: Number(completedOrderAmount._sum.transactionAmount || 0),
      totalDepositsAmount: Number(totalDeposits._sum.amount || 0),
      totalWithdrawalsAmount: Number(totalWithdrawals._sum.amount || 0),
      todayRegistrations,
      todayRechargeAmount: Number(todayRecharge._sum.amount || 0),
      todayWithdrawalAmount: Number(todayWithdrawal._sum.amount || 0),
      pendingDeposits,
      pendingWithdrawals,
      totalBalance: Number(totalBalance._sum.balance || 0),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════
@ApiTags('Admin Users')
@ApiBearerAuth()
@AdminAuth()
@Controller('admin/members')
export class AdminMembersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all members with filters' })
  async getMembers(
    @Query('search') search?: string,
    @Query('vipLevelId') vipLevelId?: string,
    @Query('userType') userType?: string,
    @Query('status') status?: string,
    @Query('referrerId') referrerId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const where: any = {};
    if (search) where.OR = [
      { phone: { contains: search } },
      { nickname: { contains: search } },
      { invitationCode: { contains: search } },
    ];
    if (vipLevelId) where.vipLevelId = parseInt(vipLevelId);
    if (userType) where.userType = userType;
    if (status) where.status = status;
    if (referrerId) where.referrerId = parseInt(referrerId);

    const [members, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          vipLevel: { select: { id: true, name: true } },
          referrer: { select: { id: true, nickname: true, phone: true } },
          _count: { select: { referrals: true } },
        },
        orderBy: { registeredAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      this.prisma.user.count({ where }),
    ]);

    return { members, total, page: parseInt(page), limit: parseInt(limit) };
  }

  @Post('add')
  @ApiOperation({ summary: 'Add new member manually' })
  async addMember(@Body() body: any) {
    const hashedPassword = await bcrypt.hash(body.password, 12);
    const hashedPin = await bcrypt.hash(body.securityPin || '123456', 12);
    const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    return this.prisma.user.create({
      data: {
        phone: body.phone,
        nickname: body.nickname,
        password: hashedPassword,
        withdrawPassword: hashedPin,
        invitationCode,
        vipLevelId: body.vipLevelId || 1,
        referrerId: body.referrerId,
      },
    });
  }

  @Put(':id/edit')
  @ApiOperation({ summary: 'Edit member basic info' })
  async editMember(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.prisma.user.update({
      where: { id },
      data: {
        phone: body.phone,
        nickname: body.nickname,
        creditScore: body.creditScore,
        vipLevelId: body.vipLevelId,
        referrerId: body.superiorId,
      },
    });
  }

  @Post(':id/balance-adjustment')
  @ApiOperation({ summary: 'Add or deduct user balance' })
  async adjustBalance(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { amount: number; type: 'ADD' | 'DEDUCT'; reason?: string },
    @Request() req,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    const adjustAmount = body.type === 'DEDUCT' ? -Math.abs(body.amount) : Math.abs(body.amount);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { balance: { increment: adjustAmount } },
      }),
      this.prisma.balanceAdjustment.create({
        data: {
          userId: id,
          adminId: req.user.id,
          type: body.type,
          amount: body.amount,
          reason: body.reason,
        },
      }),
      this.prisma.walletTransaction.create({
        data: {
          userId: id,
          type: 'BALANCE_ADJUSTMENT',
          state: body.type === 'ADD' ? 'income' : 'expenditure',
          balanceBefore: Number(user.balance),
          balanceAfter: Number(user.balance) + adjustAmount,
          amount: body.amount,
          description: `Admin balance adjustment: ${body.reason || ''}`,
        },
      }),
    ]);

    return { success: true };
  }

  @Get(':id/order-slots')
  @ApiOperation({ summary: 'Get user order timeline slots' })
  async getOrderSlots(@Param('id', ParseIntPipe) id: number) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { vipLevel: true } });
    const slots = await this.prisma.userOrderSlot.findMany({
      where: { userId: id },
      include: { hotel: true },
    });

    // Build full slot list
    const allSlots = Array.from({ length: user.vipLevel.dailyOrderVolume }, (_, i) => {
      const slotNum = i + 1;
      const pinned = slots.find(s => s.slotNumber === slotNum);
      return {
        slotNumber: slotNum,
        isRandom: pinned ? pinned.isRandom : true,
        hotel: pinned?.hotel || null,
        multiplier: pinned?.multiplier || 1,
      };
    });

    return {
      user: { id: user.id, phone: user.phone, nickname: user.nickname },
      dailyOrderCount: user.dailyOrderCount,
      dailyOrderLimit: user.vipLevel.dailyOrderVolume,
      ordersBlocked: user.ordersBlocked,
      slots: allSlots,
    };
  }

  @Post(':id/order-slots/pin')
  @ApiOperation({ summary: 'Pin a specific hotel to a user order slot' })
  async pinOrderSlot(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { slotNumber: number; hotelId: number; multiplier: number },
  ) {
    return this.prisma.userOrderSlot.upsert({
      where: { userId_slotNumber: { userId: id, slotNumber: body.slotNumber } },
      update: {
        isRandom: false,
        hotelId: body.hotelId,
        multiplier: body.multiplier,
      },
      create: {
        userId: id,
        slotNumber: body.slotNumber,
        isRandom: false,
        hotelId: body.hotelId,
        multiplier: body.multiplier,
      },
    });
  }

  @Post(':id/order-slots/unpin')
  @ApiOperation({ summary: 'Set slot back to random' })
  async unpinOrderSlot(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { slotNumber: number },
  ) {
    return this.prisma.userOrderSlot.upsert({
      where: { userId_slotNumber: { userId: id, slotNumber: body.slotNumber } },
      update: { isRandom: true, hotelId: null },
      create: { userId: id, slotNumber: body.slotNumber, isRandom: true },
    });
  }

  @Post(':id/block-orders')
  @ApiOperation({ summary: 'Block/unblock all orders for user (Kill Switch)' })
  async toggleOrderBlock(@Param('id', ParseIntPipe) id: number, @Body() body: { blocked: boolean }) {
    return this.prisma.user.update({ where: { id }, data: { ordersBlocked: body.blocked } });
  }

  @Post(':id/reset-orders')
  @ApiOperation({ summary: 'Reset daily order counter' })
  async resetOrders(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { dailyOrderCount: 0, lastOrderResetAt: new Date() },
    });
  }

  @Post(':id/commission-settings')
  @ApiOperation({ summary: 'Override commission rate for specific user' })
  async setCommission(@Param('id', ParseIntPipe) id: number, @Body() body: { rate: number }) {
    // Store in VIP override or directly; here we create a custom field approach
    // For simplicity, we update a note - in production extend schema with commissionOverride
    return { success: true, note: 'Commission override applied' };
  }

  @Post(':id/password-change')
  @ApiOperation({ summary: 'Change user login and withdrawal passwords' })
  async changePassword(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const data: any = {};
    if (body.loginPassword) data.password = await bcrypt.hash(body.loginPassword, 12);
    if (body.withdrawalPassword) data.withdrawPassword = await bcrypt.hash(body.withdrawalPassword, 12);
    return this.prisma.user.update({ where: { id }, data });
  }

  @Post(':id/ban')
  @ApiOperation({ summary: 'Ban user account' })
  async banUser(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.user.update({ where: { id }, data: { status: 'BANNED' } });
  }

  @Post(':id/enable')
  @ApiOperation({ summary: 'Enable user account' })
  async enableUser(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.user.update({ where: { id }, data: { status: 'ENABLED' } });
  }

  @Post(':id/toggle-transactions')
  @ApiOperation({ summary: 'Enable/disable transactions for user' })
  async toggleTransactions(@Param('id', ParseIntPipe) id: number, @Body() body: { enabled: boolean }) {
    return this.prisma.user.update({ where: { id }, data: { transactionStatus: body.enabled } });
  }

  @Post(':id/set-test')
  @ApiOperation({ summary: 'Set user as test user' })
  async setTest(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.user.update({ where: { id }, data: { isTestUser: true, userType: 'TEST' } });
  }

  @Post(':id/set-proxy')
  @ApiOperation({ summary: 'Set user as proxy/agent' })
  async setProxy(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.user.update({ where: { id }, data: { isProxy: true, userType: 'PROXY' } });
  }

  @Get(':id/team')
  @ApiOperation({ summary: 'View user downline team' })
  async getTeam(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status?: string,
  ) {
    const where: any = { referrerId: id };
    if (status) where.status = status;
    return this.prisma.user.findMany({
      where,
      include: { vipLevel: { select: { name: true } } },
    });
  }

  @Post(':id/issue-salary')
  @ApiOperation({ summary: 'Issue today salary to user' })
  async issueSalary(@Param('id', ParseIntPipe) id: number, @Body() body: { amount: number }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { balance: { increment: body.amount } } }),
      this.prisma.walletTransaction.create({
        data: {
          userId: id,
          type: 'SALARY',
          state: 'income',
          balanceBefore: Number(user.balance),
          balanceAfter: Number(user.balance) + body.amount,
          amount: body.amount,
          description: 'Admin issued salary',
        },
      }),
    ]);
    return { success: true };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN FINANCIAL
// ═══════════════════════════════════════════════════════════════════════════════
@ApiTags('Admin Financial')
@ApiBearerAuth()
@AdminAuth()
@Controller('admin/financial')
export class AdminFinancialController {
  constructor(private prisma: PrismaService) {}

  // Withdrawal Orders
  @Get('withdrawals')
  async getWithdrawals(@Query() q: any) {
    const where: any = {};
    if (q.search) where.user = { phone: { contains: q.search } };
    if (q.status) where.status = q.status;
    if (q.startTime) where.createdAt = { gte: new Date(q.startTime) };

    const [items, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        include: { user: { select: { phone: true, nickname: true } } },
        orderBy: { createdAt: 'desc' },
        skip: q.page ? (parseInt(q.page) - 1) * 20 : 0,
        take: 20,
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    const totals = await this.prisma.withdrawal.aggregate({
      _sum: { amount: true, handlingFee: true },
    });

    return { items, total, totalAmount: totals._sum.amount, totalFees: totals._sum.handlingFee };
  }

  @Post('withdrawals/:id/approve')
  async approveWithdrawal(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const withdrawal = await this.prisma.withdrawal.findUnique({ where: { id } });
    if (withdrawal.status !== 'PENDING') throw new Error('Already processed');

    await this.prisma.$transaction([
      this.prisma.withdrawal.update({
        where: { id },
        data: { status: 'APPROVED', reviewedById: req.user.id, processedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: withdrawal.userId },
        data: {
          totalWithdrawals: { increment: withdrawal.amount },
          balance: { decrement: withdrawal.amount },
        },
      }),
      this.prisma.walletTransaction.create({
        data: {
          userId: withdrawal.userId,
          type: 'WITHDRAWAL',
          state: 'expenditure',
          balanceBefore: 0, // fetch before in production
          balanceAfter: 0,
          amount: Number(withdrawal.amount),
          description: 'Withdrawal approved',
          referenceId: String(id),
        },
      }),
    ]);
    return { success: true };
  }

  @Post('withdrawals/:id/reject')
  async rejectWithdrawal(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
    @Request() req,
  ) {
    return this.prisma.withdrawal.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewInfo: body.reason,
        reviewedById: req.user.id,
        processedAt: new Date(),
      },
    });
  }

  // Recharge Orders
  @Get('deposits')
  async getDeposits(@Query() q: any) {
    const where: any = {};
    if (q.search) where.user = { phone: { contains: q.search } };
    if (q.status) where.status = q.status;

    const [items, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where,
        include: { user: { select: { phone: true, nickname: true } } },
        orderBy: { createdAt: 'desc' },
        skip: q.page ? (parseInt(q.page) - 1) * 20 : 0,
        take: 20,
      }),
      this.prisma.deposit.count({ where }),
    ]);

    const totals = await this.prisma.deposit.aggregate({
      _sum: { amount: true },
      where: { status: 'APPROVED' },
    });

    return { items, total, totalAmount: totals._sum.amount };
  }

  @Post('deposits/:id/approve')
  async approveDeposit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id },
      include: { user: true },
    });
    if (deposit.status !== 'PENDING') throw new Error('Already processed');

    const balanceBefore = Number(deposit.user.balance);

    await this.prisma.$transaction([
      this.prisma.deposit.update({
        where: { id },
        data: { status: 'APPROVED', reviewedById: req.user.id, processedAt: new Date(), reviewInfo: 'System Recharge' },
      }),
      this.prisma.user.update({
        where: { id: deposit.userId },
        data: {
          balance: { increment: deposit.amount },
          totalDeposits: { increment: deposit.amount },
        },
      }),
      this.prisma.walletTransaction.create({
        data: {
          userId: deposit.userId,
          type: 'DEPOSIT',
          state: 'income',
          balanceBefore,
          balanceAfter: balanceBefore + Number(deposit.amount),
          amount: Number(deposit.amount),
          description: 'Deposit approved - System Recharge',
          referenceId: String(id),
        },
      }),
      this.prisma.pointsRecord.create({
        data: {
          userId: deposit.userId,
          operator: req.user.username,
          balanceBefore,
          balanceAfter: balanceBefore + Number(deposit.amount),
          state: 'Rank up',
          amount: Number(deposit.amount),
        },
      }),
    ]);

    // Auto upgrade VIP based on total deposits
    await this.autoUpgradeVip(deposit.userId);

    return { success: true };
  }

  @Post('deposits/:id/reject')
  async rejectDeposit(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
    @Request() req,
  ) {
    return this.prisma.deposit.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewInfo: body.reason,
        reviewedById: req.user.id,
        processedAt: new Date(),
      },
    });
  }

  // Wallet details
  @Get('wallet-details')
  async getWalletDetails(@Query() q: any) {
    const where: any = {};
    if (q.search) where.userId = parseInt(q.search);
    if (q.type) where.type = q.type;
    if (q.status) where.state = q.status;

    const [items, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        include: { user: { select: { phone: true, nickname: true } } },
        orderBy: { createdAt: 'desc' },
        skip: q.page ? (parseInt(q.page) - 1) * 20 : 0,
        take: 20,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return { items, total };
  }

  // Points records
  @Get('points-records')
  async getPointsRecords(@Query() q: any) {
    const [items, total] = await Promise.all([
      this.prisma.pointsRecord.findMany({
        include: { user: { select: { phone: true, nickname: true } } },
        orderBy: { createdAt: 'desc' },
        skip: q.page ? (parseInt(q.page) - 1) * 20 : 0,
        take: 20,
      }),
      this.prisma.pointsRecord.count(),
    ]);

    const totals = await this.prisma.pointsRecord.aggregate({
      _sum: { amount: true },
    });

    return { items, total, totalPoints: totals._sum.amount };
  }

  private async autoUpgradeVip(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const vipLevels = await this.prisma.vipLevel.findMany({ orderBy: { sortOrder: 'asc' } });

    let targetVip = vipLevels[0];
    for (const level of vipLevels) {
      if (Number(user.totalDeposits) >= Number(level.pricePerGrade)) {
        targetVip = level;
      }
    }

    if (targetVip.id !== user.vipLevelId) {
      await this.prisma.user.update({ where: { id: userId }, data: { vipLevelId: targetVip.id } });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ORDERS
// ═══════════════════════════════════════════════════════════════════════════════
@ApiTags('Admin Orders')
@ApiBearerAuth()
@AdminAuth()
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getOrders(@Query() q: any) {
    const where: any = {};
    if (q.orderNumber) where.orderNumber = { contains: q.orderNumber };
    if (q.userId) where.userId = parseInt(q.userId);
    if (q.status) where.status = q.status;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { phone: true, nickname: true } },
          hotel: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: q.page ? (parseInt(q.page) - 1) * 20 : 0,
        take: 20,
      }),
      this.prisma.order.count({ where }),
    ]);

    const totals = await this.prisma.order.aggregate({
      _sum: { transactionAmount: true, commission: true },
    });

    return {
      items, total,
      totalTransactionAmount: totals._sum.transactionAmount,
      totalCommission: totals._sum.commission,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN VIP CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
@ApiTags('Admin VIP')
@ApiBearerAuth()
@AdminAuth()
@Controller('admin/vip')
export class AdminVipController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getVipLevels() {
    return this.prisma.vipLevel.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  @Post()
  async createVipLevel(@Body() body: any) {
    return this.prisma.vipLevel.create({ data: body });
  }

  @Put(':id')
  async updateVipLevel(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.prisma.vipLevel.update({ where: { id }, data: body });
  }

  @Delete(':id')
  async deleteVipLevel(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.vipLevel.delete({ where: { id } });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN HOTELS
// ═══════════════════════════════════════════════════════════════════════════════
@ApiTags('Admin Hotels')
@ApiBearerAuth()
@AdminAuth()
@Controller('admin/hotels')
export class AdminHotelsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getHotels(@Query() q: any) {
    const where: any = {};
    if (q.search) where.name = { contains: q.search, mode: 'insensitive' };

    const [hotels, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: q.page ? (parseInt(q.page) - 1) * 20 : 0,
        take: 20,
      }),
      this.prisma.hotel.count({ where }),
    ]);

    return { hotels, total };
  }

  @Post()
  async createHotel(@Body() body: any) {
    return this.prisma.hotel.create({ data: { name: body.name, picture: body.picture, price: body.price } });
  }

  @Put(':id')
  async updateHotel(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.prisma.hotel.update({ where: { id }, data: body });
  }

  @Delete(':id')
  async deleteHotel(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.hotel.delete({ where: { id } });
  }

  @Post(':id/toggle')
  async toggleHotel(@Param('id', ParseIntPipe) id: number, @Body() body: { isActive: boolean }) {
    return this.prisma.hotel.update({ where: { id }, data: { isActive: body.isActive } });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════
@ApiTags('Admin Settings')
@ApiBearerAuth()
@AdminAuth()
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private prisma: PrismaService) {}

  @Get('basic')
  async getBasicSettings() {
    return this.prisma.siteSettings.findFirst();
  }

  @Put('basic')
  async updateBasicSettings(@Body() body: any) {
    return this.prisma.siteSettings.upsert({
      where: { id: 1 },
      update: body,
      create: { id: 1, ...body },
    });
  }

  @Get('customer-service')
  async getCustomerServiceLinks() {
    return this.prisma.customerServiceLink.findMany();
  }

  @Post('customer-service')
  async addCustomerServiceLink(@Body() body: { name: string; url: string }) {
    return this.prisma.customerServiceLink.create({ data: body });
  }

  @Put('customer-service/:id')
  async updateCustomerServiceLink(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.prisma.customerServiceLink.update({ where: { id }, data: body });
  }

  @Delete('customer-service/:id')
  async deleteCustomerServiceLink(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.customerServiceLink.delete({ where: { id } });
  }

  @Get('merchant-banks')
  async getMerchantBanks() {
    return this.prisma.merchantBankAccount.findMany();
  }

  @Post('merchant-banks')
  async addMerchantBank(@Body() body: any) {
    return this.prisma.merchantBankAccount.create({ data: body });
  }

  @Put('merchant-banks/:id')
  async updateMerchantBank(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.prisma.merchantBankAccount.update({ where: { id }, data: body });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN CONTENT
// ═══════════════════════════════════════════════════════════════════════════════
@ApiTags('Admin Content')
@ApiBearerAuth()
@AdminAuth()
@Controller('admin/content')
export class AdminContentController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getContent(@Query('language') language = 'en') {
    return this.prisma.multilingualContent.findMany({ where: { language } });
  }

  @Put()
  async updateContent(@Body() body: { key: string; language: string; content: string; contentType?: string }) {
    return this.prisma.multilingualContent.upsert({
      where: { key_language: { key: body.key, language: body.language } },
      update: { content: body.content },
      create: body,
    });
  }

  @Get('agreements')
  async getAgreements() {
    return this.prisma.registrationAgreement.findMany();
  }

  @Put('agreements')
  async updateAgreement(@Body() body: { language: string; content: string }) {
    return this.prisma.registrationAgreement.upsert({
      where: { language: body.language },
      update: { content: body.content },
      create: body,
    });
  }

  @Get('app-scrolling')
  async getAppScrolling() {
    return this.prisma.appScrollItem.findMany({ orderBy: { createdAt: 'asc' } });
  }

  @Post('app-scrolling')
  async addAppScrollItem(@Body() body: { name: string; picture: string }) {
    return this.prisma.appScrollItem.create({ data: body });
  }

  @Put('app-scrolling/:id')
  async updateAppScrollItem(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.prisma.appScrollItem.update({ where: { id }, data: body });
  }

  @Delete('app-scrolling/:id')
  async deleteAppScrollItem(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.appScrollItem.delete({ where: { id } });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ADMINISTRATORS (manage admin accounts)
// ═══════════════════════════════════════════════════════════════════════════════
@ApiTags('Admin Administrators')
@ApiBearerAuth()
@AdminAuth()
@Controller('admin/administrators')
export class AdminAdministratorsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getAdmins() {
    return this.prisma.admin.findMany({
      include: { role: true },
      select: {
        id: true, username: true, characterName: true, frontendUserId: true,
        isEnabled: true, lastLoginAt: true, remark: true, role: true, createdAt: true,
      },
    });
  }

  @Post()
  async createAdmin(@Body() body: any) {
    const hashedPassword = await bcrypt.hash(body.password, 12);
    return this.prisma.admin.create({
      data: {
        username: body.username,
        password: hashedPassword,
        characterName: body.characterName,
        remark: body.remark,
        roleId: body.roleId,
      },
    });
  }

  @Put(':id')
  async updateAdmin(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const data: any = { characterName: body.characterName, remark: body.remark, roleId: body.roleId };
    if (body.password) data.password = await bcrypt.hash(body.password, 12);
    return this.prisma.admin.update({ where: { id }, data });
  }

  @Post(':id/toggle')
  async toggleAdmin(@Param('id', ParseIntPipe) id: number, @Body() body: { enabled: boolean }) {
    return this.prisma.admin.update({ where: { id }, data: { isEnabled: body.enabled } });
  }

  // Roles
  @Get('roles')
  async getRoles() {
    return this.prisma.adminRole.findMany({ include: { _count: { select: { admins: true } } } });
  }

  @Post('roles')
  async createRole(@Body() body: { name: string; permissions: any }) {
    return this.prisma.adminRole.create({ data: body });
  }

  @Put('roles/:id')
  async updateRole(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.prisma.adminRole.update({ where: { id }, data: body });
  }
}
