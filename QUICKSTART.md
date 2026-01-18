# Quick Start Guide

## 🎯 5-Minute Setup

Get the tracking platform running locally in 5 minutes.

### Prerequisites

```bash
node --version  # Should be 18+
npm --version
```

### 1. Install Dependencies

```bash
git clone <repository-url>
cd tracking-script
npm install
```

### 2. Configure Environment

Create `apps/dashboard/.env.local`:

```bash
# Supabase (get from https://supabase.com/dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### 3. Set Up Database

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
cd packages/database
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy ingest-events
supabase functions deploy affiliate-webhook
```

### 4. Build Tracking Script

```bash
cd apps/tracking-script
npm run build
# Output: dist/tracker.min.js
```

### 5. Start Dashboard

```bash
cd apps/dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 🧪 Test the Tracking Script

Create `test.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Tracking Test</title>
  <script>
    (function(w,d,s,o,f,js,fjs){
      w['TrackingObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
      js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
      js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
    }(window,document,'script','tracker','http://localhost:3001/tracker.min.js'));

    tracker('init', 'YOUR_TRACKING_CODE');
    tracker('trackEvent', 'page_view');
  </script>
</head>
<body>
  <h1>Tracking Test</h1>
  <button id="testBtn">Test Button</button>
  <script>
    document.getElementById('testBtn').addEventListener('click', function() {
      tracker('trackEvent', 'button_click');
    });
  </script>
</body>
</html>
```

Serve the tracking script:

```bash
cd apps/tracking-script/dist
python3 -m http.server 3001
```

Open `test.html` in your browser and check the Network tab for events being sent!

## 📋 Next Steps

1. **Add a Website**
   - Go to Dashboard > Websites
   - Click "Add Website"
   - Copy tracking code
   - Install on your site

2. **Configure Affiliate Tracking**
   - Dashboard > Affiliate URLs
   - Add impression pixels
   - Set URL patterns for triggering

3. **Create Audiences**
   - Dashboard > Audiences
   - Build segments with filters
   - Set up platform integrations

4. **Connect Ad Platforms**
   - Dashboard > Integrations
   - Authenticate with OAuth
   - Configure sync settings

## 🔧 Common Issues

**Port already in use:**
```bash
# Change port
npm run dev -- -p 3002
```

**Supabase connection error:**
- Verify `.env.local` has correct credentials
- Check Supabase project is active
- Ensure API is enabled in Supabase Dashboard

**Tracking script not loading:**
- Verify CORS is configured in Supabase
- Check browser console for errors
- Ensure tracking code matches website record

## 📚 Learn More

- [Full README](./README.md) - Complete documentation
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [API Reference](./docs/api-reference.md) - API endpoints
- [Architecture](./docs/architecture.md) - System design

## 💬 Get Help

- GitHub Issues: Report bugs
- Discussions: Ask questions
- Email: support@example.com

---

**Ready to go deeper?** Check out the [full documentation](./README.md) →
