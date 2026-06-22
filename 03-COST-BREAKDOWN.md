# Cost Breakdown: Development & Maintenance

## Summary

| Category | Monthly (INR) | Monthly (USD) | Notes |
|----------|---------------|---------------|-------|
| **Development Phase** | ~₹2,500-4,000 | ~$30-50 | Minimal costs during build |
| **Production (10 restaurants)** | ~₹3,500-6,000 | ~$40-70 | Lean setup |
| **Production (50 restaurants)** | ~₹8,000-15,000 | ~$95-180 | Scaled setup |

---

## 1. Hosting & Infrastructure

### Option A: VPS (Recommended for 10-50 restaurants)

| Provider | Spec | Monthly Cost | Notes |
|----------|------|-------------|-------|
| **Hetzner** (Best value) | 4 vCPU, 8GB RAM, 80GB SSD | ~₹700 (~€8.5) | EU/US locations |
| **DigitalOcean** | 4 vCPU, 8GB RAM | ~₹4,000 (~$48) | Singapore available |
| **AWS Lightsail** | 4 vCPU, 8GB RAM | ~₹3,300 (~$40) | Mumbai region |
| **Hostinger VPS** | 4 vCPU, 8GB RAM | ~₹900 (~$11) | Budget option |

**Recommendation**: Hetzner or Hostinger for starting. Move to DigitalOcean/AWS when profitable.

### Option B: Managed Services (Higher cost, less ops)

| Service | What | Monthly Cost |
|---------|------|-------------|
| Railway/Render (Backend) | Managed containers | ~₹1,700-4,000 ($20-48) |
| Vercel (Frontend) | Next.js hosting | ₹0-1,700 (Free-$20) |
| Supabase (Database) | Managed Postgres | ₹0-2,100 (Free-$25) |
| Upstash (Redis) | Managed Redis | ₹0-850 (Free-$10) |

**Recommendation**: Great DX but costs add up. Better for prototyping, move to VPS for production.

### Development Phase (Local Only)

| Item | Cost |
|------|------|
| Docker Compose (local) | ₹0 |
| Your laptop | Already have |
| **Total during dev** | **₹0** |

---

## 2. Database

### Option A: Self-hosted on VPS (Included in VPS cost)

- PostgreSQL in Docker
- You manage backups, updates
- **Cost: ₹0 additional**

### Option B: Managed Database

| Provider | Spec | Monthly |
|----------|------|---------|
| Supabase (Free tier) | 500MB, 2 projects | ₹0 |
| Supabase (Pro) | 8GB, daily backups | ~₹2,100 ($25) |
| PlanetScale | MySQL (if you switch) | ~₹2,500 ($29) |
| AWS RDS (Mumbai) | db.t3.micro, 20GB | ~₹1,500 ($18) |
| Neon (Postgres) | Free tier generous | ₹0 to start |

**Recommendation**: Self-host on VPS initially. Move to managed when you have revenue.

---

## 3. Redis

| Option | Monthly |
|--------|---------|
| Self-hosted on VPS | ₹0 (included) |
| Upstash (Free) | ₹0 (10K commands/day) |
| Upstash (Pay-as-you-go) | ~₹170-850 ($2-10) |
| AWS ElastiCache | ~₹1,300+ ($15+) |

**Recommendation**: Self-host. Redis uses minimal resources for this scale.

---

## 4. File Storage (Menu Images)

### Option A: Self-hosted MinIO (on VPS)

- **Cost: ₹0 additional**
- Limited by VPS disk space
- You manage backups

### Option B: Cloud Object Storage

| Provider | Free Tier | Paid |
|----------|-----------|------|
| Cloudflare R2 | 10GB + 10M reads/mo | ₹0 for most use cases |
| AWS S3 (Mumbai) | 5GB (12 months) | ~₹50-200/mo at scale |
| DigitalOcean Spaces | 250GB included | ~₹420 ($5)/mo |
| Backblaze B2 | 10GB free | Very cheap after |

**Recommendation**: Cloudflare R2. Generous free tier, no egress fees, S3-compatible.

### Estimated Storage Needs

```
Per restaurant: ~50 menu item images × 500KB = ~25MB
50 restaurants: ~1.25GB
With thumbnails/variants: ~3-5GB total
```

Cloudflare R2 free tier (10GB) covers you until ~150+ restaurants.

---

## 5. Domain & SSL

| Item | Cost (Annual) |
|------|---------------|
| .com domain | ~₹800-1,200 ($10-15) |
| .in domain | ~₹500-700 ($6-9) |
| SSL certificate | ₹0 (Cloudflare/Let's Encrypt) |
| Cloudflare (Free plan) | ₹0 |

**Recommendation**: Buy a .com domain (~₹1,000/year). Cloudflare for DNS + free SSL + CDN.

**Monthly: ~₹85** (domain amortized)

---

## 6. Email Service (Transactional)

Used for: OTP, welcome emails, password reset, subscription invoices, reports.

| Provider | Free Tier | Paid |
|----------|-----------|------|
| **Resend** | 3,000 emails/mo | ~₹1,700 ($20)/mo for 50K |
| **Brevo (Sendinblue)** | 300 emails/day (9K/mo) | ~₹1,500+ for more |
| AWS SES (Mumbai) | 62K free (if on EC2) | ₹0.09/100 emails |
| Mailgun | 1,000/mo free (sandbox) | ~₹2,900 ($35) for 50K |

**Recommendation**: Resend (3K free/mo is enough for 10-50 restaurants). Switch to AWS SES at scale.

### Estimated Email Volume

```
Per restaurant/month:
- Staff invites: 2-3
- Password resets: 1-2
- Subscription invoice: 1
- Reports: 4 (weekly)
Total: ~10 emails/restaurant/month

50 restaurants: ~500 emails/month
Customer OTPs (if enabled): +200-500/month
Total: ~1,000 emails/month → Well within free tier
```

**Monthly: ₹0** (free tier covers it)

---

## 7. SMS / OTP (If Needed)

For customer OTP login (optional feature). Can skip for MVP and use email OTP instead.

| Provider | Cost per SMS |
|----------|-------------|
| MSG91 | ₹0.16-0.20/SMS |
| Twilio | ₹0.50-1.00/SMS (expensive for India) |
| Gupshup | ₹0.15-0.18/SMS |
| Kaleyra | ₹0.15-0.20/SMS |
| 2Factor | ₹0.14-0.18/SMS |

**Recommendation**: Skip SMS for MVP. Use email OTP. Add MSG91 or 2Factor later (cheapest for India).

### If you add SMS later:

```
Assume 10% of customers use OTP: 
50 restaurants × 50 orders/day × 10% OTP = 250 OTPs/day = 7,500/month
Cost: 7,500 × ₹0.17 = ~₹1,275/month
```

**Monthly: ₹0 (MVP) → ₹1,000-2,000 (later)**

---

## 8. Payment Gateway (Razorpay)

For collecting subscription payments from restaurant owners.

| Item | Cost |
|------|------|
| Setup | ₹0 |
| Transaction fee | 2% per transaction |
| Subscription billing | Included |
| Minimum payout | ₹100 |

### Estimated Transaction Costs

```
If you charge ₹2,000/month per restaurant:
- 50 restaurants = ₹1,00,000/month revenue
- Razorpay fee (2%): ₹2,000/month
- GST on fee (18%): ₹360/month
- Total gateway cost: ~₹2,360/month
```

**Monthly: ₹500-2,500** (scales with revenue — this is cost of doing business, not overhead)

---

## 9. CDN & Performance

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Cloudflare | Unlimited bandwidth | DNS, CDN, DDoS, SSL — all free |
| Cloudflare Images | 100K images/$5/mo | Optional: image optimization |

**Recommendation**: Cloudflare free plan. Covers CDN, DNS, SSL, DDoS protection.

**Monthly: ₹0**

---

## 10. Monitoring & Uptime

| Service | Free Tier | Paid |
|---------|-----------|------|
| UptimeRobot | 50 monitors, 5-min checks | ₹0 |
| Better Stack (formerly Logtail) | 1GB logs/mo | ₹0 |
| Sentry (Error tracking) | 5K events/mo | ₹0 |
| Grafana Cloud | 10K metrics series | ₹0 |

**Recommendation**: All free tiers are sufficient for 10-50 restaurants.

**Monthly: ₹0**

---

## 11. Development Tools (Free)

| Tool | Cost | Purpose |
|------|------|---------|
| GitHub (Free) | ₹0 | Code hosting, Actions CI (2000 min/mo) |
| VS Code | ₹0 | Editor |
| Docker Desktop | ₹0 (personal use) | Local development |
| Postman | ₹0 | API testing |
| Figma (Free) | ₹0 | UI design (if needed) |

---

## 12. Optional / Nice-to-Have

| Service | Cost | When to Add |
|---------|------|-------------|
| Cloudinary (image optimization) | ₹0-₹4,200/mo | When image load times matter |
| Firebase (push notifications) | ₹0 | When adding mobile push |
| WhatsApp Business API | ₹0.50-1.00/message | When restaurants want WhatsApp alerts |
| Google Maps API | ₹0 (up to $200/mo free) | If adding restaurant locator |
| Hotjar/PostHog (analytics) | ₹0 free tier | When tracking user behavior |

---

## Total Monthly Cost Estimates

### During Development (Months 1-4)

| Item | Cost |
|------|------|
| Everything runs locally | ₹0 |
| Domain (if bought early) | ₹85 |
| **Total** | **~₹85/month** |

### Launch (10 Restaurants)

| Item | Monthly (INR) |
|------|---------------|
| VPS (Hetzner 4GB) | ₹700 |
| Domain | ₹85 |
| Cloudflare R2 (storage) | ₹0 |
| Cloudflare (CDN/SSL) | ₹0 |
| Email (Resend free) | ₹0 |
| Monitoring (free tiers) | ₹0 |
| Redis (self-hosted) | ₹0 |
| Razorpay fees | ₹500 |
| **Total** | **~₹1,300/month** |

### Growth (50 Restaurants)

| Item | Monthly (INR) |
|------|---------------|
| VPS (8GB RAM) | ₹1,400 |
| Domain | ₹85 |
| Cloudflare R2 | ₹0 |
| Cloudflare | ₹0 |
| Email (Resend/SES) | ₹0-500 |
| SMS (if added) | ₹1,500 |
| Monitoring | ₹0 |
| Razorpay fees | ₹2,500 |
| Managed DB (optional) | ₹2,100 |
| **Total** | **~₹5,000-8,000/month** |

---

## Revenue vs Cost Projection

### Pricing Model (Suggested)

| Plan | Price/month | Features |
|------|-------------|----------|
| Starter | ₹999 | 5 tables, 1 staff, basic menu |
| Growth | ₹1,999 | 20 tables, 5 staff, KDS, analytics |
| Pro | ₹3,999 | Unlimited tables, staff, offers, priority support |

### Break-Even Analysis

```
Fixed costs at launch: ~₹1,300/month

Break-even: 2 restaurants on Starter plan (₹1,998) 
            OR 1 restaurant on Growth plan (₹1,999)

At 10 restaurants (avg ₹2,000/month):
  Revenue: ₹20,000
  Costs: ₹1,300
  Margin: ₹18,700 (93%)

At 50 restaurants (avg ₹2,500/month):
  Revenue: ₹1,25,000
  Costs: ₹8,000
  Margin: ₹1,17,000 (94%)
```

SaaS margins are excellent once you have product-market fit.

---

## One-Time Costs

| Item | Cost | Notes |
|------|------|-------|
| Domain purchase | ₹800-1,200 | Annual, first time |
| Razorpay KYC setup | ₹0 | Just documentation |
| SSL certificate | ₹0 | Cloudflare/Let's Encrypt |
| Logo/branding (optional) | ₹0-5,000 | Can DIY or skip for MVP |
| Legal (T&C, Privacy Policy) | ₹0-5,000 | Templates available free online |

---

## Cost Optimization Tips

1. **Start with Hetzner/Hostinger** — 70-80% cheaper than AWS/DO for same specs
2. **Use Cloudflare R2** instead of S3 — no egress fees, generous free tier
3. **Email OTP over SMS** — saves ₹1,000-2,000/month
4. **Self-host everything** on one VPS initially — Postgres, Redis, MinIO all fit on 4GB RAM
5. **Cloudflare free tier** gives you CDN, SSL, DDoS, DNS — no reason to pay
6. **GitHub Actions free tier** (2000 min/month) is enough for CI/CD
7. **Don't pre-optimize** — add managed services only when self-hosted becomes a maintenance burden
8. **Razorpay annual billing** — charge restaurants yearly at discount, better cash flow and lower transaction count

---

## When to Scale Up Spending

| Trigger | Action | Added Cost |
|---------|--------|-----------|
| >50 restaurants | Upgrade VPS to 16GB or add second node | +₹1,000-3,000 |
| Slow queries | Move to managed Postgres (RDS/Supabase) | +₹2,000-4,000 |
| Downtime concerns | Add redundancy (2 VPS + load balancer) | +₹2,000 |
| Image load slow | Add Cloudinary or imgproxy | +₹0-4,000 |
| Customer demands SMS | Add MSG91/2Factor | +₹1,000-3,000 |
| Need mobile push | Firebase Cloud Messaging | ₹0 |
| >200 restaurants | Consider Kubernetes / ECS | +₹10,000+ |
