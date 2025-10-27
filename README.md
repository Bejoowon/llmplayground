# LLM Playground

A web application that allows you to compare LLM responses across multiple models simultaneously. Submit a single prompt to multiple LLMs and view/compare the results side-by-side.

## Features

- **Multi-LLM Comparison**: Submit one prompt to up to 10 different LLMs simultaneously
- **User Authentication**: Secure user accounts with email/password authentication
- **Custom LLM Integration**: Add your own LLMs using your API keys
- **Provider Support**: Built-in support for OpenAI, Anthropic, and custom API endpoints
- **Conversation History**: Save and view your previous prompts and responses
- **Flexible Configuration**: Register and manage multiple LLM configurations

## Tech Stack

- **Frontend**: Next.js 15.2.4 with React 19
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **Deployment**: Docker Compose

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for database and deployment)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd LLM-playground
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random string for session encryption
- `NEXTAUTH_URL`: Your application URL (default: http://localhost:3000)

Generate a secret:
```bash
openssl rand -base64 32
```

### 4. Start PostgreSQL with Docker

```bash
docker-compose up postgres -d
```

### 5. Run database migrations

```bash
npm run db:generate
npm run db:migrate
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Create an Account

- Navigate to `/register`
- Create an account with email and password

### 2. Add LLM Configurations

- Click "Add LLM" button
- Select a provider (OpenAI, Anthropic, or Custom)
- Enter your API key and configuration details
- Save the configuration

### 3. Start Comparing

- Select up to 10 LLMs from your configured models
- Enter a prompt
- Press Enter or click Send
- View responses from all selected LLMs side-by-side

### 4. View History

- Access your conversation history from the sidebar
- Click on any conversation to view previous exchanges

## Docker Deployment

### Build and run with Docker Compose

```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Next.js application on port 3000

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - Authentication endpoints
- `GET /api/conversations` - Get user's conversations
- `GET /api/conversations/[id]/messages` - Get conversation messages
- `POST /api/chat` - Send prompt to multiple LLMs
- `GET /api/llm-configs` - Get user's LLM configurations
- `POST /api/llm-configs` - Add new LLM configuration

## Database Schema

- **users**: User accounts
- **llm_configs**: User's LLM API configurations
- **conversations**: Chat conversations
- **messages**: Individual messages (user prompts)
- **llm_responses**: LLM responses linked to messages

## Security Notes

⚠️ **Important**: In a production environment:
- Encrypt API keys before storing in database
- Use HTTPS for all connections
- Implement rate limiting
- Add input validation and sanitization
- Use environment-specific secrets
- Enable CORS protection

## Development

### Database Management

View database with Drizzle Studio:
```bash
npm run db:studio
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
