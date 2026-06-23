import {
  Injectable, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async startTask(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vipLevel: true },
    });

    // Reset daily orders if new day
    await this.resetDailyOrdersIfNeeded(user);

    // Checks
    if (user.ordersBlocked) throw new ForbiddenException('Your orders have been blocked by admin');
    if (user.status !== 'ENABLED') throw new ForbiddenException('Account is not active');
    if (!user.transactionStatus) throw new ForbiddenException('Transactions are disabled');

    // Check working hours
    await this.checkWorkingHours();

    // Check daily limit
    if (user.dailyOrderCount >= user.vipLevel.dailyOrderVolume) {
      throw new BadRequestException('Daily order limit reached');
    }

    // Check balance
    if (Number(user.balance) <= 0) {
      throw new BadRequestException('Insufficient balance. Please deposit first.');
    }

    // Get next slot number
    const nextSlot = user.dailyOrderCount + 1;

    // Check if slot is pinned (manual order setting)
    const pinnedSlot = await this.prisma.userOrderSlot.findUnique({
      where: { userId_slotNumber: { userId, slotNumber: nextSlot } },
      include: { hotel: true },
    });

    let hotel: any;
    let multiplier = 1;

    if (pinnedSlot && !pinnedSlot.isRandom && pinnedSlot.hotel) {
      hotel = pinnedSlot.hotel;
      multiplier = Number(pinnedSlot.multiplier);
    } else {
      // Random hotel from pool
      hotel = await this.getRandomHotel(user);
    }

    if (!hotel) throw new BadRequestException('No available hotels. Contact admin.');

    const transactionAmount = Number(hotel.price) * Math.abs(multiplier);

    // Check balance covers booking amount
    if (Number(user.balance) < transactionAmount) {
      throw new BadRequestException('Balance too low for any order. Please deposit.');
    }

    return {
      hotel: {
        id: hotel.id,
        name: hotel.name,
        picture: hotel.picture,
        price: hotel.price,
      },
      transactionAmount,
      commission: multiplier > 0
        ? Number(transactionAmount) * Number(user.vipLevel.orderCommissionRate)
        : Number(transactionAmount) * Number(user.vipLevel.orderCommissionRate) * -1,
      commissionRate: user.vipLevel.orderCommissionRate,
      slotNumber: nextSlot,
      multiplier,
    };
  }

  async submitTask(userId: number, body: { hotelId: number; slotNumber: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vipLevel: true },
    });

    const hotel = await this.prisma.hotel.findUnique({ where: { id: body.hotelId } });
    if (!hotel || !hotel.isActive) throw new BadRequestException('Hotel not available');

    // Re-check slot pin
    const pinnedSlot = await this.prisma.userOrderSlot.findUnique({
      where: { userId_slotNumber: { userId, slotNumber: body.slotNumber } },
    });

    const multiplier = pinnedSlot && !pinnedSlot.isRandom ? Number(pinnedSlot.multiplier) : 1;
    const transactionAmount = Number(hotel.price) * Math.abs(multiplier);
    const commission = transactionAmount * Number(user.vipLevel.orderCommissionRate);
    const netCommission = multiplier > 0 ? commission : -commission;

    // Check balance
    if (Number(user.balance) < transactionAmount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Generate order number
    const orderNumber = `SC${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Execute transaction
    await this.prisma.$transaction(async (tx) => {
      const balanceBefore = Number(user.balance);

      // Deduct booking amount from balance
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: transactionAmount },
          dailyOrderCount: { increment: 1 },
        },
      });

      // Record trade (expenditure)
      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'TRADE',
          state: 'expenditure',
          balanceBefore,
          balanceAfter: balanceBefore - transactionAmount,
          amount: transactionAmount,
          description: `Booking: ${hotel.name}`,
        },
      });

      const balanceAfterTrade = balanceBefore - transactionAmount;

      // Return principal + commission
      const returnAmount = transactionAmount + netCommission;
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: returnAmount },
          totalCommissions: { increment: netCommission },
        },
      });

      // Record return principal
      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'RETURN_PRINCIPAL',
          state: 'income',
          balanceBefore: balanceAfterTrade,
          balanceAfter: balanceAfterTrade + transactionAmount,
          amount: transactionAmount,
          description: `Return principal: ${hotel.name}`,
        },
      });

      // Record commission
      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'TRANSACTION_COMMISSION',
          state: netCommission > 0 ? 'income' : 'expenditure',
          balanceBefore: balanceAfterTrade + transactionAmount,
          balanceAfter: balanceAfterTrade + transactionAmount + netCommission,
          amount: Math.abs(netCommission),
          description: `Commission: ${hotel.name}`,
        },
      });

      // Create order record
      await tx.order.create({
        data: {
          orderNumber,
          userId,
          hotelId: hotel.id,
          slotNumber: body.slotNumber,
          unitPrice: hotel.price,
          transactionVolume: 1,
          transactionAmount,
          commission: netCommission,
          commissionRate: user.vipLevel.orderCommissionRate,
          status: 'COMPLETE',
          settledAt: new Date(),
        },
      });

      // Handle referral commission
      if (user.referrerId && netCommission > 0) {
        await this.handleReferralCommission(tx, user.referrerId, netCommission, userId);
      }

      // Check if all daily orders completed → pay grade salary
      const updatedUser = await tx.user.findUnique({ where: { id: userId }, include: { vipLevel: true } });
      if (
        updatedUser.dailyOrderCount >= updatedUser.vipLevel.dailyOrderVolume &&
        Number(updatedUser.vipLevel.gradeSalary) > 0
      ) {
        const salary = Number(updatedUser.vipLevel.gradeSalary);
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: salary } },
        });
        await tx.walletTransaction.create({
          data: {
            userId,
            type: 'SALARY',
            state: 'income',
            balanceBefore: Number(updatedUser.balance),
            balanceAfter: Number(updatedUser.balance) + salary,
            amount: salary,
            description: 'Grade salary - all tasks completed',
          },
        });
      }
    });

    // Get updated user
    const updatedUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vipLevel: true },
    });

    return {
      orderNumber,
      commission: netCommission,
      newBalance: updatedUser.balance,
      dailyOrderCount: updatedUser.dailyOrderCount,
      dailyOrderLimit: updatedUser.vipLevel.dailyOrderVolume,
      todayProfit: await this.getTodayProfit(userId),
    };
  }

  async getHistory(userId: number, filter: string, page = 1, limit = 20) {
    const where: any = { userId };
    if (filter === 'pending') where.status = 'WAITING';
    if (filter === 'completed') where.status = 'COMPLETE';

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { hotel: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit };
  }

  async getTodayProfit(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prisma.order.aggregate({
      where: {
        userId,
        status: 'COMPLETE',
        settledAt: { gte: today },
      },
      _sum: { commission: true },
    });

    return Number(result._sum.commission || 0);
  }

  private async getRandomHotel(user: any) {
    const vip = user.vipLevel;
    const where: any = { isActive: true };

    if (Number(vip.lowestProductPrice) > 0) {
      where.price = { gte: vip.lowestProductPrice };
    }
    if (Number(vip.highestProductPrice) > 0) {
      where.price = { ...where.price, lte: vip.highestProductPrice };
    }

    // Also filter by user balance
    where.price = { ...where.price, lte: user.balance };

    const count = await this.prisma.hotel.count({ where });
    if (count === 0) return null;

    const skip = Math.floor(Math.random() * count);
    const hotels = await this.prisma.hotel.findMany({ where, skip, take: 1 });
    return hotels[0];
  }

  private async handleReferralCommission(
    tx: any,
    referrerId: number,
    orderCommission: number,
    userId: number,
  ) {
    const settings = await tx.siteSettings.findFirst();
    const rate = Number(settings?.level1CommissionRate || 0.30);
    const referralCommission = orderCommission * rate;

    if (referralCommission <= 0) return;

    const referrer = await tx.user.findUnique({ where: { id: referrerId } });
    await tx.user.update({
      where: { id: referrerId },
      data: { balance: { increment: referralCommission } },
    });

    await tx.walletTransaction.create({
      data: {
        userId: referrerId,
        type: 'REFERRAL_COMMISSION',
        state: 'income',
        balanceBefore: Number(referrer.balance),
        balanceAfter: Number(referrer.balance) + referralCommission,
        amount: referralCommission,
        description: `Referral commission from user #${userId}`,
        referenceId: String(userId),
      },
    });
  }

  private async checkWorkingHours() {
    const settings = await this.prisma.siteSettings.findFirst();
    if (!settings) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (currentTime < settings.openingTime || currentTime > settings.closingTime) {
      throw new BadRequestException(
        `Orders only available during working hours: ${settings.openingTime} - ${settings.closingTime}`
      );
    }
  }

  private async resetDailyOrdersIfNeeded(user: any) {
    const now = new Date();
    const lastReset = new Date(user.lastOrderResetAt);

    if (
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { dailyOrderCount: 0, lastOrderResetAt: now },
      });
      user.dailyOrderCount = 0;
    }
  }
}
