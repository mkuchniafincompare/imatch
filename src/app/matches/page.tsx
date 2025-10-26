'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import MatchCard from '@/components/MatchCard'
import BackgroundImage from '@/components/BackgroundImage'
import FilterChip from '@/components/FilterChip'
import FiltersDrawer, { type FiltersState } from '@/components/FiltersDrawer'

type OfferItem = {
  id: string
  clubName: string
  ageLabel: string
  year?: number | null
  date?: string | null           // "YYYY-MM-DD"
  kickoffTime?: string | null    // "HH:mm"
  kickoffFlexible?: boolean
  homeAway: 'HOME' | 'AWAY' | 'FLEX'
  notes?: string | null
  playTime?: string | null
  strengthLabel?: string | null
  address?: string | null
  logoUrl?: string | null
}

type HomeAway = 'HOME' | 'AWAY' | 'FLEX' | null

function countActiveFilters(state: {
  ages?: string[];
  strengthMin?: any;
  strengthMax?: any;
  homeAway?: any;
  dateFrom?: string | null;
  dateTo?: string | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  playForms?: any[];
  zipcode?: string | null;
  city?: string | null;
  radiusKm?: number | null;
}) {
  {
    let n = 0
    // Home/Away
    if (state.homeAway) n++
    // Ages as one
    if (state.ages && state.ages.length) n++
    // Play forms as one
    if (state.playForms && state.playForms.length) n++
    // Strength group (min/max together)
    const hasStrength = Boolean(state.strengthMin) || Boolean(state.strengthMax)
    if (hasStrength) n++
    // Date/Time group (any of them -> one)
    const hasDateTime =
      Boolean(state.dateFrom) || Boolean(state.dateTo) ||
      Boolean(state.timeFrom) || Boolean(state.timeTo)
    if (hasDateTime) n++
    // Location group (zipcode/city/radius -> one)
    const hasLocation =
      Boolean(state.zipcode) || Boolean(state.city) ||
      (typeof state.radiusKm === 'number' && state.radiusKm > 0)
    if (hasLocation) n++
    return n
  }
}

function isPristineFilters(f: FiltersState, ha: HomeAway) {
  const nothingSet =
    (!ha) &&
    (!f.homeAway) &&
    (!f.ages || f.ages.length === 0) &&
    (!f.playForms || f.playForms.length === 0) &&
    !f.strengthMin &&
    !f.strengthMax &&
    !f.dateFrom &&
    !f.dateTo &&
    !f.timeFrom &&
    !f.timeTo &&
    !f.zipcode &&
    !f.city &&
    !(typeof f.radiusKm === 'number' && f.radiusKm > 0)
  return nothingSet
}

export default function MatchesPage() {
  const [items, setItems] = useState<OfferItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // per-offer UI state
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [requested, setRequested] = useState<Set<string>>(new Set())

  function isSaved(id: string) { return saved.has(id) }
  function isRequested(id: string) { return requested.has(id) }

  async function toggleSave(offerId: string) {
    // optimistic
    const next = new Set(saved)
    const willSave = !next.has(offerId)
    if (willSave) next.add(offerId); else next.delete(offerId)
    setSaved(next)
    try {
      const res = await fetch(`/api/saved-offers`, {
        method: willSave ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      })
      if (!res.ok) throw new Error('Server error')
    } catch {
      // revert on error
      const revert = new Set(next)
      if (willSave) revert.delete(offerId); else revert.add(offerId)
      setSaved(revert)
    }
  }

  async function toggleRequest(offerId: string) {
    const willRequest = !requested.has(offerId)
    // optimistic toggle
    const next = new Set(requested)
    if (willRequest) next.add(offerId)
    else next.delete(offerId)
    setRequested(next)
    try {
      const res = await fetch(`/api/requests`, {
        method: willRequest ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      })
      if (!res.ok) throw new Error('Server error')
    } catch {
      // revert on error
      const revert = new Set(next)
      if (willRequest) revert.delete(offerId)
      else revert.add(offerId)
      setRequested(revert)
    }
  }

  // Quick filter state (Top-Chips)
  const [homeAway, setHomeAway] = useState<HomeAway>(null)

  // Full filters (Drawer)
  const [filters, setFilters] = useState<FiltersState>({
    ages: [],
    strengthMin: null,
    strengthMax: null,
    homeAway: null,
    dateFrom: null,
    dateTo: null,
    timeFrom: null,
    timeTo: null,
    playForms: [],
    zipcode: null,
    city: null,
    radiusKm: null,
  })

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false)

  // apply defaults from user's standard team only once and only if filters are pristine
  const defaultsAppliedRef = useRef(false)

  useEffect(() => {
    if (defaultsAppliedRef.current) return
    if (!isPristineFilters(filters, homeAway)) {
      defaultsAppliedRef.current = true
      return
    }
    ;(async () => {
      try {
        const res = await fetch('/api/profile/defaults', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.defaults) {
          defaultsAppliedRef.current = true
          return
        }
        const d = data.defaults as {
          ageGroup?: string | null
          preferredForm?: string | null
          city?: string | null
          zip?: string | null
        }
        const next: FiltersState = {
          ...filters,
          ages: d.ageGroup ? [d.ageGroup] : [],
          playForms: d.preferredForm ? [d.preferredForm as any] : [],
          city: d.city || null,
          zipcode: d.zip || null,
          radiusKm: 25,
          // keep other fields empty
          homeAway: null,
          strengthMin: null,
          strengthMax: null,
          dateFrom: null,
          dateTo: null,
          timeFrom: null,
          timeTo: null,
        }
        setFilters(next)
      } catch {
        // ignore — defaults are optional
      } finally {
        defaultsAppliedRef.current = true
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeCount = useMemo(() => {
    const merged = { ...filters, homeAway: homeAway ?? filters.homeAway }
    return countActiveFilters(merged)
  }, [filters, homeAway])

  // Build query string from filters
  const query = useMemo(() => {
    const usp = new URLSearchParams()
    // Prefer explicit top-chip homeAway; fallback to Drawer value
    const ha = homeAway ?? filters.homeAway
    if (ha) usp.set('homeAway', ha)

    if (filters.ages?.length) usp.set('ages', filters.ages.join(','))
    if (filters.strengthMin) usp.set('strengthMin', String(filters.strengthMin))
    if (filters.strengthMax) usp.set('strengthMax', String(filters.strengthMax))
    if (filters.dateFrom) usp.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) usp.set('dateTo', filters.dateTo)
    if (filters.timeFrom) usp.set('timeFrom', filters.timeFrom)
    if (filters.timeTo) usp.set('timeTo', filters.timeTo)
    if (filters.playForms?.length) usp.set('playForms', filters.playForms.join(','))
    if (filters.zipcode) usp.set('zipcode', filters.zipcode)
    if (filters.city) usp.set('city', filters.city)
    if (typeof filters.radiusKm === 'number' && !Number.isNaN(filters.radiusKm)) {
      usp.set('radiusKm', String(filters.radiusKm))
    }
    return usp.toString()
  }, [homeAway, filters])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const url = '/api/offer' + (query ? `?${query}` : '')
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (e: any) {
      setError(e?.message ?? 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  useEffect(() => {
    if (!items.length) return
    const ids = items.map(i => i.id).join(',')
    ;(async () => {
      try {
        const res = await fetch(`/api/saved-offers?ids=${encodeURIComponent(ids)}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (Array.isArray(data?.savedIds)) {
          setSaved(new Set(data.savedIds))
        }
      } catch {
        // ignore errors
      }
    })()
  }, [items])

    // Nachdem items geladen sind: bereits angefragte Offers markieren
  useEffect(() => {
    if (!items.length) return
    const ids = items.map(i => i.id).join(',')
    ;(async () => {
      try {
        const res = await fetch(`/api/requests?ids=${encodeURIComponent(ids)}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (Array.isArray(data?.requestedIds)) {
          setRequested(new Set(data.requestedIds))
        }
      } catch {
        // Ignorieren – UI bleibt funktionsfähig
      }
    })()
  }, [items])

  function toggleHomeAway(val: Exclude<HomeAway, null>) {
    setHomeAway((prev) => (prev === val ? null : val))
  }

  function resetAll() {
    setHomeAway(null)
    setFilters({
      ages: [],
      strengthMin: null,
      strengthMax: null,
      homeAway: null,
      dateFrom: null,
      dateTo: null,
      timeFrom: null,
      timeTo: null,
      playForms: [],
      zipcode: null,
      city: null,
      radiusKm: null,
    })
  }

  return (
    <main className="relative min-h-dvh text-white pt-12">
      {/* Dezent überlagerter Seitenhintergrund */}
      <BackgroundImage src="/back2.jpg" />

      {/* Fixed Top-Bar (unter App-Header) */}
      <div className="fixed top-12 left-0 right-0 z-20 px-3 pt-2 pb-2 bg-[#D04D2E]/90 backdrop-blur-md shadow-md">
        <div className="mx-auto max-w-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold leading-none">Matches</h1>
            </div>
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/20 border border-white/60 hover:bg-white/30 transition"
                aria-label="Filter"
              >
                <img
                  src="/filter.png"
                  alt="Filter"
                  className="w-5 h-5 object-contain"
                />
                {activeCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full px-[5px] py-[1px] leading-none">
                    {activeCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-white/85">
            {loading ? 'Lade …' : `${items.length} Treffer`}
          </div>
        </div>
      </div>
      <div className="h-16" />

      <div className="mx-auto max-w-sm px-3 pt-3 pb-2">
        {loading && (
          <div className="glass-card px-3 py-2 text-sm text-white/90">
            Lade …
          </div>
        )}
        {error && (
          <div className="glass-card border-red-400/60 bg-red-500/15 text-red-50 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-3">
          {items.map((it) => (
            <div key={it.id} className="glass-card overflow-hidden">
              <MatchCard {...it} />
              <div className="px-3 pb-3 pt-2 border-t border-white/15 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleSave(it.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    isSaved(it.id)
                      ? 'bg-white text-black'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  aria-pressed={isSaved(it.id)}
                >
                  <span className="text-base">{isSaved(it.id) ? '★' : '☆'}</span>
                  <span>{isSaved(it.id) ? 'Gemerkt' : 'Merken'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleRequest(it.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isRequested(it.id)
                      ? 'bg-red-600/20 text-red-100 border border-red-400 hover:bg-red-600/30'
                      : 'bg-[#D04D2E] hover:brightness-110 text-white'
                  }`}
                >
                  <span>{isRequested(it.id) ? '↩︎' : '📨'}</span>
                  <span>{isRequested(it.id) ? 'Anfrage zurückziehen' : 'Anfragen'}</span>
                </button>
              </div>
            </div>
          ))}

          {!loading && !error && items.length === 0 && (
            <div className="glass-card px-3 py-2 text-sm text-white/90">
              Keine Angebote gefunden.
            </div>
          )}
        </div>
      </div>

      {/* Drawer für volle Filter */}
      <FiltersDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initial={{ ...filters, homeAway }}
        onApply={(next) => {
          setFilters(next)
          setHomeAway(next.homeAway ?? null)
        }}
        onReset={resetAll}
      />
      
    </main>
  )
}