'use client'

import { useEffect, useRef, useState } from 'react'
import BackgroundImage from '@/components/BackgroundImage'
import MatchCard from '@/components/MatchCard'
import ConfirmModal from '@/components/ConfirmModal'

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
}

export default function SavedOffersPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savedOffers, setSavedOffers] = useState<MatchItem[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set())
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [requestMessage, setRequestMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchSavedOffers(), fetchRequestedIds()])
    } catch (e: any) {
      setError(e?.message ?? 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
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

  async function fetchRequestedIds() {
    const req = await fetch('/api/requests')
    if (!req.ok) return
    const reqData = await req.json()
    setRequestedIds(new Set(reqData.requestedIds || []))
  }

  async function handleRemoveFromSaved(offerId: string) {
    try {
      const res = await fetch('/api/saved-offers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      })

      if (res.ok) {
        setSavedIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(offerId)
          return newSet
        })
        setSavedOffers(prev => prev.filter(o => o.id !== offerId))
        setOpenMenuId(null)
      }
    } catch (e: any) {
      console.error('Remove from saved failed:', e)
    }
  }

  function openRequestModal(offerId: string) {
    setSelectedOfferId(offerId)
    setRequestMessage('')
    setRequestModalOpen(true)
    setOpenMenuId(null)
  }

  async function handleSendRequest() {
    if (!selectedOfferId) return
    
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          offerId: selectedOfferId,
          message: requestMessage.trim() || null,
        }),
      })

      if (res.ok) {
        setRequestedIds(prev => new Set(prev).add(selectedOfferId))
        setRequestModalOpen(false)
        setSelectedOfferId(null)
        setRequestMessage('')
        // Weiterleitung zu "Meine Anfragen"
        window.location.href = '/my-requests'
      }
    } catch (e: any) {
      console.error('Request failed:', e)
    }
  }

  // Auto-cleanup wird jetzt auf dem Server durchgeführt (in der API)

  // Filter: Wenn ein Spiel angefragt wurde, nicht mehr bei "Gemerkt" anzeigen
  const filteredSavedOffers = savedOffers.filter(offer => !requestedIds.has(offer.id))

  return (
    <main className="relative min-h-screen pt-16">
      <BackgroundImage />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <h1 className="text-2xl font-bold text-white mb-6">
          Meine Merkliste
        </h1>

        {/* Content */}
        {loading ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-white/80">Lade...</div>
          </div>
        ) : error ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-red-300">{error}</div>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-white/20 rounded-xl text-white hover:bg-white/30"
            >
              Erneut versuchen
            </button>
          </div>
        ) : filteredSavedOffers.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4 text-amber-500">⭐</div>
            <div className="text-white/90 font-medium mb-2">
              Noch keine Angebote gemerkt
            </div>
            <div className="text-white/60 text-sm">
              Speichere interessante Angebote auf der "Suchen"-Seite
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredSavedOffers.map((offer, index) => (
                <div key={offer.id} className="glass-card relative">
                  <div className="overflow-hidden rounded-2xl">
                    <MatchCard 
                      {...offer} 
                      ageLabel={offer.ageLabel || '—'}
                    />
                  </div>
                  
                  {/* Burger-Menü */}
                  <div className="absolute bottom-3 right-3 z-20">
                    <button
                      id={`burger-${offer.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === offer.id ? null : offer.id)
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
              ))}
            </div>
            
            {/* Burger-Menüs außerhalb der Kacheln rendern */}
            {filteredSavedOffers.map((offer, index) => {
              const isMenuOpen = openMenuId === offer.id
              if (!isMenuOpen) return null
              
              return (
                <BurgerMenu
                  key={`menu-${offer.id}`}
                  offerId={offer.id}
                  isFirstItem={index === 0}
                  onRemove={() => handleRemoveFromSaved(offer.id)}
                  onRequest={() => openRequestModal(offer.id)}
                  onClose={() => setOpenMenuId(null)}
                />
              )
            })}
          </>
        )}
      </div>

      {/* Request Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Anfrage senden</h3>
            <p className="text-gray-700 mb-4 text-sm">
              Du kannst optional eine Nachricht an den Anbieter hinzufügen:
            </p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Nachricht (optional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D04D2E] focus:border-transparent resize-none text-gray-900"
              rows={4}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setRequestModalOpen(false)
                  setSelectedOfferId(null)
                  setRequestMessage('')
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSendRequest}
                className="flex-1 px-4 py-2 bg-[#D04D2E] text-white rounded-lg hover:bg-[#B83D1E] font-medium"
              >
                Anfrage senden
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function BurgerMenu({
  offerId,
  isFirstItem,
  onRemove,
  onRequest,
  onClose,
}: {
  offerId: string
  isFirstItem: boolean
  onRemove: () => void
  onRequest: () => void
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
        onClick={onRequest}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-900 flex items-center gap-2 border-b border-gray-100"
      >
        <span>📤</span>
        <span>Anfrage senden</span>
      </button>
      <button
        onClick={onRemove}
        className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm text-red-600 flex items-center gap-2"
      >
        <span>⭐</span>
        <span>Von Merkliste entfernen</span>
      </button>
    </div>
  )
}
