# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with NestJS and TypeScript
- Docker Compose configuration (PostgreSQL, Redis, MinIO, PgAdmin, Redis Commander)
- Prisma schema with core models (Users, Restaurants, RestaurantMembers, Tables, QRCodes, Categories, MenuItems, Variants, AddOns, Orders, OrderItems, Sessions, Notifications, AuditLogs, Subscriptions, Invoices, Feedback)
- Authentication module (register, login, refresh token, logout)
- JWT strategy with access token (15 min) and refresh token (7 days) rotation
- Google OAuth integration skeleton
- Password hashing with Argon2
- Multi-tenancy middleware (Prisma-level tenant filtering)
- RBAC guards (role-based access control)
- Tenant isolation guard
- Session guard for customer endpoints
- Zod validation pipe for all DTOs
- Global exception filter with consistent error format
- Response transform interceptor
- Rate limiting middleware (Redis-based)
- Swagger/OpenAPI documentation setup
- Environment configuration with validation
- Database seed script (super admin, sample restaurant)
- Health check endpoint
- CORS configuration
- Helmet security headers

## [0.2.0] — Phase 2: Customer Ordering

### Added
- QR module: signed token generation and verification (HMAC-SHA256)
- Sessions module: Redis-backed customer sessions with 2-hour TTL
- Session guard: validates customer session token on every request
- Tables module: CRUD with soft delete and active session count
- Categories module: CRUD, reorder, slug generation
- Menu Items module: full CRUD with variants, add-ons, bulk availability toggle
- Public menu controller: session-authenticated endpoint for customers
- Orders module: create from session, status transitions, bill request
- Order status validation: enforced transition rules (PLACED→ACCEPTED→PREPARING→READY→SERVED→COMPLETED)
- Order number generation: sequential per restaurant per day
- Customer order controller: place order, view orders, request bill
- Staff order controller: list orders (filtered/paginated), update status
- Feedback module: post-order rating and comments
- Session-derived security: tableId and restaurantId always from server, never client

## [0.1.0] — Phase 1: Foundation

### Added
- Project scaffolding and configuration
- Docker infrastructure
- Authentication & authorization system
- Multi-tenancy enforcement
- RBAC implementation
- Base project structure and conventions
