# 🚀 Quick Start Guide - Audience Mapper

## ✅ Current Status

### Deployed and Live
- ✅ **Dashboard:** https://audience-mapper.vercel.app
- ✅ **Tracking CDN:** https://d2o4mys7y6h0j6.cloudfront.net
- ✅ **Database:** Supabase (20+ tables with RLS)
- ✅ **AWS Infrastructure:** DynamoDB, Lambda, S3, CloudFront, SQS, EventBridge
- ✅ **Edge Functions:** ingest-events, affiliate-webhook

---

## 🎯 Next Steps

### 1. Create Your Super Admin Account

Go to: https://audience-mapper.vercel.app/auth/signup

**Credentials (from CREDENTIALS.local.md):**
- Email: geet@adquark.io
- Password: Dang7898$

### 2. Create Your First Organization

After logging in:
1. You'll be prompted to create an organization
2. Name it "AdQuark" (or your company name)
3. You'll automatically be the owner

### 3. Add Your First Website

1. Go to Dashboard → Websites
2. Click "Add Website"
3. Enter your website details:
   - Name: "My Website"
   - Domain: "example.com"
   - Timezone: Your timezone
4. Copy the tracking code provided

### 4. Install Tracking Script

Add this to your website's `<head>` tag:

```html
<script src="https://d2o4mys7y6h0j6.cloudfront.net/v1/loader.min.js" data-website-id="YOUR_WEBSITE_ID"></script>
```

Replace `YOUR_WEBSITE_ID` with the ID from step 3.

### 5. Test Tracking

1. Visit your website with the script installed
2. Go back to Dashboard → Analytics
3. You should see your page view appear within seconds

### 6. Create Your First Audience Segment

1. Go to Dashboard → Audiences
2. Click "Create Segment"
3. Add rules (e.g., "Visited /pricing page")
4. Save the segment

### 7. Connect Advertising Platforms (Optional)

1. Go to Dashboard → Integrations
2. Choose a platform (Google Ads, Facebook, TikTok, LinkedIn)
3. Click "Connect" and follow OAuth flow
4. Once connected, you can sync audiences to that platform

---

## 🧪 Test Locally

### Start Development Server

```bash
cd /Users/geetsoni/Downloads/tracking-script/apps/dashboard
npm run dev
```

Dashboard will be available at: http://localhost:3000

### All Credentials Available In:
- `apps/dashboard/.env.local` - Environment variables
- `CREDENTIALS.local.md` - All sensitive credentials
- `DEPLOYMENT_INFO.md` - Full deployment documentation

---

## 📖 Key Files to Reference

### Configuration
- `/apps/dashboard/.env.local` - Local environment variables
- `/CREDENTIALS.local.md` - All sensitive credentials (NEVER commit)
- `/DEPLOYMENT_INFO.md` - Complete deployment information

### Documentation
- `/docs/ARCHITECTURE.md` - System architecture
- `/docs/API.md` - API endpoints
- `/docs/TRACKING.md` - Tracking implementation
- `/docs/DEPLOYMENT.md` - Deployment guide
- `/docs/OAUTH.md` - OAuth integration guide

### Database
- `/supabase/migrations/001_initial_schema.sql` - Main schema
- `/supabase/migrations/002_user_managed_credentials.sql` - OAuth schema

---

## 🔧 Common Tasks

### View Tracking Events
```sql
-- In Supabase SQL Editor
SELECT * FROM events ORDER BY created_at DESC LIMIT 100;
```

### Check User Profiles
```sql
SELECT * FROM user_profiles ORDER BY last_seen DESC LIMIT 50;
```

### View Segments
```sql
SELECT * FROM segments WHERE organization_id = 'YOUR_ORG_ID';
```

### Check Integration Status
```sql
SELECT * FROM integrations WHERE organization_id = 'YOUR_ORG_ID';
```

---

## 🎨 Example Integration

Here's a complete example for a blog:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Blog</title>
  
  <!-- Audience Mapper Tracking -->
  <script src="https://d2o4mys7y6h0j6.cloudfront.net/v1/loader.min.js" 
          data-website-id="abc123"></script>
</head>
<body>
  <h1>Welcome to My Blog</h1>
  
  <script>
    // Track custom event when user signs up
    document.getElementById('signup-button').addEventListener('click', function() {
      if (window.tracker) {
        window.tracker.track('signup_started', {
          plan: 'premium',
          source: 'blog'
        });
      }
    });
    
    // Track conversion with revenue
    function onPurchaseComplete(orderId, amount) {
      if (window.tracker) {
        window.tracker.track('purchase', {
          order_id: orderId,
          revenue: amount,
          currency: 'USD'
        });
      }
    }
  </script>
</body>
</html>
```

---

## 🚨 Troubleshooting

### Dashboard not loading
1. Check Vercel deployment: https://vercel.com/geet-sonis-projects/audience-mapper
2. View logs: `vercel logs --prod`
3. Verify environment variables are set

### Tracking not working
1. Open browser console for errors
2. Verify script URL is correct
3. Check website_id is valid
4. View events in Supabase: `SELECT * FROM events`

### OAuth not working
1. Verify platform credentials in dashboard
2. Check integration_errors table
3. Test token refresh: Check DynamoDB cache

### Local development issues
1. Ensure `.env.local` exists in `apps/dashboard/`
2. Run `npm install` in root and dashboard
3. Check Node.js version (should be 18+)

---

## 📞 Support Resources

### Live URLs
- **Dashboard:** https://audience-mapper.vercel.app
- **Supabase:** https://supabase.com/dashboard/project/lmmspmhzezesexeyndvq
- **AWS Console:** https://console.aws.amazon.com (region: ap-south-1)
- **Vercel:** https://vercel.com/geet-sonis-projects/audience-mapper
- **GitHub:** https://github.com/sonigeet20/audience-mapper

### Logs & Monitoring
- **Vercel Logs:** `cd apps/dashboard && vercel logs --prod`
- **Supabase Logs:** Project Dashboard → Logs
- **CloudWatch:** AWS Console → CloudWatch → Logs
- **Edge Function Logs:** Supabase → Functions → Logs

---

## ✨ Features Overview

### Tracking
- ✅ Page views (automatic)
- ✅ Custom events
- ✅ User properties
- ✅ Session tracking
- ✅ UTM parameters
- ✅ Referrer tracking
- ✅ Device & browser detection
- ✅ IP geolocation

### Analytics
- ✅ Real-time dashboard
- ✅ Event filtering
- ✅ User timeline
- ✅ Session replay (data only)
- ✅ Conversion tracking

### Audience Management
- ✅ Rule-based segments
- ✅ Real-time updates
- ✅ Platform sync (Google, Facebook, TikTok, LinkedIn)
- ✅ Export capabilities

### Affiliate Tracking
- ✅ Click tracking
- ✅ Conversion attribution
- ✅ Commission calculation
- ✅ Multi-level referrals

### Integrations
- ✅ Google Ads (OAuth)
- ✅ Facebook Ads (OAuth)
- ✅ TikTok Ads (OAuth)
- ✅ LinkedIn Ads (OAuth)
- ✅ User-managed credentials
- ✅ Encrypted storage
- ✅ Token refresh automation

---

**Ready to start tracking? Go to: https://audience-mapper.vercel.app** 🚀
