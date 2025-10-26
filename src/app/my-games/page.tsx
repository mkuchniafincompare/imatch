'use client'

import { useEffect, useState } from 'react'
import BackgroundImage from '@/components/BackgroundImage'
import MatchCard from '@/components/MatchCard'
import ConfirmedMatchCard from '@/components/ConfirmedMatchCard'
import Drawer from '@/components/Drawer'
import ConfirmModal from '@/components/ConfirmModal'

type Tab = 'own' | 'saved' | 'requested' | 'confirmed'

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
  pendingRequestCount?: number
  isReserved?: boolean
  // For confirmed matches
  opponentClubName?: string
  opponentAgeLabel?: string | null
  opponentYear?: number | null
  opponentLogoUrl?: string | null
  isOwner?: boolean
}

export default function MyGamesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('own')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [ownOffers, setOwnOffers] = useState<MatchItem[]>([])
  const [savedOffers, setSavedOffers] = useState<MatchItem[]>([])
  const [requestedOffers, setRequestedOffers] = useState<MatchItem[]>([])
  const [confirmedOffers, setConfirmedOffers] = useState<MatchItem[]>([])

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set())

  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [offerRequests, setOfferRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [offerIdToWithdraw, setOfferIdToWithdraw] = useState<string | null>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  async function fetchAllData() {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        fetchOwnOffers(),
        fetchSavedOffers(),
        fetchRequestedOffers(),
        fetchConfirmedOffers(),
      ])
    } catch (e: any) {
      setError(e?.message ?? 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  async function fetchOwnOffers() {
    const res = await fetch('/api/offer/my-offers')
    if (!res.ok) throw new Error('Eigene Angebote konnten nicht geladen werden')
    const data = await res.json()
    setOwnOffers(data.items || [])
  }

  async function fetchSavedOffers() {
    const saved = await fetch('/api/saved-offers')
    if (!saved.ok) throw new Error('Gemerkte Angebote konnten nicht geladen werden')
    const savedData = await saved.json()
    const ids = savedData.savedIds || []
    setSavedIds(new Set(ids))

    if (ids.length === 0) {
      setSavedOffers([])
      return
    }

    const offers = await fetch(`/api/offer?ids=${ids.join(',')}`)
    if (!offers.ok) throw new Error('Angebotsdaten konnten nicht geladen werden')
    const offersData = await offers.json()
    setSavedOffers(offersData.items || [])
  }

  async function fetchRequestedOffers() {
    const req = await fetch('/api/requests')
    if (!req.ok) throw new Error('Angefragte Angebote konnten nicht geladen werden')
    const reqData = await req.json()
    const ids = reqData.requestedIds || []
    setRequestedIds(new Set(ids))

    if (ids.length === 0) {
      setRequestedOffers([])
      return
    }

    const offers = await fetch(`/api/offer?ids=${ids.join(',')}`)
    if (!offers.ok) throw new Error('Angebotsdaten konnten nicht geladen werden')
    const offersData = await offers.json()
    setRequestedOffers(offersData.items || [])
  }

  async function fetchConfirmedOffers() {
    try {
      const res = await fetch('/api/requests/confirmed')
      if (!res.ok) {
        setConfirmedOffers([])
        return
      }
      const text = await res.text()
      const trimmed = text.trim()
      if (!trimmed) {
        setConfirmedOffers([])
        return
      }
      const data = JSON.parse(trimmed)
      setConfirmedOffers(data.items || [])
    } catch (e) {
      console.error('Confirmed offers fetch failed:', e)
      setConfirmedOffers([])
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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId, action }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Fehler beim Bearbeiten der Anfrage')
        return
      }

      // Refresh requests
      await openRequestsDrawer(selectedOfferId)
      await fetchAllData()
    } catch (e: any) {
      console.error('Respond failed:', e)
      alert('Fehler beim Bearbeiten der Anfrage')
    }
  }

  async function handleSave(offerId: string) {
    try {
      if (savedIds.has(offerId)) {
        await fetch('/api/saved-offers', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offerId }),
        })
        setSavedIds(prev => {
          const next = new Set(prev)
          next.delete(offerId)
          return next
        })
        setSavedOffers(prev => prev.filter(o => o.id !== offerId))
      } else {
        await fetch('/api/saved-offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offerId }),
        })
        setSavedIds(prev => new Set([...prev, offerId]))
        
        // Add offer to savedOffers if not already there
        const offerToAdd = ownOffers.find(o => o.id === offerId) 
          || requestedOffers.find(o => o.id === offerId)
        if (offerToAdd && !savedOffers.some(o => o.id === offerId)) {
          setSavedOffers(prev => [...prev, offerToAdd])
        }
      }
    } catch (e: any) {
      console.error('Save failed:', e)
    }
  }

  async function handleRequest(offerId: string) {
    // Check if already requested - if yes, show withdraw modal
    if (requestedIds.has(offerId)) {
      setOfferIdToWithdraw(offerId)
      setWithdrawModalOpen(true)
      return
    }

    // Otherwise, send new request
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      })
      if (res.ok) {
        setRequestedIds(prev => new Set([...prev, offerId]))
        
        // Add offer to requestedOffers if not already there
        const offerToAdd = ownOffers.find(o => o.id === offerId) 
          || savedOffers.find(o => o.id === offerId)
        if (offerToAdd && !requestedOffers.some(o => o.id === offerId)) {
          setRequestedOffers(prev => [...prev, offerToAdd])
        }
      }
    } catch (e: any) {
      console.error('Request failed:', e)
    }
  }

  async function handleWithdrawRequest() {
    if (!offerIdToWithdraw) return

    try {
      const res = await fetch('/api/requests/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: offerIdToWithdraw }),
      })
      
      if (res.ok) {
        // Remove from requestedIds
        setRequestedIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(offerIdToWithdraw)
          return newSet
        })
        
        // Remove from requestedOffers
        setRequestedOffers(prev => prev.filter(o => o.id !== offerIdToWithdraw))
        
        setOfferIdToWithdraw(null)
      }
    } catch (e: any) {
      console.error('Withdraw request failed:', e)
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
        // Update local state
        setOwnOffers(prev => prev.map(o => 
          o.id === offerId ? { ...o, isReserved: !currentReserved } : o
        ))
      }
    } catch (e: any) {
      console.error('Toggle reserved failed:', e)
    }
  }

  // Filter: Wenn ein Spiel angefragt wurde, nicht mehr bei "Gemerkt" anzeigen
  const filteredSavedOffers = savedOffers.filter(offer => 
    !requestedOffers.some(req => req.id === offer.id)
  )

  const currentOffers = 
    activeTab === 'own' ? ownOffers :
    activeTab === 'saved' ? filteredSavedOffers :
    activeTab === 'requested' ? requestedOffers :
    confirmedOffers

  const tabConfig: Record<Tab, { label: string; icon: string; color: string; bgColor: string }> = {
    own: { 
      label: 'Meine Angebote', 
      icon: '➕', 
      color: 'text-[#D04D2E]',
      bgColor: 'bg-[#D04D2E]'
    },
    saved: { 
      label: 'Gemerkt', 
      icon: '⭐', 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500'
    },
    requested: { 
      label: 'Angefragt', 
      icon: '✉️', 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500'
    },
    confirmed: {
      label: 'Vereinbart',
      icon: '✓',
      color: 'text-green-500',
      bgColor: 'bg-green-500'
    },
  }

  return (
    <main className="relative min-h-dvh text-white pt-12">
      {/* Hintergrundbild wie auf /matches */}
      <BackgroundImage src="/back2.jpg" />

      {/* Fixed Top-Bar (unter App-Header) - Orange wie auf /matches */}
      <div className="fixed top-12 left-0 right-0 z-20 px-3 pt-2 pb-2 bg-[#D04D2E]/90 backdrop-blur-md shadow-md">
        <div className="mx-auto max-w-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold leading-none">Meine Spiele</h1>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-white/85">
            {loading ? 'Lade …' : `${currentOffers.length} ${activeTab === 'own' ? 'Angebote' : activeTab === 'saved' ? 'Gemerkt' : 'Angefragt'}`}
          </div>
        </div>
      </div>
      <div className="h-16" />

      <div className="relative z-10 mx-auto max-w-sm px-3 pt-3 pb-6">

        {/* Tab Navigation mit glassmorphism */}
        <div className="glass-card mb-6 p-1 rounded-2xl">
          <div className="grid grid-cols-4 gap-1">
            {(Object.entries(tabConfig) as [Tab, typeof tabConfig[Tab]][]).map(([key, config]) => {
              const count = key === 'own' ? ownOffers.length : key === 'saved' ? filteredSavedOffers.length : key === 'requested' ? requestedOffers.length : confirmedOffers.length
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`
                    relative py-3 px-2 rounded-xl text-sm font-medium transition-all
                    ${activeTab === key 
                      ? 'bg-white/30 backdrop-blur-md shadow-lg' 
                      : 'bg-transparent hover:bg-white/10'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative">
                      <span className={`text-2xl ${activeTab === key ? config.color : 'opacity-60'}`}>
                        {config.icon}
                      </span>
                      {/* Badge mit Anzahl */}
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs ${activeTab === key ? 'text-white font-semibold' : 'text-white/80'}`}>
                      {config.label}
                    </span>
                    {/* Indikator-Linie unten */}
                    {activeTab === key && (
                      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 ${config.bgColor} rounded-full`} />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
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
              onClick={fetchAllData}
              className="mt-4 px-4 py-2 bg-white/20 rounded-xl text-white hover:bg-white/30"
            >
              Erneut versuchen
            </button>
          </div>
        ) : currentOffers.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className={`text-5xl mb-4 ${tabConfig[activeTab].color}`}>
              {tabConfig[activeTab].icon}
            </div>
            <div className="text-white/90 font-medium mb-2">
              {activeTab === 'own' && 'Keine offenen Spielangebote erstellt'}
              {activeTab === 'saved' && 'Noch keine Angebote gemerkt'}
              {activeTab === 'requested' && 'Noch keine Anfragen verschickt'}
              {activeTab === 'confirmed' && 'Noch keine vereinbarten Spiele'}
            </div>
            <div className="text-white/60 text-sm">
              {activeTab === 'saved' && 'Speichere interessante Angebote auf der "Matches"-Seite'}
              {activeTab === 'requested' && 'Sende deine erste Anfrage auf der "Matches"-Seite'}
              {activeTab === 'confirmed' && 'Akzeptiere Anfragen um Spiele zu vereinbaren'}
            </div>
            {activeTab === 'own' && (
              <a 
                href="/offer/new" 
                className="inline-block mt-4 px-6 py-3 bg-[#D04D2E] text-white rounded-lg hover:bg-[#B83D1E] transition font-semibold shadow-lg"
              >
                ➕ Spielangebot erstellen
              </a>
            )}
          </div>
        ) : (
          <div>
            <div className="space-y-4">
              {currentOffers.map(offer => {
              const hasRequests = activeTab === 'own' && offer.requestCount && offer.requestCount > 0
              return (
                <div 
                  key={offer.id} 
                  className={`glass-card overflow-hidden ${hasRequests ? 'ring-2 ring-orange-500 cursor-pointer' : ''}`}
                  style={activeTab === 'confirmed' ? { border: '2px solid #22c55e' } : undefined}
                  onClick={() => hasRequests ? openRequestsDrawer(offer.id) : null}
                >
                  {activeTab === 'confirmed' ? (
                    <ConfirmedMatchCard 
                      clubName={offer.clubName}
                      ageLabel={offer.ageLabel}
                      year={offer.year}
                      logoUrl={offer.logoUrl}
                      opponentClubName={offer.opponentClubName || '—'}
                      opponentAgeLabel={offer.opponentAgeLabel || null}
                      opponentYear={offer.opponentYear}
                      opponentLogoUrl={offer.opponentLogoUrl}
                      date={offer.date}
                      kickoffTime={offer.kickoffTime}
                      kickoffFlexible={offer.kickoffFlexible}
                      homeAway={offer.homeAway}
                      notes={offer.notes}
                      playTime={offer.playTime}
                      strengthLabel={offer.strengthLabel}
                      address={offer.address}
                      pendingRequestCount={offer.pendingRequestCount}
                      isOwner={offer.isOwner}
                    />
                  ) : (
                    <MatchCard 
                      {...offer} 
                      ageLabel={offer.ageLabel || '—'}
                      isOwner={false}
                      isReserved={offer.isReserved}
                    />
                  )}
                  {activeTab === 'own' && (
                    <div className="px-3 pb-3 pt-2 border-t border-white/15">
                      {/* Badges Zeile */}
                      {((offer.savedCount ?? 0) > 0 || (offer.requestCount ?? 0) > 0) && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {offer.savedCount !== undefined && offer.savedCount > 0 && (
                            <div className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-green-500/20 text-green-200">
                              <span>⭐</span>
                              <span className="font-medium">{offer.savedCount} × gemerkt</span>
                            </div>
                          )}
                          {offer.requestCount !== undefined && offer.requestCount > 0 && (
                            <div className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-orange-500/20 text-orange-200">
                              <span>✉️</span>
                              <span className="font-medium">{offer.requestCount} × angefragt</span>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Aktions-Buttons Zeile */}
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleReserved(offer.id, offer.isReserved || false)
                          }}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                            offer.isReserved 
                              ? 'bg-amber-500/30 text-amber-200 hover:bg-amber-500/40' 
                              : 'bg-white/10 text-white/80 hover:bg-white/20'
                          }`}
                        >
                          <span>{offer.isReserved ? '🔒' : '🔓'}</span>
                          <span className="font-medium">
                            {offer.isReserved ? 'Reserviert' : 'Reservieren'}
                          </span>
                        </button>
                        <a
                          href={`/offer/edit/${offer.id}`}
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-white/10 text-white/80 hover:bg-white/20 transition"
                        >
                          <span>✏️</span>
                          <span className="font-medium">Bearbeiten</span>
                        </a>
                      </div>
                    </div>
                    )}
                  {activeTab !== 'own' && activeTab !== 'confirmed' && (
                  <div className="px-3 pb-3 pt-2 border-t border-white/15 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleSave(offer.id)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                        savedIds.has(offer.id)
                          ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      <span>{savedIds.has(offer.id) ? '⭐' : '☆'}</span>
                      <span>{savedIds.has(offer.id) ? 'Gemerkt' : 'Merken'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequest(offer.id)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                        requestedIds.has(offer.id)
                          ? 'bg-green-500/20 text-green-200 hover:bg-green-500/30'
                          : 'bg-[#D04D2E]/80 text-white hover:bg-[#D04D2E]'
                      }`}
                    >
                      <span>{requestedIds.has(offer.id) ? '✓' : '✉️'}</span>
                      <span>{requestedIds.has(offer.id) ? 'Angefragt' : 'Anfragen'}</span>
                    </button>
                    </div>
                  )}
                </div>
              )
              })}
            </div>
            
            {/* Button "Spielangebot erstellen" bei Tab "Meine Angebote" */}
            {activeTab === 'own' && (
              <div className="mt-6">
                <a 
                  href="/offer/new"
                  className="block w-full glass-card rounded-2xl px-4 py-4 text-center text-white font-medium hover:bg-white/10 transition"
                >
                  <span className="text-lg mr-2">➕</span>
                  Spielangebot erstellen
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Details Drawer */}
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

      {/* Withdraw Confirmation Modal */}
      <ConfirmModal
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        onConfirm={handleWithdrawRequest}
        title="Anfrage zurückziehen?"
        message="Möchtest du die Anfrage wirklich zurückziehen? Der Anbieter wird darüber per E-Mail, Nachricht und Benachrichtigung informiert."
        confirmText="Ja"
        cancelText="Nein"
      />
    </main>
  )
}
