import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Check system health and PostgreSQL database connectivity' })
  @ApiResponse({ status: 200, description: 'System health report' })
  async checkHealth() {
    let isDbConnected = false;
    try {
      if (this.dataSource && this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        isDbConnected = true;
      }
    } catch {
      isDbConnected = false;
    }

    return {
      status: isDbConnected ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      database: {
        provider: 'postgresql',
        orm: 'typeorm',
        status: isDbConnected ? 'connected' : 'disconnected',
      },
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
