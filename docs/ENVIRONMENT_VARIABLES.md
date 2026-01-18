# Environment Variables

This document lists all required environment variables for the tracking system.

## Dashboard (Next.js on Vercel)

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### AWS Configuration
```bash
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
DYNAMODB_CACHE_TABLE=tracking-cache
```

### Application Configuration
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Encryption
```bash
# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=your-256-bit-base64-encoded-key
```

## AWS Lambda Functions

All Lambda functions need these environment variables (set in CDK stack):

```bash
DYNAMODB_CACHE_TABLE=tracking-cache
ARCHIVE_BUCKET=tracking-data-archive-{account-id}
```

## Supabase Edge Functions

### ingest-events
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### affiliate-webhook
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Platform OAuth Credentials (User-Managed)

These credentials are **NOT** environment variables. Users provide them through the dashboard UI:

### Google Ads
- Client ID
- Client Secret
- Developer Token

### Facebook Ads
- App ID
- App Secret

### TikTok Ads
- Client Key
- Client Secret

### LinkedIn Ads
- Client ID
- Client Secret

## How to Obtain Credentials

### AWS Credentials

1. **Sign in to AWS Console**: https://console.aws.amazon.com/
2. **Create IAM User**:
   - Go to IAM → Users → Create User
   - Username: `tracking-system-deploy`
   - Permissions: Attach policies directly
     - `AdministratorAccess` (for CDK deployment) OR
     - Custom policy with: CloudFormation, Lambda, S3, DynamoDB, CloudFront, SQS, EventBridge, IAM permissions
3. **Create Access Key**:
   - Select user → Security credentials → Create access key
   - Use case: CLI
   - Copy `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### Supabase Credentials

1. **Sign in to Supabase**: https://supabase.com/dashboard
2. **Create new project** or select existing
3. **Get credentials**:
   - Go to Settings → API
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### Encryption Key

Generate a secure 256-bit key:

```bash
openssl rand -base64 32
```

Copy the output to `ENCRYPTION_KEY` environment variable.

### Platform OAuth Apps (User-Managed)

Users must create OAuth apps on each platform:

#### Google Ads
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable Google Ads API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-domain.vercel.app/api/integrations/google-ads/callback`
5. Get Developer Token from Google Ads Manager: https://ads.google.com/home/tools/manager-accounts/

#### Facebook Ads
1. Go to https://developers.facebook.com/
2. Create new app or select existing
3. Add "Marketing API" product
4. Basic Settings → Copy App ID and App Secret
5. Add OAuth redirect URI: `https://your-domain.vercel.app/api/integrations/facebook/callback`

#### TikTok Ads
1. Go to https://ads.tiktok.com/marketing_api/homepage
2. Apply for API access
3. Create new app
4. Copy Client Key and Client Secret
5. Add redirect URI: `https://your-domain.vercel.app/api/integrations/tiktok/callback`

#### LinkedIn Ads
1. Go to https://www.linkedin.com/developers/apps
2. Create new app
3. Products → Request access to "Advertising API"
4. Auth → Copy Client ID and Client Secret
5. Add redirect URI: `https://your-domain.vercel.app/api/integrations/linkedin/callback`

## Environment Variable Setup

### Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in all required variables in `.env.local`

3. Never commit `.env.local` to git

### Vercel Deployment

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. Add all dashboard environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `DYNAMODB_CACHE_TABLE`
   - `NEXT_PUBLIC_APP_URL`
   - `ENCRYPTION_KEY`

3. Set environment for: Production, Preview, Development

### AWS Lambda (via CDK)

Environment variables are automatically set in `infrastructure/aws/lib/tracking-infrastructure-stack.ts`:

```typescript
environment: {
  DYNAMODB_CACHE_TABLE: cacheTable.tableName,
  ARCHIVE_BUCKET: dataArchiveBucket.bucketName,
}
```

### Supabase Edge Functions

1. Go to Supabase Dashboard → Edge Functions
2. For each function, add environment variables:
   ```bash
   supabase secrets set SUPABASE_URL=https://your-project.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
   ```

Or in `supabase/functions/.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Security Best Practices

1. **Never commit secrets to git**
   - Add `.env*` to `.gitignore`
   - Use environment variables in CI/CD

2. **Rotate credentials regularly**
   - AWS access keys: Every 90 days
   - Supabase service role key: When compromised
   - Encryption key: Never (would lose all encrypted data)

3. **Use least privilege**
   - AWS IAM: Only grant necessary permissions
   - Supabase RLS: Enforce row-level security

4. **Monitor usage**
   - AWS CloudTrail: Track API calls
   - Supabase Logs: Monitor database access
   - Platform OAuth: Check API usage limits

## Troubleshooting

### "Invalid credentials" error
- Check credentials are correct (no extra spaces)
- Verify IAM user has necessary permissions
- Check AWS region matches deployed resources

### "CORS error" in OAuth flow
- Verify redirect URIs match exactly in OAuth app settings
- Check `NEXT_PUBLIC_APP_URL` is correct
- Ensure HTTPS in production

### "Encryption/decryption failed"
- Verify `ENCRYPTION_KEY` is exactly 32 bytes (base64 encoded)
- Check key hasn't changed (would make old data unreadable)
- Ensure key is consistent across all deployments

### "DynamoDB table not found"
- Run `cdk deploy` to create infrastructure
- Verify `DYNAMODB_CACHE_TABLE` matches CDK output
- Check AWS region is correct
