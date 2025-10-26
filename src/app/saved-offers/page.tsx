'use client'

import { useEffect, useState } from 'react'
import BackgroundImage from '@/components/BackgroundImage'
import MatchCard from '@/components/MatchCard'
import ConfirmModal from '@/components/ConfirmModal'

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

  async function handleToggleSaved(offerId: string) {
    const isSaved = savedIds.has(offerId)
    try {
      const res = await fetch('/api/saved-offers', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      })

      if (res.ok) {
        if (isSaved) {
          setSavedIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(offerId)
            return newSet
          })
          setSavedOffers(prev => prev.filter(o => o.id !== offerId))
        }
      }
    } catch (e: any) {
      console.error('Toggle saved failed:', e)
    }
  }

  async function handleSendRequest(offerId: string) {
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      })

      if (res.ok) {
        setRequestedIds(prev => new Set(prev).add(offerId))
      }
    } catch (e: any) {
      console.error('Request failed:', e)
    }
  }

  // Filter: Wenn ein Spiel angefragt wurde, nicht mehr bei "Gemerkt" anzeigen
  const filteredSavedOffers = savedOffers.filter(offer => !requestedIds.has(offer.id))

  return (
    <main className="relative min-h-screen">
      <BackgroundImage />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
          <span>⭐</span>
          <span>Meine Merkliste</span>
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
          <div className="space-y-4">
            {filteredSavedOffers.map(offer => (
              <div key={offer.id} className="glass-card overflow-hidden">
                <MatchCard 
                  {...offer} 
                  ageLabel={offer.ageLabel || '—'}
                  isSaved={true}
                  onSaveClick={() => handleToggleSaved(offer.id)}
                  onRequestClick={() => handleSendRequest(offer.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
