# Architecture & System Design

## Overview

A multi-tenant SaaS platform for restaurant QR-based table ordering. Restaurants subscribe to the platform, generate QR codes for tables, and customers scan to order food from their mobile browsers. Staff manage orders via a dashboard with real-time kitchen display.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
├─────────────────┬──────────────────┬────────────────────────────┤
│  Customer App   │  Restaurant      │  Super Admin               │
│  (Mobile Web)   │  Dashboard       │  Dashboard                 │
│  No login req.  │  (Desktop/Tab)   │  (Desktop)                 │
└────────┬────────┴────────┬─────────┴──────────┬─────────────────┘
         │                 │                     │
         │          HTTPS / WSS                  │
         │                 │                     │
┌────────▼─────────────────▼─────────────────────▼─────────────────┐
│                      NGINX / REVERSE PROXY                        │
│                   (SSL Termination, Rate Limiting)                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                     BACKEND (NestJS)                              │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │   Auth   │ │  Orders  │ │   Menu   │ │  Subscriptions   │    │
│  │  Module  │ │  Module  │ │  Module  │ │     Module       │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │  Tables  │ │ Analytics│ │   QR     │ │   Notifications  │    │
│  │  Module  │ │  Module  │ │  Module  │ │     Module       │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │  Users   │ │  Admin   │ │  Offers  │                         │
│  │  Module  │ │  Module  │ │  Module  │                         │
│  └──────────┘ └──────────┘ └──────────┘                         │
├──────────────────────────────────────────────────────────────────┤
│  CROSS-CUTTING: Guards (RBAC, Tenant) │ Middleware │ Interceptors│
└───────┬──────────────┬───────────────────┬───────────────────────┘
        │              │                   │
   ┌────▼────┐    ┌────▼────┐        ┌────▼────┐
   │PostgreSQL│    │  Redis  │        │  MinIO  │
   │ (Primary │    │ (Cache, │        │  (File  │
   │   DB)    │    │Sessions,│        │ Storage)│
   │          │    │ Queues) │        │         │
   └──────────┘    └─────────┘        └─────────┘
```

---

## Multi-Tenant Architecture

### Strategy: Shared Database, Row-Level Isolation

```
┌─────────────────────────────────────────────┐
│              PostgreSQL Database             │
├─────────────────────────────────────────────┤
│  Every table has: restaurantId (UUID, FK)   │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Prisma Middleware (Global Filter)  │    │
│  │  - Injects restaurantId on CREATE   │    │
│  │  - Filters by restaurantId on READ  │    │
│  │  - Validates on UPDATE/DELETE       │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Exceptions (platform-level tables):        │
│  - Users (can belong to multiple tenants)   │
│  - Subscriptions (linked to owner)          │
│  - AuditLogs (platform-wide for admin)      │
└─────────────────────────────────────────────┘
```

### Tenant Resolution

```
Request → Extract JWT/Session Token
        → Identify user/session
        → Resolve restaurantId from:
           - JWT claims (staff)
           - Redis session (customer)
           - URL param (super admin impersonation)
        → Inject into request context
        → Prisma middleware auto-filters
```

---

## Authentication & Session Architecture

### Staff Authentication (Restaurant Dashboard)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Login   │────▶│  Backend │────▶│  Return  │
│  Email/  │     │  Verify  │     │  Access  │
│  Google  │     │  Creds   │     │  Token   │
└──────────┘     └──────────┘     │  (15min) │
                                  │  Refresh │
                                  │  (7days) │
                                  └──────────┘

Token Refresh Flow:
Access Token expires → Frontend sends Refresh Token
→ Backend validates (hashed in DB) → New Access Token
→ Rotate Refresh Token (one-time use)
```

### Customer Session (QR Flow)

```
┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────┐
│  Scan QR │────▶│  /scan?token │────▶│  Verify   │────▶│  Create  │
│  Code    │     │  =SIGNED_JWT │     │  QR Token │     │  Session │
└──────────┘     └──────────────┘     │  (QR_SECRET)    │  (Redis) │
                                      └───────────┘     └────┬─────┘
                                                             │
                                                             ▼
                                                      ┌──────────┐
                                                      │  Return  │
                                                      │  Session │
                                                      │  Token   │
                                                      │  (2hrs)  │
                                                      └──────────┘
```

### QR Token Structure

```
Header: { alg: "HS256" }
Payload: {
  restaurantId: "uuid",
  tableId: "uuid",
  version: 1,
  iat: timestamp
}
Signed with: QR_SECRET (separate from JWT_SECRET)
```

### Session Storage (Redis)

```
Key: session:{sessionId}
Value: {
  sessionId: "uuid",
  restaurantId: "uuid",
  tableId: "uuid",
  deviceFingerprint: "hash",
  createdAt: timestamp,
  expiresAt: timestamp (2 hours)
}
TTL: 7200 seconds
```

---

## Order Flow (Complete Sequence)

```
Customer                    Backend                     Kitchen/Staff
   │                          │                              │
   │  1. Scan QR              │                              │
   │─────────────────────────▶│                              │
   │                          │  Verify QR token             │
   │                          │  Create Redis session        │
   │  2. Session token        │                              │
   │◀─────────────────────────│                              │
   │                          │                              │
   │  3. GET /menu            │                              │
   │─────────────────────────▶│                              │
   │  4. Menu data            │                              │
   │◀─────────────────────────│                              │
   │                          │                              │
   │  5. POST /orders         │                              │
   │  {items, notes}          │                              │
   │─────────────────────────▶│                              │
   │                          │  Validate session            │
   │                          │  Derive tableId, restaurantId│
   │                          │  Create order (PLACED)       │
   │                          │  ─────────────────────────────▶ WebSocket: NEW_ORDER
   │  6. Order confirmed      │                              │
   │◀─────────────────────────│                              │
   │                          │                              │
   │                          │                              │  7. Accept order
   │                          │◀─────────────────────────────│
   │                          │  Update status (ACCEPTED)    │
   │  8. WebSocket: status    │                              │
   │◀─────────────────────────│                              │
   │                          │                              │
   │         ... PREPARING → READY → SERVED ...              │
   │                          │                              │
   │  9. POST /bill-request   │                              │
   │─────────────────────────▶│  ─────────────────────────────▶ WebSocket: BILL_REQUEST
   │                          │                              │
   │  10. POST /feedback      │                              │
   │─────────────────────────▶│                              │
   │                          │                              │
```

---

## Order Statuses

```
PLACED ──▶ ACCEPTED ──▶ PREPARING ──▶ READY ──▶ SERVED ──▶ COMPLETED
  │            │                                               │
  ▼            ▼                                               │
CANCELLED  CANCELLED                                           │
(by staff) (by staff)                                          │
                                                               ▼
                                                         BILL_GENERATED
```

- Only staff can change statuses (not customers)
- Customer can request cancellation (staff approves/rejects)
- COMPLETED is set when payment is received at counter

---

## WebSocket Architecture

```
┌─────────────────────────────────────────────────┐
│              Socket.IO Server                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  Namespaces:                                     │
│  ├── /customer   (order tracking)               │
│  ├── /kitchen    (KDS updates)                  │
│  └── /dashboard  (staff notifications)          │
│                                                  │
│  Rooms (per restaurant):                         │
│  ├── restaurant:{id}:kitchen                    │
│  ├── restaurant:{id}:dashboard                  │
│  ├── restaurant:{id}:table:{tableId}            │
│  └── order:{orderId}                            │
│                                                  │
│  Events:                                         │
│  ├── order:new          (→ kitchen, dashboard)  │
│  ├── order:status       (→ customer, dashboard) │
│  ├── order:cancelled    (→ customer, kitchen)   │
│  ├── bill:requested     (→ dashboard)           │
│  ├── menu:updated       (→ customer sessions)   │
│  └── table:session-end  (→ dashboard)           │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Background Jobs (BullMQ)

```
┌────────────────────────────────────────┐
│            Job Queues                   │
├────────────────────────────────────────┤
│                                        │
│  notifications:                        │
│  ├── Send OTP email                    │
│  ├── Subscription expiry warning       │
│  ├── Welcome email to new restaurant   │
│  └── Daily report generation           │
│                                        │
│  cleanup:                              │
│  ├── Expire stale sessions             │
│  ├── Archive old orders (>90 days)     │
│  └── Clear expired QR tokens           │
│                                        │
│  analytics:                            │
│  ├── Aggregate daily revenue           │
│  ├── Calculate peak hours              │
│  └── Generate weekly reports           │
│                                        │
└────────────────────────────────────────┘
```

---

## Database Schema (ER Overview)

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────┐
│    Users     │────▶│RestaurantMembers  │◀────│ Restaurants  │
│              │     │(role, permissions)│     │              │
└──────────────┘     └───────────────────┘     └──────┬───────┘
                                                      │
                     ┌────────────────────────────────┼────────────────┐
                     │                    │           │                │
              ┌──────▼───┐         ┌──────▼──┐  ┌────▼─────┐  ┌──────▼──────┐
              │  Tables   │         │Categories│  │  Offers  │  │Subscriptions│
              └──────┬────┘         └────┬─────┘  └──────────┘  └─────────────┘
                     │                   │
              ┌──────▼────┐        ┌─────▼──────┐
              │ QR Codes  │        │ Menu Items │
              └───────────┘        ├────────────┤
                                   │  Variants  │
                                   │  Add-ons   │
                                   └─────┬──────┘
                                         │
┌──────────────┐     ┌───────────────┐   │
│   Sessions   │────▶│    Orders     │◀──┘
│   (Redis +   │     ├─────────────┬─┘
│    DB ref)   │     │ Order Items │
└──────────────┘     └─────────────┘
                           │
                     ┌─────▼───────┐
                     │  Feedback   │
                     └─────────────┘

Platform Level:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  AuditLogs   │  │Notifications │  │   Invoices   │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Security Architecture

### Defense Layers

```
Layer 1: Network
├── HTTPS everywhere
├── CORS whitelist (only known frontend domains)
├── Rate limiting (Nginx + Application level)
└── DDoS protection (Cloudflare)

Layer 2: Application
├── Helmet.js (security headers)
├── Input validation (Zod on every endpoint)
├── CSRF protection (double-submit cookie for dashboard)
├── XSS prevention (content sanitization)
└── SQL injection prevention (Prisma parameterized queries)

Layer 3: Authentication
├── JWT with short expiry (15 min access)
├── Refresh token rotation (one-time use)
├── Argon2 password hashing
├── Account lockout after 5 failed attempts
└── Session invalidation on password change

Layer 4: Authorization
├── RBAC Guards (role-based endpoint access)
├── Tenant Guards (restaurantId isolation)
├── Resource ownership validation
└── Super Admin impersonation audit trail

Layer 5: Data
├── Prisma middleware (tenant filtering)
├── Soft deletes (no data loss)
├── Encryption at rest (database level)
├── PII handling (minimal collection)
└── Audit logging (all mutations)
```

### Rate Limiting Strategy

```
Endpoint Type          │ Limit
───────────────────────┼──────────────────
Customer session APIs  │ 20 req/min/session
Auth endpoints (login) │ 5 req/min/IP
OTP requests           │ 3 req/10min/phone
General APIs (staff)   │ 100 req/min/user
Webhooks               │ 50 req/min/IP
File uploads           │ 10 req/min/user
```

---

## Frontend Architecture

```
restaurant-platform-web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (customer)/               # Customer routes (no auth)
│   │   │   ├── scan/                 # QR landing
│   │   │   ├── menu/                 # Browse menu
│   │   │   ├── cart/                 # Cart
│   │   │   ├── order/                # Order tracking
│   │   │   └── feedback/             # Post-order feedback
│   │   │
│   │   ├── (dashboard)/              # Restaurant dashboard (auth required)
│   │   │   ├── overview/
│   │   │   ├── menu/
│   │   │   ├── orders/
│   │   │   ├── kitchen/              # KDS
│   │   │   ├── tables/
│   │   │   ├── qr/
│   │   │   ├── offers/
│   │   │   ├── members/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   │
│   │   └── (admin)/                  # Super Admin (platform auth)
│   │       ├── overview/
│   │       ├── restaurants/
│   │       ├── subscriptions/
│   │       ├── revenue/
│   │       ├── users/
│   │       └── audit-logs/
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui base components
│   │   ├── customer/                 # Customer-specific
│   │   ├── dashboard/                # Dashboard-specific
│   │   └── admin/                    # Admin-specific
│   │
│   ├── lib/
│   │   ├── api/                      # API client (axios/fetch wrapper)
│   │   ├── socket/                   # Socket.IO client setup
│   │   ├── stores/                   # Zustand stores
│   │   └── utils/                    # Helpers
│   │
│   └── hooks/                        # Custom React hooks
│
├── public/
├── tests/                            # Playwright E2E
└── next.config.ts
```

---

## Backend Architecture

```
restaurant-platform-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── tenant.guard.ts
│   │   │   └── session.guard.ts      # Customer session validation
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   └── current-tenant.decorator.ts
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts
│   │   │   └── audit-log.interceptor.ts
│   │   ├── middleware/
│   │   │   ├── tenant.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── pipes/
│   │       └── zod-validation.pipe.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── restaurants/
│   │   ├── tables/
│   │   ├── qr/
│   │   ├── categories/
│   │   ├── menu-items/
│   │   ├── orders/
│   │   ├── sessions/
│   │   ├── offers/
│   │   ├── analytics/
│   │   ├── notifications/
│   │   ├── subscriptions/
│   │   ├── admin/
│   │   └── uploads/
│   │
│   ├── websockets/
│   │   ├── websocket.gateway.ts
│   │   ├── kitchen.gateway.ts
│   │   └── order.gateway.ts
│   │
│   ├── jobs/
│   │   ├── notification.processor.ts
│   │   ├── cleanup.processor.ts
│   │   └── analytics.processor.ts
│   │
│   └── prisma/
│       ├── schema.prisma
│       ├── migrations/
│       ├── seed.ts
│       └── prisma.service.ts
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docker/
│   ├── Dockerfile
│   └── Dockerfile.dev
│
└── docker-compose.yml
```

---

## Deployment Architecture (Recommended for 10-50 Restaurants)

```
┌─────────────────────────────────────────────────────┐
│                  Cloudflare                          │
│            (DNS, SSL, DDoS, CDN)                    │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              Single VPS (4GB RAM)                    │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │              Docker Compose                     │  │
│  ├────────────────────────────────────────────────┤  │
│  │                                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐   │  │
│  │  │  Nginx   │  │ Backend  │  │  Frontend  │   │  │
│  │  │ (Proxy)  │  │ (NestJS) │  │  (Next.js) │   │  │
│  │  └──────────┘  └──────────┘  └────────────┘   │  │
│  │                                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐   │  │
│  │  │PostgreSQL│  │  Redis   │  │   MinIO    │   │  │
│  │  │          │  │          │  │            │   │  │
│  │  └──────────┘  └──────────┘  └────────────┘   │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Backups: Daily DB dump → Object Storage             │
└──────────────────────────────────────────────────────┘
```

### Scaling Path (When Needed)

```
Stage 1 (Now):    Single VPS + Docker Compose
Stage 2 (50+):   Managed DB (RDS/Supabase) + App on VPS
Stage 3 (200+):  Kubernetes/ECS + Managed everything
Stage 4 (1000+): Multi-region + Read replicas + CDN
```

---

## API Design Conventions

```
Base URL: https://api.yourplatform.com/v1

Authentication:
- Staff:    Authorization: Bearer <access_token>
- Customer: X-Session-Token: <session_token>

Response Format:
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 100 }
}

Error Format:
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order does not exist",
    "statusCode": 404
  }
}

Pagination: ?page=1&limit=20
Sorting: ?sort=createdAt&order=desc
Filtering: ?status=PLACED&from=2024-01-01
```

---

## Key Architectural Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Database | Shared DB, row isolation | Simpler ops for <200 tenants, no schema drift |
| Session store | Redis | Fast reads, auto-expiry via TTL, no DB load |
| File storage | MinIO (S3-compatible) | Local dev parity, swap to S3 in prod |
| Real-time | Socket.IO | Broad browser support, room-based routing |
| Background jobs | BullMQ + Redis | Already using Redis, good DX, retries built-in |
| Auth | JWT + Refresh rotation | Stateless verification, revocation via DB check |
| Password hashing | Argon2 | Current best practice, memory-hard |
| Validation | Zod | Runtime + compile-time safety, shared with frontend |
| ORM | Prisma | Type-safe, migration system, middleware support |
| Frontend state | Zustand + TanStack Query | Zustand for UI state, TQ for server state |
