# ConversationClarify - AI Conversation Analysis Tool

A full-stack web application that analyzes conversations to identify potential miscommunications, ambiguous language, and communication issues using AI.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (or Neon Database for cloud hosting)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/conversation_clarify

# AI Service API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Stripe Configuration (for subscription features)
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# Server Configuration
PORT=5000

# Optional: PostHog Analytics (for tracking)
POSTHOG_API_KEY=your_posthog_api_key_here
POSTHOG_HOST=https://app.posthog.com

# Optional: Google Cloud Storage (for file uploads)
GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
GOOGLE_CLOUD_BUCKET_NAME=your_bucket_name
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
```

### 3. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL on your system
2. Create a database named `conversation_clarify`
3. Update the `DATABASE_URL` in your `.env` file

#### Option B: Neon Database (Recommended)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string and update `DATABASE_URL` in your `.env` file

### 4. Push Database Schema

```bash
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Required API Keys

### OpenAI API Key
- Sign up at [platform.openai.com](https://platform.openai.com)
- Create an API key
- Add it to your `.env` file as `OPENAI_API_KEY`

### Anthropic API Key (Optional)
- Sign up at [console.anthropic.com](https://console.anthropic.com)
- Create an API key
- Add it to your `.env` file as `ANTHROPIC_API_KEY`

### Stripe API Key (Optional)
- Sign up at [stripe.com](https://stripe.com)
- Get your secret key from the dashboard
- Add it to your `.env` file as `STRIPE_SECRET_KEY`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check the codebase
- `npm run db:push` - Push database schema changes

## Features

- **AI-Powered Analysis**: Uses GPT-4o and Claude 3.5 Sonnet for conversation analysis
- **Image Text Extraction**: Extract text from conversation screenshots
- **Multi-Model Support**: Choose between different AI models
- **Subscription Tiers**: Free, Pro, and Premium plans with different limits
- **Dark Mode**: Full dark/light mode support
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **AI Services**: OpenAI and Anthropic APIs

## Troubleshooting

### Windows Compatibility
The project now uses `cross-env` for Windows compatibility. If you encounter any issues, make sure you have the latest dependencies installed.

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Ensure your database is running and accessible
- Check that the database exists and you have proper permissions

### API Key Issues
- Verify all required API keys are set in your `.env` file
- Check that your API keys are valid and have sufficient credits
- Ensure you're using the correct API key format

## Support

For issues and questions, please check the project documentation or create an issue in the repository.
