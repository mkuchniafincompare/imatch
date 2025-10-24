'use client'

import { useEffect, useState } from 'react'
import BackgroundImage from '@/components/BackgroundImage'
import MatchCard from '@/components/MatchCard'

type Tab = 'own' | 'saved' | 'requested'

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

export default function MyGamesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('own')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [ownOffers, setOwnOffers] = useState<MatchItem[]>([])
  const [savedOffers, setSavedOffers] = useState<MatchItem[]>([])
  const [requestedOffers, setRequestedOffers] = useState<MatchItem[]>([])

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set())

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
      }
    } catch (e: any) {
      console.error('Save failed:', e)
    }
  }

  async function handleRequest(offerId: string) {
    try {
      if (requestedIds.has(offerId)) {
        await fetch('/api/requests', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offerId }),
        })
        setRequestedIds(prev => {
          const next = new Set(prev)
          next.delete(offerId)
          return next
        })
        setRequestedOffers(prev => prev.filter(o => o.id !== offerId))
      } else {
        await fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offerId }),
        })
        setRequestedIds(prev => new Set([...prev, offerId]))
      }
    } catch (e: any) {
      console.error('Request failed:', e)
    }
  }

  const currentOffers = 
    activeTab === 'own' ? ownOffers :
    activeTab === 'saved' ? savedOffers :
    requestedOffers

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
  }

  return (
    <main className="min-h-dvh relative">
      <BackgroundImage />

      <div className="relative z-10 p-4 pb-6">
        <h1 className="text-2xl font-bold mb-4 text-white drop-shadow-lg">Meine Spiele</h1>

        {/* Tab Navigation mit glassmorphism */}
        <div className="glass-card mb-6 p-1 rounded-2xl">
          <div className="grid grid-cols-3 gap-1">
            {(Object.entries(tabConfig) as [Tab, typeof tabConfig[Tab]][]).map(([key, config]) => (
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
                  <span className={`text-2xl ${activeTab === key ? config.color : 'opacity-60'}`}>
                    {config.icon}
                  </span>
                  <span className={`text-xs ${activeTab === key ? 'text-white font-semibold' : 'text-white/80'}`}>
                    {config.label}
                  </span>
                  {/* Indikator-Linie unten */}
                  {activeTab === key && (
                    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 ${config.bgColor} rounded-full`} />
                  )}
                </div>
              </button>
            ))}
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
              {activeTab === 'own' && 'Noch keine Angebote erstellt'}
              {activeTab === 'saved' && 'Noch keine Angebote gemerkt'}
              {activeTab === 'requested' && 'Noch keine Anfragen verschickt'}
            </div>
            <div className="text-white/60 text-sm">
              {activeTab === 'own' && 'Erstelle dein erstes Angebot über "Anbieten"'}
              {activeTab === 'saved' && 'Speichere interessante Angebote auf der "Matches"-Seite'}
              {activeTab === 'requested' && 'Sende deine erste Anfrage auf der "Matches"-Seite'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {currentOffers.map(offer => (
              <MatchCard
                key={offer.id}
                match={offer}
                isSaved={savedIds.has(offer.id)}
                isRequested={requestedIds.has(offer.id)}
                onSave={() => handleSave(offer.id)}
                onRequest={() => handleRequest(offer.id)}
                showActions={activeTab !== 'own'}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
