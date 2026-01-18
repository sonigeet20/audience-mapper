# Audience Mapper - Deployment Information

## 🚀 Live URLs

### Production Dashboard
**URL:** https://audience-mapper.vercel.app
**Project:** audience-mapper (Vercel)

### Tracking Script CDN
**CloudFront Distribution:** https://d2o4mys7y6h0j6.cloudfront.net

**Script URLs:**
- Loader (Eternal): `https://d2o4mys7y6h0j6.cloudfront.net/v1/loader.min.js`
- Tracker (Updatable): `https://d2o4mys7y6h0j6.cloudfront.net/v1/tracker.js`

**Integration Code:**
```html
<script src="https://d2o4mys7y6h0j6.cloudfront.net/v1/loader.min.js" data-website-id="YOUR_WEBSITE_ID"></script>
```

---

## 🔐 Super Admin Credentials

**Email:** (see .env.local for credentials)
**Password:** (see .env.local for credentials)

**First Login Steps:**
1. Go to https://audience-mapper.vercel.app/auth/signup
2. Sign up with the above credentials
3. Verify email if required (check email or Supabase dashboard)
4. Login and create your first organization

---

## 🗄️ Supabase Configuration

**Project URL:** https://lmmspmhzezesexeyndvq.supabase.co
**Project ID:** lmmspmhzezesexeyndvq

### API Keys
**Anon Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbXNwbWh6ZXplc2V4ZXluZHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NzIxNTEsImV4cCI6MjA1MjQ0ODE1MX0.N2Wv-iodbqwDfAZmBE7r1f2VjhJZ63S6Cg0iYtRSqHo
```

**Service Role Key:** (stored in .env.local - never commit to Git)

### Edge Functions
- **ingest-events:** Deployed ✅
- **affiliate-webhook:** Deployed ✅

### Database
- 20+ tables with Row Level Security (RLS)
- User-managed credentials encryption
- Event data storage and archiving
- Audience segmentation

---

## ☁️ AWS Resources (ap-south-1)

**Account ID:** 179406869795
**Region:** ap-south-1

### S3 Buckets
1. **tracking-scripts-179406869795**
   - Contains: loader.min.js, tracker.js
   - CloudFront Distribution attached
   
2. **tracking-data-archive-179406869795**
   - Contains: Long-term event data (31+ days)

### DynamoDB
**Table:** tracking-cache
- Billing: PAY_PER_REQUEST
- TTL: Enabled (ttl attribute)
- Purpose: OAuth token caching

### Lambda Functions
1. **cache-cleanup** - Removes expired cache entries
2. **data-archiver** - Archives events older than 31 days
3. **refresh-tokens** - Refreshes OAuth tokens before expiry
4. **sync-audiences** - Syncs segments to advertising platforms

### CloudFront
**Distribution ID:** E1234567890ABC (example)
**Domain:** d2o4mys7y6h0j6.cloudfront.net
**Cache Behaviors:**
- loader.min.js: 1 year cache (immutable)
- tracker.js: 1 hour cache (updatable)

### SQS
**Queue:** tracking-event-queue
**Dead Letter Queue:** tracking-event-queue-dlq

### EventBridge Rules
- Hourly: Cache cleanup, token refresh
- Daily: Audience sync
- Midnight: Data archival

---

## 🔑 AWS Credentials

**Region:** ap-south-1

> **Note:** AWS credentials are stored securely in:
> - Local: `apps/dashboard/.env.local`
> - Vercel: Project environment variables
> - Never commit AWS credentials to Git

---

## 🔐 Encryption

**Encryption Key (AES-256-GCM):**
```
+Tolk+9gAK4Op3kus81IjpU4ugL/+yehbj9sv3k2wt8=
``` (stored in .env.local - never commit to Git)Auth credentials in database
- Sensitive platform API keys
- User-managed integration credentials

---

## 🧪 Local Development

### Prerequisites
```bash
cd /Users/geetsoni/Downloads/tracking-script
```

### Install Dependencies
```bash
npm install
```

### Environment Variables
All environment variables are already configured in:
```
apps/dashboard/.env.local
```

### Start Development Server
```bash
cd apps/dashboard
npm run dev
```

Dashboard will be available at: http://localhost:3000

### Test Tracking Script Locally
```bash
cd apps/tracking-script
npm run dev
```

Then open `examples/demo.html` in your browser.

---

## 📊 Platform Integrations

### Supported Platforms
1. **Google Ads**
   - OAuth 2.0
   - Customer Match audience sync
   
2. **Facebook Ads**
   - OAuth 2.0
   - Custom Audiences API
   
3. **TikTok Ads**
   - OAuth 2.0
   - Custom Audiences API
   
4. **LinkedIn Ads**
   - OAuth 2.0
   - Matched Audiences API

### OAuth Proxy
Routes available:
- `/api/oauth/google/authorize`
- `/api/oauth/facebook/authorize`
- `/api/oauth/tiktok/authorize`
- `/api/oauth/linkedin/authorize`

All credentials are user-managed and encrypted in the database.

---

## 🎯 Tracking Features

### Event Types
- Page Views
- Custom Events
- User Properties
- Session Tracking
- UTM Parameters
- Referrer Tracking
- Device & Browser Info
- IP Geolocation

### Audience Segmentation
- Rule-based segments
- Real-time updates
- Platform sync (Google, Facebook, TikTok, LinkedIn)
- Export capabilities

### Affiliate Tracking
- Click tracking with unique IDs
- Conversion attribution
- Commission calculation
- Multi-level referrals

---

## 📝 Database Schema

### Core Tables
- `organizations` - Multi-tenant organization data
- `users` - User accounts and authentication
- `organization_members` - Org membership and roles
- `websites` - Tracked websites
- `events` - Real-time event data
- `user_profiles` - Aggregated user data
- `sessions` - Session tracking
- `affiliates` - Affiliate program data
- `affiliate_clicks` - Click tracking
- `affiliate_conversions` - Conversion data
- `segments` - Audience definitions
- `segment_members` - Segment membership
- `integrations` - Platform connections
- `integration_credentials` - Encrypted OAuth tokens
- `integration_cache` - DynamoDB token cache
- `integration_errors` - Error tracking

---

## 🚢 Deployment Commands

### Deploy Dashboard
```bash
cd apps/dashboard
vercel --prod
```

### Deploy Supabase Edge Functions
```bash
cd supabase
supabase functions deploy ingest-events
supabase functions deploy affiliate-webhook
```

### Deploy AWS Infrastructure
```bash
cd infrastructure/aws
npm run deploy
```

### Upload Tracking Scripts to S3
```bash
cd apps/tracking-script
npm run build
aws s3 cp dist/loader.min.js s3://tracking-scripts-179406869795/v1/loader.min.js --cache-control "public, max-age=31536000, immutable"
aws s3 cp dist/tracker.js s3://tracking-scripts-179406869795/v1/tracker.js --cache-control "public, max-age=3600"
```

---

## 🔍 Monitoring & Debugging

### Vercel Logs
```bash
cd apps/dashboard
vercel logs --prod
```

### Supabase Logs
Go to: https://supabase.com/dashboard/project/lmmspmhzezesexeyndvq/logs

### AWS CloudWatch
- Lambda function logs
- CloudFront access logs
- EventBridge rule executions

### Check Tracking Events
```sql
-- In Supabase SQL Editor
SELECT * FROM events ORDER BY created_at DESC LIMIT 100;
```

---

## 🧹 Maintenance Tasks

### Clear Cache
```bash
aws dynamodb scan --table-name tracking-cache --region ap-south-1
```

### Archive Old Events
Lambda function runs daily at midnight UTC

### Refresh OAuth Tokens
Lambda function runs hourly

### Sync Audiences
Lambda function runs daily at 2 AM UTC

---

## 📖 Documentation

Full documentation available in:
- `/docs/ARCHITECTURE.md` - System architecture
- `/docs/API.md` - API endpoints
- `/docs/TRACKING.md` - Tracking implementation
- `/docs/DEPLOYMENT.md` - Deployment guide
- `/docs/OAUTH.md` - OAuth integration guide

---

## ✅ Quick Start Checklist

1. ✅ Dashboard deployed to Vercel
2. ✅ Tracking scripts uploaded to S3
3. ✅ CloudFront distribution active
4. ✅ Supabase database and Edge Functions deployed
5. ✅ AWS infrastructure deployed (DynamoDB, Lambda, SQS, EventBridge)
6. ⏳ Create super admin user (manual signup required)
7. ⏳ Test tracking script integration
8. ⏳ Configure OAuth credentials for platforms
9. ⏳ Create first website and get tracking code
10. ⏳ Test end-to-end flow

---

## 🆘 Support

For issues or questions:
1. Check the logs (Vercel, Supabase, CloudWatch)
2. Review the documentation in `/docs`
3. Test locally using `.env.local`
4. Verify API keys and credentials

---

**Last Updated:** January 18, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
