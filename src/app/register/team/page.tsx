'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BackgroundImage from '@/components/BackgroundImage'
import RegisterHeaderBar from '@/components/RegisterHeaderBar'
import RegisterProgress from '@/components/RegisterProgress'

type ClubItem = {
  id: string
  name: string
  city: string | null
  street: string | null
  zip: string | null
  hasTeams: boolean
  hasVenues: boolean
}

function cls(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

export default function RegisterTeamStep() {
  const router = useRouter()
  const sp = useSearchParams()
  const fnParam = sp.get('fn')

  // User-Vorname laden (best effort)
  const [firstName, setFirstName] = useState<string | null>(null)
  useEffect(() => {
    if (fnParam && !firstName) {
      setFirstName(fnParam)
    }
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        if (data && typeof data.firstName === 'string') {
          setFirstName(data.firstName)
        }
      } catch {
        // ignore
      }
    })()
  }, [])

  // Suche
  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ClubItem[]>([])
  const [error, setError] = useState<string | null>(null)

  // Neuanlage
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [street, setStreet] = useState('')
  const [zip, setZip] = useState('')
  const [city, setCity] = useState('')

  // Logo-Upload
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoMime, setLogoMime] = useState<string | null>(null)
  const [logoWidth, setLogoWidth] = useState<number | null>(null)
  const [logoHeight, setLogoHeight] = useState<number | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Spielstätten (mind. ein Eintrag)
  type VenueForm = { name: string; useAltAddress: boolean; street: string; zip: string; city: string }
  const [venues, setVenues] = useState<VenueForm[]>([
    { name: '', useAltAddress: false, street: '', zip: '', city: '' },
  ])

  // Logo-Preview erzeugen
  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null)
      setLogoUrl(null)
      setLogoMime(null)
      setLogoWidth(null)
      setLogoHeight(null)
      return
    }
    const objectUrl = URL.createObjectURL(logoFile)
    setLogoPreview(objectUrl)
    // Bildmaße ermitteln
    const img = new window.Image()
    img.onload = () => {
      setLogoWidth(img.naturalWidth || null)
      setLogoHeight(img.naturalHeight || null)
    }
    img.src = objectUrl
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [logoFile])

  function updateVenue(idx: number, patch: Partial<VenueForm>) {
    setVenues(prev => prev.map((v, i) => i === idx ? { ...v, ...patch } : v))
  }
  function addVenue() {
    setVenues(prev => [...prev, { name: '', useAltAddress: false, street: '', zip: '', city: '' }])
  }
  function removeVenue(idx: number) {
    setVenues(prev => prev.filter((_, i) => i !== idx))
  }

  // exakter Duplikat-Check (Name identisch)
  const duplicateExists = useMemo(() => {
    const needle = name.trim()
    if (!needle) return false
    return results.some(r => r.name.trim() === needle)
  }, [name, results])

  // Suche mit Debounce
  useEffect(() => {
    const term = q.trim()
    const t = setTimeout(async () => {
      if (!term) { setResults([]); return }
      try {
        setSearching(true); setError(null)
        const res = await fetch(`/api/club/search?q=${encodeURIComponent(term)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
        setResults(data.items ?? [])
      } catch (e: any) {
        setError(e?.message ?? 'Suche fehlgeschlagen')
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  async function chooseClub(id: string) {
    // Weiter zu Schritt 3 (Team-Auswahl/-Anlage)
    router.replace(`/register/team/choose?clubId=${encodeURIComponent(id)}`)
  }

  async function createClub(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (duplicateExists) {
      setError('Diesen Vereinsnamen gibt es bereits – bitte in der Liste auswählen.')
      return
    }
    try {
      // 1) Falls ein Logo gewählt wurde und noch keine URL vorliegt: hochladen
      let finalLogoUrl = logoUrl
      let finalLogoMime = logoMime
      if (logoFile && !finalLogoUrl) {
        // Clientseitige Schutzprüfung (falls Auswahl noch geändert wurde)
        const MAX_BYTES = 5 * 1024 * 1024
        if (logoFile.size > MAX_BYTES) {
          throw new Error('Das Logo ist zu groß (max. 5 MB).')
        }
        setUploadingLogo(true)
        const fd = new FormData()
        fd.append('file', logoFile)
        const uploadRes = await fetch('/api/upload/club-logo', {
          method: 'POST',
          body: fd,
        })
        const uploadData = await uploadRes.json().catch(() => ({}))
        if (!uploadRes.ok) {
          setUploadingLogo(false)
          throw new Error(uploadData?.error || 'Logo-Upload fehlgeschlagen')
        }
        finalLogoUrl = uploadData.url as string
        finalLogoMime = uploadData.mime as string
        setLogoUrl(finalLogoUrl)
        setLogoMime(finalLogoMime)
        setUploadingLogo(false)
      }
      // Build payload incl. venues (nur Einträge mit Name)
      const payload = {
        name: name.trim(),
        street: street.trim() || null,
        zip: zip.trim() || null,
        city: city.trim() || null,
        logoUrl: finalLogoUrl,
        logoMime: finalLogoMime,
        logoWidth: logoWidth,
        logoHeight: logoHeight,
        venues: venues
          .filter(v => v.name && v.name.trim().length > 0)
          .map(v => ({
            name: v.name.trim(),
            street: v.useAltAddress ? (v.street.trim() || null) : null,
            zip:    v.useAltAddress ? (v.zip.trim()    || null) : null,
            city:   v.useAltAddress ? (v.city.trim()   || null) : null,
          })),
      }

      const res = await fetch('/api/club', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      const clubId = data?.club?.id as string
      if (!clubId) throw new Error('Antwort ohne Club-ID')
      router.replace(`/register/team/choose?clubId=${encodeURIComponent(clubId)}`)
    } catch (e: any) {
      setError(e?.message ?? 'Verein konnte nicht angelegt werden')
    }
  }

  return (
    <main className="relative min-h-dvh text-white">
      {/* Hintergrund identisch zu /register */}
      <BackgroundImage />

      <RegisterHeaderBar />

      {/* Page-Content */}
      <div className="relative z-10 mx-auto max-w-sm min-h-dvh flex flex-col px-4 pt-20">
        <RegisterProgress active={2} />

        {/* Begrüßung + Hinweis */}
        <div className="mb-4 p-3 rounded-xl bg-black/45 backdrop-blur-md border border-white/15 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          <h2 className="text-lg font-semibold text-white mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            Hallo {firstName ? firstName : ''}!
          </h2>
          <p className="text-sm text-white/95 leading-snug">
            Bitte wähle als nächstes deinen Verein aus, für den du Spiele anbieten oder suchen möchtest.
            Wenn es deinen Verein noch nicht gibt, so kannst du ihn auch manuell anlegen.
          </p>
        </div>

        {/* Titel (kompakt, wie auf /register entfernt – hier auch ohne große Headline) */}
        <h1 className="sr-only">Verein wählen</h1>

        {/* Suchfeld */}
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1">Verein suchen</label>
          <input
            className="w-full rounded-xl border px-3 py-2 bg-white/95 text-black placeholder:text-gray-500"
            placeholder='z. B. "SC Berlin"'
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="text-[11px] text-white/85 mt-1">
            Tippe, um passende Vereine zu finden. Exakte Duplikate sind nicht erlaubt.
          </div>
        </div>

        {/* Trefferliste */}
        <div className="rounded-xl border border-white/40 divide-y divide-white/20 bg-black/20 backdrop-blur-sm mb-3">
          {searching && (
            <div className="px-3 py-2 text-sm text-white/85">Suche…</div>
          )}
          {!searching && results.length === 0 && q.trim() && (
            <div className="px-3 py-2 text-sm text-white/85">Kein Verein gefunden.</div>
          )}
          {!searching && results.map((c) => (
            <button
              key={c.id}
              onClick={() => chooseClub(c.id)}
              className="w-full text-left px-3 py-2 hover:bg-white/10"
            >
              <div className="text-sm font-medium text-white">{c.name}</div>
              <div className="text-xs text-white/85">
                {[c.street, c.zip, c.city].filter(Boolean).join(', ') || '—'}
              </div>
              <div className="text-[11px] text-white/80 mt-1">
                {c.hasTeams ? 'hat Mannschaften' : 'keine Mannschaften'} • {c.hasVenues ? 'Spielstätten vorhanden' : 'keine Spielstätten'}
              </div>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/40" /></div>
          <div className="relative flex justify-center">
            <span className="bg-black/30 backdrop-blur-sm border border-white/30 rounded-md px-2 py-0.5 text-xs text-white/90">oder neuen Verein anlegen</span>
          </div>
        </div>

        {/* Neuanlage */}
        <button
          type="button"
          onClick={() => setCreateOpen(v => !v)}
          className="w-full rounded-xl border border-white/60 bg-white/10 backdrop-blur-sm px-3 py-2 text-left"
        >
          {createOpen ? '− Formular ausblenden' : '+ Neuen Verein anlegen'}
        </button>

        {createOpen && (
          <form onSubmit={createClub} className="space-y-3 mt-3">
            <div>
              <label className="block text-xs font-medium mb-1">Vereinsname</label>
              <input
                className={cls(
                  'w-full rounded-xl border px-3 py-2 bg-white/95 text-black placeholder:text-gray-500',
                  duplicateExists && 'border-red-400 ring-1 ring-red-400/60'
                )}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. SC Berlin Mitte"
                required
              />
              {duplicateExists && (
                <p className="mt-1 text-[12px] text-white bg-red-700/90 border border-red-400/70 rounded-md px-2 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                  Diesen Namen gibt es bereits. Bitte oben in der Liste auswählen.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Straße</label>
                <input className="w-full rounded-xl border px-3 py-2 bg-white/95 text-black" value={street} onChange={e=>setStreet(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">PLZ</label>
                <input className="w-full rounded-xl border px-3 py-2 bg-white/95 text-black" value={zip} onChange={e=>setZip(e.target.value)} inputMode="numeric" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Ort</label>
              <input className="w-full rounded-xl border px-3 py-2 bg-white/95 text-black" value={city} onChange={e=>setCity(e.target.value)} />
            </div>

            {/* Logo-Upload (JPG/PNG) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Vereinslogo (JPG/PNG)</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={(e) => {
                    const f = e.currentTarget.files?.[0] || null
                    if (f) {
                      const MAX_BYTES = 5 * 1024 * 1024
                      if (f.size > MAX_BYTES) {
                        setError('Das Logo ist zu groß (max. 5 MB). Bitte eine kleinere Datei wählen.')
                        e.currentTarget.value = ''
                        setLogoFile(null)
                        return
                      }
                      // evtl. alte Fehlermeldung zurücksetzen
                      setError(null)
                    }
                    setLogoFile(f)
                  }}
                  className="w-full rounded-xl border px-3 py-2 bg-white/95 text-black file:mr-3 file:rounded-lg file:border file:px-3 file:py-1 file:bg-white/80 file:text-black"
                />
                <p className="text-[11px] text-white/85 mt-1">Optional. Empfohlenes Seitenverhältnis ~1:1, max. 5 MB.</p>
              </div>
              <div className="flex items-end">
                <div className="flex flex-col items-center gap-1">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo-Vorschau"
                      className="w-16 h-16 rounded-lg object-cover border border-white/40 bg-white/70"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-[11px] text-white/70">
                      Vorschau
                    </div>
                  )}
                  {uploadingLogo && (
                    <span className="text-[11px] text-white/85">lade hoch…</span>
                  )}
                </div>
              </div>
            </div>

            {/* Spielstätten */}
            <div className="mt-4 rounded-xl border border-white/30 bg-black/20 backdrop-blur-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Spielstätte(n)</h3>
                <button
                  type="button"
                  onClick={addVenue}
                  className="text-xs underline underline-offset-2 decoration-white/70 hover:decoration-white"
                >
                  + weitere Spielstätte anlegen
                </button>
              </div>

              <div className="space-y-4">
                {venues.map((v, idx) => (
                  <div key={idx} className="rounded-lg border border-white/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1">Spielstätte</label>
                        <input
                          className="w-full rounded-xl border px-3 py-2 bg-white/95 text-black placeholder:text-gray-500"
                          value={v.name}
                          onChange={e => updateVenue(idx, { name: e.target.value })}
                          placeholder="z. B. Jugend-Sportanlage"
                        />
                      </div>
                      {venues.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVenue(idx)}
                          className="text-xs text-white/80 hover:text-white px-2 py-1 rounded-md border border-white/30 bg-white/10"
                          title="Spielstätte entfernen"
                        >
                          Entfernen
                        </button>
                      )}
                    </div>

                    <label className="mt-3 flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={v.useAltAddress}
                        onChange={e => updateVenue(idx, { useAltAddress: e.target.checked })}
                      />
                      <span>abweichende Adresse</span>
                    </label>

                    {v.useAltAddress && (
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium mb-1">Straße</label>
                          <input
                            className="w-full rounded-xl border px-3 py-2 bg-white/95 text-black"
                            value={v.street}
                            onChange={e => updateVenue(idx, { street: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">PLZ</label>
                          <input
                            className="w-full rounded-xl border px-3 py-2 bg-white/95 text-black"
                            value={v.zip}
                            inputMode="numeric"
                            onChange={e => updateVenue(idx, { zip: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Ort</label>
                          <input
                            className="w-full rounded-xl border px-3 py-2 bg-white/95 text-black"
                            value={v.city}
                            onChange={e => updateVenue(idx, { city: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/70 bg-red-700/90 text-white px-3 py-2 text-sm shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!name.trim() || duplicateExists}
              className="w-full rounded-xl bg-[#D04D2E] text-white px-4 py-2"
            >
              Anlegen & weiter
            </button>
          </form>
        )}
      </div>
    </main>
  )
}