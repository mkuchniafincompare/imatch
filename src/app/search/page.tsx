'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

/** Altersklassen U6–U19 (Mehrfachauswahl) */
const ALL_AGES = Array.from({ length: 14 }, (_, i) => `U${i + 6}`) as const
type Age = typeof ALL_AGES[number]

/** Enums / Labels wie in der API */
type HomeAway = 'HOME' | 'AWAY' | 'FLEX'
type PlayForm = 'FUNINO' | 'FUSSBALL_4' | 'FUSSBALL_5' | 'FUSSBALL_7' | 'NEUN_GEGEN_NEUN' | 'ELF_GEGEN_ELF'
const PLAYFORM_LABEL: Record<PlayForm, string> = {
  FUNINO: 'Funino',
  FUSSBALL_4: 'Fußball 4',
  FUSSBALL_5: 'Fußball 5',
  FUSSBALL_7: 'Fußball 7',
  NEUN_GEGEN_NEUN: '9 vs. 9',
  ELF_GEGEN_ELF: '11 vs. 11',
}
const PLAYFORM_OPTIONS: PlayForm[] = [
  'FUNINO','FUSSBALL_4','FUSSBALL_5','FUSSBALL_7','NEUN_GEGEN_NEUN','ELF_GEGEN_ELF'
]

/** Spielstärke – vollständige Ordnung (für Spanne min/max) */
type Strength =
  | 'SEHR_SCHWACH' | 'SCHWACH' | 'NORMAL' | 'STARK' | 'SEHR_STARK'
  | 'GRUPPE' | 'KREISKLASSE' | 'KREISLIGA' | 'BEZIRKSOBERLIGA' | 'FOERDERLIGA' | 'NLZ_LIGA'
  | 'BAYERNLIGA' | 'REGIONALLIGA'
const STRENGTH_ORDER: Strength[] = [
  'SEHR_SCHWACH','SCHWACH','NORMAL','STARK','SEHR_STARK',
  'GRUPPE','KREISKLASSE','KREISLIGA','BEZIRKSOBERLIGA','FOERDERLIGA','NLZ_LIGA',
  'BAYERNLIGA','REGIONALLIGA'
]
const STRENGTH_LABEL: Record<Strength,string> = {
  SEHR_SCHWACH:'sehr schwach', SCHWACH:'schwach', NORMAL:'normal', STARK:'stark', SEHR_STARK:'sehr stark',
  GRUPPE:'Gruppe', KREISKLASSE:'Kreisklasse', KREISLIGA:'Kreisliga', BEZIRKSOBERLIGA:'Bezirksoberliga',
  FOERDERLIGA:'Förderliga', NLZ_LIGA:'NLZ-Liga', BAYERNLIGA:'Bayernliga', REGIONALLIGA:'Regionalliga'
}

function cls(...xs:(string|false|undefined)[]) { return xs.filter(Boolean).join(' ') }

export default function SearchPage() {
  const router = useRouter()

  // Altersklassen (Mehrfach)
  const [selectedAges, setSelectedAges] = useState<Age[]>([])

  // Ort & Radius
  const [zipcode, setZipcode] = useState('')
  const [city, setCity] = useState('')
  const [radiusKm, setRadiusKm] = useState('')

  // Datum/Zeit
  const [dateFrom, setDateFrom] = useState('') // yyyy-mm-dd
  const [dateTo, setDateTo]     = useState('')
  const [timeFrom, setTimeFrom] = useState('') // HH:mm (optional)
  const [timeTo, setTimeTo]     = useState('')

  // Spielort & Spielform (Mehrfach)
  const [homeAway, setHomeAway] = useState<HomeAway | ''>('')
  const [playForms, setPlayForms] = useState<PlayForm[]>([])

  // Spielstärke-Spanne
  const [strengthMin, setStrengthMin] = useState<Strength | ''>('')
  const [strengthMax, setStrengthMax] = useState<Strength | ''>('')

  // Hilfsfunktionen
  function toggleAge(age: Age) {
    setSelectedAges(prev => prev.includes(age) ? prev.filter(a=>a!==age) : [...prev, age])
  }
  function togglePlayForm(pf: PlayForm) {
    setPlayForms(prev => prev.includes(pf) ? prev.filter(p=>p!==pf) : [...prev, pf])
  }

  // Min/Max logisch einschränken (optional Komfort)
  const strengthMaxOptions = useMemo(() => {
    if (!strengthMin) return STRENGTH_ORDER
    const idx = STRENGTH_ORDER.indexOf(strengthMin)
    return STRENGTH_ORDER.slice(idx)
  }, [strengthMin])

  const strengthMinOptions = useMemo(() => {
    if (!strengthMax) return STRENGTH_ORDER
    const idx = STRENGTH_ORDER.indexOf(strengthMax)
    return STRENGTH_ORDER.slice(0, idx+1)
  }, [strengthMax])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const sp = new URLSearchParams()

    if (selectedAges.length) sp.set('ages', selectedAges.join(','))
    if (zipcode) sp.set('zipcode', zipcode)
    if (city) sp.set('city', city)
    if (radiusKm) sp.set('radiusKm', radiusKm)

    if (dateFrom) sp.set('dateFrom', dateFrom)
    if (dateTo)   sp.set('dateTo', dateTo)
    if (timeFrom) sp.set('timeFrom', timeFrom)
    if (timeTo)   sp.set('timeTo', timeTo)

    if (homeAway) sp.set('homeAway', homeAway)
    if (playForms.length) sp.set('playForms', playForms.join(','))

    if (strengthMin) sp.set('strengthMin', strengthMin)
    if (strengthMax) sp.set('strengthMax', strengthMax)

    const qs = sp.toString()
    router.push(`/matches${qs ? `?${qs}` : ''}`)
  }

  function reset() {
    setSelectedAges([])
    setZipcode(''); setCity(''); setRadiusKm('')
    setDateFrom(''); setDateTo(''); setTimeFrom(''); setTimeTo('')
    setHomeAway(''); setPlayForms([])
    setStrengthMin(''); setStrengthMax('')
  }

  return (
    <main className="min-h-dvh bg-white text-gray-900 p-4">
      <h1 className="text-lg font-semibold mb-3">Suchen</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Altersklassen (Mehrfach) */}
        <div>
          <label className="block text-xs font-medium mb-2">Altersklassen</label>
          <div className="flex flex-wrap gap-2">
            {ALL_AGES.map(age => (
              <button
                key={age}
                type="button"
                onClick={() => toggleAge(age)}
                className={cls(
                  'px-3 py-1 rounded-full border text-sm',
                  selectedAges.includes(age) ? 'bg-black text-white border-black' : 'bg-white text-gray-800'
                )}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        {/* Ort & Radius (PLZ/Ort statt lat/lng) */}
        <div>
          <label className="block text-xs font-medium mb-2">Ort & Radius</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <input
                placeholder="PLZ"
                className="w-full rounded-xl border px-3 py-2"
                value={zipcode} onChange={e=>setZipcode(e.target.value)}
                inputMode="numeric" maxLength={5}
              />
            </div>
            <div className="col-span-2">
              <input
                placeholder="Ort (z. B. Berlin)"
                className="w-full rounded-xl border px-3 py-2"
                value={city} onChange={e=>setCity(e.target.value)}
              />
            </div>
            <div className="col-span-3">
              <input
                placeholder="Radius in km (z. B. 60)"
                className="w-full rounded-xl border px-3 py-2"
                value={radiusKm} onChange={e=>setRadiusKm(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>
        </div>

        {/* Datum & optionale Zeit (von–bis) */}
        <div>
          <label className="block text-xs font-medium mb-2">Zeitraum</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="block text-[11px] mb-1">Datum von</span>
              <input type="date" className="w-full rounded-xl border px-3 py-2"
                value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
            </div>
            <div>
              <span className="block text-[11px] mb-1">Datum bis</span>
              <input type="date" className="w-full rounded-xl border px-3 py-2"
                value={dateTo} onChange={e=>setDateTo(e.target.value)} />
            </div>
            <div>
              <span className="block text-[11px] mb-1">Zeit von (optional)</span>
              <input type="time" className="w-full rounded-xl border px-3 py-2"
                value={timeFrom} onChange={e=>setTimeFrom(e.target.value)} />
            </div>
            <div>
              <span className="block text-[11px] mb-1">Zeit bis (optional)</span>
              <input type="time" className="w-full rounded-xl border px-3 py-2"
                value={timeTo} onChange={e=>setTimeTo(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Spielort & Spielform (Mehrfach) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Spielort</label>
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={homeAway} onChange={e=>setHomeAway(e.target.value as HomeAway | '')}
            >
              <option value="">– egal –</option>
              <option value="HOME">Heimspiel</option>
              <option value="AWAY">Auswärtsspiel</option>
              <option value="FLEX">Heim- oder Auswärtsspiel</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Spielform (Mehrfach)</label>
            <div className="grid grid-cols-2 gap-2">
              {PLAYFORM_OPTIONS.map(p => (
                <label key={p} className="inline-flex items-center gap-2 text-xs border rounded-lg px-2 py-1">
                  <input
                    type="checkbox"
                    checked={playForms.includes(p)}
                    onChange={() => togglePlayForm(p)}
                  />
                  {PLAYFORM_LABEL[p]}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Spielstärke (Spanne) */}
        <div>
          <label className="block text-xs font-medium mb-1">Spielstärke (von–bis)</label>
          <div className="grid grid-cols-2 gap-3">
            <select className="w-full rounded-xl border px-3 py-2"
              value={strengthMin} onChange={e=>setStrengthMin((e.target.value||'') as Strength| '')}
            >
              <option value="">– mind. –</option>
              {strengthMinOptions.map(s => <option key={s} value={s}>{STRENGTH_LABEL[s]}</option>)}
            </select>
            <select className="w-full rounded-xl border px-3 py-2"
              value={strengthMax} onChange={e=>setStrengthMax((e.target.value||'') as Strength| '')}
            >
              <option value="">– max. –</option>
              {strengthMaxOptions.map(s => <option key={s} value={s}>{STRENGTH_LABEL[s]}</option>)}
            </select>
          </div>
        </div>

        {/* Aktionen */}
        <div className="flex gap-2">
          <button type="submit" className="flex-1 rounded-xl bg-black text-white px-4 py-2">
            Suchen
          </button>
          <button type="button" onClick={reset} className="rounded-xl border px-4 py-2">
            Reset
          </button>
        </div>
      </form>
    </main>
  )
}