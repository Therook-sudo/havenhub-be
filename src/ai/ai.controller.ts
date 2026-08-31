import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
    summary: 'Generate Listing Description with AI',
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

  @Post('summarize')
  @ApiOperation({
    summary: 'Summarize Property Listing Highlights',
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
}