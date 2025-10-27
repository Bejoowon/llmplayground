export interface LLMConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  apiKey: string;
  apiEndpoint?: string;
  config?: Record<string, unknown>;
}

export interface LLMRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  responseTime: number;
  error?: string;
}

export interface LLMProvider {
  call(config: LLMConfig, request: LLMRequest): Promise<LLMResponse>;
}
