# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
