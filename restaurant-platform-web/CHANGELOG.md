# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.8.0] — Phase 8: Security Hardening & Testing

### Added
- Playwright configuration with Chrome + Mobile Chrome projects
- E2E tests: authentication flow (login, register, logout, redirect protection)
- E2E tests: customer ordering flow (QR scan, menu, cart, order)
- E2E tests: dashboard navigation (all pages, role-based access)
- Auto-starts dev server for E2E tests

## [0.7.0] — Phase 7: Subscriptions & Billing

### Added
- Billing page: current subscription status, plan details, trial info
- Plans display with pricing, features, table/staff limits
- Subscribe (free trial), change plan, cancel subscription flows
- Razorpay checkout integration (opens Razorpay modal for payment)
- Payment confirmation flow with backend verification
- Invoices table (date, plan, amount, tax, total, status)
- Subscription status badges (Active, Trialing, Past Due, Cancelled)
- Billing link in dashboard sidebar navigation

## [0.6.0] — Phase 6: Super Admin

### Added
- Admin layout with separate navigation (Overview, Restaurants, Users, Audit Logs)
- Platform role guard (SUPER_ADMIN/PLATFORM_ADMIN only)
- Admin overview page with platform KPI cards and health metrics
- Restaurants management: searchable table with stats, plan, activate/deactivate, impersonate
- Users management: searchable table with role badges, membership counts, enable/disable
- Audit logs page: filterable by entity and action, paginated
- Admin API client (`admin.ts`)
- Link to restaurant dashboard from admin sidebar

## [0.5.0] — Phase 5: Analytics & Notifications

### Added
- Analytics dashboard page with date range filters (Today, 7 Days, 30 Days)
- Revenue summary cards (total revenue, orders, avg order value, tax collected)
- Daily revenue bar chart visualization
- Order statistics breakdown (by status, completion/cancellation rates)
- Peak hours chart (top 8 busiest hours)
- Best sellers table (top 10 products by quantity)
- Table performance table (orders and revenue per table)
- Notification bell component with unread badge count
- Notification dropdown panel (list, mark read, mark all read)
- Real-time notification push via WebSocket
- Analytics and notifications API client functions

### Changed
- Dashboard layout now includes notification bell in header bar

## [0.4.0] — Phase 4: WebSocket Real-time

### Added
- Socket.IO client with staff (JWT) and customer (session token) authentication
- WebSocket hooks: `useStaffSocket`, `useKitchenSocket`, `useCustomerSocket`
- Real-time order updates on Kitchen Display (replaces polling when connected)
- Real-time order updates on Orders management page
- Real-time order status on customer order tracking page
- Bill request notifications on orders page (WebSocket push)
- Connection status indicators on KDS, orders, and order tracking pages
- Automatic fallback to polling when WebSocket disconnects

### Changed
- Kitchen Display now uses WebSocket as primary, polling as fallback
- Customer order tracking uses WebSocket for instant status updates
- Orders page shows live bill request notifications from customers

## [0.3.0] — Phase 3: Restaurant Dashboard

### Added
- Dashboard overview page with real-time stats (today's orders, revenue, active tables, pending orders)
- Menu management page: categories CRUD, menu items table with availability toggle, add/edit item modal with variants & add-ons
- Orders management page: status filters, pagination, order detail modal, status advancement, cancel order
- Kitchen Display System (KDS): 4-column board (New/Accepted/Preparing/Ready), 3s auto-refresh, time-based color coding, one-tap status advancement, new order notification sound
- Tables management page: grid layout, CRUD, capacity, active/inactive toggle
- QR Codes page: generate all QR codes, copy URL, regenerate individual
- Members page: invite by email, assign roles, update roles, remove members
- Settings page: restaurant name, description, contact info, address, GST, tax rate, operating hours
- Dashboard API client (`restaurants.ts`): all restaurant management endpoints

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
