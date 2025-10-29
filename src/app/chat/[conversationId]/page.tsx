'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import BackgroundImage from '@/components/BackgroundImage'

type Message = {
  id: string
  text: string
  senderId: string
  isOwn: boolean
  createdAt: string
  read: boolean
}

type ConversationData = {
  id: string
  otherUser: {
    id: string
    name: string
  }
  messages: Message[]
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.conversationId as string
  
  const [conversation, setConversation] = useState<ConversationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversation()
  }, [conversationId])

  useEffect(() => {
    if (conversation) {
      scrollToBottom()
    }
  }, [conversation])

  async function fetchConversation() {
    try {
      const res = await fetch(`/api/messaging/conversations/${conversationId}`)
      const data = await res.json()
      
      if (res.ok) {
        setConversation(data.conversation)
      } else {
        alert('Konversation nicht gefunden')
        router.push('/chat')
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error)
      alert('Fehler beim Laden der Konversation')
      router.push('/chat')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!messageText.trim() || !conversation) return

    setSending(true)
    try {
      const res = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: conversation.otherUser.id,
          text: messageText,
        }),
      })

      if (res.ok) {
        setMessageText('')
        fetchConversation()
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

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Heute'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Gestern'
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  }

  function groupMessagesByDate(messages: Message[]) {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ''
    let currentGroup: Message[] = []

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString()
      if (msgDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup })
        }
        currentDate = msgDate
        currentGroup = [msg]
      } else {
        currentGroup.push(msg)
      }
    })

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup })
    }

    return groups
  }

  if (loading) {
    return (
      <main className="relative min-h-screen pt-12">
        <BackgroundImage src="/back2.jpg" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
          <div className="glass-card rounded-2xl p-8 text-center text-white/70">
            Lade Konversation...
          </div>
        </div>
      </main>
    )
  }

  if (!conversation) {
    return null
  }

  const messageGroups = groupMessagesByDate(conversation.messages)

  return (
    <main className="relative min-h-screen pt-12 pb-24">
      <BackgroundImage src="/back2.jpg" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/chat')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 border border-white/40 hover:bg-white/30 transition"
          >
            <span className="text-white text-xl">←</span>
          </button>
          <h1 className="text-2xl font-bold text-white">
            {conversation.otherUser.name}
          </h1>
        </div>

        {/* Messages */}
        <div className="glass-card rounded-2xl p-4 mb-6 max-h-[60vh] overflow-y-auto">
          {conversation.messages.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              Noch keine Nachrichten. Schreibe die erste Nachricht!
            </div>
          ) : (
            <div className="space-y-4">
              {messageGroups.map((group, groupIdx) => (
                <div key={groupIdx}>
                  {/* Date Separator */}
                  <div className="flex items-center justify-center my-4">
                    <div className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs">
                      {formatDate(group.messages[0].createdAt)}
                    </div>
                  </div>

                  {/* Messages for this date */}
                  {group.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          msg.isOwn
                            ? 'bg-[#D04D2E] text-white'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        <div className="break-words">{msg.text}</div>
                        <div
                          className={`text-xs mt-1 ${
                            msg.isOwn ? 'text-white/70' : 'text-white/50'
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="glass-card rounded-2xl p-4">
          <div className="flex gap-3">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Nachricht schreiben..."
              rows={2}
              className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
            />
            <button
              type="submit"
              disabled={sending || !messageText.trim()}
              className="self-end px-6 py-2 rounded-lg bg-[#D04D2E] text-white font-semibold hover:bg-[#B03D1E] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {sending ? '...' : 'Senden'}
            </button>
          </div>
          <div className="text-xs text-white/50 mt-2">
            Drücke Enter zum Senden, Shift+Enter für neue Zeile
          </div>
        </form>
      </div>
    </main>
  )
}
