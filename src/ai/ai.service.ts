import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateDescriptionResponse, SummarizeResponse } from './ai.types';

const LLM_TIMEOUT_MS = 10000; // 10 seconds for reliable cloud-to-cloud latency
const SUMMARY_BYPASS_WORD_COUNT = 30;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('GROQ_API_KEY') ||
      process.env.GROQ_API_KEY ||
      this.configService.get<string>('OPENAI_API_KEY') ||
      process.env.OPENAI_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      const isGroq = apiKey.startsWith('gsk_') || !apiKey.startsWith('sk-');
      this.client = new OpenAI({
        apiKey: apiKey.trim(),
        baseURL: isGroq ? 'https://api.groq.com/openai/v1' : undefined,
      });
      this.logger.log(`AiService initialized successfully with ${isGroq ? 'Groq' : 'OpenAI'} provider.`);
    } else {
      this.logger.warn(
        'GROQ_API_KEY / OPENAI_API_KEY is not configured in environment variables. AiService will safely use built-in fallback copy templates.',
      );
    }
  }

  /**
   * Generates a property description from freeform landlord input.
   */
  async generateDescription(userInput: string): Promise<GenerateDescriptionResponse> {
    if (!this.client) {
      this.logger.warn('generateDescription: No API key configured, using fallback template.');
      return this.descriptionFallback(userInput);
    }

    const prompt = this.buildDescriptionPrompt(userInput);

    try {
      const completion = await this.withTimeout(
        this.client.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content:
                'You are a professional real estate copywriter for a Nigerian property rental marketplace. ' +
                'Write clear, appealing, factual property descriptions. Do not invent features ' +
                'the user did not mention (e.g. do not add a swimming pool if none was stated). ' +
                'Keep it concise (2-4 sentences). Do not use markdown formatting.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 300,
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
      return { success: true, highlights: [description.trim()] };
    }

    if (!this.client) {
      this.logger.warn('summarize: No API key configured, using fallback template.');
      return this.summaryFallback(description);
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
                'Extract exactly 3 concise selling points from this Nigerian property rental description ' +
                '(e.g. location convenience, utilities, parking, security, amenities). ' +
                'Respond with ONLY a JSON array of 3 short strings, with no extra markdown or explanations. ' +
                'Example: ["Spacious 3-bedroom master layout", "24/7 continuous power supply", "Private gated security with ample parking"]',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 200,
        }),
        LLM_TIMEOUT_MS,
      );

      const raw = completion.choices[0]?.message?.content?.trim() ?? '';
      const highlights = this.parseHighlights(raw);

      if (!highlights || highlights.length === 0) {
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

  /**
   * Multi-strategy highlight parser: handles JSON arrays, markdown code fences, and bullet points.
   */
  private parseHighlights(raw: string): string[] | null {
    if (!raw || raw.trim().length === 0) return null;

    try {
      // Strategy 1: Direct JSON parsing with cleanup
      const cleaned = raw.replace(/^```json\s*|```$/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((h) => typeof h === 'string')) {
        return parsed.slice(0, 3);
      }
    } catch {
      // Ignore JSON parse error, proceed to fallback strategies
    }

    try {
      // Strategy 2: Regex extraction of JSON array from anywhere in the output
      const jsonMatch = raw.match(/\[\s*"(?:[^"\\]|\\.)*"(?:\s*,\s*"(?:[^"\\]|\\.)*")*\s*\]/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 3);
        }
      }
    } catch {
      // Ignore regex JSON parse error
    }

    // Strategy 3: Bullet points / line split fallback
    const lines = raw
      .split('\n')
      .map((line) => line.replace(/^[-*•\d.)\]\s]+/, '').replace(/^["']|["']$/g, '').trim())
      .filter((line) => line.length > 3 && !line.startsWith('[') && !line.startsWith(']'));

    if (lines.length >= 3) {
      return lines.slice(0, 3);
    }

    return null;
  }

  private descriptionFallback(userInput: string): GenerateDescriptionResponse {
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