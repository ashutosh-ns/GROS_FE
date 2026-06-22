# Restaurant Platform API

Production-grade backend for a multi-tenant Restaurant QR Ordering SaaS platform built with NestJS.

## Overview

This API powers a platform where restaurants subscribe to enable QR-based table ordering. Customers scan QR codes at tables, browse menus, and place orders directly from their mobile browsers. Staff manage orders via real-time dashboards.

### Key Features

- **Multi-Tenant Architecture** — Shared database with row-level isolation per restaurant
- **QR Security** — Signed JWT tokens for QR codes (not plain IDs in URLs)
- **Session Management** — Redis-backed customer sessions with 2-hour expiry
- **Real-time** — Socket.IO for kitchen display and order tracking
- **RBAC** — Role-based access control (8 roles across platform and restaurant levels)
- **Background Jobs** — BullMQ for notifications, reports, and cleanup tasks
- **API Documentation** — Auto-generated Swagger/OpenAPI docs

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   NestJS Application                  │
├─────────────────────────────────────────────────────┤
│  Modules: Auth, Users, Restaurants, Tables, QR,      │
│  Categories, MenuItems, Orders, Sessions, Offers,    │
│  Analytics, Notifications, Subscriptions, Admin      │
├─────────────────────────────────────────────────────┤
│  Cross-cutting: Guards (JWT, RBAC, Tenant, Session)  │
│  Middleware (RateLimit, Tenant) │ Pipes (Zod)        │
├─────────────────────────────────────────────────────┤
│  WebSockets: Kitchen Gateway, Order Gateway          │
├─────────────────────────────────────────────────────┤
│  Jobs: Notifications, Cleanup, Analytics             │
└────────┬──────────────┬───────────────┬─────────────┘
         │              │               │
    PostgreSQL        Redis          MinIO
    (Primary DB)   (Cache/Queue/    (File Storage)
                    Sessions)
```

### Multi-Tenancy

Every restaurant-scoped database table contains a `restaurantId` column. A Prisma middleware automatically filters all queries by the authenticated user's restaurant context. Cross-tenant access is impossible at the ORM level.

### Authentication Flow

**Staff (Restaurant Dashboard):**
```
Login (email/password or Google OAuth)
  → Access Token (JWT, 15 min)
  → Refresh Token (JWT, 7 days, hashed in DB)
  → Refresh rotation (one-time use)
```

**Customer (QR Scan):**
```
Scan QR → /scan?token=SIGNED_TOKEN
  → Backend verifies token signature (QR_SECRET)
  → Creates Redis session (2 hour TTL)
  → Returns session token
  → All subsequent requests use X-Session-Token header
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 10+ |
| Language | TypeScript (strict) |
| ORM | Prisma |
| Database | PostgreSQL 15+ |
| Cache/Sessions | Redis 7+ |
| Queue | BullMQ |
| WebSockets | Socket.IO |
| Auth | JWT (jsonwebtoken) |
| Password Hashing | Argon2 |
| Validation | Zod |
| File Storage | MinIO (S3-compatible) |
| API Docs | Swagger (@nestjs/swagger) |
| Testing | Jest + Supertest |

## Prerequisites

- **Node.js** >= 18.x (LTS recommended)
- **pnpm** >= 8.x (package manager)
- **Docker** & **Docker Compose** (for local services)
- **Git**

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd restaurant-platform-api
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your local values. See [Environment Variables](#environment-variables) below.

### 4. Start infrastructure services

```bash
docker compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- MinIO (port 9000, console: 9001)
- PgAdmin (port 5050)
- Redis Commander (port 8081)

### 5. Run database migrations

```bash
pnpm prisma migrate dev
```

### 6. Seed the database (optional)

```bash
pnpm prisma db seed
```

This creates:
- Super admin account
- Sample restaurant with tables
- Sample menu items

### 7. Start the development server

```bash
pnpm dev
```

The API runs at `http://localhost:3000`.

Swagger docs at `http://localhost:3000/api/docs`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start:prod` | Start production server |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm test:cov` | Run tests with coverage |
| `pnpm lint` | Lint code |
| `pnpm format` | Format code with Prettier |
| `pnpm prisma migrate dev` | Create/apply migrations |
| `pnpm prisma studio` | Open Prisma Studio (DB GUI) |
| `pnpm prisma db seed` | Seed database |
| `pnpm docker:up` | Start Docker services |
| `pnpm docker:down` | Stop Docker services |

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/restaurant_platform` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing auth JWTs | (generate a random 64-char string) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | (generate a random 64-char string) |
| `QR_SECRET` | Secret for signing QR tokens | (generate a random 64-char string) |
| `MINIO_ENDPOINT` | MinIO host | `localhost` |
| `MINIO_PORT` | MinIO port | `9000` |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO secret key | `minioadmin` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | (from Google Console) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | (from Google Console) |
| `FRONTEND_URL` | Frontend app URL (CORS) | `http://localhost:3001` |
| `PORT` | API port | `3000` |

## Project Structure

```
restaurant-platform-api/
├── src/
│   ├── main.ts                     # Application bootstrap
│   ├── app.module.ts               # Root module
│   ├── common/                     # Shared utilities
│   │   ├── guards/                 # Auth, RBAC, Tenant guards
│   │   ├── decorators/             # Custom decorators
│   │   ├── interceptors/           # Response transform, audit log
│   │   ├── middleware/             # Rate limit, tenant resolution
│   │   ├── filters/               # Exception filters
│   │   └── pipes/                 # Zod validation pipe
│   ├── modules/                    # Feature modules
│   │   ├── auth/                  # Authentication & authorization
│   │   ├── users/                 # User management
│   │   ├── restaurants/           # Restaurant CRUD & settings
│   │   ├── tables/                # Table management
│   │   ├── qr/                    # QR code generation & validation
│   │   ├── categories/            # Menu categories
│   │   ├── menu-items/            # Food items, variants, add-ons
│   │   ├── orders/                # Order lifecycle
│   │   ├── sessions/              # Customer session management
│   │   ├── offers/                # Discounts & promotions
│   │   ├── analytics/             # Reports & metrics
│   │   ├── notifications/         # In-app & email notifications
│   │   ├── subscriptions/         # Plan management & billing
│   │   ├── admin/                 # Super admin operations
│   │   └── uploads/               # File upload handling
│   ├── websockets/                 # Socket.IO gateways
│   ├── jobs/                       # BullMQ job processors
│   └── prisma/                     # Schema, migrations, seed
├── test/                           # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker/                         # Docker configurations
├── docker-compose.yml              # Local development services
├── .env.example                    # Environment template
├── prisma/
│   └── schema.prisma              # Database schema
└── package.json
```

## API Response Format

All endpoints return a consistent format:

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100 }
}

// Error
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested order does not exist",
    "statusCode": 404
  }
}
```

## Roles

| Role | Scope | Access |
|------|-------|--------|
| SUPER_ADMIN | Platform | Everything |
| PLATFORM_ADMIN | Platform | Platform management (no billing) |
| OWNER | Restaurant | Full restaurant access |
| MANAGER | Restaurant | All except billing/delete |
| WAITER | Restaurant | Orders, tables |
| CASHIER | Restaurant | Orders, billing |
| KITCHEN | Restaurant | KDS, order status |
| STAFF | Restaurant | View only |

## License

Proprietary. All rights reserved.
