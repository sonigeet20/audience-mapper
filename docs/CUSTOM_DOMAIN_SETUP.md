# Custom Domain Setup for Eternal Tracking Script

## Overview

Using a custom domain (e.g., `cdn.yourdomain.com`) instead of CloudFront's default domain provides:

✅ **Provider Independence** - Switch from AWS to Cloudflare/Fastly without changing client code  
✅ **Brand Consistency** - Use your own domain instead of `cloudfront.net`  
✅ **Flexibility** - Update DNS to point to any CDN provider  
✅ **Multi-CDN Strategy** - Route traffic to different CDNs by geography  

---

## Current Setup (Temporary)

Your tracking scripts are currently available at:

```
Loader:  https://d21qcvva8ccdyb.cloudfront.net/v1/loader.min.js
Tracker: https://d21qcvva8ccdyb.cloudfront.net/v1/tracker.js
```

**Problem:** If you switch from AWS CloudFront to another provider, all client websites break.

---

## Recommended Setup (Permanent)

Use a custom domain that you control:

```
Loader:  https://cdn.yourdomain.com/v1/loader.min.js
Tracker: https://cdn.yourdomain.com/v1/tracker.js
```

**Benefit:** Switch CDN providers anytime by updating DNS - client websites keep working.

---

## Step-by-Step Setup

### Step 1: Choose a Subdomain

Pick a subdomain for your tracking scripts:
- `cdn.yourdomain.com` (recommended)
- `track.yourdomain.com`
- `assets.yourdomain.com`
- `scripts.yourdomain.com`

### Step 2: Request SSL Certificate in AWS ACM

1. **Go to AWS Certificate Manager** (ACM)
   - **Important:** Must be in `us-east-1` region for CloudFront
   - Switch region in top-right: `US East (N. Virginia)`

2. **Request public certificate**
   ```
   Domain name: cdn.yourdomain.com
   Validation method: DNS validation (recommended)
   ```

3. **Add DNS validation record**
   - ACM will provide a CNAME record
   - Add this to your domain's DNS provider (GoDaddy, Cloudflare, Route53, etc.)
   - Wait 5-30 minutes for validation

4. **Certificate Status: Issued** ✅

### Step 3: Add Custom Domain to CloudFront

1. **Go to CloudFront Console**
   - Find distribution: `d21qcvva8ccdyb.cloudfront.net`

2. **Edit distribution settings**
   ```
   Alternate Domain Names (CNAMEs): cdn.yourdomain.com
   SSL Certificate: Custom SSL Certificate → Select your ACM certificate
   ```

3. **Save changes** (takes 5-15 minutes to deploy)

### Step 4: Create DNS CNAME Record

In your DNS provider (GoDaddy, Cloudflare, Route53, etc.):

```
Type:  CNAME
Name:  cdn (or cdn.yourdomain.com)
Value: d21qcvva8ccdyb.cloudfront.net
TTL:   1 hour (3600 seconds)
```

**Example configurations:**

**GoDaddy:**
```
Type: CNAME
Host: cdn
Points to: d21qcvva8ccdyb.cloudfront.net
TTL: 1 Hour
```

**Cloudflare:**
```
Type: CNAME
Name: cdn
Target: d21qcvva8ccdyb.cloudfront.net
Proxy status: DNS only (click orange cloud to gray)
TTL: Auto
```

**AWS Route53:**
```
Record name: cdn.yourdomain.com
Record type: CNAME
Value: d21qcvva8ccdyb.cloudfront.net
TTL: 3600
Routing policy: Simple routing
```

### Step 5: Test Custom Domain

Wait 5-10 minutes for DNS propagation, then test:

```bash
# Check DNS resolution
nslookup cdn.yourdomain.com

# Test HTTPS (should return 200 OK)
curl -I https://cdn.yourdomain.com/v1/tracker.js

# Test in browser
https://cdn.yourdomain.com/v1/tracker.js
```

**Expected result:**
- DNS resolves to CloudFront IP addresses
- HTTPS works (no certificate errors)
- Script loads successfully

### Step 6: Update Client Websites

**Old code (temporary):**
```html
<script>
(function(){
  var t=document.createElement('script');
  t.src='https://d21qcvva8ccdyb.cloudfront.net/v1/tracker.js';
  ...
})();
</script>
```

**New code (permanent):**
```html
<script>
(function(){
  var t=document.createElement('script');
  t.src='https://cdn.yourdomain.com/v1/tracker.js';
  ...
})();
</script>
```

---

## Future: Switch to Different CDN

When you want to switch from AWS CloudFront to another provider:

### Example: Migrate to Cloudflare

1. **Upload scripts to Cloudflare R2 or Workers**
   ```bash
   # Upload to Cloudflare R2
   wrangler r2 object put tracking-scripts/v1/loader.min.js \
     --file=dist/loader.min.js
   
   wrangler r2 object put tracking-scripts/v1/tracker.js \
     --file=dist/tracker.js
   ```

2. **Update DNS CNAME**
   ```
   # Old
   cdn.yourdomain.com  CNAME  d21qcvva8ccdyb.cloudfront.net
   
   # New
   cdn.yourdomain.com  CNAME  cdn.yourdomain.com.cdn.cloudflare.net
   ```

3. **Wait for DNS propagation** (5-60 minutes)

4. **Done!** All client websites now use Cloudflare ✅

**Client websites:** NO CHANGES NEEDED - same URL still works!

---

## Multi-CDN Strategy (Advanced)

Route traffic to different CDNs based on geography:

### AWS Route53 Geolocation Routing

```
# North America → CloudFront
cdn.yourdomain.com (US)  →  d21qcvva8ccdyb.cloudfront.net

# Europe → Cloudflare
cdn.yourdomain.com (EU)  →  cdn.yourdomain.com.cdn.cloudflare.net

# Asia → Fastly
cdn.yourdomain.com (AP)  →  yourdomain.global.ssl.fastly.net

# Default → CloudFront
cdn.yourdomain.com (*)   →  d21qcvva8ccdyb.cloudfront.net
```

**Benefits:**
- Lower latency (users get closest CDN)
- Load distribution
- Fault tolerance (if one CDN fails, use another)

---

## Fallback CDN Configuration

Add a backup CDN in loader script:

```html
<script>
(function(){
  var t=document.createElement('script');
  t.async=1;
  t.src='https://cdn.yourdomain.com/v1/tracker.js';
  
  // Fallback to backup CDN if primary fails
  t.onerror = function() {
    if (!t.getAttribute('data-fallback-tried')) {
      t.setAttribute('data-fallback-tried', 'true');
      t.src='https://backup-cdn.yourdomain.com/v1/tracker.js';
      document.head.appendChild(t);
    }
  };
  
  document.head.appendChild(t);
})();
</script>
```

DNS setup:
```
cdn.yourdomain.com        CNAME  d21qcvva8ccdyb.cloudfront.net  (Primary)
backup-cdn.yourdomain.com CNAME  yourdomain.cdn.cloudflare.net  (Backup)
```

---

## Monitoring & Alerts

### CloudWatch Alarms

Monitor CloudFront metrics:
- Requests per minute
- Error rate (4xx, 5xx)
- Cache hit rate
- Origin latency

### DNS Health Checks

Use Route53 health checks:
```
Health check URL: https://cdn.yourdomain.com/v1/tracker.js
Check interval: 30 seconds
Failure threshold: 3 consecutive failures
Alert: SNS topic → Email/SMS
```

### Uptime Monitoring

Use external services:
- Pingdom
- UptimeRobot
- StatusCake

Monitor:
- `https://cdn.yourdomain.com/v1/tracker.js` (200 OK)
- Response time < 200ms
- SSL certificate expiration

---

## Best Practices

1. ✅ **Use custom domain** - Never expose CloudFront domain to clients
2. ✅ **Enable HTTPS only** - Redirect HTTP → HTTPS in CloudFront
3. ✅ **Long cache for loader** - 1 year (immutable)
4. ✅ **Short cache for tracker** - 1 hour (frequent updates)
5. ✅ **Set up fallback CDN** - Automatic failover
6. ✅ **Monitor uptime** - Alerts for downtime
7. ✅ **Version tracking** - Tag script versions for rollback
8. ✅ **Global edge locations** - Use CDN with worldwide presence

---

## Troubleshooting

### Issue: CNAME already exists

**Error:** "CNAME record already exists for cdn.yourdomain.com"

**Solution:** Delete existing CNAME first, then create new one

### Issue: SSL certificate error

**Error:** "Your connection is not private" or "Certificate invalid"

**Causes:**
- ACM certificate not validated yet
- Certificate not in us-east-1 region
- Certificate domain doesn't match CNAME

**Solution:**
- Wait for ACM validation (check email or DNS)
- Create new certificate in us-east-1
- Ensure certificate covers exact domain (cdn.yourdomain.com)

### Issue: DNS not resolving

**Test:**
```bash
nslookup cdn.yourdomain.com
dig cdn.yourdomain.com
```

**Solution:**
- Wait 5-10 minutes for DNS propagation
- Check CNAME record is correct
- Flush local DNS cache: `sudo dscacheutil -flushcache` (Mac)

### Issue: CloudFront returns 403 Forbidden

**Causes:**
- S3 bucket not public
- CloudFront origin access not configured
- CloudFront alternate domain not added

**Solution:**
- Check S3 bucket policy allows CloudFront access
- Verify alternate domain added in CloudFront settings

---

## Cost Estimate

### AWS CloudFront (Current Setup)

```
Data transfer: $0.085/GB (first 10 TB)
HTTPS requests: $0.0075 per 10,000 requests

Example monthly cost for 1M page views:
- 1M requests × 20KB = 20 GB data transfer
- 20 GB × $0.085 = $1.70
- 1M requests × $0.0075/10k = $0.75
Total: ~$2.50/month
```

### Custom Domain Add-ons

```
ACM SSL certificate: FREE ✅
Route53 hosted zone: $0.50/month
Route53 queries: $0.40 per million queries

Total additional cost: ~$1/month
```

**Total cost with custom domain: ~$3.50/month for 1M page views**

---

## Summary

**Current (Temporary):**
```
https://d21qcvva8ccdyb.cloudfront.net/v1/tracker.js
```

**Recommended (Permanent):**
```
https://cdn.yourdomain.com/v1/tracker.js
```

**Setup Time:** 30 minutes  
**Cost:** +$1/month  
**Benefit:** Provider independence forever ✅
