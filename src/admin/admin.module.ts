import { Module } from '@nestjs/common';
import {
  AdminDashboardController,
  AdminMembersController,
  AdminFinancialController,
  AdminOrdersController,
  AdminVipController,
  AdminHotelsController,
  AdminSettingsController,
  AdminContentController,
  AdminAdministratorsController,
} from './admin.controller';

@Module({
  controllers: [
    AdminDashboardController,
    AdminMembersController,
    AdminFinancialController,
    AdminOrdersController,
    AdminVipController,
    AdminHotelsController,
    AdminSettingsController,
    AdminContentController,
    AdminAdministratorsController,
  ],
})
export class AdminModule {}
