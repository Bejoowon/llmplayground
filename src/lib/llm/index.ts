import { LLMConfig, LLMRequest, LLMResponse, LLMProvider } from './types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { CustomProvider } from './providers/custom';

const providers: Record<string, LLMProvider> = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  custom: new CustomProvider(),
};

export async function callLLM(
  config: LLMConfig,
  request: LLMRequest
): Promise<LLMResponse> {
  const provider = providers[config.provider];

  if (!provider) {
    return {
      content: '',
      responseTime: 0,
      error: `Unknown provider: ${config.provider}`,
    };
  }

  return provider.call(config, request);
}

export async function callMultipleLLMs(
  configs: LLMConfig[],
  request: LLMRequest
): Promise<Array<{ configId: string; response: LLMResponse }>> {
  const promises = configs.map(async (config) => ({
    configId: config.id,
    response: await callLLM(config, request),
  }));

  return Promise.all(promises);
}

export * from './types';
