import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API Root Welcome Endpoint' })
  @ApiResponse({ status: 200, description: 'Welcome payload with documentation links' })
  getWelcome() {
    return {
      message: 'Welcome to HAVENHUB Property Rental Marketplace REST API',
      version: '1.0.0',
      status: 'active',
      documentation: '/api/docs',
      endpoints: {
        health: '/api/v1/health',
        properties: '/api/v1/properties',
        auth: '/api/v1/auth',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
