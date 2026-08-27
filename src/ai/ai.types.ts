export interface GenerateDescriptionResponse {
  success: boolean;
  generatedDescription: string;
  fallback?: boolean;
}

export interface SummarizeResponse {
  success: boolean;
  highlights: string[];
  fallback?: boolean;
}