'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Drawer from '@/components/Drawer'

function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

export default function HeaderBar() {
  const router = useRouter()
  const [openProfile, setOpenProfile] = useState(false)
  const [openBell, setOpenBell] = useState(false)
  const [openBurger, setOpenBurger] = useState(false)

  // Badge-Zahlen
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0)
  const [unreadMessages, setUnreadMessages] = useState<number>(0)
  
  // Drawer-Inhalte
  const [notifications, setNotifications] = useState<any[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  
  // Club-Status für Warnungs-Badge
  const [hasClub, setHasClub] = useState<boolean | null>(null)

  const profileRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(profileRef, () => setOpenProfile(false))
  useOnClickOutside(burgerRef, () => setOpenBurger(false))

  // Fetch Badge Counts
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [clubRes, notifsRes, msgsRes] = await Promise.all([
          fetch('/api/profile/affiliation', { cache: 'no-store' }),
          fetch('/api/notifications', { cache: 'no-store' }),
          fetch('/api/messaging/unread-count', { cache: 'no-store' }),
        ])
        
        if (!alive) return
        
        const clubData = await clubRes.json().catch(() => ({}))
        if (clubRes.ok && clubData) {
          setHasClub(!!clubData.club)
        }

        const notifsData = await notifsRes.json().catch(() => ({ unreadCount: 0 }))
        setUnreadNotifs(notifsData.unreadCount || 0)

        const msgsData = await msgsRes.json().catch(() => ({ unreadCount: 0 }))
        setUnreadMessages(msgsData.unreadCount || 0)
      } catch {
        // Ignorieren - Badge wird nicht angezeigt bei Fehler
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // Fetch Notifications when drawer opens
  useEffect(() => {
    if (!openBell) return
    
    setLoadingNotifs(true)
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        setNotifications(data.items || [])
        setUnreadNotifs(data.unreadCount || 0)
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoadingNotifs(false))
  }, [openBell])

  async function markNotificationRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadNotifs(prev => Math.max(0, prev - 1))
    } catch (e) {
      console.error('Failed to mark notification as read:', e)
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setOpenProfile(false)
    router.replace('/')
  }

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-12 bg-[#D04D2E]/95 backdrop-blur border-b border-[#D04D2E]">
      <div className="mx-auto max-w-screen-sm h-full flex items-center justify-between px-4">
        {/* Links: App-Icon -> /matches */}
        <Link href="/matches" className="inline-flex items-center gap-2" aria-label="iMatch Home">
          <div className="w-7 h-7 rounded-lg border border-white/30 bg-white overflow-hidden grid place-items-center">
            <Image
              src="/icon.png"
              alt="iMatch Icon"
              width={26}
              height={26}
              className="object-contain"
              priority={false}
            />
          </div>
          <span className="sr-only">iMatch</span>
        </Link>

        {/* Rechts: Chat, Glocke, Profil */}
        <div className="flex items-center gap-2">
          {/* Chat */}
          <Link href="/chat" className="relative inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/40 hover:bg-white/20 active:scale-[0.98] transition" title="Chats">
            <Image
              src="/sprechblasen.png"
              alt="Chats"
              width={18}
              height={18}
              className="object-contain brightness-0 invert"
            />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#D04D2E] text-[10px] font-bold leading-[18px] text-center">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </Link>

          {/* Glocke */}
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => { setOpenBell(true); setOpenProfile(false); setOpenBurger(false) }}
              aria-haspopup="dialog"
              aria-expanded={openBell}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/40 hover:bg-white/20 active:scale-[0.98] transition"
              title="Benachrichtigungen"
            >
              <Image
                src="/glocke.png"
                alt="Benachrichtigungen"
                width={18}
                height={18}
                className="object-contain brightness-0 invert"
              />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#D04D2E] text-[10px] font-bold leading-[18px] text-center">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
          </div>

          {/* Burger-Menü */}
          <div className="relative" ref={burgerRef}>
            <button
              type="button"
              onClick={() => { setOpenBurger(v => !v); setOpenBell(false); setOpenProfile(false) }}
              aria-haspopup="menu"
              aria-expanded={openBurger}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/40 hover:bg-white/20 active:scale-[0.98] transition"
              title="Menü"
            >
              {/* Burger-Icon: 3 horizontale Striche */}
              <div className="flex flex-col gap-[3px]">
                <div className="w-4 h-[2px] bg-white rounded"></div>
                <div className="w-4 h-[2px] bg-white rounded"></div>
                <div className="w-4 h-[2px] bg-white rounded"></div>
              </div>
            </button>

            {openBurger && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-300 bg-gray-50 shadow-lg overflow-hidden"
              >
                <Link
                  href="/pending-reviews"
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
                  onClick={() => setOpenBurger(false)}
                  role="menuitem"
                >
                  <span>Offene Bewertungen</span>
                </Link>
                <Link
                  href="/my-stats"
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
                  onClick={() => setOpenBurger(false)}
                  role="menuitem"
                >
                  <span>Meine Statistik</span>
                </Link>
              </div>
            )}
          </div>

          {/* Profil + Menü */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => { setOpenProfile(v => !v); setOpenBell(false); setOpenBurger(false) }}
              aria-haspopup="menu"
              aria-expanded={openProfile}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/40 hover:bg-white/20 active:scale-[0.98] transition"
              title="Profil"
            >
              <Image
                src="/benutzer.png"
                alt="Profil"
                width={18}
                height={18}
                className="object-contain brightness-0 invert"
              />
              {/* Warnungs-Badge wenn kein Club vorhanden */}
              {hasClub === false && (
                <Image
                  src="/warning.png"
                  alt="Warnung"
                  width={16}
                  height={16}
                  className="absolute -top-1 -right-1 object-contain"
                />
              )}
            </button>

            {openProfile && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-300 bg-gray-50 shadow-lg overflow-hidden"
              >
                <Link
                  href="/profile"
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
                  onClick={() => setOpenProfile(false)}
                  role="menuitem"
                >
                  <span>Profil</span>
                  {/* Warnungs-Icon im Menü wenn kein Club */}
                  {hasClub === false && (
                    <Image
                      src="/warning.png"
                      alt="Warnung"
                      width={14}
                      height={14}
                      className="object-contain"
                    />
                  )}
                </Link>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
                  role="menuitem"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer: Benachrichtigungen */}
      <Drawer
        open={openBell}
        onClose={() => setOpenBell(false)}
        title="Benachrichtigungen"
        side="right"
      >
        {loadingNotifs ? (
          <div className="text-sm text-gray-700">Lade Benachrichtigungen...</div>
        ) : notifications.length === 0 ? (
          <div className="text-sm text-gray-700">Keine Benachrichtigungen vorhanden.</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && markNotificationRead(notif.id)}
                className={`p-3 rounded-lg border cursor-pointer ${
                  notif.read ? 'bg-white border-gray-200' : 'bg-amber-50 border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="font-semibold text-sm text-gray-900">{notif.title}</div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  )}
                </div>
                <div className="text-xs text-gray-700">{notif.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(notif.createdAt).toLocaleDateString('de-DE')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </header>
  )
}
