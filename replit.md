# Overview

**iMatch** is a Next.js 15 application designed to connect youth soccer teams and coaches in Germany for scheduling friendly matches and tournaments. It enables users to register, manage clubs and teams, post match offers, search for opponents based on various criteria (age group, location, play format, team strength), and manage match requests. The platform aims to streamline the process of finding and offering soccer matches, enhancing connectivity within the youth soccer community.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: Next.js 15 (App Router) with React Server Components.
**Styling**: Tailwind CSS v4, featuring a glassmorphism aesthetic with mobile-first responsiveness.
**Layout**: `AppChrome` for conditional header/bottom navigation rendering. Fixed header (12px) and bottom navigation (3 tabs: Meine Spiele, Anbieten, Matches).
**Component Architecture**: Reusable UI components (e.g., `Drawer`, `MatchCard`), feature-specific components, client-side state management with React hooks.
**Design Patterns**: Form validation with real-time feedback, debounced search, filter state management, drawer overlays for filters and notifications.

## Backend Architecture

**API Routes**: RESTful API via Next.js Route Handlers (`/src/app/api/`).
**Authentication**: Cookie-based sessions (`mm_session`). Supports password (bcrypt) and OTP login. Email verification uses token-based Double Opt-In. Session verification via middleware.
**Middleware**: `src/middleware.ts` protects authenticated routes, redirecting unauthenticated users to `/login`.
**Database Layer**: Prisma ORM with PostgreSQL (Replit Neon). Schema includes User, Club, Team, Venue, Offer, OfferRequest, SavedOffer, GeocodeCache.
**Business Logic**: Geocoding (Nominatim integration with caching), Haversine distance calculation for search, strength/format enums, multi-criteria filtering.
**File Upload**: Club logo upload to `/public/uploads/club-logos/` (PNG/JPEG, max 5MB).

## System Design Choices

- **Offer Management**: Streamlined workflow for managing offers, including automatic removal of accepted offers from "Meine Angebote" and a dedicated "Vereinbart" tab for confirmed matches. VS-style display for confirmed matches. Orange "Spielangebot erstellen" button for easy access. **Edit Functionality**: Offer owners can edit their offers via ✏️ icon in MatchCard, opening EditOfferModal with all relevant fields (date, time, strength, format, field type, notes). **Reserve Feature**: Offers can be marked as "reserved" by owners, hiding them from /matches search results while keeping them visible in "Meine Angebote".
- **Request Management**: Comprehensive system with multi-channel notifications (in-app notifications, inbox messages, email). Request management workflow integrated into `/my-games` page with accept/reject functionality. Only one request can be accepted per offer. **Withdraw Requests**: Modal confirmation for withdrawing requests with automatic multi-channel notifications.
- **Profile Management**: Enhanced club/team management in profile, allowing users to add/join clubs and teams. Warning badge for incomplete profiles.
- **Navigation**: Redesigned bottom navigation with "Meine Spiele" (My Games) including "Meine Angebote", "Gemerkt", "Angefragt", and "Vereinbart" tabs. Offer creation accessed via prominent orange button in "Meine Angebote".
- **Code Quality & Security**: Centralized authentication and HTTP utilities. Removal of debug endpoints and sensitive console logs. Generic error messages for security. Ownership verification in edit/update operations with null-check protection.
- **Replit Migration**: Application migrated from Vercel to Replit, utilizing Replit Neon PostgreSQL.

# External Dependencies

**Database**: Prisma ORM with PostgreSQL (Replit Neon database).
**Third-Party Services**:
- **Geocoding**: Nominatim (OpenStreetMap) API.
- **Email**: Nodemailer for transactional emails (currently console-only in development).
**Authentication Libraries**:
- `bcryptjs` for password hashing.
- Native `crypto` module for token generation.
**UI Libraries**:
- Tailwind CSS v4.
- Google Fonts (Poppins).
- Next.js Image component.