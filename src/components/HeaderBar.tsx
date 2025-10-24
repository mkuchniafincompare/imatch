'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Drawer from '@/components/Drawer'

function useOnClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
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
  const [openChat, setOpenChat] = useState(false)

  // Badge-Zahlen (Platzhalter; später vom Server/API befüllen)
  const [unreadNotifs] = useState<number>(0)
  const [unreadMessages] = useState<number>(0)

  const profileRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(profileRef, () => setOpenProfile(false))
  // Für Bell/Chat verwenden wir einen Overlay-Click-Catcher (siehe unten)

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setOpenProfile(false)
    router.replace('/')
  }

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-12 bg-white/95 backdrop-blur border-b">
      <div className="mx-auto max-w-screen-sm h-full flex items-center justify-between px-4">
        {/* Links: App-Icon -> /matches */}
        <Link href="/matches" className="inline-flex items-center gap-2" aria-label="iMatch Home">
          <div className="w-7 h-7 rounded-lg border border-black/10 bg-white overflow-hidden grid place-items-center">
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
          <div className="relative" ref={chatRef}>
            <button
              type="button"
              onClick={() => { setOpenChat(true); setOpenBell(false); setOpenProfile(false) }}
              aria-haspopup="dialog"
              aria-expanded={openChat}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border hover:bg-gray-50 active:scale-[0.98] transition"
              title="Nachrichten"
            >
              <Image
                src="/sprechblasen.png"
                alt="Nachrichten"
                width={18}
                height={18}
                className="object-contain"
              />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D04D2E] text-white text-[10px] leading-[18px] text-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>
          </div>

          {/* Glocke */}
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => { setOpenBell(true); setOpenChat(false); setOpenProfile(false) }}
              aria-haspopup="dialog"
              aria-expanded={openBell}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border hover:bg-gray-50 active:scale-[0.98] transition"
              title="Benachrichtigungen"
            >
              <Image
                src="/glocke.png"
                alt="Benachrichtigungen"
                width={18}
                height={18}
                className="object-contain"
              />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D04D2E] text-white text-[10px] leading-[18px] text-center">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
          </div>

          {/* Profil + Menü */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => { setOpenProfile(v => !v); setOpenBell(false); setOpenChat(false) }}
              aria-haspopup="menu"
              aria-expanded={openProfile}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border hover:bg-gray-50 active:scale-[0.98] transition"
              title="Profil"
            >
              <Image
                src="/benutzer.png"
                alt="Profil"
                width={18}
                height={18}
                className="object-contain"
              />
            </button>

            {openProfile && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-300 bg-gray-50 shadow-lg overflow-hidden"
              >
                <Link
                  href="/profile"
                  className="block px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
                  onClick={() => setOpenProfile(false)}
                  role="menuitem"
                >
                  Profil
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

      {/* Drawer: Nachrichten */}
      <Drawer
        open={openChat}
        onClose={() => setOpenChat(false)}
        title="Nachrichten"
        side="right"
      >
        <div className="text-sm text-gray-700">
          <p>Hier zeigen wir Nachrichten an. (MVP‑Platzhalter)</p>
          <p className="mt-2 text-xs text-gray-500">Später: Konversationen, „alle gelesen“, Deep‑Links.</p>
        </div>
      </Drawer>

      {/* Drawer: Benachrichtigungen */}
      <Drawer
        open={openBell}
        onClose={() => setOpenBell(false)}
        title="Benachrichtigungen"
        side="right"
      >
        <div className="text-sm text-gray-700">
          <p>Hier zeigen wir Benachrichtigungen an. (MVP‑Platzhalter)</p>
          <p className="mt-2 text-xs text-gray-500">Später: Liste, Aktionen, Deep‑Links.</p>
        </div>
      </Drawer>
    </header>
  )
}
