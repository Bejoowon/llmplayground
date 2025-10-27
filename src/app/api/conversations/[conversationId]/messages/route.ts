import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations, messages, llmResponses, llmConfigs } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.conversationId;

    // Verify conversation belongs to user
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, session.user.id)
      ),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages with responses
    const conversationMessages = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: [asc(messages.createdAt)],
      with: {
        responses: {
          with: {
            llmConfig: true,
          },
        },
      },
    });

    // Format messages
    const formattedMessages = conversationMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      responses: msg.responses.map((resp) => ({
        id: resp.id,
        llmConfigId: resp.llmConfigId,
        llmName: resp.llmConfig.name,
        content: resp.content,
        responseTime: resp.responseTime,
        error: resp.error,
      })),
      createdAt: msg.createdAt,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
