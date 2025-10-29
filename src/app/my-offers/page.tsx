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
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null)
  const [reserveModalOpen, setReserveModalOpen] = useState(false)
  const [reserveAction, setReserveAction] = useState<{ offerId: string; isCurrentlyReserved: boolean } | null>(null)

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
                        {...offer} 
                        ageLabel={offer.ageLabel || '—'}
                        isReserved={offer.isReserved}
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
                  isFirstItem={index === 0}
                  onEdit={() => {
                    setOpenMenuId(null)
                    router.push(`/offer/edit/${offer.id}`)
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

function BurgerMenu({
  offerId,
  isReserved,
  isFirstItem,
  onEdit,
  onReserve,
  onDelete,
  onClose,
}: {
  offerId: string
  isReserved: boolean
  isFirstItem: boolean
  onEdit: () => void
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
      className="fixed z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
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
