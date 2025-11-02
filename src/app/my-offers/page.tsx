'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import BackgroundImage from '@/components/BackgroundImage'
import MatchCard from '@/components/MatchCard'
import Drawer from '@/components/Drawer'

function useOnClickOutside(
  ref: React.RefObject<HTMLElement | null>, 
  handler: () => void,
  excludeId?: string
) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      
      // Ignore clicks on the burger button
      if (excludeId) {
        const target = e.target as HTMLElement
        const burgerButton = document.getElementById(excludeId)
        if (burgerButton && (burgerButton === target || burgerButton.contains(target))) {
          return
        }
      }
      
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler, excludeId])
}

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
  matchType?: string
}

export default function MyOffersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ownOffers, setOwnOffers] = useState<MatchItem[]>([])
  
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [selectedOfferData, setSelectedOfferData] = useState<{ matchType: string; numberOfOpponents: number | null } | null>(null)
  const [offerRequests, setOfferRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null)
  const [reserveModalOpen, setReserveModalOpen] = useState(false)
  const [reserveAction, setReserveAction] = useState<{ offerId: string; isCurrentlyReserved: boolean } | null>(null)
  
  const [drawerView, setDrawerView] = useState<'list' | 'confirm' | 'bulk-reject'>('list')
  const [respondAction, setRespondAction] = useState<{ requesterId: string; action: 'accept' | 'reject'; requesterName: string; clubName: string } | null>(null)
  const [respondMessage, setRespondMessage] = useState('')
  const [bulkRejectMessage, setBulkRejectMessage] = useState('')
  const [showBulkRejectPrompt, setShowBulkRejectPrompt] = useState(false)

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
    const offer = ownOffers.find(o => o.id === offerId)
    setSelectedOfferId(offerId)
    setSelectedOfferData({
      matchType: offer?.matchType || 'TESTSPIEL',
      numberOfOpponents: null, // wird aus API geladen
    })
    setRequestDrawerOpen(true)
    setDrawerView('list')
    setLoadingRequests(true)
    
    try {
      const res = await fetch(`/api/requests/${offerId}`)
      if (!res.ok) throw new Error('Anfragen konnten nicht geladen werden')
      const data = await res.json()
      setOfferRequests(data.requests || [])
      // numberOfOpponents aus Offer-Daten laden wenn verfügbar
      if (data.offerData?.numberOfOpponents) {
        setSelectedOfferData(prev => prev ? { ...prev, numberOfOpponents: data.offerData.numberOfOpponents } : null)
      }
    } catch (e: any) {
      console.error('Failed to load requests:', e)
      setOfferRequests([])
    } finally {
      setLoadingRequests(false)
    }
  }

  function openRespondConfirm(requesterId: string, action: 'accept' | 'reject', requesterName: string, clubName: string) {
    setRespondAction({ requesterId, action, requesterName, clubName })
    setRespondMessage('')
    setDrawerView('confirm')
  }

  async function handleRespondToRequest() {
    if (!selectedOfferId || !respondAction) return

    try {
      const res = await fetch(`/api/requests/${selectedOfferId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requesterId: respondAction.requesterId, 
          action: respondAction.action,
          message: respondMessage.trim() || null,
        }),
      })

      if (res.ok) {
        const isAccept = respondAction.action === 'accept'
        const isTestspiel = selectedOfferData?.matchType === 'TESTSPIEL'
        
        setDrawerView('list')
        setRespondAction(null)
        setRespondMessage('')
        
        // Anfragen neu laden
        const reqRes = await fetch(`/api/requests/${selectedOfferId}`)
        const reqData = await reqRes.json()
        setOfferRequests(reqData.requests || [])
        
        // Angebote aktualisieren
        await fetchOwnOffers()
        
        // Bei Testspiel: Sofort zu confirmed-matches
        if (isTestspiel && isAccept) {
          setRequestDrawerOpen(false)
          router.push('/confirmed-matches')
          return
        }
        
        // Bei Leistungsvergleich: Prüfen ob max erreicht und noch offene Anfragen vorhanden
        if (!isTestspiel && isAccept) {
          const maxAccepts = selectedOfferData?.numberOfOpponents || 1
          const acceptedCount = (reqData.requests || []).filter((r: any) => r.status === 'ACCEPTED').length
          const pendingRequests = (reqData.requests || []).filter((r: any) => r.status === 'PENDING')
          
          if (acceptedCount >= maxAccepts && pendingRequests.length > 0) {
            // Maximale Anzahl erreicht und noch offene Anfragen vorhanden
            setShowBulkRejectPrompt(true)
          }
          // Drawer bleibt offen
        } else {
          // Bei Ablehnung: Drawer offen lassen
        }
      }
    } catch (e: any) {
      console.error('Failed to respond:', e)
    }
  }

  async function handleBulkRejectAll() {
    if (!selectedOfferId) return
    
    try {
      const res = await fetch(`/api/requests/${selectedOfferId}/bulk-reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: bulkRejectMessage.trim() || null,
        }),
      })

      if (res.ok) {
        setShowBulkRejectPrompt(false)
        setDrawerView('list')
        setBulkRejectMessage('')
        setRequestDrawerOpen(false)
        
        // Zu confirmed-matches weiterleiten
        router.push('/confirmed-matches')
      }
    } catch (e: any) {
      console.error('Failed to bulk reject:', e)
    }
  }

  function handleBackToList() {
    setDrawerView('list')
    setRespondAction(null)
    setRespondMessage('')
  }

  function openReserveModal(offerId: string, currentReserved: boolean) {
    setReserveAction({ offerId, isCurrentlyReserved: currentReserved })
    setReserveModalOpen(true)
    setOpenMenuId(null)
  }

  async function handleToggleReserved() {
    if (!reserveAction) return

    try {
      const res = await fetch('/api/offer/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: reserveAction.offerId,
          isReserved: !reserveAction.isCurrentlyReserved,
        }),
      })

      if (res.ok) {
        setOwnOffers(prev => prev.map(o => 
          o.id === reserveAction.offerId ? { ...o, isReserved: !reserveAction.isCurrentlyReserved } : o
        ))
        setReserveModalOpen(false)
        setReserveAction(null)
      }
      setOpenMenuId(null)
    } catch (e: any) {
      console.error('Toggle reserved failed:', e)
    }
  }

  function openDeleteModal(offerId: string) {
    setOfferToDelete(offerId)
    setDeleteModalOpen(true)
    setOpenMenuId(null)
  }

  async function handleDelete() {
    if (!offerToDelete) return
    
    try {
      const res = await fetch('/api/offer/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: offerToDelete }),
      })

      if (res.ok) {
        setOwnOffers(prev => prev.filter(o => o.id !== offerToDelete))
        setDeleteModalOpen(false)
        setOfferToDelete(null)
      } else {
        alert('Fehler beim Löschen des Spiels')
      }
    } catch (e: any) {
      console.error('Delete failed:', e)
      alert('Fehler beim Löschen des Spiels')
    }
  }

  return (
    <main className="relative min-h-screen pt-16">
      <BackgroundImage src="/back2.jpg" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            Meine Spielangebote
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
              {ownOffers.map((offer, index) => {
                const hasRequests = offer.requestCount && offer.requestCount > 0
                const isMenuOpen = openMenuId === offer.id
                return (
                  <div 
                    key={offer.id} 
                    className={`glass-card relative ${hasRequests ? 'ring-2 ring-orange-500' : ''}`}
                  >
                    <div 
                      className={`overflow-hidden rounded-2xl ${hasRequests ? 'cursor-pointer' : ''}`}
                      onClick={() => hasRequests ? openRequestsDrawer(offer.id) : null}
                    >
                      <MatchCard 
                        clubName={offer.clubName}
                        ageLabel={offer.ageLabel || '—'}
                        year={offer.year}
                        date={offer.date}
                        kickoffTime={offer.kickoffTime}
                        kickoffFlexible={offer.kickoffFlexible}
                        homeAway={offer.homeAway}
                        notes={offer.notes}
                        playTime={offer.playTime}
                        strengthLabel={offer.strengthLabel}
                        address={offer.address}
                        logoUrl={offer.logoUrl}
                        isReserved={offer.isReserved}
                        matchType={offer.matchType}
                        requestCount={offer.requestCount}
                      />
                    </div>
                    
                    {/* Burger-Menü */}
                    <div className="absolute bottom-3 right-3 z-20">
                      <button
                        id={`burger-${offer.id}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenuId(isMenuOpen ? null : offer.id)
                        }}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center transition"
                        aria-label="Menü"
                      >
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <circle cx="10" cy="5" r="1.5" />
                          <circle cx="10" cy="10" r="1.5" />
                          <circle cx="10" cy="15" r="1.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Burger-Menüs außerhalb der Kacheln rendern */}
            {ownOffers.map((offer, index) => {
              const isMenuOpen = openMenuId === offer.id
              if (!isMenuOpen) return null
              
              return (
                <BurgerMenu
                  key={`menu-${offer.id}`}
                  offerId={offer.id}
                  isReserved={offer.isReserved || false}
                  hasRequests={(offer.requestCount || 0) > 0}
                  isFirstItem={index === 0}
                  onEdit={() => {
                    setOpenMenuId(null)
                    router.push(`/offer/edit/${offer.id}`)
                  }}
                  onManageRequests={() => {
                    setOpenMenuId(null)
                    openRequestsDrawer(offer.id)
                  }}
                  onReserve={() => openReserveModal(offer.id, offer.isReserved || false)}
                  onDelete={() => openDeleteModal(offer.id)}
                  onClose={() => setOpenMenuId(null)}
                />
              )
            })}
            
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

      {/* Reserve Modal */}
      {reserveModalOpen && reserveAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {reserveAction.isCurrentlyReserved ? 'Reservierung aufheben?' : 'Spiel reservieren?'}
            </h3>
            <p className="text-gray-700 mb-6">
              {reserveAction.isCurrentlyReserved 
                ? 'Die Reservierung wird aufgehoben - das Spiel ist wieder in den Suchergebnissen für anderen Vereine sichtbar.' 
                : 'Das Spiel wird reserviert - damit ist es nicht mehr in den Suchergebnissen für andere Vereine sichtbar.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReserveModalOpen(false)
                  setReserveAction(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={handleToggleReserved}
                className="flex-1 px-4 py-2 bg-[#D04D2E] text-white rounded-lg hover:bg-[#B83D1E] font-medium"
              >
                {reserveAction.isCurrentlyReserved ? 'Aufheben' : 'Reservieren'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Spiel löschen?</h3>
            <p className="text-gray-700 mb-6">
              Möchtest du dieses Spielangebot wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setOfferToDelete(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reject Prompt Modal */}
      {showBulkRejectPrompt && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Maximale Anzahl erreicht</h3>
            <p className="text-gray-700 mb-6">
              Du hast die maximale Anzahl an Gegnern akzeptiert. Möchtest du alle anderen offenen Anfragen auf "abgelehnt" setzen?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkRejectPrompt(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setShowBulkRejectPrompt(false)
                  setDrawerView('bulk-reject')
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Alle Anfragen ablehnen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Drawer */}
      <Drawer
        open={requestDrawerOpen}
        onClose={() => {
          setRequestDrawerOpen(false)
          setDrawerView('list')
          setShowBulkRejectPrompt(false)
        }}
        title={
          drawerView === 'list' ? 'Anfragen bearbeiten' : 
          drawerView === 'bulk-reject' ? 'Alle Anfragen ablehnen' :
          respondAction?.action === 'accept' ? 'Anfrage akzeptieren' : 'Anfrage ablehnen'
        }
        side="right"
        className="!bg-white !text-gray-900"
      >
        {drawerView === 'list' ? (
          // Liste der Anfragen
          <>
            {(() => {
              const isTestspiel = selectedOfferData?.matchType === 'TESTSPIEL'
              const maxAccepts = isTestspiel ? 1 : (selectedOfferData?.numberOfOpponents || 1)
              const acceptedCount = offerRequests.filter(r => r.status === 'ACCEPTED').length
              const canAcceptMore = acceptedCount < maxAccepts
              
              return (
                <>
                  {/* Zähler bei Leistungsvergleich */}
                  {!isTestspiel && selectedOfferData?.numberOfOpponents && (
                    <div className="mb-4 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-[#D04D2E]/30 shadow-sm">
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        Leistungsvergleich
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        Bereits akzeptiert: <span className="text-[#D04D2E]">{acceptedCount}</span> / {maxAccepts}
                      </div>
                    </div>
                  )}

                  {loadingRequests ? (
                    <div className="text-sm text-gray-600">Lade Anfragen...</div>
                  ) : offerRequests.length === 0 ? (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                      <div className="text-gray-600">Keine Anfragen vorhanden.</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {offerRequests.map((req) => {
                        const isAccepted = req.status === 'ACCEPTED'
                        const isRejected = req.status === 'REJECTED'
                        const isPending = req.status === 'PENDING'
                        const canAcceptThis = isPending && canAcceptMore
                        
                        return (
                          <div key={req.requesterId} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="font-semibold text-gray-900">{req.requesterName}</div>
                                <div className="text-sm text-gray-600">{req.clubName}</div>
                                {req.teamAgeGroup && (
                                  <div className="text-xs text-gray-500">{req.teamAgeGroup}</div>
                                )}
                              </div>
                              <div className={`text-xs px-3 py-1 rounded-full font-medium ${
                                isAccepted ? 'bg-green-100 text-green-800' :
                                isRejected ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {isAccepted ? 'Akzeptiert' : isRejected ? 'Abgelehnt' : 'Ausstehend'}
                              </div>
                            </div>
                            
                            {req.message && (
                              <div className="text-sm text-gray-700 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="text-xs text-blue-600 font-medium mb-1">Nachricht:</div>
                                {req.message}
                              </div>
                            )}

                            {isPending && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => openRespondConfirm(req.requesterId, 'accept', req.requesterName, req.clubName)}
                                  disabled={!canAcceptThis}
                                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${
                                    canAcceptThis
                                      ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow'
                                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  }`}
                                  title={!canAcceptThis ? 'Maximale Anzahl bereits akzeptiert' : ''}
                                >
                                  Akzeptieren
                                </button>
                                <button
                                  onClick={() => openRespondConfirm(req.requesterId, 'reject', req.requesterName, req.clubName)}
                                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition shadow-sm hover:shadow"
                                >
                                  Ablehnen
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )
            })()}
          </>
        ) : drawerView === 'bulk-reject' ? (
          // Bulk-Reject-Ansicht
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                📢 Massenablehnung
              </div>
              <div className="text-sm text-gray-700">
                Du bist dabei, <span className="font-semibold text-red-700">alle verbleibenden offenen Anfragen abzulehnen</span>. Die Nachricht wird an alle betroffenen Vereine gesendet (InApp + E-Mail).
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nachricht an alle abgelehnten Vereine (optional)
              </label>
              <textarea
                value={bulkRejectMessage}
                onChange={(e) => setBulkRejectMessage(e.target.value)}
                placeholder="z.B. 'Vielen Dank für euer Interesse. Leider haben wir bereits die maximale Anzahl an Gegnern erreicht.'"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D04D2E] focus:border-[#D04D2E] resize-none text-gray-900 placeholder-gray-400"
                rows={5}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDrawerView('list')
                  setBulkRejectMessage('')
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition border border-gray-300"
              >
                Zurück
              </button>
              <button
                onClick={handleBulkRejectAll}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition shadow-sm hover:shadow"
              >
                Alle ablehnen
              </button>
            </div>
          </div>
        ) : (
          // Bestätigungs-Ansicht (einzelne Anfrage)
          respondAction && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="font-semibold text-gray-900 mb-1">{respondAction.requesterName}</div>
                <div className="text-sm text-gray-600 mb-2">{respondAction.clubName}</div>
                <div className="text-sm text-gray-700">
                  Du bist dabei, diese Anfrage zu {respondAction.action === 'accept' ? <span className="font-semibold text-green-700">akzeptieren</span> : <span className="font-semibold text-red-700">ablehnen</span>}.
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nachricht (optional)
                </label>
                <textarea
                  value={respondMessage}
                  onChange={(e) => setRespondMessage(e.target.value)}
                  placeholder="Nachricht hinzufügen..."
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D04D2E] focus:border-[#D04D2E] resize-none text-gray-900 placeholder-gray-400"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBackToList}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition border border-gray-300"
                >
                  Zurück
                </button>
                <button
                  onClick={handleRespondToRequest}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition shadow-sm hover:shadow ${
                    respondAction.action === 'accept'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {respondAction.action === 'accept' ? 'Akzeptieren' : 'Ablehnen'}
                </button>
              </div>
            </div>
          )
        )}
      </Drawer>
    </main>
  )
}

function BurgerMenu({
  offerId,
  isReserved,
  hasRequests,
  isFirstItem,
  onEdit,
  onManageRequests,
  onReserve,
  onDelete,
  onClose,
}: {
  offerId: string
  isReserved: boolean
  hasRequests: boolean
  isFirstItem: boolean
  onEdit: () => void
  onManageRequests: () => void
  onReserve: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  
  useOnClickOutside(menuRef, onClose, `burger-${offerId}`)

  // Finde das Burger-Button-Element um das Menü richtig zu positionieren
  useEffect(() => {
    const button = document.getElementById(`burger-${offerId}`)
    if (button && menuRef.current) {
      const rect = button.getBoundingClientRect()
      const menu = menuRef.current
      
      if (isFirstItem) {
        // Nach unten öffnen
        menu.style.top = `${rect.bottom + window.scrollY + 8}px`
      } else {
        // Nach oben öffnen
        menu.style.bottom = `${window.innerHeight - rect.top - window.scrollY + 8}px`
      }
      menu.style.right = `${window.innerWidth - rect.right}px`
    }
  }, [offerId, isFirstItem])

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-52 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {hasRequests && (
        <button
          onClick={onManageRequests}
          className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-900 flex items-center gap-2 border-b border-gray-100"
        >
          <span>📋</span>
          <span>Anfragen bearbeiten</span>
        </button>
      )}
      <button
        onClick={onEdit}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-900 flex items-center gap-2 border-b border-gray-100"
      >
        <span>✏️</span>
        <span>Bearbeiten</span>
      </button>
      <button
        onClick={onReserve}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-900 flex items-center gap-2 border-b border-gray-100"
      >
        <span>{isReserved ? '🔓' : '🔒'}</span>
        <span>{isReserved ? 'Reservierung aufheben' : 'Reservieren'}</span>
      </button>
      <button
        onClick={onDelete}
        className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm text-red-600 flex items-center gap-2"
      >
        <span>🗑️</span>
        <span>Spiel löschen</span>
      </button>
    </div>
  )
}
