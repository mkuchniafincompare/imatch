'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BackgroundImage from '@/components/BackgroundImage'
import MatchCard from '@/components/MatchCard'
import Drawer from '@/components/Drawer'

interface MatchItem {
  id: string
  clubName: string
  ageLabel: string | null
  year: number | null
  date: string | null
  kickoffTime: string | null
  kickoffFlexible: boolean
  homeAway: 'HOME' | 'AWAY' | 'FLEX'
  notes: string | null
  playTime: string | null
  strengthLabel: string | null
  address: string | null
  logoUrl: string | null
  savedCount?: number
  requestCount?: number
  isReserved?: boolean
}

export default function MyOffersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ownOffers, setOwnOffers] = useState<MatchItem[]>([])
  
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [offerRequests, setOfferRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  useEffect(() => {
    fetchOwnOffers()
  }, [])

  async function fetchOwnOffers() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/offer/my-offers')
      if (!res.ok) throw new Error('Eigene Angebote konnten nicht geladen werden')
      const data = await res.json()
      setOwnOffers(data.items || [])
    } catch (e: any) {
      setError(e?.message ?? 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  async function openRequestsDrawer(offerId: string) {
    setSelectedOfferId(offerId)
    setRequestDrawerOpen(true)
    setLoadingRequests(true)
    
    try {
      const res = await fetch(`/api/requests/${offerId}`)
      if (!res.ok) throw new Error('Anfragen konnten nicht geladen werden')
      const data = await res.json()
      setOfferRequests(data.requests || [])
    } catch (e: any) {
      console.error('Failed to load requests:', e)
      setOfferRequests([])
    } finally {
      setLoadingRequests(false)
    }
  }

  async function handleRespondToRequest(requesterId: string, action: 'accept' | 'reject') {
    if (!selectedOfferId) return

    try {
      const res = await fetch(`/api/requests/${selectedOfferId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId, action }),
      })

      if (res.ok) {
        setRequestDrawerOpen(false)
        fetchOwnOffers()
      }
    } catch (e: any) {
      console.error('Failed to respond:', e)
    }
  }

  async function handleToggleReserved(offerId: string, currentReserved: boolean) {
    try {
      const res = await fetch('/api/offer/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId,
          isReserved: !currentReserved,
        }),
      })

      if (res.ok) {
        setOwnOffers(prev => prev.map(o => 
          o.id === offerId ? { ...o, isReserved: !currentReserved } : o
        ))
      }
    } catch (e: any) {
      console.error('Toggle reserved failed:', e)
    }
  }

  return (
    <main className="relative min-h-screen">
      <BackgroundImage />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>➕</span>
            <span>Meine Spielangebote</span>
          </h1>
        </div>

        {/* Content */}
        {loading ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-white/80">Lade...</div>
          </div>
        ) : error ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-red-300">{error}</div>
            <button
              onClick={fetchOwnOffers}
              className="mt-4 px-4 py-2 bg-white/20 rounded-xl text-white hover:bg-white/30"
            >
              Erneut versuchen
            </button>
          </div>
        ) : ownOffers.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4 text-[#D04D2E]">➕</div>
            <div className="text-white/90 font-medium mb-2">
              Keine offenen Spielangebote erstellt
            </div>
            <a 
              href="/offer/new" 
              className="inline-block mt-4 px-6 py-3 bg-[#D04D2E] text-white rounded-lg hover:bg-[#B83D1E] transition font-semibold shadow-lg"
            >
              ➕ Spielangebot erstellen
            </a>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {ownOffers.map(offer => {
                const hasRequests = offer.requestCount && offer.requestCount > 0
                return (
                  <div 
                    key={offer.id} 
                    className={`glass-card overflow-hidden ${hasRequests ? 'ring-2 ring-orange-500 cursor-pointer' : ''}`}
                    onClick={() => hasRequests ? openRequestsDrawer(offer.id) : null}
                  >
                    <MatchCard 
                      {...offer} 
                      ageLabel={offer.ageLabel || '—'}
                      savedCount={offer.savedCount}
                      requestCount={offer.requestCount}
                      onEditClick={() => router.push(`/offer/edit/${offer.id}`)}
                      onReserveClick={() => handleToggleReserved(offer.id, offer.isReserved || false)}
                      isReserved={offer.isReserved}
                    />
                  </div>
                )
              })}
            </div>
            
            {/* Erstellen-Button nach der Liste */}
            <div className="mt-6 flex justify-center pb-20">
              <a 
                href="/offer/new" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#D04D2E] text-white rounded-lg hover:bg-[#B83D1E] transition font-semibold shadow-lg"
              >
                <span>➕</span>
                <span>Neues Spielangebot erstellen</span>
              </a>
            </div>
          </>
        )}
      </div>

      {/* Request Drawer */}
      <Drawer
        open={requestDrawerOpen}
        onClose={() => setRequestDrawerOpen(false)}
        title="Anfragen für dieses Angebot"
        side="right"
      >
        {loadingRequests ? (
          <div className="text-sm text-gray-700">Lade Anfragen...</div>
        ) : offerRequests.length === 0 ? (
          <div className="text-sm text-gray-700">Keine Anfragen vorhanden.</div>
        ) : (
          <div className="space-y-4">
            {offerRequests.map((req) => (
              <div key={req.requesterId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900">{req.requesterName}</div>
                    <div className="text-sm text-gray-600">{req.clubName}</div>
                    {req.teamAgeGroup && (
                      <div className="text-xs text-gray-500">{req.teamAgeGroup}</div>
                    )}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    req.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                    req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {req.status === 'ACCEPTED' ? 'Akzeptiert' :
                     req.status === 'REJECTED' ? 'Abgelehnt' :
                     'Ausstehend'}
                  </div>
                </div>
                
                {req.message && (
                  <div className="text-sm text-gray-700 mb-3 p-2 bg-white rounded border border-gray-100">
                    {req.message}
                  </div>
                )}

                {req.status === 'PENDING' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleRespondToRequest(req.requesterId, 'accept')}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      Akzeptieren
                    </button>
                    <button
                      onClick={() => handleRespondToRequest(req.requesterId, 'reject')}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      Ablehnen
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </main>
  )
}
