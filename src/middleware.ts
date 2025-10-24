// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Sehr einfacher Session-Check:
 * Cookie gilt als gültig, wenn es existiert und mit "uid:" beginnt.
 */
function hasSession(req: NextRequest) {
  const c = req.cookies.get('mm_session')?.value || ''
  return c.startsWith('uid:')
}

/** Pfade, die ohne Login erreichbar sind (Seiten) */
const PUBLIC_PATHS = new Set([
  '/',               // Startseite
  '/login',          // Login
  '/register',       // Registrierung
  '/verify-email',   // DOI-Seite
])

/** Immer öffentliche Pfade (Assets, Icons, bestimmte APIs) */
function isAlwaysPublicPath(pathname: string) {
  // 1) Statische Dateien aus /public (Dateiendungen) + Favicons/Manifeste
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname === '/manifest.json' ||
    /\.(?:png|jpg|jpeg|gif|webp|svg|ico|avif)$/.test(pathname)
  ) {
    return true
  }

  // 2) Öffentliche API-Routen (für Auth/Onboarding)
  if (
    pathname.startsWith('/api/auth') ||           // Login, OTP, Register, Verify
    pathname.startsWith('/api/club') ||           // Club-Suche fürs Onboarding
    pathname.startsWith('/api/team') ||           // Team-Anlage im Onboarding
    pathname.startsWith('/api/auth/resend-verification') ||
    pathname.startsWith('/api/auth/verify-email')
  ) {
    return true
  }

  return false
}

/**
 * Guard-Logik:
 * - Ungeloggt + private Route → redirect /login?redirectTo=...
 * - Eingeloggt + /login|/register → redirect /matches
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // Assets & explizit öffentliche Pfade immer durchlassen
  if (isAlwaysPublicPath(pathname)) return NextResponse.next()

  const loggedIn = hasSession(req)
  const isPublic = PUBLIC_PATHS.has(pathname) || [...PUBLIC_PATHS].some(p => pathname.startsWith(p + '/'))

  // 1) Ungeloggt & nicht-öffentlich → auf /login umleiten
  if (!loggedIn && !isPublic) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname + (search || ''))
    return NextResponse.redirect(url)
  }

  // 2) Eingeloggt & versucht /login oder /register → nach /matches
  if (loggedIn && (pathname === '/login' || pathname === '/register')) {
    const url = req.nextUrl.clone()
    url.pathname = '/matches'
    return NextResponse.redirect(url)
  }

  // 3) Normal weiter
  return NextResponse.next()
}

/**
 * Matcher: Middleware läuft NICHT für _next und NICHT für Dateien mit Endung.
 * Dadurch werden /public-Assets wie /background.jpg nicht mehr abgefangen.
 */
export const config = {
  matcher: ['/((?!_next|.*\\.[\\w]+$).*)'],
}