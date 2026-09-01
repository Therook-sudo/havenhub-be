import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateDescriptionResponse, SummarizeResponse } from './ai.types';

const LLM_TIMEOUT_MS = 3000;
const SUMMARY_BYPASS_WORD_COUNT = 30;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    // Using Groq's free tier via its OpenAI-compatible API.
    // No billing required for the free tier as of this writing.
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  /**
   * Generates a property description from freeform landlord input.
   * Frontend sends raw text (not structured fields) - see generate-description.dto.ts
   */
  async generateDescription(userInput: string): Promise<GenerateDescriptionResponse> {
    const prompt = this.buildDescriptionPrompt(userInput);

    try {
      const completion = await this.withTimeout(
        this.client.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content:
                'You are a real estate copywriter for a Nigerian property rental platform. ' +
                'Write clear, appealing, factual property descriptions. Do not invent details ' +
                'the user did not mention (e.g. do not add a pool if none was stated). ' +
                'Keep it to 2-4 sentences. Do not use markdown formatting.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
        LLM_TIMEOUT_MS,
      );

      const generatedDescription = completion.choices[0]?.message?.content?.trim();

      if (!generatedDescription) {
        return this.descriptionFallback(userInput);
      }

      return { success: true, generatedDescription };
    } catch (err) {
      this.logger.warn(`generateDescription failed/timed out: ${(err as Error).message}`);
      return this.descriptionFallback(userInput);
    }
  }

  /**
   * Summarizes a listing description into exactly 3 highlights.
   * Bypasses the LLM entirely if the description is under 30 words (PRD requirement).
   */
  async summarize(description: string): Promise<SummarizeResponse> {
    const wordCount = description.trim().split(/\s+/).filter(Boolean).length;

    if (wordCount < SUMMARY_BYPASS_WORD_COUNT) {
      // Per PRD: short descriptions bypass AI and return the raw text.
      // Frontend expects a `highlights` string array regardless, so we
      // return the raw text as a single-element array to keep the
      // response shape consistent for the frontend's map/loop logic.
      return { success: true, highlights: [description.trim()] };
    }

    const prompt = this.buildSummaryPrompt(description);

    try {
      const completion = await this.withTimeout(
        this.client.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content:
                'You extract exactly 3 concise selling points from property listing ' +
                'descriptions (e.g. proximity, utilities, parking, amenities). ' +
                'Respond with ONLY a JSON array of exactly 3 short strings, no markdown, ' +
                'no extra commentary. Example: ["Spacious 3-bedroom layout", ' +
                '"Private swimming pool access", "24/7 continuous power supply"]',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 150,
        }),
        LLM_TIMEOUT_MS,
      );

      const raw = completion.choices[0]?.message?.content?.trim() ?? '';
      const highlights = this.parseHighlights(raw);

      if (!highlights) {
        return this.summaryFallback(description);
      }

      return { success: true, highlights };
    } catch (err) {
      this.logger.warn(`summarize failed/timed out: ${(err as Error).message}`);
      return this.summaryFallback(description);
    }
  }

  private buildDescriptionPrompt(userInput: string): string {
    return `Write a property listing description based on this landlord input: "${userInput}"`;
  }

  private buildSummaryPrompt(description: string): string {
    return `Extract exactly 3 key highlights from this property description:\n\n${description}`;
  }

  private parseHighlights(raw: string): string[] | null {
    try {
      // Strip potential markdown code fences just in case the model adds them
      const cleaned = raw.replace(/^```json\s*|```$/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length === 3 && parsed.every((h) => typeof h === 'string')) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  private descriptionFallback(userInput: string): GenerateDescriptionResponse {
    // Graceful degradation per NFR: never block listing creation.
    // Return the user's own input as the description so the textarea
    // still has editable content, just not AI-enhanced.
    return {
      success: true,
      generatedDescription: userInput,
      fallback: true,
    };
  }

  private summaryFallback(description: string): SummarizeResponse {
    return {
      success: true,
      highlights: [description.trim()],
      fallback: true,
    };
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`LLM request exceeded ${ms}ms timeout`)), ms),
      ),
    ]);
  }
}