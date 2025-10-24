

'use client'

import React from 'react'

type AffiliationPayload = {
  club: {
    id: string
    name: string
    city: string | null
    zip: string | null
    street: string | null
    logoUrl: string | null
  } | null
  teams: {
    id: string
    name: string | null
    ageGroup: string | null
    year: number | null
    preferredForm: string | null
    clubId: string
  }[]
}

export default function ProfileAffiliation() {
  const [state, setState] = React.useState<{
    loading: boolean
    error: string | null
    data: AffiliationPayload | null
  }>({ loading: true, error: null, data: null })

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/profile/affiliation', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!alive) return
        if (!res.ok) {
          throw new Error(data?.error || `HTTP ${res.status}`)
        }
        setState({ loading: false, error: null, data })
      } catch (e: any) {
        if (!alive) return
        setState({ loading: false, error: e?.message ?? 'Laden fehlgeschlagen', data: null })
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const { loading, error, data } = state

  return (
    <section className="rounded-2xl glass p-4">
      <header className="mb-3">
        <h2 className="text-base font-semibold text-white">Verein &amp; Teams</h2>
      </header>

      {loading && <p className="text-sm text-white/80">Lade Zuordnung…</p>}

      {error && (
        <div className="rounded-xl border border-red-400 bg-red-500/15 text-red-100 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Club-Block */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
              {data?.club?.logoUrl ? (
                <img
                  src={data.club.logoUrl}
                  alt={data.club.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-white/70">Logo</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-white font-medium truncate">
                {data?.club?.name ?? '—'}
              </div>
              <div className="text-white/75 text-xs truncate">
                {[data?.club?.street, data?.club?.zip, data?.club?.city].filter(Boolean).join(', ') ||
                  '—'}
              </div>
            </div>
          </div>

          {/* Teams-Liste */}
          <div className="mt-4">
            <div className="text-xs font-medium uppercase tracking-wide text-white/70 mb-1">
              Teams
            </div>
            {!data || data.teams.length === 0 ? (
              <div className="text-sm text-white/80">Keine Teams hinterlegt.</div>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {data.teams.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm text-white"
                  >
                    <span className="font-medium">{t.ageGroup ?? '—'}</span>
                    {t.year ? <span className="ml-1 text-white/85">• {t.year}</span> : null}
                    {t.name ? <span className="ml-1 text-white/85">• {t.name}</span> : null}
                    {t.preferredForm ? (
                      <span className="ml-1 text-white/70 text-xs">({mapForm(t.preferredForm)})</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  )
}

function mapForm(f: string) {
  switch (f) {
    case 'FUNINO':
      return 'Funino'
    case 'FUSSBALL_4':
      return 'Fußball 4'
    case 'FUSSBALL_5':
      return 'Fußball 5'
    case 'FUSSBALL_7':
      return 'Fußball 7'
    case 'NEUN_GEGEN_NEUN':
      return '9 vs. 9'
    case 'ELF_GEGEN_ELF':
      return '11 vs. 11'
    default:
      return f
  }
}