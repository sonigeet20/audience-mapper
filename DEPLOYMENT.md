# Deployment Guide

## Overview

This guide covers deploying the Universal Tracking & Audience Management Platform to production across multiple cloud providers.

## Prerequisites

- Node.js 18+
- Supabase account
- AWS account with admin access
- Vercel account
- GitHub repository (for CI/CD)
- Domain name (optional, for custom branding)

## Phase 1: Supabase Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Choose region (closest to users)
4. Save credentials:
   - Project URL
   - Anon key
   - Service role key

### 1.2 Enable TimescaleDB

```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

### 1.3 Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link project
cd packages/database
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### 1.4 Configure Row-Level Security

RLS policies are included in migrations. Verify:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 1.5 Deploy Edge Functions

```bash
# Set environment variables for functions
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key

# Deploy ingestion endpoint
supabase functions deploy ingest-events

# Deploy affiliate webhook
supabase functions deploy affiliate-webhook

# Get function URLs
supabase functions list
```

### 1.6 Configure CORS

In Supabase Dashboard > Settings > API:
- Add allowed origins (your customer websites)
- Enable CORS for Edge Functions

## Phase 2: AWS Infrastructure

### 2.1 Configure AWS CLI

```bash
aws configure
# Enter:
# - Access Key ID
# - Secret Access Key
# - Default region: us-east-1
# - Output format: json
```

### 2.2 Bootstrap CDK

```bash
cd infrastructure/aws
npm install

# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-ID/REGION

# Review changes
cdk diff

# Deploy infrastructure
cdk deploy

# Note outputs:
# - CloudFront distribution domain
# - S3 bucket names
# - Lambda function ARNs
```

### 2.3 Upload Tracking Script

```bash
# Build tracking script
cd apps/tracking-script
npm run build

# Upload to S3
aws s3 cp dist/tracker.min.js s3://tracking-scripts-ACCOUNT-ID/ \
  --cache-control "max-age=3600" \
  --content-type "application/javascript"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### 2.4 Configure Lambda Environment Variables

```bash
# Set Supabase credentials for Lambda functions
aws lambda update-function-configuration \
  --function-name tracking-identity-resolution \
  --environment Variables={
    SUPABASE_URL=https://your-project.supabase.co,
    SUPABASE_SERVICE_ROLE_KEY=your-key
  }

# Repeat for other functions:
# - tracking-event-enrichment
# - tracking-detection-monitor
# - tracking-data-lifecycle
```

## Phase 3: Upstash Redis

### 3.1 Create Redis Database

1. Go to [upstash.com](https://upstash.com)
2. Create new database
3. Choose region (same as Supabase)
4. Enable TLS
5. Save credentials:
   - Redis URL
   - Redis token

### 3.2 Test Connection

```bash
# Test Redis connection
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-redis.upstash.io/set/test/hello
```

## Phase 4: Vercel Deployment

### 4.1 Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com)
2. Import Git repository
3. Select `apps/dashboard` as root directory
4. Framework preset: Next.js

### 4.2 Configure Environment Variables

In Vercel Dashboard > Settings > Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# AWS
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# Upstash Redis
UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=your-token

# CloudFront
NEXT_PUBLIC_TRACKING_SCRIPT_CDN=https://d111111abcdef8.cloudfront.net

# Platform Integrations (configure after OAuth setup)
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
TIKTOK_CLIENT_KEY=
LINKEDIN_CLIENT_ID=
```

### 4.3 Deploy

```bash
# Manual deploy
vercel --prod

# Or push to main branch for automatic deployment
git push origin main
```

### 4.4 Configure Custom Domain (Optional)

1. Vercel Dashboard > Domains
2. Add domain: `analytics.yourdomain.com`
3. Update DNS records as instructed
4. Enable SSL (automatic)

## Phase 5: Platform Integrations

### 5.1 Google Ads OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Google Ads API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://yourdomain.com/api/integrations/google/callback`
6. Copy Client ID and Secret to Vercel env vars

### 5.2 Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create new app (Business type)
3. Add Marketing API product
4. Configure OAuth redirect: `https://yourdomain.com/api/integrations/facebook/callback`
5. Copy App ID and Secret to Vercel env vars

### 5.3 TikTok Marketing API

1. Apply at [TikTok for Business](https://business.tiktok.com)
2. Create developer app
3. Request Marketing API access
4. Configure OAuth settings
5. Copy credentials to Vercel env vars

### 5.4 LinkedIn Ads

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create new app
3. Request Marketing Developer Platform access
4. Configure OAuth redirect
5. Copy credentials to Vercel env vars

## Phase 6: Monitoring & Alerting

### 6.1 Supabase Monitoring

1. Dashboard > Logs > API Logs
2. Set up log drains (optional):
   - Datadog
   - LogDNA
   - Custom webhook

### 6.2 AWS CloudWatch

```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name tracking-platform \
  --dashboard-body file://cloudwatch-dashboard.json

# Set up alarms
aws cloudwatch put-metric-alarm \
  --alarm-name lambda-errors-high \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### 6.3 Vercel Monitoring

1. Dashboard > Analytics
2. Enable Web Vitals tracking
3. Set up deployment notifications

### 6.4 Error Tracking (Sentry)

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard -i nextjs

# Add to Vercel env vars
NEXT_PUBLIC_SENTRY_DSN=your-dsn
```

## Phase 7: Performance Optimization

### 7.1 CloudFront Optimizations

```bash
# Create custom cache policy
aws cloudfront create-cache-policy \
  --cache-policy-config file://cache-policy.json

# Enable compression
aws cloudfront update-distribution \
  --id YOUR_DISTRIBUTION_ID \
  --compress
```

### 7.2 Database Indexing

```sql
-- Verify critical indexes exist
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public';

-- Add composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_events_org_website_created
ON events(org_id, website_id, created_at DESC);
```

### 7.3 Redis Caching Strategy

Implement in dashboard code:

```typescript
// Cache frequently accessed data
const cacheKey = `website:${websiteId}:config`
const cached = await redis.get(cacheKey)

if (!cached) {
  const data = await supabase.from('websites').select('*')
  await redis.setex(cacheKey, 3600, JSON.stringify(data))
}
```

## Phase 8: Security Hardening

### 8.1 Supabase Security

- [ ] Review RLS policies
- [ ] Enable 2FA for admin accounts
- [ ] Rotate service role keys
- [ ] Enable database backups (automatic)
- [ ] Configure PITR (Point-in-Time Recovery)

### 8.2 AWS Security

- [ ] Enable GuardDuty
- [ ] Configure IAM roles with least privilege
- [ ] Enable S3 bucket encryption
- [ ] Set up AWS Secrets Manager for sensitive data
- [ ] Enable CloudTrail logging

### 8.3 Vercel Security

- [ ] Enable DDoS protection
- [ ] Configure rate limiting
- [ ] Set up WAF rules (Enterprise)
- [ ] Enable secure headers

## Phase 9: Backup & Disaster Recovery

### 9.1 Database Backups

Supabase provides automatic daily backups. For manual backup:

```bash
# Export database
pg_dump --host=db.your-project.supabase.co \
  --username=postgres \
  --dbname=postgres \
  --file=backup.sql

# Store in S3
aws s3 cp backup.sql s3://your-backup-bucket/$(date +%Y%m%d)/
```

### 9.2 Infrastructure as Code

All AWS infrastructure is defined in CDK, enabling easy recreation:

```bash
cd infrastructure/aws
cdk deploy --all
```

### 9.3 Disaster Recovery Plan

1. **RPO (Recovery Point Objective)**: 24 hours
2. **RTO (Recovery Time Objective)**: 4 hours
3. **Backup frequency**: Daily automated + on-demand
4. **Backup retention**: 30 days
5. **Failover region**: us-west-2 (if primary is us-east-1)

## Phase 10: Go Live Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Edge Functions deployed
- [ ] AWS infrastructure deployed
- [ ] Tracking script uploaded to CDN
- [ ] Dashboard deployed to Vercel
- [ ] Custom domain configured
- [ ] SSL certificates active
- [ ] Monitoring dashboards created
- [ ] Alerting rules configured
- [ ] Error tracking initialized
- [ ] Platform OAuth apps approved
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated

## Scaling Considerations

### Horizontal Scaling

- **Database**: Enable read replicas in Supabase
- **Lambda**: Automatic scaling (monitor concurrent executions)
- **Redis**: Upgrade to cluster mode for high availability

### Vertical Scaling

- **Database**: Upgrade Supabase plan
- **Lambda**: Increase memory allocation
- **Redis**: Upgrade to larger instance

### Cost Optimization

- **S3**: Enable lifecycle policies for old data
- **Lambda**: Use provisioned concurrency for consistent workloads
- **CloudFront**: Review cache hit ratios
- **Supabase**: Monitor database size and API requests

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor error rates
- Check platform sync status
- Review anomaly alerts

**Weekly:**
- Review CloudWatch metrics
- Check database performance
- Validate backup integrity

**Monthly:**
- Security updates
- Cost analysis
- Capacity planning
- Performance optimization

### Emergency Contacts

- **Database issues**: Supabase support
- **Infrastructure issues**: AWS support
- **Deployment issues**: Vercel support
- **Platform integrations**: Respective platform support

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)

**Need help?** Contact support@example.com
