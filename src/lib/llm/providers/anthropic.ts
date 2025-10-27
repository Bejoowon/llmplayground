import { LLMConfig, LLMRequest, LLMResponse, LLMProvider } from '../types';

export class AnthropicProvider implements LLMProvider {
  async call(config: LLMConfig, request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const endpoint = config.apiEndpoint || 'https://api.anthropic.com/v1/messages';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'user',
              content: request.prompt,
            },
          ],
          system: request.systemPrompt,
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
          error: `Anthropic API error: ${response.status} - ${error}`,
        };
      }

      const data = await response.json();

      return {
        content: data.content[0].text,
        tokensUsed: {
          prompt: data.usage?.input_tokens || 0,
          completion: data.usage?.output_tokens || 0,
          total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
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
