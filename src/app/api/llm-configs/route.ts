import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { llmConfigs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configs = await db.query.llmConfigs.findMany({
      where: eq(llmConfigs.userId, session.user.id),
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error('Get LLM configs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, provider, model, apiKey, apiEndpoint, config } = await request.json();

    if (!name || !provider || !model || !apiKey) {
      return NextResponse.json(
        { error: 'Name, provider, model, and API key are required' },
        { status: 400 }
      );
    }

    if (provider === 'custom' && !apiEndpoint) {
      return NextResponse.json(
        { error: 'API endpoint is required for custom providers' },
        { status: 400 }
      );
    }

    const [newConfig] = await db.insert(llmConfigs).values({
      userId: session.user.id,
      name,
      provider,
      model,
      apiKey, // In production, encrypt this!
      apiEndpoint,
      config,
      isActive: true,
    }).returning();

    return NextResponse.json({ config: newConfig }, { status: 201 });
  } catch (error) {
    console.error('Create LLM config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
