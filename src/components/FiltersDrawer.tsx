'use client'

import React from 'react'
import Drawer from '@/components/Drawer'
import FilterChip from '@/components/FilterChip'

// --- Types ------------------------------------------------------------
export type HomeAway = 'HOME' | 'AWAY' | 'FLEX' | null

export type Strength =
  | 'SEHR_SCHWACH' | 'SCHWACH' | 'NORMAL' | 'STARK' | 'SEHR_STARK'
  | 'GRUPPE' | 'KREISKLASSE' | 'KREISLIGA' | 'BEZIRKSOBERLIGA' | 'FOERDERLIGA' | 'NLZ_LIGA'
  | 'BAYERNLIGA' | 'REGIONALLIGA'

export type PlayForm =
  | 'FUNINO' | 'FUSSBALL_4' | 'FUSSBALL_5' | 'FUSSBALL_7' | 'NEUN_GEGEN_NEUN' | 'ELF_GEGEN_ELF'

export const ALL_AGES = Array.from({ length: 14 }, (_, i) => `U${i + 6}`) as const
export const STRENGTH_ORDER: Strength[] = [
  'SEHR_SCHWACH','SCHWACH','NORMAL','STARK','SEHR_STARK',
  'GRUPPE','KREISKLASSE','KREISLIGA','BEZIRKSOBERLIGA','FOERDERLIGA','NLZ_LIGA',
  'BAYERNLIGA','REGIONALLIGA',
]
export const PLAY_FORMS: PlayForm[] = [
  'FUNINO','FUSSBALL_4','FUSSBALL_5','FUSSBALL_7','NEUN_GEGEN_NEUN','ELF_GEGEN_ELF',
]

export type FiltersState = {
  ages: string[]
  strengthMin?: Strength | null
  strengthMax?: Strength | null
  homeAway: HomeAway
  dateFrom?: string | null
  dateTo?: string | null
  timeFrom?: string | null
  timeTo?: string | null
  playForms: PlayForm[]
  zipcode?: string | null
  city?: string | null
  radiusKm?: number | null
}

export type FiltersDrawerProps = {
  isOpen: boolean
  onClose: () => void
  initial: FiltersState
  onApply: (next: FiltersState) => void
  onReset?: () => void
}

function labelStrength(s?: Strength | null) {
  if (!s) return '—'
  const map: Record<Strength,string> = {
    SEHR_SCHWACH:'sehr schwach', SCHWACH:'schwach', NORMAL:'normal', STARK:'stark', SEHR_STARK:'sehr stark',
    GRUPPE:'Gruppe', KREISKLASSE:'Kreisklasse', KREISLIGA:'Kreisliga', BEZIRKSOBERLIGA:'Bezirksoberliga',
    FOERDERLIGA:'Förderliga', NLZ_LIGA:'NLZ-Liga', BAYERNLIGA:'Bayernliga', REGIONALLIGA:'Regionalliga',
  }
  return map[s]
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-white/70">{title}</h3>
      <div>{children}</div>
    </section>
  )
}

// --- Component --------------------------------------------------------
export default function FiltersDrawer({
  isOpen,
  onClose,
  initial,
  onApply,
  onReset,
}: FiltersDrawerProps) {
  const [ages, setAges] = React.useState<string[]>(initial.ages ?? [])
  const [homeAway, setHomeAway] = React.useState<HomeAway>(initial.homeAway ?? null)
  const [strengthMin, setStrengthMin] = React.useState<Strength | null>(initial.strengthMin ?? null)
  const [strengthMax, setStrengthMax] = React.useState<Strength | null>(initial.strengthMax ?? null)
  const [dateFrom, setDateFrom] = React.useState<string | null>(initial.dateFrom ?? null)
  const [dateTo, setDateTo] = React.useState<string | null>(initial.dateTo ?? null)
  const [timeFrom, setTimeFrom] = React.useState<string | null>(initial.timeFrom ?? null)
  const [timeTo, setTimeTo] = React.useState<string | null>(initial.timeTo ?? null)
  const [playForms, setPlayForms] = React.useState<PlayForm[]>(initial.playForms ?? [])
  const [zipcode, setZipcode] = React.useState<string | null>(initial.zipcode ?? null)
  const [city, setCity] = React.useState<string | null>(initial.city ?? null)
  const [radiusKm, setRadiusKm] = React.useState<number | null>(initial.radiusKm ?? null)

  React.useEffect(() => {
    if (!isOpen) return
    setAges(initial.ages ?? [])
    setHomeAway(initial.homeAway ?? null)
    setStrengthMin(initial.strengthMin ?? null)
    setStrengthMax(initial.strengthMax ?? null)
    setDateFrom(initial.dateFrom ?? null)
    setDateTo(initial.dateTo ?? null)
    setTimeFrom(initial.timeFrom ?? null)
    setTimeTo(initial.timeTo ?? null)
    setPlayForms(initial.playForms ?? [])
    setZipcode(initial.zipcode ?? null)
    setCity(initial.city ?? null)
    setRadiusKm(initial.radiusKm ?? null)
  }, [isOpen]) // absichtlich nur auf Open reagieren

  function toggleAge(a: string) {
    setAges(prev => (prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]))
  }
  function togglePlayForm(p: PlayForm) {
    setPlayForms(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]))
  }
  function apply() {
    onApply({
      ages,
      strengthMin,
      strengthMax,
      homeAway,
      dateFrom,
      dateTo,
      timeFrom,
      timeTo,
      playForms,
      zipcode,
      city,
      radiusKm,
    })
    onClose()
  }
  function reset() {
    onReset?.()
    setAges([])
    setHomeAway(null)
    setStrengthMin(null)
    setStrengthMax(null)
    setDateFrom(null)
    setDateTo(null)
    setTimeFrom(null)
    setTimeTo(null)
    setPlayForms([])
    setZipcode(null)
    setCity(null)
    setRadiusKm(null)
  }

  const strengthOptions = STRENGTH_ORDER

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Filter">
      <div className="space-y-6 text-white">
        <Section title="Spielort">
          <div className="flex gap-2 flex-wrap">
            <FilterChip
              active={homeAway === 'HOME'}
              onClick={() => setHomeAway(homeAway === 'HOME' ? null : 'HOME')}
            >
              Heim
            </FilterChip>
            <FilterChip
              active={homeAway === 'AWAY'}
              onClick={() => setHomeAway(homeAway === 'AWAY' ? null : 'AWAY')}
            >
              Auswärts
            </FilterChip>
          </div>
        </Section>

        <Section title="Altersklassen">
          <div className="flex gap-1.5 flex-wrap">
            {ALL_AGES.map((a) => (
              <FilterChip key={a} active={ages.includes(a)} onClick={() => toggleAge(a)}>
                {a}
              </FilterChip>
            ))}
          </div>
        </Section>

        <Section title="Spielstärke (Spanne)">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-white/70 mb-1">Min</label>
              <select
                className="w-full rounded-xl border border-white/25 bg-white/10 text-white px-3 py-2 [&>option]:bg-gray-800 [&>option]:text-white"
                value={strengthMin ?? ''}
                onChange={(e) => setStrengthMin((e.target.value || '') as Strength || null)}
              >
                <option value="">—</option>
                {strengthOptions.map((s) => (
                  <option key={s} value={s}>{labelStrength(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-white/70 mb-1">Max</label>
              <select
                className="w-full rounded-xl border border-white/25 bg-white/10 text-white px-3 py-2 [&>option]:bg-gray-800 [&>option]:text-white"
                value={strengthMax ?? ''}
                onChange={(e) => setStrengthMax((e.target.value || '') as Strength || null)}
              >
                <option value="">—</option>
                {strengthOptions.map((s) => (
                  <option key={s} value={s}>{labelStrength(s)}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-white/60">
            Optional: Wähle eine Unter- und Obergrenze. Nicht angegeben = kein Filter.
          </p>
        </Section>

        <Section title="Datum & Zeit">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-white/70 mb-1">Von (Datum)</label>
              <input
                type="date"
                className="w-full rounded-xl border border-white/25 bg-white/10 text-white px-3 py-2"
                value={dateFrom ?? ''}
                onChange={(e) => setDateFrom(e.target.value || null)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/70 mb-1">Bis (Datum)</label>
              <input
                type="date"
                className="w-full rounded-xl border border-white/25 bg-white/10 text-white px-3 py-2"
                value={dateTo ?? ''}
                onChange={(e) => setDateTo(e.target.value || null)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="block text-[11px] text-white/70 mb-1">Zeit: Von</label>
              <input
                type="time"
                className="w-full rounded-xl border border-white/25 bg-white/10 text-white px-3 py-2"
                value={timeFrom ?? ''}
                onChange={(e) => setTimeFrom(e.target.value || null)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/70 mb-1">Zeit: Bis</label>
              <input
                type="time"
                className="w-full rounded-xl border border-white/25 bg-white/10 text-white px-3 py-2"
                value={timeTo ?? ''}
                onChange={(e) => setTimeTo(e.target.value || null)}
              />
            </div>
          </div>
        </Section>

        <Section title="Spielform (Mehrfach)">
          <div className="flex gap-1.5 flex-wrap">
            {PLAY_FORMS.map((p) => (
              <FilterChip key={p} active={playForms.includes(p)} onClick={() => togglePlayForm(p)}>
                {p === 'FUNINO' ? 'Funino'
                  : p === 'FUSSBALL_4' ? 'Fußball 4'
                  : p === 'FUSSBALL_5' ? 'Fußball 5'
                  : p === 'FUSSBALL_7' ? 'Fußball 7'
                  : p === 'NEUN_GEGEN_NEUN' ? '9 vs. 9'
                  : '11 vs. 11'}
              </FilterChip>
            ))}
          </div>
        </Section>

        <Section title="Ort & Radius">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="block text-[11px] text-white/70 mb-1">PLZ</label>
              <input
                className="w-full rounded-xl border border-white/25 bg-white/10 text-white px-3 py-2 placeholder:text-white/40"
                value={zipcode ?? ''}
                onChange={(e) => setZipcode(e.target.value || null)}
                placeholder="z. B. 10115"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] text-white/70 mb-1">Ort</label>
              <input
                className="w-full rounded-xl border border-white/25 bg-white/10 text-white px-3 py-2 placeholder:text-white/40"
                value={city ?? ''}
                onChange={(e) => setCity(e.target.value || null)}
                placeholder="z. B. Berlin"
              />
            </div>
          </div>

          {/* Radius (Slider) */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] text-white/70">Radius (km)</label>
              <span className="text-[11px] text-white/85">
                {typeof radiusKm === 'number' ? `${radiusKm} km` : '—'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={250}
              step={5}
              value={typeof radiusKm === 'number' ? radiusKm : 0}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-[#D04D2E]"
            />
            <div className="flex justify-between text-[10px] text-white/60 mt-1">
              <span>0</span><span>125</span><span>250</span>
            </div>
          </div>
        </Section>

        <div className="h-px bg-white/15 my-2" />

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-white/40 text-white px-4 py-2 bg-white/10 hover:bg-white/15 transition text-sm"
          >
            Zurücksetzen
          </button>
          <div className="flex">
            <button
              type="button"
              onClick={apply}
              className="rounded-xl bg-[#D04D2E] text-white px-4 py-2 shadow-lg shadow-black/10 text-sm"
            >
              Filtern
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  )
}