# Deployment Guide

Complete step-by-step guide to deploy the tracking system.

## Prerequisites

1. **Node.js** 18+ installed
2. **pnpm** installed: `npm install -g pnpm`
3. **AWS CLI** installed: https://aws.amazon.com/cli/
4. **Supabase CLI** installed: `npm install -g supabase`
5. **Git** installed
6. **Accounts created**:
   - AWS account
   - Supabase account
   - Vercel account

## Deployment Order

1. ✅ Supabase (Database & Edge Functions)
2. ✅ AWS Infrastructure (CDK)
3. ✅ Vercel (Dashboard)
4. ✅ Tracking Script (CloudFront)
5. ✅ Test OAuth flows

---

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New project"
3. Fill in details:
   - Name: `tracking-system`
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Wait for project to be ready (~2 minutes)

### 1.2 Get Supabase Credentials

1. Go to Settings → API
2. Copy these values:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

### 1.3 Enable TimescaleDB Extension

1. Go to Database → Extensions
2. Search for "timescaledb"
3. Click "Enable"

### 1.4 Run Database Migrations

```bash
cd tracking-script

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Or manually via SQL Editor:

1. Go to SQL Editor
2. Open `packages/database/migrations/001_initial_schema.sql`
3. Copy and paste into SQL Editor
4. Click "Run"
5. Repeat with `packages/database/migrations/002_user_managed_credentials.sql`

### 1.5 Deploy Edge Functions

```bash
cd packages/database/supabase/functions

# Deploy ingest-events function
supabase functions deploy ingest-events

# Deploy affiliate-webhook function
supabase functions deploy affiliate-webhook

# Set secrets
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
```

### 1.6 Verify Supabase Setup

1. Go to Table Editor → Should see 20+ tables
2. Go to Edge Functions → Should see 2 functions deployed
3. Test Edge Function:
   ```bash
   curl -X POST 'https://your-project.supabase.co/functions/v1/ingest-events' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{}'
   ```

---

## Step 2: AWS Infrastructure Setup

### 2.1 Configure AWS CLI

```bash
# Configure with your credentials
aws configure

# Enter:
# AWS Access Key ID: YOUR_KEY
# AWS Secret Access Key: YOUR_SECRET
# Default region: us-east-1
# Default output format: json
```

### 2.2 Install AWS CDK

```bash
npm install -g aws-cdk

# Verify installation
cdk --version
```

### 2.3 Bootstrap CDK (First Time Only)

```bash
cd infrastructure/aws

# Bootstrap your AWS account for CDK
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

Replace `YOUR_ACCOUNT_ID` with your AWS account ID (find in AWS Console → top right).

### 2.4 Install Dependencies

```bash
cd infrastructure/aws
pnpm install
```

### 2.5 Deploy Infrastructure

```bash
# See what will be created
cdk diff

# Deploy infrastructure
cdk deploy

# Confirm with 'y' when prompted
```

This creates:
- DynamoDB table for caching
- S3 buckets for scripts and data archive
- CloudFront distribution for script delivery
- Lambda functions (enrichment, identity resolution, detection monitoring, data lifecycle)
- SQS queue for event processing
- EventBridge rules for scheduled jobs

### 2.6 Note CDK Outputs

After deployment, CDK outputs important values:

```
Outputs:
TrackingInfrastructureStack.TrackingScriptBucketName = tracking-scripts-123456789012
TrackingInfrastructureStack.CloudFrontDistributionDomain = d1234567890.cloudfront.net
TrackingInfrastructureStack.EventQueueUrl = https://sqs.us-east-1.amazonaws.com/...
TrackingInfrastructureStack.DataArchiveBucketName = tracking-data-archive-123456789012
TrackingInfrastructureStack.CacheTableName = tracking-cache
```

**Save these values** for later configuration.

### 2.7 Verify AWS Setup

1. Go to AWS Console → DynamoDB → Tables → Should see `tracking-cache`
2. Go to S3 → Should see 2 buckets
3. Go to Lambda → Should see 4 functions
4. Go to CloudFront → Should see 1 distribution

---

## Step 3: Vercel Deployment

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Prepare Environment Variables

Create `.env.production` file in `apps/dashboard/`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AWS
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
DYNAMODB_CACHE_TABLE=tracking-cache

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your-256-bit-base64-key
```

### 3.3 Deploy to Vercel

```bash
cd apps/dashboard

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

### 3.4 Set Environment Variables in Vercel UI

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `.env.production`
5. Select environments: Production, Preview, Development
6. Click "Save"

### 3.5 Redeploy with Environment Variables

```bash
vercel --prod
```

### 3.6 Verify Dashboard Deployment

1. Visit your Vercel URL
2. Sign up for an account
3. Should see dashboard with:
   - Websites page
   - Affiliate page
   - Audiences page
   - Integrations page
   - Analytics page

---

## Step 4: Tracking Script Deployment

### 4.1 Build Tracking Script

```bash
cd apps/tracking-script

# Install dependencies
pnpm install

# Build minified script
pnpm build
```

This creates `dist/tracker.min.js` (<20KB gzipped).

### 4.2 Upload to S3

```bash
# Upload to S3 bucket (replace bucket name from CDK outputs)
aws s3 cp dist/tracker.min.js s3://tracking-scripts-YOUR_ACCOUNT_ID/v1/tracker.min.js \
  --content-type "application/javascript" \
  --cache-control "public, max-age=31536000, immutable"
```

### 4.3 Get CloudFront URL

From CDK outputs, you have CloudFront domain: `d1234567890.cloudfront.net`

Full tracking script URL:
```
https://d1234567890.cloudfront.net/v1/tracker.min.js
```

### 4.4 Test Tracking Script

Create test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Tracking Test</title>
</head>
<body>
  <h1>Tracking Script Test</h1>
  <button id="test-click">Click Me</button>

  <script src="https://YOUR_CLOUDFRONT_DOMAIN/v1/tracker.min.js"></script>
  <script>
    // Initialize tracker
    tracker.init({
      websiteId: 'test-website-id',
      apiEndpoint: 'https://your-project.supabase.co/functions/v1/ingest-events',
      apiKey: 'YOUR_ANON_KEY',
      obfuscationLevel: 'moderate'
    });

    // Track pageview
    tracker.trackPageView();

    // Track button click
    document.getElementById('test-click').addEventListener('click', () => {
      tracker.trackEvent('button_click', { button: 'test' });
    });
  </script>
</body>
</html>
```

Open in browser and check:
1. Console → Should see tracker initialized
2. Network tab → Should see requests to Supabase Edge Function
3. Supabase Dashboard → Table Editor → `events` table → Should see events

---

## Step 5: Configure OAuth Apps

Users must create OAuth apps on each platform they want to use.

### 5.1 Google Ads Setup

1. **Create Google Cloud Project**:
   - Go to https://console.cloud.google.com/
   - Create new project: "Tracking System OAuth"

2. **Enable Google Ads API**:
   - APIs & Services → Library
   - Search "Google Ads API"
   - Click "Enable"

3. **Create OAuth Credentials**:
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Name: "Tracking System"
   - Authorized redirect URIs:
     ```
     https://your-domain.vercel.app/api/integrations/google-ads/callback
     ```
   - Save **Client ID** and **Client Secret**

4. **Get Developer Token**:
   - Go to https://ads.google.com/
   - Tools & Settings → Setup → API Center
   - Request and copy **Developer Token**

### 5.2 Facebook Ads Setup

1. **Create Facebook App**:
   - Go to https://developers.facebook.com/
   - My Apps → Create App
   - Use case: Business
   - Type: Business

2. **Add Marketing API**:
   - Dashboard → Add Product → Marketing API

3. **Configure OAuth**:
   - Settings → Basic
   - Copy **App ID** and **App Secret**
   - Add OAuth redirect URI:
     ```
     https://your-domain.vercel.app/api/integrations/facebook/callback
     ```
   - Save changes

### 5.3 TikTok Ads Setup

1. **Apply for TikTok Marketing API**:
   - Go to https://ads.tiktok.com/marketing_api/homepage
   - Click "Get Started"
   - Fill in application form

2. **Create App** (after approval):
   - TikTok for Business → Developer Portal
   - My Apps → Create New App
   - Copy **Client Key** and **Client Secret**
   - Add redirect URI:
     ```
     https://your-domain.vercel.app/api/integrations/tiktok/callback
     ```

### 5.4 LinkedIn Ads Setup

1. **Create LinkedIn App**:
   - Go to https://www.linkedin.com/developers/apps
   - Create app
   - Fill in app details

2. **Request API Access**:
   - Products tab → Request access to "Advertising API"
   - Wait for approval (~1-2 days)

3. **Configure OAuth**:
   - Auth tab → Copy **Client ID** and **Client Secret**
   - Redirect URLs → Add:
     ```
     https://your-domain.vercel.app/api/integrations/linkedin/callback
     ```
   - OAuth 2.0 scopes → Select: `r_ads`, `r_organization_social`, `w_organization_social`

---

## Step 6: Test OAuth Flows

### 6.1 Add Integration in Dashboard

1. Login to dashboard
2. Go to Integrations page
3. Click "Add Integration"
4. Select platform (e.g., Google Ads)
5. Enter OAuth credentials:
   - Client ID
   - Client Secret
   - Developer Token (Google Ads only)
6. Click "Test Connection"
7. Should show "Connection successful"
8. Click "Save & Authorize"

### 6.2 Complete OAuth Flow

1. Redirected to platform OAuth page
2. Login if needed
3. Grant permissions
4. Redirected back to dashboard
5. Should see "Integration connected successfully!"

### 6.3 Verify Integration

1. Integrations page → Should show platform as "Connected"
2. Status should be green checkmark
3. Last sync time should show "Just now"

---

## Step 7: Create Test Audience and Sync

### 7.1 Create Segment

1. Go to Audiences page
2. Click "Create Segment"
3. Configure rules:
   - Name: "Test Visitors"
   - Rule: `visited_pages > 0`
4. Click "Create"
5. Wait for calculation (~30 seconds)
6. Should show user count

### 7.2 Sync to Platform

1. Click on segment
2. Click "Sync to Platforms"
3. Select platform (e.g., Google Ads)
4. Click "Sync Now"
5. Should see progress bar
6. Success message: "Synced X users to Google Ads"

### 7.3 Verify on Platform

**Google Ads**:
1. Go to https://ads.google.com/
2. Tools & Settings → Shared Library → Audience Manager
3. Should see new audience with name "Test Visitors"

**Facebook**:
1. Go to https://business.facebook.com/
2. Audiences
3. Should see new Custom Audience

---

## Troubleshooting

### CDK Deployment Fails

**Error**: "Stack already exists"
```bash
# Delete stack and redeploy
cdk destroy
cdk deploy
```

**Error**: "Insufficient permissions"
- Check IAM user has `AdministratorAccess` or necessary CDK permissions
- Verify AWS credentials are correct

### Vercel Deployment Fails

**Error**: "Build failed"
```bash
# Check build locally
cd apps/dashboard
pnpm install
pnpm build
```

**Error**: "Environment variables not set"
- Go to Vercel Dashboard → Settings → Environment Variables
- Verify all variables are set for Production environment

### OAuth Flow Fails

**Error**: "Redirect URI mismatch"
- Check OAuth app settings have exact redirect URI
- Verify `NEXT_PUBLIC_APP_URL` matches Vercel URL
- Ensure HTTPS (not HTTP)

**Error**: "Invalid credentials"
- Test credentials manually with platform's API
- Check for typos in Client ID/Secret
- Verify OAuth app is approved (LinkedIn, TikTok)

### Tracking Script Not Loading

**Error**: "404 Not Found"
- Verify script uploaded to correct S3 bucket
- Check CloudFront distribution is deployed
- Wait 5-10 minutes for CloudFront propagation

**Error**: "CORS error"
- Tracking script should not have CORS issues (no XHR/Fetch from script itself)
- Edge Function should have proper CORS headers

---

## Post-Deployment Checklist

- [ ] Supabase tables created (20+ tables)
- [ ] Edge Functions deployed and accessible
- [ ] AWS infrastructure deployed via CDK
- [ ] DynamoDB cache table exists
- [ ] Lambda functions created
- [ ] CloudFront distribution active
- [ ] Tracking script uploaded to S3
- [ ] Dashboard deployed to Vercel
- [ ] All environment variables set
- [ ] OAuth apps created on platforms
- [ ] Test integration connected successfully
- [ ] Test tracking script on demo page
- [ ] Test audience creation and sync
- [ ] Verified data flowing: Script → Edge Function → Database
- [ ] Monitoring setup (CloudWatch, Supabase Logs)

---

## Next Steps

1. **Custom Domain**: Set up custom domain in Vercel and update OAuth redirect URIs
2. **Monitoring**: Set up alerts in CloudWatch and Supabase
3. **Scaling**: Monitor DynamoDB and Lambda usage, adjust as needed
4. **Backups**: Enable Point-in-Time Recovery for DynamoDB
5. **Documentation**: Create user guide for your team

---

## Support

If you encounter issues:

1. Check logs:
   - Vercel: Dashboard → Deployments → Logs
   - AWS Lambda: CloudWatch → Log Groups
   - Supabase: Dashboard → Logs

2. Review documentation:
   - [Environment Variables](./ENVIRONMENT_VARIABLES.md)
   - [README](../README.md)
   - [API Documentation](./API.md)

3. Common issues:
   - [Deployment Troubleshooting](./TROUBLESHOOTING.md)
