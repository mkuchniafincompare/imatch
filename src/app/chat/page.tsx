'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BackgroundImage from '@/components/BackgroundImage'

type Conversation = {
  id: string
  otherUser: {
    id: string
    name: string
    clubName: string
    ageGroup: string | null
  }
  lastMessage: {
    text: string
    createdAt: string
    isOwn: boolean
  } | null
  unreadCount: number
  updatedAt: string
}

type Club = {
  id: string
  name: string
  city: string | null
}

type Trainer = {
  id: string
  name: string
  email: string
  clubName: string
  ageGroup: string | null
  displayText: string
}

export default function ChatPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewMessage, setShowNewMessage] = useState(false)
  
  // Search states
  const [clubQuery, setClubQuery] = useState('')
  const [trainerQuery, setTrainerQuery] = useState('')
  const [clubResults, setClubResults] = useState<Club[]>([])
  const [trainerResults, setTrainerResults] = useState<Trainer[]>([])
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null)
  
  // Message state
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  async function fetchConversations() {
    try {
      const res = await fetch('/api/messaging/conversations')
      const data = await res.json()
      if (res.ok) {
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Debounced club search
  useEffect(() => {
    if (clubQuery.length < 2) {
      setClubResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/messaging/search/clubs?q=${encodeURIComponent(clubQuery)}`)
        const data = await res.json()
        if (res.ok) {
          setClubResults(data.clubs || [])
        }
      } catch (error) {
        console.error('Club search failed:', error)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [clubQuery])

  // Debounced trainer search
  useEffect(() => {
    if (trainerQuery.length < 2 && !selectedClub) {
      setTrainerResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams()
        if (trainerQuery) params.set('q', trainerQuery)
        if (selectedClub) params.set('clubId', selectedClub.id)
        
        const res = await fetch(`/api/messaging/search/trainers?${params}`)
        const data = await res.json()
        if (res.ok) {
          setTrainerResults(data.trainers || [])
        }
      } catch (error) {
        console.error('Trainer search failed:', error)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [trainerQuery, selectedClub])

  function handleSelectClub(club: Club) {
    setSelectedClub(club)
    setClubQuery(club.name)
    setClubResults([])
    setTrainerQuery('')
    setTrainerResults([])
  }

  function handleSelectTrainer(trainer: Trainer) {
    setSelectedTrainer(trainer)
    setTrainerQuery(trainer.displayText)
    setTrainerResults([])
  }

  async function handleSendMessage() {
    if (!selectedTrainer || !messageText.trim()) return

    setSending(true)
    try {
      const res = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedTrainer.id,
          text: messageText,
        }),
      })

      if (res.ok) {
        setShowNewMessage(false)
        setClubQuery('')
        setTrainerQuery('')
        setMessageText('')
        setSelectedClub(null)
        setSelectedTrainer(null)
        fetchConversations()
      } else {
        alert('Fehler beim Senden der Nachricht')
      }
    } catch (error) {
      console.error('Send message failed:', error)
      alert('Fehler beim Senden der Nachricht')
    } finally {
      setSending(false)
    }
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Gestern'
    } else if (days < 7) {
      return date.toLocaleDateString('de-DE', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    }
  }

  return (
    <main className="relative min-h-screen pt-12">
      <BackgroundImage src="/back2.jpg" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>💬</span>
            <span>Chats</span>
          </h1>
          <button
            type="button"
            onClick={() => setShowNewMessage(true)}
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#D04D2E] text-white text-2xl hover:bg-[#B03D1E] transition shadow-lg"
            title="Neue Nachricht"
          >
            +
          </button>
        </div>

        {/* New Message Modal */}
        {showNewMessage && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Neue Nachricht</h2>
              <button
                onClick={() => {
                  setShowNewMessage(false)
                  setClubQuery('')
                  setTrainerQuery('')
                  setMessageText('')
                  setSelectedClub(null)
                  setSelectedTrainer(null)
                }}
                className="text-white/70 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Club Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/90 mb-2">
                Verein suchen
              </label>
              <input
                type="text"
                value={clubQuery}
                onChange={(e) => {
                  setClubQuery(e.target.value)
                  if (selectedClub) setSelectedClub(null)
                }}
                placeholder="Vereinsname eingeben..."
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              />
              {clubResults.length > 0 && (
                <div className="mt-2 bg-white/10 rounded-lg border border-white/20 overflow-hidden">
                  {clubResults.map((club) => (
                    <button
                      key={club.id}
                      onClick={() => handleSelectClub(club)}
                      className="w-full text-left px-4 py-2 hover:bg-white/10 text-white text-sm transition"
                    >
                      {club.name} {club.city && `(${club.city})`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Trainer Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/90 mb-2">
                Trainer suchen
              </label>
              <input
                type="text"
                value={trainerQuery}
                onChange={(e) => {
                  setTrainerQuery(e.target.value)
                  if (selectedTrainer) setSelectedTrainer(null)
                }}
                placeholder="Trainername eingeben..."
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              />
              {trainerResults.length > 0 && (
                <div className="mt-2 bg-white/10 rounded-lg border border-white/20 overflow-hidden">
                  {trainerResults.map((trainer) => (
                    <button
                      key={trainer.id}
                      onClick={() => handleSelectTrainer(trainer)}
                      className="w-full text-left px-4 py-2 hover:bg-white/10 text-white text-sm transition"
                    >
                      {trainer.displayText}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Message Input - Only show when trainer is selected */}
            {selectedTrainer && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Nachricht an {selectedTrainer.name}
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Nachricht eingeben..."
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 resize-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !messageText.trim()}
                  className="mt-2 px-6 py-2 rounded-lg bg-[#D04D2E] text-white font-semibold hover:bg-[#B03D1E] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {sending ? 'Sende...' : 'Nachricht senden'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Conversations List */}
        {loading ? (
          <div className="glass-card rounded-2xl p-8 text-center text-white/70">
            Lade Chats...
          </div>
        ) : conversations.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-white/70">
            Noch keine Chats vorhanden. Starte eine neue Unterhaltung mit dem + Button.
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => router.push(`/chat/${conv.id}`)}
                className="w-full glass-card rounded-2xl p-4 hover:bg-white/10 transition text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white flex items-center gap-2">
                      {conv.otherUser.name}
                      {conv.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[#D04D2E] text-white text-xs font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/60">
                      {conv.otherUser.clubName}
                      {conv.otherUser.ageGroup && ` • ${conv.otherUser.ageGroup}`}
                    </div>
                  </div>
                  {conv.lastMessage && (
                    <div className="text-xs text-white/50 ml-2">
                      {formatTime(conv.lastMessage.createdAt)}
                    </div>
                  )}
                </div>
                {conv.lastMessage && (
                  <div className="text-sm text-white/70 truncate">
                    {conv.lastMessage.isOwn && 'Du: '}
                    {conv.lastMessage.text}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
