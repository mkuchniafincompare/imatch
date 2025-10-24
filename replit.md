# Overview

This is **iMatch**, a Next.js 15 application for finding and offering youth soccer matches and tournaments in Germany. The platform connects coaches and teams to schedule friendly games, with features for filtering by age group, location, play format, and team strength.

Built with Next.js (App Router), React 19, Prisma ORM, and Tailwind CSS v4. The app uses cookie-based authentication with bcrypt password hashing and optional OTP login. Users can register, create or join clubs, manage teams, post match offers, search for opponents, and save/request matches.

## Recent Changes (October 24, 2025)

**Profile Club/Team Management Enhancement**:
- Extended `ProfileAffiliation` component with "+ Verein/Team hinzufügen" button
- Integrated club selection/creation drawer (similar to registration flow):
  - Live search for existing clubs with debounced input
  - "Neuen Verein anlegen" expandable form with club name, address, logo upload, and venues
  - Duplicate club name validation with inline error messaging
  - All club creation features from registration now available in profile
- Created `/profile/add-team` page for team selection after club choice:
  - Shows selected club details with logo
  - Lists existing teams for selection (if any)
  - New team creation form with age group, name, and year fields
  - Uses same glassmorphism UI design as rest of app
- Created `/api/team/join` route (POST) to assign existing team to user
- Updated `My Games` page header to use orange background (#D04D2E) and `/back2.jpg` image matching `/matches` design
- Added warning badge (yellow triangle icon) to profile button in header when no club is assigned:
  - Badge appears on profile icon in top-right header
  - Same warning icon also appears next to "Profil" in dropdown menu
  - Helps users immediately see they need to complete their profile setup
- Users can now manage multiple clubs/teams from profile without re-registering

**Previous: Navigation Restructure - "Meine Spiele" Feature**:
- Replaced "Suchen" (Search) navigation with "Meine Spiele" (My Games) feature
- Deleted `/search` page and all related search form code
- Created `/my-games` page with three-tab navigation system:
  - **Meine Angebote**: Shows game offers created by the user (fetched via `/api/offer/my-offers`)
  - **Gemerkt**: Shows offers the user has saved/bookmarked (fetched via `/api/saved-offers` + `/api/offer?ids=...`)
  - **Angefragt**: Shows offers the user has requested (fetched via `/api/requests` + `/api/offer?ids=...`)
- Tab design features glassmorphism aesthetic with color-coded indicators:
  - Orange/red (#D04D2E) for "Meine Angebote" (➕)
  - Amber for "Gemerkt" (⭐)
  - Blue for "Angefragt" (✉️)
- Each tab clearly shows which context the user is viewing with distinct icons and colors
- Implemented cross-tab state synchronization: saving/requesting offers immediately updates all relevant tabs
- Created `/api/offer/my-offers` route to fetch user's own offers
- Extended `/api/offer` route to support fetching specific offers by ID via `?ids=` parameter
- Updated `AppChrome` bottom navigation: "Suchen" → "Meine Spiele" (🎮 icon)

**Previous: Code Quality and Security Refactoring**:
- Created shared utility libraries to eliminate code duplication:
  - `src/lib/auth.ts`: Centralized authentication functions (cookie reading, session guards, password validation/hashing/verification, OTP/token generation)
  - `src/lib/http.ts`: HTTP utilities (JSON parsing, error/success responses, cookie management)
- Removed critical security vulnerabilities:
  - Deleted `/api/debug/users` endpoint that exposed user data
  - Removed all console.log statements leaking OTP codes and verification tokens
  - Fixed password verification to return generic error messages preventing account status leakage
- Cleaned up unused code:
  - Deleted `src/lib/ping.ts` utility
  - Removed non-functional SSO placeholder buttons from login/register pages
- Refactored all authentication and profile API routes to use shared utilities with consistent error handling

**Previous: Vercel to Replit Migration**:
- Migrated from Vercel hosting to Replit environment
- Switched database from SQLite to PostgreSQL (Replit Neon database)
- Configured Next.js dev server to run on port 5000 with host 0.0.0.0 for Replit compatibility
- Set up production deployment configuration using autoscale deployment target
- Environment variables configured: DATABASE_URL, NEXT_PUBLIC_BASE_URL

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: Next.js 15 with App Router and React Server Components pattern. All pages use `'use client'` directives for interactivity.

**Styling**: Tailwind CSS v4 with custom utility classes. Design features a glassmorphism aesthetic with backdrop blur effects, semi-transparent overlays, and a mobile-first responsive layout optimized for phones.

**Layout Structure**: 
- `AppChrome` wrapper conditionally renders header and bottom navigation based on route
- Fixed header bar (12px height) with app icon, notifications, messages, and profile menu
- Fixed bottom navigation (3 tabs: Meine Spiele, Anbieten, Matches)
- Content area with bottom padding to prevent overlap with fixed nav
- Background image component with layered effects (color + grayscale mask)

**Component Architecture**:
- Reusable UI components: `Drawer`, `FilterChip`, `MatchCard`, `HeroHeader`
- Feature-specific components: `FiltersDrawer`, `ProfileInfo`, `ProfileAffiliation`, `PasswordChange`
- Registration flow split across multiple pages with progress indicator
- Client-side state management using React hooks (no external state library)

**Key Design Patterns**:
- Form validation with real-time feedback and error shaking animations
- Debounced search with live results
- Filter state management with apply/reset pattern
- Toast-style info/error messages inline with forms
- Drawer overlays for filters and notifications

## Backend Architecture

**API Routes**: RESTful API implemented via Next.js Route Handlers in `/src/app/api/`

**Shared Utilities**:
- `src/lib/auth.ts`: Core authentication functions used across all auth routes (getUserIdFromCookie, requireAuth, validatePassword, hashPassword, verifyPassword, generateOtpCode, generateToken)
- `src/lib/http.ts`: HTTP helper functions for consistent request/response handling (parseJsonBody, errorResponse, successResponse, setCookie, clearCookie, notEmpty)
- All API routes refactored to use these shared utilities for consistency and maintainability

**Authentication**:
- Cookie-based sessions using `mm_session` cookie format: `uid:<userId>`
- Dual login methods: password (bcrypt) and OTP (6-digit code, 10min expiry)
- Email verification via token-based Double Opt-In (DOI)
- Session verification via middleware protecting authenticated routes
- Generic error messages for all password verification failures to prevent information leakage about account status

**Middleware Protection**:
- `/src/middleware.ts` guards all routes except public paths (/, /login, /register, /verify-email)
- Static assets and auth API routes are always accessible
- Redirects unauthenticated users to `/login?redirectTo=<path>`

**Database Layer**:
- Prisma ORM with schema defining: User, Club, Team, Venue, Offer, OfferRequest, SavedOffer, GeocodeCache
- Primary entities: clubs (soccer organizations), teams (age groups), offers (match availability)
- Relationships: users contact teams, teams belong to clubs, offers link to teams
- Email verification tokens stored on User model with expiry timestamps

**Business Logic**:
- Geocoding service with Nominatim integration and database caching for address → lat/lng conversion
- Haversine distance calculation for radius-based match search
- Strength and play format enums with German labels (Kreisklasse, Funino, etc.)
- Multi-criteria filtering: age, strength range, home/away preference, date/time windows, location radius

**File Upload**:
- Club logo upload to `/public/uploads/club-logos/` directory
- Validation: PNG/JPEG only, 5MB max size
- Returns public URL for database storage

## External Dependencies

**Database**: Prisma ORM with PostgreSQL (Replit Neon database). Schema includes geocoding cache table for performance optimization. Migrations managed via `npm run db:push` command.

**Third-Party Services**:
- **Geocoding**: Nominatim (OpenStreetMap) API for address geocoding with configurable endpoint via `GEOCODER_NOMINATIM_URL` environment variable
- **Email**: Nodemailer prepared for transactional emails (verification, OTP) but currently using console logging in development

**Authentication Libraries**:
- `bcryptjs` for password hashing (10 rounds)
- Native `crypto` module for token generation (24-byte hex tokens)

**UI Libraries**:
- Tailwind CSS v4 with PostCSS integration
- Google Fonts integration (Poppins font family)
- Next.js Image component for optimized logo/icon rendering

**Planned Integrations**:
- Real email delivery service (currently console-only)
- Social sign-on (SSO) - removed placeholder UI, to be implemented when needed

**Environment Configuration**:
- `DATABASE_URL` for PostgreSQL database connection (managed by Replit)
- `NEXT_PUBLIC_BASE_URL` for absolute URL construction (verification links)
- `GEOCODER_NOMINATIM_URL` for geocoding service endpoint (optional)
- `GEOCODER_USER_AGENT` for Nominatim API requests (optional)
- `GEOCODER_PROVIDER` for selecting geocoding service (defaults to 'nominatim')
- `MAPBOX_TOKEN` for Mapbox geocoding (optional, if using Mapbox)
- `NODE_ENV` for production/development conditional logic

**Development Tools**:
- TypeScript with strict mode enabled
- ESLint with Next.js config
- Path aliases (`@/*` mapping to `src/*`)