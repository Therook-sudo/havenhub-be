import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Check system health and database connectivity' })
  @ApiResponse({ status: 200, description: 'System health report' })
  async checkHealth() {
    const isDbConnected = await this.prismaService.isHealthy();

    return {
      status: isDbConnected ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      database: {
        provider: 'postgresql',
        status: isDbConnected ? 'connected' : 'disconnected',
      },
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
