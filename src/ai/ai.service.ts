import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateDescriptionResponse, SummarizeResponse } from './ai.types';

const LLM_TIMEOUT_MS = 10000;
const SUMMARY_BYPASS_WORD_COUNT = 30;

// Supported production models on Groq in priority order
const GROQ_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
];

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI | null = null;
  private readonly isGroq: boolean = true;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('GROQ_API_KEY') ||
      process.env.GROQ_API_KEY ||
      this.configService.get<string>('OPENAI_API_KEY') ||
      process.env.OPENAI_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      this.isGroq = apiKey.startsWith('gsk_') || !apiKey.startsWith('sk-');
      this.client = new OpenAI({
        apiKey: apiKey.trim(),
        baseURL: this.isGroq ? 'https://api.groq.com/openai/v1' : undefined,
      });
      this.logger.log(
        `AiService initialized successfully with ${this.isGroq ? 'Groq' : 'OpenAI'} provider.`,
      );
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
      return this.descriptionFallback(userInput, 'GROQ_API_KEY is not configured in environment variables');
    }

    const prompt = this.buildDescriptionPrompt(userInput);
    const modelsToTry = this.isGroq ? GROQ_MODELS : ['gpt-4o-mini', 'gpt-3.5-turbo'];

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      try {
        const completion = await this.withTimeout(
          this.client.chat.completions.create({
            model,
            messages: [
             {
  role: 'system',
  content:
    'You are an experienced real estate copywriter for a Nigerian property rental ' +
    'marketplace. Write listing descriptions the way top Nigerian agents actually write ' +
    'them: warm, confident, and specific, not generic or overly formal. ' +
    'Use natural Nigerian real estate terms where they fit the property described: ' +
    '"self-contain", "serviced apartment", "ensuite rooms", "BQ" (boys\' quarters), ' +
    '"tastefully finished", "secured/gated estate", "24-hour power", "good access roads". ' +
    'Anchor the location naturally (e.g. "in the heart of X", "along Y") rather than a ' +
    'bare address. Do NOT invent details the user did not mention (e.g. do not add a ' +
    'pool, BQ, or security features if none were stated). ' +
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

        if (generatedDescription) {
          return { success: true, generatedDescription };
        }
      } catch (err) {
        lastError = err as Error;
        this.logger.warn(`Model [${model}] failed: ${(err as Error).message}. Trying next available model...`);
        // If it's a 404 (model not found), continue trying the next candidate model
        if ((err as Error).message?.includes('404') || (err as Error).message?.includes('does not exist')) {
          continue;
        }
        break;
      }
    }

    const errorMsg = lastError ? lastError.message : 'No available models succeeded';
    return this.descriptionFallback(userInput, errorMsg);
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
      return this.summaryFallback(description, 'GROQ_API_KEY is not configured in environment variables');
    }

    const prompt = this.buildSummaryPrompt(description);
    const modelsToTry = this.isGroq ? GROQ_MODELS : ['gpt-4o-mini', 'gpt-3.5-turbo'];

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      try {
        const completion = await this.withTimeout(
          this.client.chat.completions.create({
            model,
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

        if (highlights && highlights.length > 0) {
          return { success: true, highlights };
        }
      } catch (err) {
        lastError = err as Error;
        this.logger.warn(`Model [${model}] failed in summarize: ${(err as Error).message}. Trying next available model...`);
        if ((err as Error).message?.includes('404') || (err as Error).message?.includes('does not exist')) {
          continue;
        }
        break;
      }
    }

    const errorMsg = lastError ? lastError.message : 'Could not extract 3 highlights from model';
    return this.summaryFallback(description, errorMsg);
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

  private descriptionFallback(userInput: string, error?: string): GenerateDescriptionResponse {
    return {
      success: true,
      generatedDescription: userInput,
      fallback: true,
      error,
    };
  }

  private summaryFallback(description: string, error?: string): SummarizeResponse {
    return {
      success: true,
      highlights: [description.trim()],
      fallback: true,
      error,
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