'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import BackgroundImage from '@/components/BackgroundImage'
import HeaderBar from '@/components/HeaderBar'

const ALL_AGES = ['U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'U20', 'U21']

type ClubDetail = {
  id: string
  name: string
  street: string | null
  zip: string | null
  city: string | null
  logoUrl: string | null
  teams: {
    id: string
    name: string | null
    ageGroup: string | null
    year: number | null
  }[]
}

export default function AddTeamPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const clubId = sp.get('clubId') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [club, setClub] = useState<ClubDetail | null>(null)

  const [tName, setTName] = useState('')
  const [age, setAge] = useState<string>('U13')
  const [year, setYear] = useState('')
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

      // Reload um Header-Badge zu aktualisieren
      window.location.href = '/profile'
    } catch (err: any) {
      setError(err?.message ?? 'Team konnte nicht angelegt werden')
    } finally {
      setSubmitting(false)
    }
  }

  async function chooseExistingTeam(teamId: string) {
    try {
      setError(null)
      const res = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      
      // Reload um Header-Badge zu aktualisieren
      window.location.href = '/profile'
    } catch (err: any) {
      setError(err?.message ?? 'Team konnte nicht zugeordnet werden')
    }
  }

  return (
    <main className="relative min-h-dvh text-white">
      <BackgroundImage />
      <HeaderBar />

      <div className="mx-auto max-w-sm px-4 pt-16 pb-24">
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-white/90 underline underline-offset-2 decoration-white/60 hover:decoration-white"
          >
            ← Zurück
          </button>
        </div>

        <h1 className="text-xl font-semibold mb-3">Team hinzufügen</h1>

        {loading && (
          <div className="rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm p-4">
            <p className="text-sm text-white/80">Lade Vereinsdaten…</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-400 bg-red-500/15 text-red-100 px-3 py-2 text-sm mb-4">
            {error}
          </div>
        )}

        {club && (
          <>
            {/* Club-Header */}
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

            {/* Bestehende Teams (falls vorhanden) */}
            {club.teams && club.teams.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-semibold mb-2 text-white/95">Bestehendes Team wählen</h2>
                <div className="rounded-xl border border-white/25 bg-black/50 backdrop-blur-sm divide-y divide-white/15">
                  {club.teams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => chooseExistingTeam(t.id)}
                      className="w-full px-3 py-2 text-left hover:bg-white/10 transition"
                    >
                      <div className="text-sm font-medium text-white">
                        {t.ageGroup ?? '—'}
                        {t.year ? ` • ${t.year}` : ''}
                        {t.name ? ` • ${t.name}` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/40" /></div>
              <div className="relative flex justify-center">
                <span className="bg-black/30 backdrop-blur-sm border border-white/30 rounded-md px-2 py-0.5 text-xs text-white/90">
                  oder neues Team anlegen
                </span>
              </div>
            </div>

            {/* Neues Team anlegen */}
            <h2 className="text-sm font-semibold mb-2 text-white/95">Neues Team anlegen</h2>
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
                    className="w-full rounded-xl border border-white/30 bg-white/15 text-white px-3 py-2 backdrop-blur-sm"
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

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#D04D2E] text-white px-4 py-2 shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Lege an…' : 'Team hinzufügen'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
