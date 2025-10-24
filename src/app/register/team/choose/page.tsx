'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import BackgroundImage from '@/components/BackgroundImage'
import RegisterHeaderBar from '@/components/RegisterHeaderBar'
import RegisterProgress from '@/components/RegisterProgress'

type TeamItem = {
  id: string
  name: string | null
  ageGroup: string
  year: number | null
  preferredForm: string | null
  contactUserId: string
}
type ClubDetail = {
  id: string
  name: string
  city: string | null
  street: string | null
  zip: string | null
  logoUrl?: string | null
  teams: TeamItem[]
}

const ALL_AGES = Array.from({ length: 14 }, (_, i) => `U${i + 6}`)

export default function RegisterChooseTeam() {
  const router = useRouter()
  const sp = useSearchParams()
  const clubId = sp.get('clubId') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [club, setClub] = useState<ClubDetail | null>(null)

  // Formular-States
  const [tName, setTName] = useState('')
  const [age, setAge] = useState<string>('U13')
  const [year, setYear] = useState('') // YYYY, optional
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!clubId) {
      setError('Kein Verein übergeben.')
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/club/${encodeURIComponent(clubId)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
        setClub(data.club as ClubDetail)
      } catch (e: any) {
        setError(e?.message ?? 'Laden fehlgeschlagen')
      } finally {
        setLoading(false)
      }
    })()
  }, [clubId])

  async function createTeam(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId,
          name: tName.trim() || null,
          ageGroup: age,
          year: year ? Number(year) : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)

      // ← Redirect-Logik: bevorzugt 'next' aus der API, sonst /matches
      if (data?.next) {
        router.replace(data.next)
      } else {
        router.replace('/matches')
      }
    } catch (err: any) {
      setError(err?.message ?? 'Team konnte nicht angelegt werden')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-dvh text-white">
      <BackgroundImage />
      <RegisterHeaderBar />
      <div className="mx-auto max-w-sm px-4 pt-20 pb-24">
        <RegisterProgress active={3} />

        {loading && <p className="text-sm text-white/85">Lade Verein…</p>}
        {error && (
          <div className="rounded-xl border border-red-400/60 bg-red-900/40 backdrop-blur px-3 py-2 text-sm text-red-50">
            {error}
          </div>
        )}

        {club && (
          <>
            {/* Club-Header mit Logo rechts (sauber vertikal zentriert) */}
            <div className="rounded-xl border border-white/25 bg-white/10 backdrop-blur-sm p-3 mb-4">
              <div className="flex items-center gap-3 min-h-[56px]">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{club.name}</div>
                  <div className="text-xs text-white/80 truncate">
                    {[club.street, club.zip, club.city].filter(Boolean).join(', ') || '—'}
                  </div>
                </div>
                <div className="ml-auto w-12 h-12 rounded-md border border-white/40 bg-white/80 flex items-center justify-center shrink-0">
                  {club.logoUrl ? (
                    <Image
                      src={club.logoUrl}
                      alt={`${club.name} Logo`}
                      width={48}
                      height={48}
                      className="max-w-[44px] max-h-[44px] object-contain block"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-600">Logo</span>
                  )}
                </div>
              </div>
            </div>

            {/* Vorhandene Teams */}
            <h2 className="text-sm font-semibold mb-2 text-white/95">Bereits vorhandene Mannschaften</h2>
            <div className="rounded-xl border border-white/25 bg-white/5 backdrop-blur-sm divide-y divide-white/10 mb-4">
              {club.teams.length === 0 && (
                <div className="px-3 py-2 text-sm text-white/80">Keine Teams vorhanden.</div>
              )}
              {club.teams.map((t) => (
                <div key={t.id} className="px-3 py-2 text-sm">
                  <div className="font-medium text-white">
                    {t.name || '—'}{' '}
                    <span className="text-white/70">
                      ({t.ageGroup}{t.year ? ` • ${t.year}` : ''})
                    </span>
                  </div>
                  <div className="text-xs text-white/75">
                    {t.preferredForm ?? '—'}
                  </div>
                </div>
              ))}
            </div>

            {/* Neues Team anlegen */}
            <h2 className="text-sm font-semibold mb-2 text-white/95">Neues Team anlegen</h2>
            <div className="rounded-xl border border-white/25 bg-black/50 backdrop-blur-sm px-3 py-2 mb-3">
              <p className="text-xs text-white/90">
                Wähle hier Deine Teams aus oder leg diese an, für die du später hauptsächlich Spiele organisieren oder suchen möchtest.
              </p>
            </div>
            <form onSubmit={createTeam} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-white/85">Team-Name (optional)</label>
                <input
                  className="w-full rounded-xl border border-white/30 bg-white/15 text-white placeholder-white/60 px-3 py-2 backdrop-blur-sm"
                  value={tName}
                  onChange={(e)=>setTName(e.target.value)}
                  placeholder="z. B. U13-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-white/85">Altersstufe</label>
                  <select
                    className="w-full rounded-xl border border-white/30 bg-white/15 text-white placeholder-white/60 px-3 py-2 backdrop-blur-sm"
                    value={age}
                    onChange={(e)=>setAge(e.target.value)}
                  >
                    {ALL_AGES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-white/85">Jahrgang (YYYY, optional)</label>
                  <input
                    className="w-full rounded-xl border border-white/30 bg-white/15 text-white placeholder-white/60 px-3 py-2 backdrop-blur-sm"
                    value={year}
                    onChange={(e)=>setYear(e.target.value.replace(/\D/g,''))}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="z. B. 2012"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-200">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#D04D2E] text-white px-4 py-2 shadow-lg shadow-black/10"
              >
                {submitting ? 'Lege an…' : 'Team anlegen & Abschluss'}
              </button>
            </form>
          </>
        )}

        {/* Navigation */}
        <div className="mt-6">
          <button onClick={() => router.back()} className="rounded-xl border border-white/40 text-white px-4 py-2 bg-white/10 backdrop-blur-sm">Zurück</button>
        </div>
      </div>
    </main>
  )
}