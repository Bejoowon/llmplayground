# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LLM Playground** is a Next.js-based web application that enables users to compare responses from multiple Large Language Models (LLMs) simultaneously. Users can send a single prompt to up to 10 different LLMs and view the results side-by-side for comparison.

### Core Features
- Multi-LLM comparison (max 10 concurrent)
- User authentication with persistent accounts
- Custom LLM registration via user-provided API keys
- Conversation history with chat-style UI
- Support for OpenAI, Anthropic, and custom API endpoints
- Real-time parallel LLM API calls

## Tech Stack

- **Framework**: Next.js 15.2.4 (App Router)
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js v5
- **Deployment**: Docker Compose

## Architecture

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── [...nextauth]/   # NextAuth handler
│   │   │   └── register/        # User registration
│   │   ├── chat/                 # Chat/prompt submission
│   │   ├── conversations/        # Conversation management
│   │   │   └── [id]/messages/   # Get messages for conversation
│   │   └── llm-configs/         # LLM configuration CRUD
│   ├── login/                   # Login page
│   ├── register/                # Registration page
│   ├── playground/              # Main playground UI
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page (redirects)
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── PlaygroundClient.tsx     # Main playground interface
│   ├── LLMSelector.tsx          # LLM selection UI
│   ├── ResponseGrid.tsx         # Response display grid
│   ├── ConversationSidebar.tsx  # Conversation history sidebar
│   └── LLMConfigModal.tsx       # Add LLM configuration modal
├── lib/
│   ├── auth/                    # Authentication logic
│   │   └── index.ts             # NextAuth configuration
│   ├── db/                      # Database
│   │   ├── schema.ts            # Drizzle schema definitions
│   │   └── index.ts             # Database client
│   ├── llm/                     # LLM integration
│   │   ├── types.ts             # LLM interfaces
│   │   ├── index.ts             # Main LLM caller
│   │   └── providers/           # Provider implementations
│   │       ├── openai.ts        # OpenAI integration
│   │       ├── anthropic.ts     # Anthropic integration
│   │       └── custom.ts        # Custom API integration
│   └── utils/
│       └── cn.ts                # Tailwind class merger
└── types/
    └── next-auth.d.ts           # NextAuth type extensions
```

### Database Schema

**users**
- User accounts with email/password authentication
- Hashed passwords using bcryptjs

**llm_configs**
- User's registered LLM configurations
- Stores API keys, endpoints, and model settings
- Supports OpenAI, Anthropic, and custom providers
- Note: API keys should be encrypted in production

**conversations**
- Chat conversation containers
- Linked to users
- Auto-generated titles from first prompt

**messages**
- Individual messages within conversations
- Role: 'user' or 'assistant'
- User messages store the prompt
- Assistant messages are containers for LLM responses

**llm_responses**
- Individual responses from each LLM
- Linked to messages and llm_configs
- Stores content, token usage, response time, and errors

### Data Flow

1. **User Authentication**
   - User registers → Password hashed → Stored in DB
   - User logs in → Credentials validated → JWT session created
   - Session persists across requests via NextAuth.js

2. **LLM Configuration**
   - User adds LLM → API key + config stored in `llm_configs`
   - Configurations are user-specific and encrypted (in production)

3. **Prompt Submission**
   - User selects LLMs (1-10) → Enters prompt → Submits
   - API creates/updates conversation
   - Creates user message record
   - Calls all selected LLMs in parallel via `callMultipleLLMs()`
   - Each provider (OpenAI, Anthropic, Custom) handles API specifics
   - Creates assistant message + individual response records
   - Returns formatted data to frontend

4. **Response Display**
   - Frontend displays user message in blue bubble
   - LLM responses shown in grid (1-3 columns based on count)
   - Each response shows: LLM name, content, response time, errors

5. **Conversation History**
   - Conversations listed in sidebar by most recent
   - Clicking conversation loads all messages with responses
   - Supports creating new conversations

### LLM Provider System

The application uses a provider pattern for LLM integrations:

**Base Interface** (`src/lib/llm/types.ts`)
- `LLMProvider` interface defines `call()` method
- Standardized request/response format
- Error handling built-in

**Providers** (`src/lib/llm/providers/`)
- `OpenAIProvider`: OpenAI API integration
- `AnthropicProvider`: Anthropic API integration
- `CustomProvider`: Generic HTTP API support for any LLM

**Parallel Execution** (`src/lib/llm/index.ts`)
- `callMultipleLLMs()` executes all LLM calls concurrently using `Promise.all()`
- Each call is independent and doesn't block others
- Errors in one LLM don't affect others

## Development Workflow

### Common Commands

**Development**
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
```

**Database**
```bash
docker-compose up postgres -d  # Start PostgreSQL
npm run db:generate            # Generate migrations from schema
npm run db:migrate             # Run migrations
npm run db:studio              # Open Drizzle Studio (DB GUI)
```

**Docker**
```bash
docker-compose up              # Start all services
docker-compose up --build      # Rebuild and start
docker-compose down            # Stop services
```

### Adding a New LLM Provider

1. Create provider file in `src/lib/llm/providers/[name].ts`
2. Implement `LLMProvider` interface
3. Handle API authentication and request formatting
4. Parse response to standard format
5. Add to provider registry in `src/lib/llm/index.ts`
6. Update `LLMConfigModal.tsx` to include in UI

### Database Changes

1. Modify schema in `src/lib/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review generated SQL in `drizzle/` directory
4. Apply migration: `npm run db:migrate`

## Important Considerations

### Security
- **API Keys**: Currently stored as plain text. MUST encrypt in production using a library like `crypto` or a service like AWS KMS
- **Rate Limiting**: Implement rate limiting on API routes to prevent abuse
- **Input Validation**: All user inputs should be validated and sanitized
- **CORS**: Configure proper CORS policies for production
- **Environment Variables**: Never commit `.env` files

### Performance
- LLM calls are executed in parallel to minimize total response time
- Database queries use Drizzle's relation queries to minimize round trips
- Consider implementing caching for repeated prompts

### Error Handling
- Each LLM response can fail independently
- Errors are stored and displayed per-LLM
- Frontend handles partial failures gracefully
- User sees which LLMs succeeded/failed

### Scalability
- Current architecture supports horizontal scaling with load balancer
- Database connection pooling via `postgres` library
- Consider implementing job queue for LLM calls if response times are too long
- Session storage can be moved to Redis for multi-instance deployments

## Testing Strategy

When testing, focus on:
1. Authentication flow (register, login, session persistence)
2. LLM configuration CRUD operations
3. Parallel LLM calling with mixed success/failure
4. Conversation and message storage
5. Error handling for invalid API keys or endpoints
6. UI responsiveness with varying numbers of LLMs (1, 2, 5, 10)

## Common Issues

**Database Connection Errors**
- Ensure PostgreSQL is running: `docker-compose up postgres -d`
- Check `DATABASE_URL` in `.env`
- Verify migrations are applied: `npm run db:migrate`

**Authentication Issues**
- Ensure `NEXTAUTH_SECRET` is set in `.env`
- Check `NEXTAUTH_URL` matches your application URL
- Clear browser cookies if experiencing session issues

**LLM API Errors**
- Verify API keys are correct
- Check API endpoints for custom providers
- Review rate limits on LLM provider accounts
- Check network connectivity and firewall rules

## Production Deployment Checklist

- [ ] Encrypt API keys before storing in database
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure production `DATABASE_URL`
- [ ] Enable HTTPS/SSL
- [ ] Implement rate limiting
- [ ] Add input validation middleware
- [ ] Configure CORS properly
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Implement logging
- [ ] Add database backups
- [ ] Review and limit API timeout values
- [ ] Test with production LLM API keys
