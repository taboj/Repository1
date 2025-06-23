# Sleep Calculator - Replit Documentation

## Overview

This is a modern sleep calculator web application designed to help users optimize their sleep cycles by calculating optimal bedtimes and wake times. The application features a science-based approach using 90-minute sleep cycles, age-specific recommendations, and personalization options. Built with React, TypeScript, and a comprehensive UI component library.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: React Hooks + TanStack Query for server state
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: In-memory storage with interface for database integration
- **API Pattern**: RESTful endpoints with `/api` prefix
- **Development**: Hot reload with Vite middleware integration

## Key Components

### Sleep Calculation Engine
- **Core Logic**: Located in `client/src/lib/sleep-calculations.ts`
- **Age-Based Recommendations**: Different cycle lengths for various age groups (45-105 minutes)
- **Quality Ratings**: EXCELLENT, GOOD, FAIR, POOR based on cycle alignment
- **Dual Mode**: Calculate optimal wake times from bedtime OR optimal bedtimes from wake time

### UI Components
- **Modern Design**: Clean, accessible interface with dark/light theme support
- **Component Library**: Comprehensive shadcn/ui components (buttons, cards, selects, sliders, etc.)
- **Responsive Layout**: Mobile-first design with adaptive components
- **Theme System**: CSS variables with automatic dark mode detection

### Data Storage
- **User Schema**: Basic user model with username/password fields
- **Storage Interface**: Abstracted storage layer supporting both memory and database backends
- **Database Integration**: Drizzle ORM with PostgreSQL, migration-ready

## Data Flow

1. **User Input**: Time selection through custom time picker components
2. **Calculation Engine**: Processes input with age-specific sleep cycle algorithms
3. **Recommendation Generation**: Creates multiple sleep/wake time options with quality ratings
4. **UI Updates**: Real-time display of recommendations with visual sleep cycle timeline
5. **Personalization**: User settings (fall asleep time, cycle preferences) modify calculations

## External Dependencies

### Frontend
- **UI Library**: Radix UI primitives for accessibility
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for time calculations
- **Validation**: Zod with react-hook-form for form validation
- **Styling**: Tailwind CSS with class-variance-authority for component variants

### Backend
- **Database**: Neon serverless PostgreSQL
- **ORM**: Drizzle with automatic migration support
- **Session Storage**: PostgreSQL session store (connect-pg-simple)
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Hot Reload**: Vite with custom error overlay for Replit
- **Type Safety**: Comprehensive TypeScript configuration
- **Path Mapping**: Absolute imports with `@/` prefix for client code

## Deployment Strategy

### Development Environment
- **Replit Integration**: Native support with `.replit` configuration
- **Port Configuration**: Vite dev server on port 5000 with proxy
- **Hot Reload**: Full-stack development with file watching
- **Module System**: ESM with Node.js 20 and PostgreSQL 16

### Production Build
- **Frontend**: Vite build to `dist/public` directory
- **Backend**: esbuild bundle to `dist/index.js`
- **Static Serving**: Express serves built frontend assets
- **Environment**: Production mode with optimized builds

### Database Strategy
- **Development**: Replit PostgreSQL module for local development
- **Production**: Neon serverless PostgreSQL with connection pooling
- **Migrations**: Drizzle-kit for schema management and migrations
- **Schema**: Shared schema definitions between client and server

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 23, 2025. Initial setup