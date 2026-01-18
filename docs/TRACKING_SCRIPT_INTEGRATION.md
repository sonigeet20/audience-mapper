# Tracking Script Integration Guide

## Overview

Our tracking system uses a **two-script architecture** for maximum flexibility:

1. **Loader Script** (eternal, ~1KB) - One-time installation, never needs updating
2. **Main Tracker** (dynamic, ~20KB) - Automatically loaded with latest features

## Why This Architecture?

- ✅ **Never update client websites** - loader stays the same forever
- ✅ **Instant updates** - deploy new features without client action
- ✅ **Provider independence** - switch CDN/hosting without changing script
- ✅ **Fallback support** - automatic failover to backup CDN
- ✅ **Version control** - pin to specific version if needed

---

## Quick Start

### Option 1: Simple Installation (Recommended)

Paste this script in your `<head>` tag:

```html
<script>
(function(){var t=document.createElement('script');t.async=1;
t.src='https://cdn.yourdomain.com/v1/tracker.js?t='+Date.now();
t.setAttribute('data-website-id','YOUR_WEBSITE_ID');
document.head.appendChild(t);})();
</script>
```

**Replace:**
- `cdn.yourdomain.com` with your tracking CDN domain
- `YOUR_WEBSITE_ID` with your website ID from dashboard

### Option 2: Hosted Loader (Alternative)

```html
<script 
  src="https://cdn.yourdomain.com/loader.min.js"
  data-website-id="YOUR_WEBSITE_ID"
  async defer>
</script>
```

---

## Configuration Options

All configuration is done via `data-*` attributes on the loader script:

```html
<script 
  src="https://cdn.yourdomain.com/loader.min.js"
  data-website-id="abc123"
  data-api-endpoint="https://yourproject.supabase.co/functions/v1/ingest-events"
  data-obfuscation="moderate"
  data-sampling="0.8"
  data-debug="false"
  data-version="latest"
  data-fallback-cdn="https://backup-cdn.yourdomain.com"
  async defer>
</script>
```

### Available Options

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data-website-id` | ✅ Yes | - | Your unique website ID |
| `data-api-endpoint` | No | Auto-detected | Event ingestion endpoint |
| `data-cdn-url` | No | `https://cdn.yourdomain.com` | Primary CDN URL |
| `data-obfuscation` | No | `moderate` | Obfuscation level: `minimal`, `moderate`, `aggressive`, `adaptive` |
| `data-sampling` | No | `1.0` | Sampling rate (0.0-1.0) |
| `data-debug` | No | `false` | Enable debug logging |
| `data-version` | No | `latest` | Pin to specific version (e.g., `v1.2.3`) |
| `data-fallback-cdn` | No | - | Backup CDN for failover |

---

## Permanent Endpoint Strategy

### Custom Domain Setup

For provider independence, use a custom domain:

```
cdn.yourdomain.com  →  Points to current CDN provider
```

#### Benefits:
- Switch from AWS to Cloudflare without changing script
- Update DNS, not client code
- Multiple CDN providers for redundancy

#### DNS Configuration (Example):

```
# Primary (CloudFront)
cdn.yourdomain.com  CNAME  d1234567890.cloudfront.net

# Backup (Cloudflare)
backup-cdn.yourdomain.com  CNAME  yourdomain.cdn.cloudflare.net
```

### Version Management

#### Always Use Latest (Default)
```html
data-version="latest"
```
Automatically gets newest features and bug fixes.

#### Pin to Specific Version
```html
data-version="v1.2.3"
```
Lock to a specific version for stability.

#### Gradual Rollout
```html
<!-- 20% of traffic on new version -->
<script>
if (Math.random() < 0.2) {
  // v2.0.0 (new version)
} else {
  // v1.9.0 (stable version)
}
</script>
```

---

## How Updates Work

### Update Flow

1. **You deploy new tracker version** → Upload `tracker.js` to CDN
2. **Loader fetches latest** → Next page load gets new version
3. **Zero client action** → Websites automatically updated

### Cache Strategy

- **Loader script** (`loader.min.js`): Long cache (1 year) - never changes
- **Main tracker** (`tracker.js`): Short cache (1 hour) - frequent updates
- Cache busting: `?t=timestamp` query parameter

### Example Update Scenario

**Before:**
```
cdn.yourdomain.com/v1/tracker.js  →  CloudFront (AWS)
```

**After switching to Cloudflare:**
```
1. Update DNS: cdn.yourdomain.com  →  Cloudflare
2. Upload tracker.js to Cloudflare
3. Wait for DNS propagation (5-60 minutes)
4. Done! All websites now use Cloudflare
```

Client websites: **No changes needed** ✅

---

## Advanced Features

### Manual Initialization

If you need custom initialization logic:

```html
<script src="https://cdn.yourdomain.com/loader.min.js" data-website-id="abc123"></script>
<script>
// Wait for tracker to load
(function checkTracker() {
  if (window.tracker) {
    // Custom initialization
    tracker.setUserId('user-123');
    tracker.trackPageView({ source: 'direct' });
  } else {
    setTimeout(checkTracker, 100);
  }
})();
</script>
```

### Multiple Trackers

Run multiple tracking scripts independently:

```html
<!-- Production tracker -->
<script data-website-id="prod-123" ...></script>

<!-- Test tracker -->
<script data-website-id="test-456" ...></script>
```

### SPA (Single Page Application) Integration

For React, Vue, Angular, etc.:

```javascript
// Load tracker once on app mount
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://cdn.yourdomain.com/v1/tracker.js';
  script.async = true;
  script.setAttribute('data-website-id', 'abc123');
  document.head.appendChild(script);
}, []);

// Track route changes
useEffect(() => {
  if (window.tracker) {
    window.tracker.trackPageView({ path: location.pathname });
  }
}, [location.pathname]);
```

---

## Performance Impact

### Loader Script
- **Size:** ~1KB minified
- **Load time:** <50ms
- **Blocking:** None (async)

### Main Tracker
- **Size:** ~20KB minified + gzipped
- **Load time:** <200ms (from CDN)
- **Blocking:** None (async + defer)

### Best Practices
1. ✅ Place loader in `<head>` with `async`
2. ✅ Use custom domain with long TTL
3. ✅ Enable gzip/brotli compression
4. ✅ Use CDN with global edge locations
5. ✅ Monitor with fallback CDN

---

## Monitoring & Debugging

### Enable Debug Mode

```html
<script data-website-id="abc123" data-debug="true"></script>
```

Console output:
```
[Tracker] Initialized (v1.2.3)
[Tracker] Website ID: abc123
[Tracker] API Endpoint: https://...
[Tracker] Tracked: pageview
```

### Performance Monitoring

```javascript
// Check loader timing
if (performance.getEntriesByName('tracker-loader-complete').length) {
  const mark = performance.getEntriesByName('tracker-loader-complete')[0];
  console.log('Loader ready in:', mark.startTime, 'ms');
}
```

### Error Handling

Loader automatically:
- Logs errors to console
- Attempts fallback CDN if configured
- Degrades gracefully if script fails

---

## Migration from Old Script

If you have an old tracking script:

### Before (Old Method)
```html
<script src="https://old-cdn.com/tracking.js"></script>
<script>
  oldTracker.init({ websiteId: 'abc123' });
</script>
```

### After (New Method)
```html
<script>
(function(){var t=document.createElement('script');t.async=1;
t.src='https://cdn.yourdomain.com/v1/tracker.js';
t.setAttribute('data-website-id','abc123');
document.head.appendChild(t);})();
</script>
```

**Remove old script** after confirming new one works.

---

## FAQ

**Q: What if the CDN goes down?**  
A: Use `data-fallback-cdn` for automatic failover to backup CDN.

**Q: Can I self-host the loader?**  
A: Yes, but defeats the purpose. Loader should be on reliable CDN.

**Q: How often does tracker update?**  
A: Automatically on every page load (respects cache headers).

**Q: Can I use a specific version?**  
A: Yes, use `data-version="v1.2.3"` to pin a version.

**Q: Does this work with Content Security Policy (CSP)?**  
A: Yes, add `script-src 'unsafe-inline' cdn.yourdomain.com`

**Q: What about GDPR/CCPA?**  
A: Loader respects DNT headers and consent flags (configure in dashboard).

---

## Support

- 📧 Email: support@yourdomain.com
- 📚 Documentation: https://docs.yourdomain.com
- 💬 Chat: https://yourdomain.com/support
