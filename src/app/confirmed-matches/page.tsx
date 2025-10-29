'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BackgroundImage from '@/components/BackgroundImage'
import ConfirmedMatchCard from '@/components/ConfirmedMatchCard'
import CancelMatchModal from '@/components/CancelMatchModal'

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
  pendingRequestCount?: number
  opponentClubName?: string
  opponentAgeLabel?: string | null
  opponentYear?: number | null
  opponentLogoUrl?: string | null
  opponentTrainerId?: string | null
  isOwner?: boolean
}

export default function ConfirmedMatchesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmedOffers, setConfirmedOffers] = useState<MatchItem[]>([])
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [offerIdToCancel, setOfferIdToCancel] = useState<string | null>(null)

  useEffect(() => {
    fetchConfirmedOffers()
  }, [])

  async function fetchConfirmedOffers() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/requests/confirmed')
      if (!res.ok) throw new Error('Vereinbarte Spiele konnten nicht geladen werden')
      const data = await res.json()
      setConfirmedOffers(data.items || [])
    } catch (e: any) {
      setError(e?.message ?? 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenCancelModal(offerId: string) {
    setOfferIdToCancel(offerId)
    setCancelModalOpen(true)
  }

  async function handleCancelMatch(reason: string) {
    if (!offerIdToCancel) return

    try {
      const res = await fetch('/api/requests/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          offerId: offerIdToCancel,
          reason: reason || undefined,
        }),
      })

      if (res.ok) {
        setConfirmedOffers(prev => prev.filter(o => o.id !== offerIdToCancel))
        setCancelModalOpen(false)
        setOfferIdToCancel(null)
      }
    } catch (e: any) {
      console.error('Cancel match failed:', e)
    }
  }

  async function handleContactTrainer(opponentTrainerId: string) {
    if (!opponentTrainerId) return

    try {
      // Find or create conversation
      const res = await fetch(`/api/messaging/find-conversation?userId=${encodeURIComponent(opponentTrainerId)}`)
      const data = await res.json()

      if (res.ok) {
        if (data.exists) {
          // Navigate to existing conversation
          router.push(`/chat/${data.conversationId}`)
        } else {
          // Navigate to chat page to start new conversation
          router.push(`/chat?newConversation=${opponentTrainerId}`)
        }
      }
    } catch (e: any) {
      console.error('Contact trainer failed:', e)
      alert('Fehler beim Öffnen der Konversation')
    }
  }

  return (
    <main className="relative min-h-screen">
      <BackgroundImage src="/back2.jpg" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
          <span>✅</span>
          <span>Vereinbarte Spiele</span>
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
              onClick={fetchConfirmedOffers}
              className="mt-4 px-4 py-2 bg-white/20 rounded-xl text-white hover:bg-white/30"
            >
              Erneut versuchen
            </button>
          </div>
        ) : confirmedOffers.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4 text-green-500">✅</div>
            <div className="text-white/90 font-medium mb-2">
              Noch keine vereinbarten Spiele
            </div>
            <div className="text-white/60 text-sm">
              Akzeptiere Anfragen um Spiele zu vereinbaren
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {confirmedOffers.map(offer => (
              <div 
                key={offer.id} 
                className="glass-card overflow-hidden"
                style={{ border: '2px solid #22c55e' }}
              >
                <ConfirmedMatchCard 
                  clubName={offer.clubName}
                  ageLabel={offer.ageLabel}
                  year={offer.year}
                  logoUrl={offer.logoUrl}
                  opponentClubName={offer.opponentClubName || '—'}
                  opponentAgeLabel={offer.opponentAgeLabel || null}
                  opponentYear={offer.opponentYear}
                  opponentLogoUrl={offer.opponentLogoUrl}
                  opponentTrainerId={offer.opponentTrainerId}
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
                  onCancel={() => handleOpenCancelModal(offer.id)}
                  onContact={() => offer.opponentTrainerId && handleContactTrainer(offer.opponentTrainerId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Match Modal */}
      <CancelMatchModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelMatch}
      />
    </main>
  )
}
