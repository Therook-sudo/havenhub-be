import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateDescriptionDto } from './dto/generate-description.dto';
import { SummarizeDto } from './dto/summarize.dto';
import { GenerateDescriptionResponse, SummarizeResponse } from './ai.types';

@ApiTags('AI Listing Assistant')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-description')
  @ApiOperation({
    summary: 'Generate Listing Description with AI (POST)',
    description:
      'Generates engaging, appealing real estate property description copy from raw landlord input.',
  })
  @ApiResponse({
    status: 201,
    description: 'AI description generated successfully',
  })
  async generateDescription(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: GenerateDescriptionDto,
  ): Promise<GenerateDescriptionResponse> {
    return this.aiService.generateDescription(dto.userInput);
  }

  @Get('generate-description')
  @ApiOperation({
    summary: 'Generate Listing Description with AI (GET / Query)',
    description:
      'Convenience GET endpoint for mobile / Flutter clients to generate listing copy via query parameters.',
  })
  @ApiQuery({ name: 'userInput', description: 'Raw listing notes/input' })
  @ApiResponse({
    status: 200,
    description: 'AI description generated successfully',
  })
  async generateDescriptionGet(
    @Query('userInput') userInput?: string,
  ): Promise<GenerateDescriptionResponse> {
    if (!userInput || userInput.trim().length === 0) {
      throw new BadRequestException('The "userInput" query parameter is required.');
    }
    return this.aiService.generateDescription(userInput.trim());
  }

  @Post('summarize')
  @ApiOperation({
    summary: 'Summarize Property Listing Highlights (POST)',
    description:
      'Extracts 3 key highlights from a property description. Automatically bypasses AI if description is under 30 words.',
  })
  @ApiResponse({
    status: 201,
    description: 'Highlights extracted successfully',
  })
  async summarize(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: SummarizeDto,
  ): Promise<SummarizeResponse> {
    return this.aiService.summarize(dto.description);
  }

  @Get('summarize')
  @ApiOperation({
    summary: 'Summarize Property Listing Highlights (GET / Query)',
    description:
      'Convenience GET endpoint for mobile / Flutter clients to summarize listing text via query parameters.',
  })
  @ApiQuery({ name: 'description', description: 'Listing description text to summarize' })
  @ApiResponse({
    status: 200,
    description: 'Highlights extracted successfully',
  })
  async summarizeGet(
    @Query('description') description?: string,
  ): Promise<SummarizeResponse> {
    if (!description || description.trim().length === 0) {
      throw new BadRequestException('The "description" query parameter is required.');
    }
    return this.aiService.summarize(description.trim());
  }
}