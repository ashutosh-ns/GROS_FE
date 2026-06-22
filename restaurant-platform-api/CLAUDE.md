# CLAUDE.md — Rules for AI Assistants

## Critical Rules

### NEVER DO
- Never read, grep, cat, or access `.env`, `.env.local`, `.env.production`, or any environment file
- Never read or expose secrets, API keys, tokens, or credentials from any file
- Never commit `.env` files or any file containing secrets
- Never log secrets or sensitive values in code you write
- Never hardcode credentials, API keys, database URLs, or secrets in source code
- Never run `rm -rf` or destructive commands without explicit user confirmation
- Never modify `docker-compose.yml` ports that conflict with the user's local setup without asking
- Never force-push to any branch
- Never delete migrations that have been applied
- Never run `prisma migrate reset` on production or without explicit confirmation
- Never expose stack traces or internal error details in API responses
- Never skip input validation on any endpoint
- Never bypass tenant isolation guards

### ALWAYS DO
- Always use environment variables for secrets (reference `process.env.VARIABLE_NAME`)
- Always validate input with Zod DTOs on every endpoint
- Always apply tenant guard on restaurant-scoped endpoints
- Always apply RBAC guard where roles matter
- Always use parameterized queries (Prisma handles this — never write raw SQL without parameterization)
- Always hash passwords with Argon2 before storing
- Always sign tokens with appropriate secrets (JWT_SECRET for auth, QR_SECRET for QR codes)
- Always add `restaurantId` to new database tables (unless it's a platform-level table)
- Always write migrations via `prisma migrate dev` — never manually edit migration SQL
- Always add indexes for frequently queried columns (especially restaurantId, status, createdAt)
- Always use soft deletes (deletedAt field) — never hard delete user data
- Always return consistent API response format: `{ success, data, error, meta }`

## Project Architecture

- **Framework**: NestJS with TypeScript (strict mode)
- **ORM**: Prisma with PostgreSQL
- **Cache/Sessions**: Redis
- **File Storage**: MinIO (S3-compatible)
- **Queue**: BullMQ with Redis
- **WebSockets**: Socket.IO
- **Auth**: JWT (access + refresh tokens)
- **Validation**: Zod
- **Docs**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

## Project Structure

```
src/
├── main.ts                    # Bootstrap
├── app.module.ts              # Root module
├── common/                    # Shared guards, decorators, pipes, filters, interceptors
│   ├── guards/
│   ├── decorators/
│   ├── interceptors/
│   ├── middleware/
│   ├── filters/
│   └── pipes/
├── modules/                   # Feature modules
│   ├── auth/
│   ├── users/
│   ├── restaurants/
│   ├── tables/
│   ├── qr/
│   ├── categories/
│   ├── menu-items/
│   ├── orders/
│   ├── sessions/
│   ├── offers/
│   ├── analytics/
│   ├── notifications/
│   ├── subscriptions/
│   ├── admin/
│   └── uploads/
├── websockets/                # Socket.IO gateways
├── jobs/                      # BullMQ processors
└── prisma/                    # Schema, migrations, seed
```

## Multi-Tenancy

- Every restaurant-scoped table has `restaurantId` column
- Prisma middleware auto-filters queries by restaurantId from request context
- Platform-level tables (Users, AuditLogs, Subscriptions) are exceptions
- Never access another tenant's data — guard enforces this

## Naming Conventions

- Files: `kebab-case` (e.g., `menu-items.service.ts`)
- Classes: `PascalCase` (e.g., `MenuItemsService`)
- Variables/functions: `camelCase`
- Database tables: `PascalCase` in Prisma schema (maps to snake_case in DB)
- Enums: `SCREAMING_SNAKE_CASE` values
- API routes: `kebab-case` plural (e.g., `/menu-items`)
- DTOs: `PascalCase` with suffix (e.g., `CreateMenuItemDto`)

## Testing

- Unit tests: `*.spec.ts` next to the file they test
- Integration tests: `test/integration/`
- E2E tests: `test/e2e/`
- Use test database (separate from dev)
- Always clean up test data after tests

## Git

- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`)
- Branch naming: `feature/`, `fix/`, `chore/`
- Never commit generated files (`dist/`, `node_modules/`, `.env`)
