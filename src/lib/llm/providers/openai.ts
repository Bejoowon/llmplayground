import { LLMConfig, LLMRequest, LLMResponse, LLMProvider } from '../types';

export class OpenAIProvider implements LLMProvider {
  async call(config: LLMConfig, request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const endpoint = config.apiEndpoint || 'https://api.openai.com/v1/chat/completions';

      const messages = [];
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }
      messages.push({
        role: 'user',
        content: request.prompt,
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 2000,
          ...config.config,
        }),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.text();
        return {
          content: '',
          responseTime,
          error: `OpenAI API error: ${response.status} - ${error}`,
        };
      }

      const data = await response.json();

      return {
        content: data.choices[0].message.content,
        tokensUsed: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0,
          total: data.usage?.total_tokens || 0,
        },
        responseTime,
      };
    } catch (error) {
      return {
        content: '',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
