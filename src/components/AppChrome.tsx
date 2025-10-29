'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import HeaderBar from '@/components/HeaderBar'
import Link from 'next/link'
import BackgroundImage from '@/components/BackgroundImage'

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [badges, setBadges] = useState({
    myOffers: 0,
    savedOffers: 0,
    myRequests: 0,
    confirmedMatches: 0,
  })

  // Seiten ohne App-Chrome (Header + BottomNav)
  const hideChrome =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/verify-email')

  // Hintergrund nur auf Startseite sichtbar
  const showBackground = pathname === '/'

  // Fetch badge counts
  useEffect(() => {
    if (hideChrome) return
    
    async function fetchBadges() {
      try {
        const [myOffersRes, savedRes, requestsRes, confirmedRes] = await Promise.all([
          fetch('/api/offer/my-offers').catch(() => null),
          fetch('/api/saved-offers').catch(() => null),
          fetch('/api/requests').catch(() => null),
          fetch('/api/requests/confirmed').catch(() => null),
        ])

        const counts = {
          myOffers: 0,
          savedOffers: 0,
          myRequests: 0,
          confirmedMatches: 0,
        }

        if (myOffersRes?.ok) {
          const data = await myOffersRes.json()
          counts.myOffers = (data.items || []).reduce((sum: number, item: any) => 
            sum + (item.requestCount || 0), 0
          )
        }

        // Für "Meine Merkliste" müssen wir die bereits angefragten Spiele herausfiltern
        let savedIds: string[] = []
        let requestedIds: string[] = []
        
        if (savedRes?.ok) {
          const data = await savedRes.json()
          savedIds = data.savedIds || []
        }

        if (requestsRes?.ok) {
          const data = await requestsRes.json()
          requestedIds = data.requestedIds || []
          counts.myRequests = requestedIds.length
        }

        // Badge für "Meine Merkliste" zeigt nur Spiele, die NICHT bereits angefragt wurden
        const requestedSet = new Set(requestedIds)
        const visibleSavedOffers = savedIds.filter(id => !requestedSet.has(id))
        counts.savedOffers = visibleSavedOffers.length

        if (confirmedRes?.ok) {
          const data = await confirmedRes.json()
          counts.confirmedMatches = (data.items || []).length
        }

        setBadges(counts)
      } catch (e) {
        console.error('Failed to fetch badge counts:', e)
      }
    }

    fetchBadges()
    // Refresh every 30 seconds
    const interval = setInterval(fetchBadges, 30000)
    return () => clearInterval(interval)
  }, [hideChrome])

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
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto max-w-screen-sm grid grid-cols-5 text-[10px] h-16">
            <Link 
              href="/my-offers" 
              className={`flex flex-col items-center justify-center gap-0.5 px-1 relative ${pathname === '/my-offers' ? 'text-[#D04D2E] font-semibold' : 'text-gray-600'}`}
            >
              <div className="text-base">➕</div>
              <div className="text-center leading-tight">Meine Angebote</div>
              {badges.myOffers > 0 && (
                <div className="absolute top-1 right-1 bg-orange-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {badges.myOffers > 9 ? '9+' : badges.myOffers}
                </div>
              )}
            </Link>
            <Link 
              href="/saved-offers" 
              className={`flex flex-col items-center justify-center gap-0.5 px-1 relative ${pathname === '/saved-offers' ? 'text-amber-500 font-semibold' : 'text-gray-600'}`}
            >
              <div className="text-base">⭐</div>
              <div className="text-center leading-tight">Meine Merkliste</div>
              {badges.savedOffers > 0 && (
                <div className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {badges.savedOffers > 9 ? '9+' : badges.savedOffers}
                </div>
              )}
            </Link>
            <Link 
              href="/my-requests" 
              className={`flex flex-col items-center justify-center gap-0.5 px-1 relative ${pathname === '/my-requests' ? 'text-blue-500 font-semibold' : 'text-gray-600'}`}
            >
              <div className="text-base">📤</div>
              <div className="text-center leading-tight">Meine Anfragen</div>
              {badges.myRequests > 0 && (
                <div className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {badges.myRequests > 9 ? '9+' : badges.myRequests}
                </div>
              )}
            </Link>
            <Link 
              href="/confirmed-matches" 
              className={`flex flex-col items-center justify-center gap-0.5 px-1 relative ${pathname === '/confirmed-matches' ? 'text-green-500 font-semibold' : 'text-gray-600'}`}
            >
              <div className="text-base">✅</div>
              <div className="text-center leading-tight">Vereinbart</div>
              {badges.confirmedMatches > 0 && (
                <div className="absolute top-1 right-1 bg-green-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {badges.confirmedMatches > 9 ? '9+' : badges.confirmedMatches}
                </div>
              )}
            </Link>
            <Link 
              href="/matches" 
              className={`flex flex-col items-center justify-center gap-0.5 px-1 ${pathname === '/matches' ? 'text-[#D04D2E] font-semibold' : 'text-gray-600'}`}
            >
              <div className="text-base">🔍</div>
              <div className="text-center leading-tight">Suchen</div>
            </Link>
          </div>
        </nav>
      )}
    </div>
  )
}