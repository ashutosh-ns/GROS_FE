# Development Phases & Sprint Plan

## Timeline Overview (Solo Developer)

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | 1-2 weeks | Foundation & Infrastructure |
| Phase 2 | 2-3 weeks | Customer Ordering (Core MVP) |
| Phase 3 | 2-3 weeks | Restaurant Dashboard |
| Phase 4 | 1-2 weeks | Kitchen Display & Real-time |
| Phase 5 | 1-2 weeks | Analytics & Notifications |
| Phase 6 | 1-2 weeks | Super Admin |
| Phase 7 | 1 week | Subscriptions & Billing |
| Phase 8 | 1-2 weeks | Security Hardening & Testing |
| Phase 9 | 1 week | Production Deployment |
| **Total** | **~12-18 weeks** | **Full Platform** |

---

## Phase 1: Foundation & Infrastructure

**Goal**: Both repos set up, auth working, multi-tenancy enforced, Docker Compose running.

### Sprint 1.1 — Project Setup (3-4 days)

**Backend:**
- [ ] Initialize NestJS project with TypeScript strict mode
- [ ] Configure ESLint, Prettier, Husky pre-commit hooks
- [ ] Set up Prisma with PostgreSQL connection
- [ ] Create initial schema (Users, Restaurants, RestaurantMembers)
- [ ] Set up Docker Compose (Postgres, Redis, MinIO, PgAdmin)
- [ ] Configure environment variables (.env.example)
- [ ] Set up Swagger/OpenAPI documentation
- [ ] Configure logging (structured JSON logs)

**Frontend:**
- [ ] Initialize Next.js 14+ with App Router
- [ ] Configure TypeScript, ESLint, Prettier
- [ ] Install and configure TailwindCSS + shadcn/ui
- [ ] Set up project structure (route groups, components, lib)
- [ ] Configure TanStack Query provider
- [ ] Set up Zustand stores skeleton
- [ ] Create API client wrapper (axios with interceptors)

**DevOps:**
- [ ] docker-compose.yml (all services)
- [ ] Dockerfile.dev for both repos
- [ ] Makefile or scripts for common commands
- [ ] GitHub Actions CI (lint + type-check)

### Sprint 1.2 — Authentication (3-4 days)

**Backend:**
- [ ] Auth module (register, login, refresh, logout)
- [ ] JWT strategy (access + refresh tokens)
- [ ] Refresh token rotation (hash stored in DB)
- [ ] Google OAuth integration
- [ ] Password hashing with Argon2
- [ ] Account lockout after failed attempts
- [ ] Email verification flow (optional for MVP)
- [ ] Auth guards (JwtAuthGuard)

**Frontend:**
- [ ] Login page (email/password)
- [ ] Register page
- [ ] Google OAuth button
- [ ] Token storage (httpOnly cookie or secure localStorage)
- [ ] Auto-refresh token on 401
- [ ] Protected route wrapper
- [ ] Auth context/store

### Sprint 1.3 — Multi-Tenancy & RBAC (2-3 days)

**Backend:**
- [ ] Restaurant CRUD (create, read, update)
- [ ] RestaurantMembers (invite, role assignment)
- [ ] Prisma middleware for tenant isolation
- [ ] Tenant guard (validate restaurantId access)
- [ ] Roles guard (RBAC decorator + guard)
- [ ] Current user decorator
- [ ] Current tenant decorator
- [ ] Seed script (test restaurant + users)

**Frontend:**
- [ ] Restaurant selection (if user has multiple)
- [ ] Store active restaurant context
- [ ] Role-based UI rendering (hide/show based on role)

**Commit & verify**: Auth flow works, tenant isolation confirmed with tests.

---

## Phase 2: Customer Ordering (Core MVP)

**Goal**: A customer can scan QR, browse menu, add to cart, and place an order.

### Sprint 2.1 — QR & Sessions (2-3 days)

**Backend:**
- [ ] QR module: generate signed QR tokens (QR_SECRET)
- [ ] QR verification endpoint: POST /scan
- [ ] Session creation in Redis (2hr TTL)
- [ ] Session guard for customer endpoints
- [ ] Rate limiting middleware (Redis-based)
- [ ] Device fingerprint capture

**Frontend:**
- [ ] /scan page (reads token from URL)
- [ ] Calls backend to validate, receives session token
- [ ] Stores session token in memory/sessionStorage
- [ ] Redirect to menu on success
- [ ] Error handling (expired QR, invalid token)

### Sprint 2.2 — Menu System (3-4 days)

**Backend:**
- [ ] Categories CRUD (name, slug, sortOrder, active)
- [ ] Menu Items CRUD (all fields from spec)
- [ ] Variants CRUD (linked to menu item)
- [ ] Add-ons CRUD (linked to menu item)
- [ ] Public menu endpoint (no auth, session-based)
- [ ] Image upload to MinIO (menu item images)
- [ ] Category filtering, search, pagination

**Frontend (Customer):**
- [ ] Menu page with categories sidebar/tabs
- [ ] Food item cards (image, name, price, veg/non-veg badge)
- [ ] Item detail modal (description, variants, add-ons)
- [ ] Category filter
- [ ] Search functionality
- [ ] Responsive mobile-first layout

### Sprint 2.3 — Cart & Orders (3-4 days)

**Backend:**
- [ ] Orders module
- [ ] POST /orders (create order from session)
- [ ] Derive tableId + restaurantId from session (ignore client IDs)
- [ ] Order items with variants and add-ons
- [ ] Order status enum (PLACED → COMPLETED)
- [ ] GET /orders/:id (customer can view own order)
- [ ] POST /orders/:id/cancel-request

**Frontend (Customer):**
- [ ] Cart store (Zustand) — add, remove, update quantity
- [ ] Cart page/drawer (items, variants, add-ons, subtotal)
- [ ] Place order button
- [ ] Order confirmation screen
- [ ] Order tracking page (status display)
- [ ] Bill request button

### Sprint 2.4 — Customer Polish (2-3 days)

- [ ] Optional OTP login (email-based for MVP)
- [ ] Feedback form (post-order rating + comment)
- [ ] Order history (if logged in)
- [ ] "Restaurant closed" handling
- [ ] Empty states, loading skeletons
- [ ] Error boundaries

**Commit & verify**: Full QR → Order flow working end-to-end.

---

## Phase 3: Restaurant Dashboard

**Goal**: Restaurant staff can manage menu, view orders, manage tables and members.

### Sprint 3.1 — Dashboard Shell (2-3 days)

**Frontend:**
- [ ] Dashboard layout (sidebar, header, content area)
- [ ] Navigation (all menu items)
- [ ] Role-based navigation (hide features by role)
- [ ] Restaurant switcher (for multi-restaurant owners)
- [ ] Overview/home page (basic stats)
- [ ] Responsive sidebar (collapse on mobile)

### Sprint 3.2 — Menu Management (3-4 days)

**Frontend:**
- [ ] Categories list (drag-to-reorder, CRUD)
- [ ] Menu items list (filter by category, search)
- [ ] Add/edit menu item form (all fields)
- [ ] Image upload component
- [ ] Variant management within item form
- [ ] Add-on management within item form
- [ ] Bulk availability toggle
- [ ] Bestseller / recommended badges

### Sprint 3.3 — Tables & QR (2-3 days)

**Backend:**
- [ ] Tables CRUD (number, name, capacity, active)
- [ ] QR generation endpoint (returns signed token + image)
- [ ] Batch QR generation (all tables at once)
- [ ] QR download as PNG/PDF

**Frontend:**
- [ ] Tables list (grid view)
- [ ] Add/edit table form
- [ ] QR code display per table
- [ ] Download single QR
- [ ] Download all QRs as PDF (printable sheet)
- [ ] Table status indicator (active session or empty)

### Sprint 3.4 — Order Management (2-3 days)

**Frontend:**
- [ ] Orders list (filterable by status, table, date)
- [ ] Order detail view (items, table, time, status)
- [ ] Status update buttons (accept, prepare, ready, serve)
- [ ] Order notes display
- [ ] Split bill view
- [ ] Print KOT (browser print)
- [ ] Print invoice (browser print)

### Sprint 3.5 — Members & Settings (2 days)

**Backend:**
- [ ] Invite member (email + role)
- [ ] Update member role
- [ ] Remove member
- [ ] Restaurant settings (name, address, timings, logo)

**Frontend:**
- [ ] Members list with roles
- [ ] Invite member form
- [ ] Role selector
- [ ] Remove member (with confirmation)
- [ ] Settings page (restaurant profile, operating hours)

**Commit & verify**: Restaurant owner can fully manage their restaurant.

---

## Phase 4: Kitchen Display & Real-time

**Goal**: Orders flow to kitchen in real-time, kitchen can manage preparation.

### Sprint 4.1 — WebSocket Infrastructure (2-3 days)

**Backend:**
- [ ] Socket.IO gateway setup
- [ ] Authentication for WebSocket (JWT for staff, session for customer)
- [ ] Room management (per restaurant, per table)
- [ ] Event definitions (order:new, order:status, etc.)
- [ ] Emit on order creation
- [ ] Emit on status change
- [ ] Redis adapter for Socket.IO (scales across instances)

**Frontend:**
- [ ] Socket.IO client setup
- [ ] Connection management (reconnect, auth)
- [ ] Hook: useSocket (generic)
- [ ] Hook: useOrderUpdates (customer)
- [ ] Hook: useKitchenOrders (KDS)
- [ ] Hook: useDashboardNotifications (staff)

### Sprint 4.2 — Kitchen Display System (3-4 days)

**Frontend:**
- [ ] KDS page (full screen, optimized for tablets)
- [ ] Order cards grouped by status (NEW, PREPARING, READY)
- [ ] Real-time new order appearance (with sound notification)
- [ ] One-tap status advancement
- [ ] Timer on each order (time since placed)
- [ ] Color coding (green: fresh, yellow: 10min+, red: 20min+)
- [ ] Auto-scroll / carousel for many orders
- [ ] Filter by category (optional: drink station vs food)

### Sprint 4.3 — Real-time Customer Updates (1-2 days)

**Frontend:**
- [ ] Order tracking page connects to WebSocket
- [ ] Live status updates (no polling)
- [ ] Status timeline animation
- [ ] Push-style notification in browser (optional)

**Commit & verify**: Order placed by customer appears on KDS in <1 second, status updates flow back to customer.

---

## Phase 5: Analytics & Notifications

**Goal**: Restaurant owners see business insights, staff get notified.

### Sprint 5.1 — Analytics Backend (3-4 days)

**Backend:**
- [ ] Analytics module
- [ ] Revenue endpoints (daily, weekly, monthly, custom range)
- [ ] Order analytics (count, avg value, peak hours)
- [ ] Product analytics (best sellers, worst performers)
- [ ] Table analytics (occupancy, revenue per table)
- [ ] Aggregation queries (optimized with indexes)
- [ ] Cache results in Redis (TTL: 5 min)
- [ ] Chart-friendly response format (labels + datasets)

### Sprint 5.2 — Analytics Frontend (2-3 days)

**Frontend:**
- [ ] Analytics dashboard page
- [ ] Revenue chart (line chart, date range picker)
- [ ] Orders chart (bar chart)
- [ ] Best sellers list
- [ ] Peak hours heatmap
- [ ] Table occupancy stats
- [ ] Date range filter (today, week, month, custom)
- [ ] Use recharts or chart.js

### Sprint 5.3 — Notifications (2-3 days)

**Backend:**
- [ ] BullMQ setup (queue + processors)
- [ ] Email service (Resend/Nodemailer for MVP)
- [ ] Notification templates (welcome, OTP, subscription expiry)
- [ ] In-app notification model (DB stored)
- [ ] GET /notifications (paginated)
- [ ] Mark as read endpoint
- [ ] WebSocket push for new notifications

**Frontend:**
- [ ] Notification bell icon (unread count badge)
- [ ] Notification dropdown/panel
- [ ] Mark as read on click
- [ ] Notification types (order alert, system message)

**Commit & verify**: Analytics display real data, notifications flow through.

---

## Phase 6: Super Admin

**Goal**: Platform administrator can manage all restaurants, subscriptions, revenue.

### Sprint 6.1 — Admin Backend (2-3 days)

**Backend:**
- [ ] Admin module (SUPER_ADMIN guard)
- [ ] List all restaurants (with filters, search, pagination)
- [ ] Restaurant detail (stats, members, subscription)
- [ ] Activate/deactivate restaurant
- [ ] Impersonation endpoint (generate temp token for restaurant)
- [ ] Platform-level analytics (total restaurants, orders, revenue)
- [ ] Audit log retrieval (filtered by entity, user, action)
- [ ] User management (list, deactivate)

### Sprint 6.2 — Admin Frontend (3-4 days)

**Frontend:**
- [ ] Admin layout (separate from restaurant dashboard)
- [ ] Platform overview (KPI cards: restaurants, MRR, orders)
- [ ] Restaurants list (table with search, filters)
- [ ] Restaurant detail page (info, stats, subscription)
- [ ] Activate/deactivate toggle
- [ ] Impersonate button (enters restaurant dashboard as them)
- [ ] Users list
- [ ] Audit logs table (searchable, filterable)
- [ ] Revenue overview (chart)

**Commit & verify**: Super admin can see and manage all restaurants.

---

## Phase 7: Subscriptions & Billing

**Goal**: Restaurants subscribe to plans, payments via Razorpay.

### Sprint 7.1 — Subscription System (3-4 days)

**Backend:**
- [ ] Plans table (name, price, features, limits)
- [ ] Subscriptions table (restaurantId, planId, status, dates)
- [ ] Razorpay integration (create subscription, webhooks)
- [ ] Webhook handler (payment success, failure, cancellation)
- [ ] Subscription status check middleware
- [ ] Feature gating based on plan (e.g., max tables, analytics access)
- [ ] Grace period on failed payment (3 days)
- [ ] Invoice generation (PDF)

**Frontend:**
- [ ] Pricing/plans page
- [ ] Current subscription status in settings
- [ ] Upgrade/downgrade flow
- [ ] Razorpay checkout integration
- [ ] Invoice download
- [ ] Subscription expiry warning banner

**Admin:**
- [ ] Subscription management per restaurant
- [ ] Manual plan override
- [ ] Revenue/MRR/ARR dashboard

**Commit & verify**: Restaurant can subscribe, payment flows through, access gated.

---

## Phase 8: Security Hardening & Testing

**Goal**: Production-grade security, comprehensive test coverage.

### Sprint 8.1 — Security Review (3-4 days)

- [ ] Helmet.js configuration review
- [ ] CORS whitelist (only production domains)
- [ ] Rate limiting verification (all endpoints)
- [ ] Input validation audit (every endpoint has Zod schema)
- [ ] SQL injection test (verify Prisma parameterization)
- [ ] XSS test (stored and reflected)
- [ ] CSRF protection verification
- [ ] JWT security (algorithm pinning, key rotation plan)
- [ ] Session security (fixation, hijacking prevention)
- [ ] Tenant isolation testing (cross-tenant access attempts)
- [ ] File upload security (type validation, size limits, no path traversal)
- [ ] Dependency audit (npm audit, Snyk)
- [ ] Error message sanitization (no stack traces in prod)
- [ ] Logging review (no sensitive data in logs)
- [ ] Create SECURITY.md with threat model

### Sprint 8.2 — Testing (4-5 days)

**Backend Tests:**
- [ ] Unit tests for services (business logic)
- [ ] Integration tests for modules (with test DB)
- [ ] E2E/API tests for critical flows:
  - QR scan → session creation
  - Order placement → status updates
  - Auth flow (register, login, refresh, logout)
  - Tenant isolation (user A can't access restaurant B)
  - RBAC (waiter can't delete menu items)
  - Rate limiting (exceed limit → 429)
  - Session expiry handling

**Frontend Tests:**
- [ ] Component tests (React Testing Library) for complex components
- [ ] Playwright E2E:
  - Customer: scan → browse → order → track
  - Staff: login → manage menu → process order
  - Admin: login → view restaurants → impersonate
  - Auth: login, logout, token refresh
  - Error states: invalid QR, expired session

**Target: 80%+ coverage on backend, critical paths covered on frontend.**

**Commit & verify**: All tests pass, security checklist complete.

---

## Phase 9: Production Deployment

**Goal**: Platform live and accessible.

### Sprint 9.1 — Production Setup (3-4 days)

- [ ] Production Dockerfiles (multi-stage, optimized)
- [ ] Production docker-compose (or deployment config)
- [ ] Environment configuration (production .env template)
- [ ] Database migration strategy (prisma migrate deploy)
- [ ] SSL certificate (Let's Encrypt via Cloudflare)
- [ ] Domain setup (DNS configuration)
- [ ] Backup strategy (daily DB dumps, upload to S3)
- [ ] Health check endpoints (/health, /ready)
- [ ] Monitoring setup (uptime monitoring, error alerts)
- [ ] Log aggregation (basic: stdout to file, rotate)
- [ ] Seed production data (super admin account, default plans)
- [ ] GitHub Actions deployment workflow
- [ ] Rollback procedure documented

### Sprint 9.2 — Documentation (2 days)

- [ ] README.md (both repos)
- [ ] Architecture documentation
- [ ] API documentation (Swagger is auto-generated)
- [ ] Local development setup guide
- [ ] Deployment guide
- [ ] Environment variables reference
- [ ] Database schema documentation (ER diagram)

**Commit & deploy**: Platform live, accessible, monitored.

---

## MVP vs Full Feature Matrix

| Feature | MVP (Phase 1-4) | Full (Phase 5-9) |
|---------|-----------------|-------------------|
| QR Ordering | Yes | Yes |
| Menu Management | Yes | Yes |
| Order Management | Yes | Yes |
| KDS | Yes | Yes |
| Real-time updates | Yes | Yes |
| Analytics | Basic counts | Full charts & reports |
| Super Admin | No | Yes |
| Subscriptions | No (all free) | Razorpay integration |
| Notifications | WebSocket only | Email + In-app |
| Offers/Discounts | No | Yes |
| Security hardening | Basic | Full review |
| Testing | Manual | 80%+ automated |
| Production deploy | Local Docker | VPS + CI/CD |

**MVP can be demo-ready by end of Phase 4 (~7-10 weeks for solo dev).**

---

## Offers/Discounts (Fit into Phase 5 or 7)

**Scope:**
- [ ] Offer types: percentage off, flat discount, BOGO
- [ ] Scope: cart-level, category-level, item-level
- [ ] Conditions: minimum order value, time-based (happy hour)
- [ ] Coupon codes (optional)
- [ ] Created by restaurant owner/manager
- [ ] Active/inactive toggle
- [ ] Validity period (start date, end date)

---

## Risk & Dependency Notes

| Risk | Mitigation |
|------|-----------|
| Scope creep | Stick to MVP first, add features incrementally |
| Solo developer burnout | Phases are designed to produce working software at each stage |
| Razorpay integration delays | Build subscription logic first, add Razorpay last |
| WebSocket complexity | Use Socket.IO (handles reconnection, fallback) |
| Image upload issues | MinIO locally, abstract storage interface for easy swap |
| Multi-tenancy bugs | Write isolation tests early (Phase 1), run continuously |
