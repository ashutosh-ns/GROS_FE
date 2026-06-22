# CLAUDE.md — Rules for AI Assistants

## Critical Rules

### NEVER DO
- Never read, grep, cat, or access `.env`, `.env.local`, `.env.production`, or any environment file
- Never read or expose secrets, API keys, tokens, or credentials from any file
- Never commit `.env` files or any file containing secrets
- Never hardcode API URLs, secrets, or keys in source code — use `NEXT_PUBLIC_*` env vars
- Never log sensitive data (tokens, session IDs, user PII) in client-side code
- Never store auth tokens in localStorage — use httpOnly cookies or secure memory
- Never expose internal API routes or server-side logic to the client bundle
- Never run `rm -rf` or destructive commands without explicit user confirmation
- Never force-push to any branch
- Never install packages without explicit user approval for non-standard packages
- Never use `dangerouslySetInnerHTML` without sanitization
- Never trust client-side data for authorization — always verify server-side
- Never expose `restaurantId` or `tableId` in URLs (use signed QR tokens)

### ALWAYS DO
- Always use environment variables via `process.env.NEXT_PUBLIC_*` for client config
- Always use server-side env vars (no `NEXT_PUBLIC_` prefix) for secrets
- Always validate forms with Zod schemas before submission
- Always handle loading, error, and empty states in UI components
- Always use TypeScript strict mode — no `any` types unless absolutely necessary
- Always make the customer app mobile-first responsive
- Always use `next/image` for image optimization
- Always use semantic HTML and ARIA attributes for accessibility
- Always memoize expensive computations and callbacks where appropriate
- Always use TanStack Query for server state (not Zustand)
- Always use Zustand only for client-side UI state (cart, modals, theme)
- Always handle WebSocket disconnection and reconnection gracefully
- Always show feedback on user actions (loading spinners, success/error toasts)

## Project Architecture

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict)
- **Styling**: TailwindCSS + shadcn/ui
- **Server State**: TanStack Query (React Query)
- **Client State**: Zustand
- **Forms**: React Hook Form + Zod
- **Real-time**: Socket.IO Client
- **Testing**: Playwright (E2E), Vitest (unit)
- **Linting**: ESLint + Prettier

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (customer)/               # Customer routes (no auth layout)
│   ├── (dashboard)/              # Restaurant dashboard (auth layout)
│   ├── (admin)/                  # Super Admin (admin auth layout)
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
│
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── customer/                 # Customer-specific components
│   ├── dashboard/                # Dashboard-specific components
│   ├── admin/                    # Admin-specific components
│   └── shared/                   # Cross-cutting (Header, Footer, etc.)
│
├── lib/
│   ├── api/                      # API client, endpoints, interceptors
│   ├── socket/                   # Socket.IO client configuration
│   ├── stores/                   # Zustand stores
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   └── validations/              # Zod schemas (shared with forms)
│
├── types/                        # TypeScript type definitions
└── config/                       # App configuration constants
```

## Route Groups

- `(customer)` — No authentication required. Mobile-first. Session-based after QR scan.
- `(dashboard)` — JWT authentication required. Responsive but desktop-optimized.
- `(admin)` — Super admin authentication. Desktop only.

## Component Guidelines

- Use shadcn/ui as the base component library
- Extend shadcn components — don't wrap them unnecessarily
- Keep components small and focused (single responsibility)
- Co-locate component-specific types and utils
- Use `"use client"` only when necessary (prefer server components)
- Never put business logic in components — extract to hooks or utils

## State Management Rules

| Type | Tool | Example |
|------|------|---------|
| Server data (API responses) | TanStack Query | Menu items, orders, analytics |
| Client UI state | Zustand | Cart, sidebar open, active filters |
| Form state | React Hook Form | Create menu item, place order |
| URL state | Next.js searchParams | Pagination, filters, active tab |

## Naming Conventions

- Files: `kebab-case` (e.g., `menu-item-card.tsx`)
- Components: `PascalCase` (e.g., `MenuItemCard`)
- Hooks: `camelCase` with `use` prefix (e.g., `useCart`)
- Stores: `camelCase` with `use` prefix (e.g., `useCartStore`)
- Utils: `camelCase` (e.g., `formatPrice`)
- Types: `PascalCase` (e.g., `MenuItem`, `OrderStatus`)
- API functions: `camelCase` verb-first (e.g., `fetchMenuItems`, `createOrder`)

## Styling

- Use Tailwind utility classes — no custom CSS unless absolutely necessary
- Use `cn()` utility (from shadcn) for conditional classes
- Mobile-first: start with mobile styles, add `md:` / `lg:` breakpoints
- Use CSS variables from shadcn theme for colors (not hardcoded hex)
- Dark mode support via shadcn theme (implement later)

## Testing

- E2E tests in `tests/` directory (Playwright)
- Component tests with Vitest + Testing Library (for complex logic)
- Test critical flows: QR scan, ordering, auth, role-based access
- Use data-testid attributes for E2E selectors

## Git

- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`)
- Branch naming: `feature/`, `fix/`, `chore/`
- Never commit: `node_modules/`, `.next/`, `.env*`, `out/`
