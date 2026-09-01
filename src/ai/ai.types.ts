export interface GenerateDescriptionResponse {
  success: boolean;
  generatedDescription: string;
  fallback?: boolean;
  error?: string;
}

export interface SummarizeResponse {
  success: boolean;
  highlights: string[];
  fallback?: boolean;
  error?: string;
}