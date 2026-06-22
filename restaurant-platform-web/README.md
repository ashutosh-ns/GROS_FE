# Restaurant Platform Web

Production-grade frontend for a multi-tenant Restaurant QR Ordering SaaS platform built with Next.js.

## Overview

This application serves three distinct user experiences within a single Next.js app:

1. **Customer App** — Mobile-first ordering experience via QR code scan (no login required)
2. **Restaurant Dashboard** — Staff management portal for orders, menu, tables, analytics
3. **Super Admin Dashboard** — Platform administration for managing all restaurants

### Key Features

- **QR-Based Ordering** — Scan, browse, order — zero friction for customers
- **Real-time Updates** — Live order tracking and kitchen notifications via WebSocket
- **Role-Based UI** — Interface adapts to user role (owner, manager, waiter, kitchen, etc.)
- **Mobile-First** — Customer app optimized for mobile browsers
- **Type-Safe** — End-to-end TypeScript with Zod validation
- **Accessible** — Semantic HTML, ARIA attributes, keyboard navigation

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Next.js App Router                   │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Route Groups:                                        │
│  ├── (customer)    → Mobile ordering (no auth)       │
│  ├── (dashboard)   → Restaurant staff (JWT auth)     │
│  └── (admin)       → Platform admin (admin auth)     │
│                                                       │
├──────────────────────────────────────────────────────┤
│  State Management:                                    │
│  ├── TanStack Query → Server state (API data)       │
│  ├── Zustand        → Client state (cart, UI)       │
│  └── React Hook Form + Zod → Form state             │
│                                                       │
├──────────────────────────────────────────────────────┤
│  Real-time:                                           │
│  └── Socket.IO Client → Order updates, KDS          │
│                                                       │
├──────────────────────────────────────────────────────┤
│  UI:                                                  │
│  ├── TailwindCSS   → Utility-first styling          │
│  └── shadcn/ui     → Component primitives           │
│                                                       │
└──────────────────────────────────────────────────────┘
         │
         │  HTTPS
         ▼
┌──────────────────────┐
│  Backend API         │
│  (NestJS)            │
│  localhost:3000      │
└──────────────────────┘
```

### Route Structure

```
/                           → Landing / redirect
/scan?token=SIGNED_TOKEN    → QR code entry point
/menu                       → Browse menu (customer)
/cart                       → View cart (customer)
/order/:id                  → Track order (customer)
/feedback/:orderId          → Leave feedback (customer)

/dashboard                  → Restaurant overview
/dashboard/menu             → Menu management
/dashboard/orders           → Order management
/dashboard/kitchen          → Kitchen Display System
/dashboard/tables           → Table management
/dashboard/qr              → QR code generator
/dashboard/offers           → Offers & discounts
/dashboard/members          → Staff management
/dashboard/analytics        → Reports & charts
/dashboard/settings         → Restaurant settings

/admin                      → Platform overview
/admin/restaurants          → Manage restaurants
/admin/subscriptions        → Subscription management
/admin/revenue              → Revenue analytics
/admin/users                → User management
/admin/audit-logs           → Audit trail
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Styling | TailwindCSS 3+ |
| Components | shadcn/ui |
| Server State | TanStack Query v5 |
| Client State | Zustand |
| Forms | React Hook Form + Zod |
| Real-time | Socket.IO Client |
| Charts | Recharts |
| E2E Testing | Playwright |
| Unit Testing | Vitest |
| Linting | ESLint + Prettier |

## Prerequisites

- **Node.js** >= 18.x (LTS recommended)
- **pnpm** >= 8.x (package manager)
- **Backend API** running at `http://localhost:3000` (see restaurant-platform-api repo)

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd restaurant-platform-web
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values. See [Environment Variables](#environment-variables) below.

### 4. Start the development server

```bash
pnpm dev
```

The app runs at `http://localhost:3001`.

### 5. Run with backend (full stack)

Ensure the backend is running:
```bash
# In restaurant-platform-api directory:
docker compose up -d   # Start Postgres, Redis, MinIO
pnpm dev               # Start API server
```

Then start the frontend:
```bash
# In restaurant-platform-web directory:
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (port 3001) |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Lint code |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm type-check` | TypeScript type checking |

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | Application display name | `RestaurantOS` |

> Note: Only `NEXT_PUBLIC_*` variables are exposed to the browser. Server-side-only secrets should NOT have this prefix.

## Project Structure

```
restaurant-platform-web/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── (customer)/               # Customer ordering (no auth)
│   │   │   ├── scan/                 # QR landing page
│   │   │   ├── menu/                 # Browse menu
│   │   │   ├── cart/                 # Shopping cart
│   │   │   ├── order/                # Order tracking
│   │   │   └── feedback/             # Post-order feedback
│   │   ├── (dashboard)/              # Restaurant dashboard (auth)
│   │   │   ├── overview/
│   │   │   ├── menu/
│   │   │   ├── orders/
│   │   │   ├── kitchen/
│   │   │   ├── tables/
│   │   │   ├── qr/
│   │   │   ├── offers/
│   │   │   ├── members/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   └── (admin)/                  # Super admin (admin auth)
│   │       ├── overview/
│   │       ├── restaurants/
│   │       ├── subscriptions/
│   │       ├── revenue/
│   │       ├── users/
│   │       └── audit-logs/
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives
│   │   ├── customer/                 # Customer components
│   │   ├── dashboard/                # Dashboard components
│   │   ├── admin/                    # Admin components
│   │   └── shared/                   # Cross-cutting components
│   ├── lib/
│   │   ├── api/                      # API client & endpoint functions
│   │   ├── socket/                   # Socket.IO configuration
│   │   ├── stores/                   # Zustand stores
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── utils/                    # Utilities (cn, formatPrice, etc.)
│   │   └── validations/              # Zod schemas
│   ├── types/                        # TypeScript definitions
│   └── config/                       # App constants
├── public/                           # Static assets
├── tests/                            # Playwright E2E tests
├── .env.example                      # Environment template
├── tailwind.config.ts                # Tailwind configuration
├── next.config.ts                    # Next.js configuration
└── package.json
```

## Design System

This project uses [shadcn/ui](https://ui.shadcn.com/) as the component foundation:

- Pre-built, accessible components (Button, Dialog, Select, etc.)
- Fully customizable via Tailwind
- Copy-paste approach (components live in your codebase)
- Consistent theming via CSS variables

### Adding a new shadcn component

```bash
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add dialog
```

## Customer App Flow

```
Scan QR Code
  → /scan?token=SIGNED_TOKEN
  → Validate with backend
  → Store session token
  → Redirect to /menu

Browse Menu
  → Categories tabs/sidebar
  → Search & filter
  → Item detail modal

Cart
  → Add/remove items
  → Adjust quantities
  → Select variants & add-ons
  → Order notes

Place Order
  → Confirm items
  → Backend creates order
  → Redirect to /order/:id

Track Order
  → Real-time status via WebSocket
  → PLACED → ACCEPTED → PREPARING → READY → SERVED

Request Bill
  → Notify waiter
  → Pay at counter (cash/UPI/card)

Feedback
  → Rate experience
  → Optional comment
```

## License

Proprietary. All rights reserved.
