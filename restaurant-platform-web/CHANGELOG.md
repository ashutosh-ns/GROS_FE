# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with Next.js 14 (App Router) and TypeScript
- TailwindCSS and shadcn/ui configuration
- Project structure with route groups: (customer), (dashboard), (admin)
- TanStack Query provider setup
- Zustand store skeleton (auth, cart)
- API client with axios (interceptors for auth, error handling)
- Socket.IO client configuration
- Authentication pages (login, register)
- Protected route middleware
- Dashboard layout (sidebar, header, content area)
- Role-based navigation
- Customer app base layout (mobile-first)
- Environment configuration
- ESLint and Prettier configuration
- Base UI components from shadcn/ui

## [0.2.0] — Phase 2: Customer Ordering

### Added
- QR scan page: validates signed token, creates session, redirects to menu
- Session store: Zustand persistent store for customer session data
- Cart store: full cart management (add, remove, quantity, notes, subtotal calculation)
- Menu page: category tabs, search, item cards with veg badges, variant selection modal
- Cart page: item list with quantity controls, special instructions, place order
- Order tracking page: real-time status timeline with 5-second polling
- Feedback page: star rating and optional comment submission
- Mobile-first responsive layout for all customer pages
- Sticky cart bar on menu page showing item count and subtotal
- Price formatting utility (INR with Indian number format)

## [0.1.0] — Phase 1: Foundation

### Added
- Project scaffolding and configuration
- Authentication UI (login, register, token management)
- Protected routes and middleware
- Dashboard shell with navigation
- Role-based UI rendering
- Base component library setup
