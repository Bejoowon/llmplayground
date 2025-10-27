import { pgTable, text, timestamp, uuid, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// LLM Configurations table - stores user's registered LLMs
export const llmConfigs = pgTable('llm_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), // e.g., "GPT-4", "Claude 3.5 Sonnet"
  provider: text('provider').notNull(), // e.g., "openai", "anthropic", "custom"
  model: text('model').notNull(), // e.g., "gpt-4", "claude-3-5-sonnet-20241022"
  apiKey: text('api_key').notNull(), // Encrypted API key
  apiEndpoint: text('api_endpoint'), // Optional custom endpoint
  isActive: boolean('is_active').default(true).notNull(),
  config: jsonb('config'), // Additional model-specific configuration
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messages table - stores individual prompts and responses
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'user' or 'assistant'
  content: text('content').notNull(), // For user messages
  selectedModels: jsonb('selected_models'), // Array of LLM config IDs used for this prompt
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// LLM Responses table - stores individual responses from each LLM
export const llmResponses = pgTable('llm_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }).notNull(),
  llmConfigId: uuid('llm_config_id').references(() => llmConfigs.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  tokensUsed: jsonb('tokens_used'), // { prompt: number, completion: number, total: number }
  responseTime: text('response_time'), // Time taken in milliseconds
  error: text('error'), // Store error if request failed
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  llmConfigs: many(llmConfigs),
  conversations: many(conversations),
}));

export const llmConfigsRelations = relations(llmConfigs, ({ one, many }) => ({
  user: one(users, {
    fields: [llmConfigs.userId],
    references: [users.id],
  }),
  responses: many(llmResponses),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  responses: many(llmResponses),
}));

export const llmResponsesRelations = relations(llmResponses, ({ one }) => ({
  message: one(messages, {
    fields: [llmResponses.messageId],
    references: [messages.id],
  }),
  llmConfig: one(llmConfigs, {
    fields: [llmResponses.llmConfigId],
    references: [llmConfigs.id],
  }),
}));
