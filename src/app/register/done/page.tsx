'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import BackgroundImage from '@/components/BackgroundImage'
import HeaderBar from '@/components/HeaderBar'

export default function RegisterDonePage() {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function resendEmail() {
    setSending(true)
    setError(null)
    setInfo(null)
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Fehler beim Versand')
      setInfo('E-Mail wurde erneut gesendet.')
    } catch (err: any) {
      setError(err.message || 'Fehler beim Versand')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="relative min-h-dvh text-white">
      <BackgroundImage />
      <HeaderBar />

      <div className="mx-auto max-w-sm px-4 pt-20 pb-24">

        {/* Card */}
        <div className="rounded-xl border border-white/25 bg-white/10 backdrop-blur-sm p-4">
          <div className="w-full flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/90 flex items-center justify-center shadow-md shadow-emerald-900/20">
              <svg viewBox="0 0 20 20" fill="none" className="w-7 h-7">
                <path d="M16.704 6.29a1 1 0 0 1 .006 1.414l-6.364 6.424a1 1 0 0 1-1.428.006L3.29 8.93a1 1 0 1 1 1.42-1.408l4.162 4.2 5.651-5.704a1 1 0 0 1 1.18-.428Z" fill="white"/>
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-semibold mb-2 text-white">Willkommen bei iMatch</h1>
          <p className="text-sm text-white/85 mb-4">
            Dein Konto wurde erfolgreich erstellt. Du kannst iMatch jetzt nutzen.
            <br />
            <br />
            Bitte bestätige in den nächsten 24&nbsp;Stunden noch deine E‑Mail‑Adresse – wir haben dir dazu eine Bestätigungsmail geschickt!
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.replace('/matches')}
              className="w-full rounded-xl bg-[#D04D2E] text-white px-4 py-2 shadow-lg shadow-black/10"
            >
              Weiter zu Matches
            </button>

            <button
              onClick={resendEmail}
              disabled={sending}
              className="w-full rounded-xl border border-white/40 text-white px-4 py-2 bg-white/10 backdrop-blur-sm disabled:opacity-60"
            >
              {sending ? 'Sende erneut …' : 'Bestätigungsmail erneut senden'}
            </button>

            {info && (
              <p className="text-sm text-emerald-200">
                {info}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-200">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}