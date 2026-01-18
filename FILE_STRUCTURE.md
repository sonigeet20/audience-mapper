# Complete File Structure

```
tracking-script/
│
├── README.md                           # Main documentation
├── QUICKSTART.md                       # 5-minute setup guide
├── DEPLOYMENT.md                       # Production deployment guide
├── PROJECT_STATUS.md                   # Feature completion tracker
├── IMPLEMENTATION_SUMMARY.md           # What's built, what remains
│
├── package.json                        # Root monorepo config
├── turbo.json                          # Turborepo pipeline config
├── tsconfig.json                       # Base TypeScript config
├── .gitignore                          # Git ignore patterns
├── .prettierrc                         # Code formatting rules
├── .env.example                        # Environment variable template
│
├── apps/
│   │
│   ├── dashboard/                      # Next.js Dashboard App
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx          # Root layout
│   │   │   │   ├── page.tsx            # Landing page
│   │   │   │   ├── globals.css         # Global styles
│   │   │   │   │
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── layout.tsx      # Dashboard layout with sidebar
│   │   │   │   │   ├── page.tsx        # Overview dashboard
│   │   │   │   │   ├── websites/
│   │   │   │   │   │   └── page.tsx    # Website management
│   │   │   │   │   ├── affiliate/
│   │   │   │   │   │   └── page.tsx    # Affiliate URL management
│   │   │   │   │   ├── event-overrides/
│   │   │   │   │   │   └── page.tsx    # Event classification override
│   │   │   │   │   ├── audiences/
│   │   │   │   │   │   └── page.tsx    # Audience segmentation
│   │   │   │   │   ├── analytics/
│   │   │   │   │   │   └── page.tsx    # Analytics & charts
│   │   │   │   │   ├── integrations/
│   │   │   │   │   │   └── page.tsx    # Platform integrations
│   │   │   │   │   └── settings/
│   │   │   │   │       └── page.tsx    # Organization settings
│   │   │   │   │
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx    # Login page
│   │   │   │   │   ├── signup/
│   │   │   │   │   │   └── page.tsx    # Signup page
│   │   │   │   │   └── callback/
│   │   │   │   │       └── route.ts    # OAuth callback handler
│   │   │   │   │
│   │   │   │   └── api/
│   │   │   │       ├── websites/
│   │   │   │       │   ├── route.ts            # GET, POST websites
│   │   │   │       │   └── [id]/
│   │   │   │       │       └── route.ts        # GET, PATCH, DELETE by ID
│   │   │   │       ├── affiliate-urls/
│   │   │   │       │   └── route.ts            # Affiliate URL CRUD
│   │   │   │       └── segments/
│   │   │   │           └── route.ts            # Segment CRUD
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   │   ├── button.tsx              # Button component
│   │   │   │   │   ├── input.tsx               # Input component
│   │   │   │   │   ├── card.tsx                # Card components
│   │   │   │   │   ├── table.tsx               # Table components
│   │   │   │   │   ├── tabs.tsx                # Tabs components
│   │   │   │   │   └── dropdown-menu.tsx       # Dropdown menu
│   │   │   │   ├── sidebar.tsx                 # Dashboard sidebar nav
│   │   │   │   ├── theme-toggle.tsx            # Dark/light theme toggle
│   │   │   │   └── providers.tsx               # React providers
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── supabase-server.ts          # Server-side Supabase client
│   │   │   │   ├── supabase-client.ts          # Client-side Supabase client
│   │   │   │   └── utils.ts                    # Utility functions
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── database.ts                 # Database type definitions
│   │   │   │
│   │   │   └── middleware.ts                   # Auth middleware
│   │   │
│   │   ├── next.config.js                      # Next.js configuration
│   │   ├── tailwind.config.js                  # Tailwind CSS config
│   │   ├── postcss.config.js                   # PostCSS config
│   │   ├── tsconfig.json                       # TypeScript config
│   │   └── package.json
│   │
│   └── tracking-script/                # Tracking SDK
│       ├── src/
│       │   ├── index.ts                # Main tracker entry point
│       │   ├── modules/
│       │   │   ├── event-detector.ts   # Auto event detection
│       │   │   ├── affiliate-tracker.ts # URL pattern matching
│       │   │   ├── event-batcher.ts    # Event batching & retry
│       │   │   ├── sampling-engine.ts  # Tiered sampling
│       │   │   ├── cookie-attribution.ts # Cookie-based attribution
│       │   │   └── obfuscation.ts      # Detection evasion
│       │   └── types.ts                # Type definitions
│       ├── webpack.config.js           # Build configuration
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   │
│   ├── database/
│   │   ├── migrations/
│   │   │   └── 001_initial_schema.sql  # Database schema with RLS
│   │   ├── supabase/
│   │   │   └── functions/
│   │   │       ├── ingest-events/
│   │   │       │   └── index.ts        # Event ingestion endpoint
│   │   │       └── affiliate-webhook/
│   │   │           └── index.ts        # Affiliate webhook handler
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── shared/                         # Shared utilities
│       ├── src/
│       │   ├── index.ts                # Package exports
│       │   ├── types.ts                # Shared type definitions
│       │   ├── constants.ts            # Constants (cache keys, rate limits)
│       │   └── utils.ts                # Utility functions
│       ├── tsconfig.json
│       └── package.json
│
├── infrastructure/
│   └── aws/                            # AWS CDK Infrastructure
│       ├── bin/
│       │   └── app.ts                  # CDK app entry point
│       ├── lib/
│       │   └── tracking-infrastructure-stack.ts # Main CDK stack
│       ├── cdk.json                    # CDK configuration
│       ├── tsconfig.json
│       └── package.json
│
└── node_modules/                       # Dependencies (gitignored)
```

## File Count Summary

| Category | Count | Description |
|----------|-------|-------------|
| **Core Config** | 7 | Root-level configuration files |
| **Documentation** | 5 | README, guides, status docs |
| **Dashboard Pages** | 8 | Next.js route pages |
| **Dashboard Components** | 10+ | UI components & layouts |
| **API Routes** | 4 | Backend API endpoints |
| **Tracking SDK** | 8 | Main tracker + modules |
| **Database** | 3 | Schema migration + Edge Functions |
| **Infrastructure** | 3 | AWS CDK stack definition |
| **Shared Utilities** | 4 | Common types & utilities |

**Total Files:** ~60+ production files

## Key Directories Explained

### `/apps/dashboard/src/app/`
Next.js 14 App Router structure with file-based routing. Each folder represents a route.

### `/apps/tracking-script/src/modules/`
Modular tracking SDK components. Each module is independently testable.

### `/packages/database/migrations/`
Database schema definitions. Run in order with Supabase CLI.

### `/packages/database/supabase/functions/`
Edge Functions deployed to Supabase. Run on Deno runtime.

### `/infrastructure/aws/`
Infrastructure as Code using AWS CDK (TypeScript). Deploy with `cdk deploy`.

## Build Outputs (Generated)

```
apps/dashboard/.next/          # Next.js build output
apps/tracking-script/dist/     # Compiled tracking script
infrastructure/aws/cdk.out/    # CDK synthesized CloudFormation
```

## Environment Files (Not in Git)

```
.env.local                     # Local environment variables
apps/dashboard/.env.local      # Dashboard-specific env vars
packages/database/.env         # Supabase connection details
```

## Configuration Files Purpose

- **turbo.json** - Defines build pipeline and caching strategy
- **tsconfig.json** - Base TypeScript compiler options
- **.prettierrc** - Code formatting rules (2 spaces, single quotes)
- **.gitignore** - Excludes node_modules, .env, build outputs
- **package.json** - Workspace configuration, scripts, dependencies

## Import Paths

The monorepo uses workspace imports:

```typescript
// In dashboard
import { retry } from '@tracking/shared'
import type { EventPayload } from '@tracking/database'

// In tracking script
import type { TrackingConfig } from '../types'
import { EventDetector } from './modules/event-detector'
```

## npm Scripts

From root `package.json`:
- `npm run dev` - Start all apps in dev mode
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run typecheck` - TypeScript type checking

From `apps/dashboard/package.json`:
- `npm run dev` - Start Next.js dev server
- `npm run build` - Production build
- `npm start` - Start production server

From `apps/tracking-script/package.json`:
- `npm run build` - Build minified tracking script
- `npm run dev` - Watch mode for development

---

**Next:** Follow [QUICKSTART.md](./QUICKSTART.md) to get everything running locally!
