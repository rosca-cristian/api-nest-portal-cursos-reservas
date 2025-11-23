import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  getHello(): object {
    return {
      status: 'ok',
      message: 'API Cursos y Reservas is running',
      timestamp: new Date().toISOString(),
      endpoints: {
        api: '/api',
        docs: '/api/docs',
      },
    };
  }
}
