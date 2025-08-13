# ConversationClarify - AI Conversation Analysis Tool

## Overview

ConversationClarify is a full-stack web application that analyzes conversations to identify potential miscommunications, ambiguous language, and communication issues. The application uses OpenAI's GPT-4o model to parse conversations, identify speakers, and provide detailed insights about communication clarity with scored analysis and actionable recommendations.

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
- **Storage Strategy**: Hybrid approach supporting both PostgreSQL (production) and in-memory storage (development)

### AI Integration
- **AI Service**: OpenAI GPT-4o integration for conversation analysis and image text extraction
- **Vision Capabilities**: GPT-4o vision model for extracting text from conversation screenshots
- **Analysis Pipeline**: Multi-step process including image text extraction, conversation parsing, speaker identification, issue detection, and summary generation
- **Response Structure**: Structured analysis results including clarity scores, categorized issues, and detailed summaries

### Key Features
- **Conversation Input**: Multi-format text input and screenshot upload with configurable analysis depth and language settings
- **Screenshot Analysis**: AI-powered text extraction from conversation screenshots using GPT-4 vision capabilities
- **Real-time Analysis**: Asynchronous processing with loading states and progress indicators
- **Issue Classification**: Categorized communication issues (assumption gaps, ambiguous language, tone mismatches, implicit meanings)
- **Severity Scoring**: Three-tier issue classification (critical, moderate, minor) with visual indicators
- **Export Functionality**: Analysis results available for download and sharing

### Development Architecture
- **TypeScript**: Full-stack type safety with shared schemas between client and server
- **Development Server**: Vite development server with hot module replacement and error overlay
- **Code Organization**: Monorepo structure with shared types and utilities between frontend and backend
- **Path Aliases**: Configured import aliases for clean import statements and better code organization

## External Dependencies

### Core Backend Services
- **OpenAI API**: GPT-4o model for conversation analysis and natural language processing
- **Neon Database**: Serverless PostgreSQL database for production data persistence
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
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Accessibility**: WCAG-compliant components with keyboard navigation support