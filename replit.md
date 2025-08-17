# ConversationClarify - AI Conversation Analysis Tool

## Overview

ConversationClarify is a full-stack web application that analyzes conversations to identify potential miscommunications, ambiguous language, and communication issues. The application uses OpenAI's GPT-4o model to parse conversations, identify speakers, and provide detailed insights about communication clarity with scored analysis and actionable recommendations.

## Recent Changes (January 17, 2025)

- **Analysis Display Fixed**: Resolved critical bug where only clarity score was displayed instead of complete analysis results
- **Advanced Analysis Only**: Removed standard analysis option, now exclusively offers "Deep Semantic Analysis" and "Context-Aware Analysis" 
- **Smart Paste Enhancement**: Auto-detects clipboard content type and switches between text/image input tabs
- **How It Works Panel**: Added persistent "don't show again" option with localStorage
- **Complete Analysis Results**: Now displays full AI analysis including:
  - Issue breakdown by severity (critical, moderate, minor)
  - Detailed expandable issue cards with descriptions and suggestions
  - AI-generated insights and recommendations
  - Complete conversation parsing with speaker identification
  - Overall assessment and communication patterns

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript in a Single Page Application (SPA) architecture
- **Routing**: Wouter for client-side routing with a simple route structure (Home and 404 pages)
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack React Query for server state management and data fetching
- **Build System**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js web server
- **API Design**: RESTful API with JSON responses following conventional HTTP status codes
- **Request Processing**: Express middleware for JSON parsing, URL encoding, and request logging
- **Error Handling**: Centralized error handling middleware with structured error responses

### Data Storage
- **Database**: PostgreSQL with connection pooling via Neon Database serverless driver
- **ORM**: Drizzle ORM for type-safe database operations with automatic schema inference
- **Schema Management**: Database migrations managed through Drizzle Kit with schema-first approach
- **Storage Strategy**: PostgreSQL database with DatabaseStorage implementation for production data persistence
- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple for secure authentication sessions

### AI Integration
- **Multi-Model Support**: OpenAI GPT-4o/GPT-4o-mini and Anthropic Claude 3.5 Sonnet integration
- **Premium Model Access**: Advanced AI models (GPT-4o, Claude 3.5 Sonnet) exclusive to premium subscribers
- **Configurable Reasoning**: Three analysis depth levels (standard, detailed, comprehensive) with subscription-based access
- **Vision Capabilities**: GPT-4o vision model for extracting text from conversation screenshots
- **Analysis Pipeline**: Multi-step process including image text extraction, conversation parsing, speaker identification, issue detection, and summary generation
- **Response Structure**: Structured analysis results including clarity scores, categorized issues, and detailed summaries

### Key Features
- **User Authentication**: Secure login via Replit Auth with automatic account creation and session management
- **Protected Access**: Landing page for logged-out users with secure authentication flow
- **Dark Mode Support**: Full dark mode implementation with system preference detection and manual toggle
- **Conversation Input**: Multi-format text input with screenshot paste/drag-drop functionality and configurable analysis depth and language settings
- **Screenshot Analysis**: AI-powered text extraction from conversation screenshots using GPT-4 vision capabilities
- **Conversation Editor**: Comprehensive editing interface for correcting speaker attribution, message ordering, and content before final analysis
- **Three-Phase Workflow**: Upload → AI extraction → Manual editing phase → Final analysis
- **Real-time Analysis**: Asynchronous processing with loading states and progress indicators
- **Issue Classification**: Categorized communication issues (assumption gaps, ambiguous language, tone mismatches, implicit meanings)
- **Severity Scoring**: Three-tier issue classification (critical, moderate, minor) with visual indicators
- **Reanalysis Functionality**: Ability to reprocess conversations with user-corrected data
- **Export Functionality**: Analysis results available for download and sharing
- **Premium AI Models**: Multiple AI model selection for premium users (GPT-4o, Claude 3.5 Sonnet)
- **Advanced Reasoning Levels**: Configurable analysis depth (standard, detailed, comprehensive) based on subscription tier
- **Screenshot Paste Functionality**: Direct clipboard image pasting with Ctrl+V for quick conversation screenshot analysis
- **Drag & Drop Interface**: Intuitive drag-and-drop image upload for conversation screenshots
- **Usage-Based Monetization**: Subscription tiers with monthly analysis limits and premium features

### Development Architecture
- **TypeScript**: Full-stack type safety with shared schemas between client and server
- **Development Server**: Vite development server with hot module replacement and error overlay
- **Code Organization**: Monorepo structure with shared types and utilities between frontend and backend
- **Path Aliases**: Configured import aliases for clean import statements and better code organization

## External Dependencies

### Core Backend Services
- **OpenAI API**: GPT-4o model for conversation analysis and natural language processing
- **Neon Database**: Serverless PostgreSQL database for production data persistence
- **Replit Auth**: OpenID Connect authentication provider for secure user authentication
- **Express.js**: Web server framework with middleware ecosystem

### Frontend Libraries
- **TanStack React Query**: Server state management and caching
- **Wouter**: Lightweight client-side routing
- **Radix UI**: Accessible component primitives for complex UI components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Date-fns**: Date manipulation and formatting utilities

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast bundling for production builds

### UI Component System
- **Shadcn/ui**: Pre-built component library with consistent design system
- **Class Variance Authority**: Type-safe CSS class composition
- **Tailwind Merge**: Utility for merging Tailwind CSS classes
- **React Hook Form**: Form state management with validation

### Additional Integrations
- **Session Management**: PostgreSQL-based session storage with connect-pg-simple
- **File Upload**: Support for conversation import from various text formats
- **Analytics**: PostHog integration for comprehensive user behavior tracking and performance monitoring
- **Theme System**: Complete dark/light mode support with system preference detection and persistent storage
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Accessibility**: WCAG-compliant components with keyboard navigation support

### Analytics Tracking
- **User Journey**: Complete funnel tracking from conversation upload through analysis completion
- **Feature Usage**: Detailed tracking of editor interactions, reanalysis events, and feature adoption
- **Performance Monitoring**: Processing time measurement and error tracking for optimization insights
- **Engagement Metrics**: Session recording and user interaction patterns for UX improvements