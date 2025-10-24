'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BackgroundImage from '@/components/BackgroundImage'
import HeroHeader from '@/components/HeroHeader'
import SsoSection from '@/components/SsoSection'

type Mode = 'password' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/matches'

  const [mode, setMode] = useState<Mode>('password')

  // shared
  const [email, setEmail] = useState('markus.kuchnia@gmail.com')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // password
  const [password, setPassword] = useState('demo123')

  // otp
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const canRequestOtp = useMemo(() => cooldown <= 0 && !loading, [cooldown, loading])

  async function loginWithPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setInfo(null); setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      router.replace(redirectTo)
    } catch (err: any) {
      setError(err?.message ?? 'Login fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  async function requestOtp() {
    setError(null); setInfo(null); setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setInfo('Falls ein Konto vorhanden ist, wurde ein Code per E-Mail versandt.')
      setCooldown(60)
    } catch (err: any) {
      setError(err?.message ?? 'OTP-Anforderung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setInfo(null); setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      router.replace(redirectTo)
    } catch (err: any) {
      setError(err?.message ?? 'Code ungültig oder abgelaufen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-dvh text-white">
      <BackgroundImage />

      <div className="relative z-10 mx-auto max-w-sm min-h-dvh flex flex-col">
        {/* TOP: Icon + Logo identisch zu "/" (ohne Claim) */}
        <HeroHeader showClaim={false} />

        {/* MIDDLE: Login-Formular */}
        <div className="flex-1 px-4">
          {/* Modus wählen */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              className={`rounded-xl border px-3 py-2 text-sm backdrop-blur-sm bg-white/10 ${mode==='password' ? 'bg-white text-black border-white' : 'text-white border-white/40'}`}
              onClick={() => { setMode('password'); setError(null); setInfo(null) }}
              type="button"
            >
              Mit Passwort
            </button>
            <button
              className={`rounded-xl border px-3 py-2 text-sm backdrop-blur-sm bg-white/10 ${mode==='otp' ? 'bg-white text-black border-white' : 'text-white border-white/40'}`}
              onClick={() => { setMode('otp'); setError(null); setInfo(null) }}
              type="button"
            >
              Einmal-Code (OTP)
            </button>
          </div>

          {/* E-Mail */}
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">E-Mail</label>
            <input
              type="email"
              className="w-full rounded-xl border px-3 py-2 bg-white/90 text-black placeholder:text-gray-500"
              autoComplete="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
              placeholder="name@verein.de"
            />
          </div>

          {/* Passwort-Modus */}
          {mode === 'password' && (
            <form onSubmit={loginWithPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Passwort</label>
                <input
                  type="password"
                  className="w-full rounded-xl border px-3 py-2 bg-white/90 text-black placeholder:text-gray-500"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-sm text-red-300">{error}</p>}
              {info && <p className="text-sm text-green-200">{info}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#D04D2E] text-white px-4 py-2 backdrop-blur-sm"
              >
                {loading ? 'Logge ein…' : 'Login'}
              </button>
            </form>
          )}

          {/* OTP-Modus */}
          {mode === 'otp' && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={requestOtp}
                  disabled={!canRequestOtp}
                  className="rounded-xl border px-3 py-2 text-sm backdrop-blur-sm bg-white/10 border-white/40"
                >
                  {cooldown > 0 ? `Code erneut senden (${cooldown}s)` : 'Code anfordern'}
                </button>
                <span className="text-xs opacity-90">6-stelliger Code, 10 Min gültig</span>
              </div>

              <form onSubmit={verifyOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Code</label>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    className="w-full rounded-xl border px-3 py-2 bg-white/90 text-black placeholder:text-gray-500"
                    placeholder="z. B. 123456"
                    value={code}
                    onChange={(e)=>setCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-300">{error}</p>}
                {info && <p className="text-sm text-green-200">{info}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#D04D2E] text-white px-4 py-2 backdrop-blur-sm"
                >
                  {loading ? 'Prüfe Code…' : 'Mit Code einloggen'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* BOTTOM: SSO identisch platziert wie auf "/" */}
        <SsoSection />
      </div>
    </main>
  )
}