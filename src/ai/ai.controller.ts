import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateDescriptionDto } from './dto/generate-description.dto';
import { SummarizeDto } from './dto/summarize.dto';
import { GenerateDescriptionResponse, SummarizeResponse } from './ai.types';

@Controller('api/v1/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-description')
  async generateDescription(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: GenerateDescriptionDto,
  ): Promise<GenerateDescriptionResponse> {
    return this.aiService.generateDescription(dto.userInput);
  }

  @Post('summarize')
  async summarize(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: SummarizeDto,
  ): Promise<SummarizeResponse> {
    return this.aiService.summarize(dto.description);
  }
}