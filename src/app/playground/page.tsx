import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import PlaygroundClient from '@/components/PlaygroundClient';
import { db } from '@/lib/db';
import { llmConfigs, conversations } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function PlaygroundPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch user's LLM configurations
  const userLLMConfigs = await db.query.llmConfigs.findMany({
    where: eq(llmConfigs.userId, session.user.id),
  });

  // Fetch user's conversations
  const userConversations = await db.query.conversations.findMany({
    where: eq(conversations.userId, session.user.id),
    orderBy: [desc(conversations.updatedAt)],
    limit: 20,
  });

  return (
    <PlaygroundClient
      llmConfigs={userLLMConfigs}
      conversations={userConversations}
      userId={session.user.id}
    />
  );
}
