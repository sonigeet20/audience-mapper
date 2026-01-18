# Universal Tracking & Audience Management Platform

## 🚀 Core Implementation Complete

A comprehensive multi-tenant SaaS tracking system with intelligent event detection, affiliate tracking with obfuscation, audience segmentation, and seamless advertising platform integrations.

**Tech Stack:** Next.js 14 | Supabase | AWS | TypeScript | <20KB tracking SDK

[Quick Start](./QUICKSTART.md) | [Deployment Guide](./DEPLOYMENT.md) | [Project Status](./PROJECT_STATUS.md)

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), shadcn/ui, Framer Motion, Tailwind CSS
- **Database**: Supabase (PostgreSQL + TimescaleDB)
- **Backend**: AWS Lambda, Step Functions, SQS, S3, CloudFront
- **Caching**: Upstash Redis (multi-level caching)
- **Analytics**: AWS Redshift/Snowflake (data warehouse)
- **Infrastructure**: AWS CDK, Terraform
- **Deployment**: Vercel (frontend), AWS (backend), Supabase (database)

### Project Structure

```
.
├── apps/
│   ├── dashboard/          # Next.js dashboard application
│   ├── tracking-script/    # JavaScript SDK for website tracking
│   └── marketing-site/     # Public marketing website
├── packages/
│   ├── database/           # Supabase schema, migrations, types
│   ├── shared/             # Shared utilities and types
│   └── ui/                 # Shared UI components
├── infrastructure/
│   ├── aws/                # AWS CDK infrastructure
│   └── terraform/          # Terraform configurations
└── docs/                   # Documentation

```

## Features

### Tracking Script
- Auto-event detection with ML-lite classification
- Optimized URL pattern matching (<2ms execution)
- Affiliate URL tracking with adaptive obfuscation
- Cookie attribution with multiple models (last-click, first-click, multi-touch, time-decay)
- Configurable event sampling (tiered by value)
- Client-side & server-side data collection modes

### Dashboard
- Multi-tenant with granular RBAC
- Website management & tracking code generation
- Event override manager (auto-detected → manual classification)
- Affiliate URL configuration with URL patterns
- Cookie drop stats & attribution analytics
- Audience builder with cross-website segmentation
- Platform integrations (Google Ads, Facebook, TikTok, LinkedIn)
- White-label support with custom domains
- Dark/light theme support

### Backend
- Storm-resistant cache invalidation (debouncing, circuit breaker)
- Incremental identity resolution (focused on last 24h)
- Tiered data storage (hot/warm/cold)
- Intelligent API rate limiting with priority queues
- Detection monitoring & adaptive obfuscation
- Cross-deployment analytics (data warehouse)
- Automated plan migration (shared → isolated infrastructure)
- Infrastructure versioning with staged rollouts

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase CLI
- AWS CLI & CDK
- Docker (for local development)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development
npm run dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# AWS
AWS_REGION=
AWS_ACCOUNT_ID=

# Platform Integrations
GOOGLE_ADS_CLIENT_ID=
FACEBOOK_APP_ID=
```

## Development

```bash
# Run dashboard locally
npm run dev

# Build tracking script
cd apps/tracking-script && npm run build

# Deploy infrastructure
npm run infra:deploy

# Run database migrations
npm run db:migrate
```

## Deployment Modes

### Shared Mode (Free/Pro Tiers)
- Single Supabase project with multi-tenant schema
- Shared AWS infrastructure with org_id partitioning
- Shared Redis instance with namespacing

### Isolated Mode (Enterprise Tier)
- Dedicated Supabase project per tenant
- Dedicated AWS account/sub-account
- Dedicated Redis instance
- Auto-provisioned via infrastructure orchestrator

## Documentation

- [Database Schema](./docs/database-schema.md)
- [API Reference](./docs/api-reference.md)
- [Tracking Script Guide](./docs/tracking-script.md)
- [Platform Integrations](./docs/integrations.md)
- [Infrastructure Guide](./docs/infrastructure.md)

## License

Proprietary - All Rights Reserved
