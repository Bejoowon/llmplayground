import { LLMConfig, LLMRequest, LLMResponse, LLMProvider } from '../types';

export class CustomProvider implements LLMProvider {
  async call(config: LLMConfig, request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      if (!config.apiEndpoint) {
        throw new Error('Custom provider requires an API endpoint');
      }

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

      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          ...((config.config?.headers as Record<string, string>) || {}),
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
          error: `Custom API error: ${response.status} - ${error}`,
        };
      }

      const data = await response.json();

      // Try to extract content from common response formats
      let content = '';
      if (data.choices?.[0]?.message?.content) {
        content = data.choices[0].message.content;
      } else if (data.content?.[0]?.text) {
        content = data.content[0].text;
      } else if (data.response) {
        content = data.response;
      } else if (data.text) {
        content = data.text;
      } else {
        content = JSON.stringify(data);
      }

      return {
        content,
        tokensUsed: data.usage ? {
          prompt: data.usage.prompt_tokens || data.usage.input_tokens || 0,
          completion: data.usage.completion_tokens || data.usage.output_tokens || 0,
          total: data.usage.total_tokens || 0,
        } : undefined,
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
