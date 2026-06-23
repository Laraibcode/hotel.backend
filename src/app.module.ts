import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({ imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), PrismaModule, AuthModule, AdminModule] })
export class AppModule {}
