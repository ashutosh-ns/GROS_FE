# Security Model

## Threat Model

### Assets
- Customer PII (email, phone)
- Restaurant business data (menu, orders, revenue)
- Authentication credentials (password hashes, tokens)
- Payment information (handled by Razorpay, never stored locally)

### Attack Surface
1. **Public API** — QR scan, menu browsing (rate-limited, session-bound)
2. **Authenticated API** — Dashboard operations (JWT + RBAC + tenant guard)
3. **WebSocket** — Real-time events (JWT/session authenticated)
4. **Admin API** — Platform management (SUPER_ADMIN guard)

### Security Controls

#### Authentication
- Argon2 password hashing (memory-hard, resistant to GPU/ASIC attacks)
- JWT with HS256 algorithm pinning (rejects none/RS256 confusion)
- Access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry with rotation (old token invalidated on use)
- Account lockout after 5 failed login attempts
- Session tokens for customers: Redis-backed, 2-hour TTL

#### Authorization
- RBAC: 6 restaurant roles + 2 platform roles
- Tenant isolation: Prisma middleware auto-filters by restaurantId
- TenantGuard validates user membership before any restaurant-scoped operation
- QR tokens signed with HMAC-SHA256 (separate QR_SECRET)
- Customer session derives tableId/restaurantId server-side (client cannot spoof)

#### Input Validation
- Zod schemas on every endpoint (no raw user input reaches business logic)
- Prisma parameterized queries (SQL injection prevented at ORM level)
- File upload validation: type whitelist, size limits, sanitized filenames

#### Transport Security
- HTTPS enforced in production (TLS 1.2+)
- Helmet.js security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- CORS restricted to production frontend domain
- Cookie flags: httpOnly, secure, sameSite=strict

#### Rate Limiting
- Redis-based rate limiting middleware
- 20 requests/minute per session (customer endpoints)
- 100 requests/hour per IP (global)
- Stricter limits on auth endpoints (5 login attempts before lockout)

#### Data Protection
- No sensitive data in logs (tokens, passwords, PII stripped)
- Error responses sanitized (no stack traces in production)
- Soft deletes (data recoverable, audit trail maintained)
- Audit log captures all mutating actions

#### Payment Security
- Razorpay handles all card data (PCI DSS compliance via their SDK)
- Payment signatures verified server-side
- No card numbers stored in our database

## Security Checklist

- [x] Helmet.js configured (all security headers)
- [x] CORS whitelist (environment-specific)
- [x] Rate limiting on all endpoints
- [x] Zod validation on all inputs
- [x] Prisma parameterized queries (no raw SQL)
- [x] Argon2 password hashing
- [x] JWT algorithm pinning (HS256)
- [x] Refresh token rotation
- [x] Account lockout
- [x] Tenant isolation (middleware + guard)
- [x] RBAC guards
- [x] Session-derived IDs (no client trust)
- [x] QR HMAC-SHA256 signing
- [x] Error sanitization (GlobalExceptionFilter)
- [x] Audit logging
- [x] Soft deletes
- [ ] Dependency audit (npm audit — run before each deploy)
- [ ] Penetration testing (scheduled post-launch)

## Reporting Vulnerabilities

Email security issues to: security@restaurantos.com (placeholder)
Do NOT open public GitHub issues for security vulnerabilities.
