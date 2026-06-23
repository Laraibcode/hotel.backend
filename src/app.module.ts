import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';

@Module({ imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), PrismaModule, AuthModule, OrdersModule, AdminModule] })
export class AppModule {}
