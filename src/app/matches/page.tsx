'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  ownerId?: string | null
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

function MatchBurgerMenu({
  offerId,
  ownerId,
  isSaved,
  isRequested,
  onToggleSave,
  onToggleRequest,
  onContact,
}: {
  offerId: string
  ownerId: string | null
  isSaved: boolean
  isRequested: boolean
  onToggleSave: () => void
  onToggleRequest: () => void
  onContact: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  return (
    <div className="absolute bottom-3 right-3 z-20" ref={menuRef}>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setMenuOpen(!menuOpen)
        }}
        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center transition"
        aria-label="Menü"
      >
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="5" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="15" r="1.5" />
        </svg>
      </button>

      {menuOpen && (
        <div 
          className="absolute right-0 bottom-full mb-2 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/40 py-2 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(false)
              onToggleSave()
            }}
            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition flex items-center gap-3 border-b border-gray-100"
          >
            <span className="text-lg">{isSaved ? '★' : '☆'}</span>
            <span className="font-medium">{isSaved ? 'Nicht mehr merken' : 'Merken'}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(false)
              onToggleRequest()
            }}
            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition flex items-center gap-3 border-b border-gray-100"
          >
            <span className="text-lg">{isRequested ? '↩︎' : '📨'}</span>
            <span className="font-medium">{isRequested ? 'Anfrage zurückziehen' : 'Anfragen'}</span>
          </button>

          {ownerId && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(false)
                onContact()
              }}
              className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition flex items-center gap-3"
            >
              <span className="text-lg">📧</span>
              <span className="font-medium">Trainer kontaktieren</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function MatchesPage() {
  const router = useRouter()
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

  async function handleContactTrainer(ownerId: string) {
    if (!ownerId) return

    try {
      const res = await fetch(`/api/messaging/find-conversation?userId=${encodeURIComponent(ownerId)}`)
      const data = await res.json()

      if (res.ok) {
        if (data.exists) {
          router.push(`/chat/${data.conversationId}`)
        } else {
          router.push(`/chat?newConversation=${ownerId}`)
        }
      }
    } catch (e: any) {
      console.error('Contact trainer failed:', e)
      alert('Fehler beim Öffnen der Konversation')
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
    <main className="relative min-h-screen pt-12">
      {/* Dezent überlagerter Seitenhintergrund */}
      <BackgroundImage src="/back2.jpg" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🔎</span>
            <span>Matches</span>
          </h1>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 border border-white/60 hover:bg-white/30 transition"
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

        {/* Stats */}
        <div className="mb-4 text-sm text-white/85">
          {loading ? 'Lade …' : `${items.length} Treffer`}
        </div>

        {/* Content */}
        {loading && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-white/80">Lade...</div>
          </div>
        )}
        {error && (
          <div className="glass-card rounded-2xl p-8 text-center border-red-400/60 bg-red-500/15">
            <div className="text-red-300">{error}</div>
          </div>
        )}

        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.id} className="glass-card relative">
              <MatchCard 
                clubName={it.clubName}
                ageLabel={it.ageLabel}
                year={it.year}
                date={it.date}
                kickoffTime={it.kickoffTime}
                kickoffFlexible={it.kickoffFlexible}
                homeAway={it.homeAway}
                notes={it.notes}
                playTime={it.playTime}
                strengthLabel={it.strengthLabel}
                address={it.address}
                logoUrl={it.logoUrl}
                isSaved={isSaved(it.id)}
                isRequested={isRequested(it.id)}
              />
              
              {/* Burger-Menü */}
              <MatchBurgerMenu
                offerId={it.id}
                ownerId={it.ownerId ?? null}
                isSaved={isSaved(it.id)}
                isRequested={isRequested(it.id)}
                onToggleSave={() => toggleSave(it.id)}
                onToggleRequest={() => toggleRequest(it.id)}
                onContact={() => { if (it.ownerId) handleContactTrainer(it.ownerId) }}
              />
            </div>
          ))}

          {!loading && !error && items.length === 0 && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="text-white/90">Keine Angebote gefunden.</div>
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