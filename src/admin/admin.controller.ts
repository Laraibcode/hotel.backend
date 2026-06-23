import { Controller, Get } from '@nestjs/common';

@Controller('admin')
export class AdminController {
  @Get('stats')
  async getStats() {
    return { status: 'ok' };
  }
}
