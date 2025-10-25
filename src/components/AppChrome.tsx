'use client'

import { usePathname } from 'next/navigation'
import HeaderBar from '@/components/HeaderBar'
import Link from 'next/link'
import BackgroundImage from '@/components/BackgroundImage'

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Seiten ohne App-Chrome (Header + BottomNav)
  const hideChrome =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/verify-email')

  // Hintergrund nur auf Startseite sichtbar
  const showBackground = pathname === '/'

  return (
    <div className="min-h-dvh flex flex-col bg-white relative">
      {showBackground && <BackgroundImage />}

      {!hideChrome && <HeaderBar />}

      {/* Scrollbarer Inhalt.
          Wichtig: Unten Platz lassen (pb-20), damit die fixe BottomNav nichts überdeckt. */}
      <div className={`flex-1 relative z-10 ${!hideChrome ? 'pb-20' : ''}`}>
        {children}
      </div>

      {/* Fixe Bottom-Navigation */}
      {!hideChrome && (
        <nav
          className="fixed bottom-0 inset-x-0 z-40 border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} // iOS safe area
        >
          <div className="mx-auto max-w-screen-sm grid grid-cols-2 text-xs h-16">
            <Link href="/my-games" className="flex flex-col items-center justify-center">
              <div>🎮</div>
              <div>Meine Spiele</div>
            </Link>
            <Link href="/matches" className="flex flex-col items-center justify-center font-semibold">
              <div>⚽</div>
              <div>Matches</div>
            </Link>
          </div>
        </nav>
      )}
    </div>
  )
}