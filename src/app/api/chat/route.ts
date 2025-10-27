import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations, messages, llmResponses, llmConfigs } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { callMultipleLLMs } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, llmConfigIds, conversationId } = await request.json();

    if (!prompt || !llmConfigIds || llmConfigIds.length === 0) {
      return NextResponse.json(
        { error: 'Prompt and LLM configs are required' },
        { status: 400 }
      );
    }

    if (llmConfigIds.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 LLMs can be selected' },
        { status: 400 }
      );
    }

    // Get LLM configurations
    const configs = await db.query.llmConfigs.findMany({
      where: and(
        eq(llmConfigs.userId, session.user.id),
        inArray(llmConfigs.id, llmConfigIds)
      ),
    });

    if (configs.length !== llmConfigIds.length) {
      return NextResponse.json(
        { error: 'Some LLM configurations not found' },
        { status: 404 }
      );
    }

    // Create or get conversation
    let convId = conversationId;
    if (!convId) {
      const [newConv] = await db.insert(conversations).values({
        userId: session.user.id,
        title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
      }).returning();
      convId = newConv.id;
    }

    // Create user message
    const [userMessage] = await db.insert(messages).values({
      conversationId: convId,
      role: 'user',
      content: prompt,
      selectedModels: llmConfigIds,
    }).returning();

    // Call multiple LLMs in parallel
    const llmResults = await callMultipleLLMs(
      configs.map(c => ({
        id: c.id,
        name: c.name,
        provider: c.provider,
        model: c.model,
        apiKey: c.apiKey,
        apiEndpoint: c.apiEndpoint || undefined,
        config: c.config as Record<string, unknown> | undefined,
      })),
      { prompt }
    );

    // Create assistant message placeholder
    const [assistantMessage] = await db.insert(messages).values({
      conversationId: convId,
      role: 'assistant',
      content: '', // Not used for assistant messages with multiple responses
    }).returning();

    // Store LLM responses
    const responseRecords = await Promise.all(
      llmResults.map(async (result) => {
        const [response] = await db.insert(llmResponses).values({
          messageId: assistantMessage.id,
          llmConfigId: result.configId,
          content: result.response.content || '',
          tokensUsed: result.response.tokensUsed,
          responseTime: `${result.response.responseTime}ms`,
          error: result.response.error,
        }).returning();

        const config = configs.find(c => c.id === result.configId);
        return {
          id: response.id,
          llmConfigId: response.llmConfigId,
          llmName: config?.name || 'Unknown',
          content: response.content,
          responseTime: response.responseTime,
          error: response.error,
        };
      })
    );

    // Update conversation timestamp
    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, convId));

    return NextResponse.json({
      conversationId: convId,
      userMessage: {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
        createdAt: userMessage.createdAt,
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: 'assistant',
        content: '',
        responses: responseRecords,
        createdAt: assistantMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
