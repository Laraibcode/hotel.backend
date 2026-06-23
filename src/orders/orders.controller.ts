// orders.controller.ts
import {
  Controller, Post, Get, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a booking task - get random hotel assignment' })
  async startTask(@Request() req) {
    return this.ordersService.startTask(req.user.id);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit/confirm a booking task' })
  async submitTask(@Request() req, @Body() body: { hotelId: number; slotNumber: number }) {
    return this.ordersService.submitTask(req.user.id, body);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get order history' })
  @ApiQuery({ name: 'filter', enum: ['all', 'pending', 'completed'], required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  async getHistory(
    @Request() req,
    @Query('filter') filter = 'all',
    @Query('page') page = 1,
  ) {
    return this.ordersService.getHistory(req.user.id, filter, Number(page));
  }

  @Get('today-profit')
  @ApiOperation({ summary: 'Get today profit' })
  async getTodayProfit(@Request() req) {
    return { profit: await this.ordersService.getTodayProfit(req.user.id) };
  }
}

// orders.module.ts
import { Module } from '@nestjs/common';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
