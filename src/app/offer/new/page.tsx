'use client'

import { useEffect, useMemo, useState } from 'react'

type Team = {
  id: string
  ageGroup: string
  level: string
  club: string | null
  city: string | null
}

// U6–U19
const ALL_AGES = Array.from({ length: 14 }, (_, i) => `U${i + 6}`) as const
type Age = typeof ALL_AGES[number]

// Enums (Server erwartet diese Werte)
type HomeAway = 'HOME' | 'AWAY' | 'FLEX'
type FieldType = 'FIELD' | 'TURF' | 'HALL'
type Strength =
  | 'SEHR_SCHWACH' | 'SCHWACH' | 'NORMAL' | 'STARK' | 'SEHR_STARK'
  | 'GRUPPE' | 'KREISKLASSE' | 'KREISLIGA' | 'BEZIRKSOBERLIGA' | 'FOERDERLIGA' | 'NLZ_LIGA'
  | 'BAYERNLIGA' | 'REGIONALLIGA'
type PlayForm = 'FUNINO' | 'FUSSBALL_4' | 'FUSSBALL_5' | 'FUSSBALL_7' | 'NEUN_GEGEN_NEUN' | 'ELF_GEGEN_ELF'

// Labels <-> Enum
const FIELD_TYPE_LABEL: Record<FieldType, string> = { FIELD: 'Rasen', TURF: 'Kunstrasen', HALL: 'Halle' }
const PLAYFORM_LABEL: Record<PlayForm, string> = {
  FUNINO: 'Funino',
  FUSSBALL_4: 'Fußball 4',
  FUSSBALL_5: 'Fußball 5',
  FUSSBALL_7: 'Fußball 7',
  NEUN_GEGEN_NEUN: '9 vs. 9',
  ELF_GEGEN_ELF: '11 vs. 11',
}
const PLAYFORM_OPTIONS: PlayForm[] = [
  'FUNINO', 'FUSSBALL_4', 'FUSSBALL_5', 'FUSSBALL_7', 'NEUN_GEGEN_NEUN', 'ELF_GEGEN_ELF',
]

// Spielstärke je Altersbereich
const STRENGTH_LABEL: Record<Strength, string> = {
  SEHR_SCHWACH: 'sehr schwach',
  SCHWACH: 'schwach',
  NORMAL: 'normal',
  STARK: 'stark',
  SEHR_STARK: 'sehr stark',
  GRUPPE: 'Gruppe',
  KREISKLASSE: 'Kreisklasse',
  KREISLIGA: 'Kreisliga',
  BEZIRKSOBERLIGA: 'Bezirksoberliga',
  FOERDERLIGA: 'Förderliga',
  NLZ_LIGA: 'NLZ-Liga',
  BAYERNLIGA: 'Bayernliga',
  REGIONALLIGA: 'Regionalliga',
}
const STRENGTH_U6_U11: Strength[] = ['SEHR_SCHWACH','SCHWACH','NORMAL','STARK','SEHR_STARK']
const STRENGTH_U12_U13: Strength[] = ['GRUPPE','KREISKLASSE','KREISLIGA','BEZIRKSOBERLIGA','FOERDERLIGA','NLZ_LIGA']
const STRENGTH_U14_UP: Strength[] = [...STRENGTH_U12_U13, 'BAYERNLIGA','REGIONALLIGA']

function minAgeNumeric(ages: Age[]) {
  if (!ages.length) return 19
  return Math.min(...ages.map(a => Number(a.slice(1))))
}
function mergedStrengthOptions(selectedAges: Age[]): Strength[] {
  if (!selectedAges.length) return STRENGTH_U6_U11
  const minAge = minAgeNumeric(selectedAges)
  if (minAge <= 11) return STRENGTH_U6_U11
  if (minAge <= 13) return STRENGTH_U12_U13
  return STRENGTH_U14_UP
}

function cls(...xs: (string | false | undefined)[]) { return xs.filter(Boolean).join(' ') }

export default function NewOfferPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [teamId, setTeamId] = useState('')
  const [selectedAges, setSelectedAges] = useState<Age[]>([]) // Mehrfach
  const [offerDate, setOfferDate] = useState('')              // yyyy-mm-dd
  const [kickoffTime, setKickoffTime] = useState('')          // HH:mm
  const [kickoffFlexible, setKickoffFlexible] = useState(false)
  const [homeAway, setHomeAway] = useState<HomeAway>('FLEX')
  const [fieldType, setFieldType] = useState<FieldType>('FIELD')
  const [playForm, setPlayForm] = useState<PlayForm | ''>('')
  const [strength, setStrength] = useState<Strength | ''>('')
  const [durationText, setDurationText] = useState('')
  const [notes, setNotes] = useState('')

  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Teams laden & Defaults (erste Team-Altersklasse vorauswählen)
  useEffect(() => {
    fetch('/api/team').then(r => r.json()).then(d => {
      const items: Team[] = d.items ?? []
      setTeams(items)
      if (items.length > 0) {
        setTeamId(items[0].id)
        const ag = items[0].ageGroup as Age
        if (ALL_AGES.includes(ag)) setSelectedAges([ag])
      }
    })
  }, [])

  const strengthOptions = useMemo(() => mergedStrengthOptions(selectedAges), [selectedAges])

  function toggleAge(age: Age) {
    setSelectedAges(prev => prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age])
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setLoading(true)
    try {
      if (!teamId) throw new Error('Kein Team gewählt')
      if (!selectedAges.length) throw new Error('Mindestens eine Altersklasse wählen')
      if (!offerDate) throw new Error('Bitte Datum wählen')
      if (!kickoffFlexible && !kickoffTime) throw new Error('Bitte Anstoßzeit setzen oder „flexibel“ wählen')

      const res = await fetch('/api/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          ages: selectedAges,
          offerDate,                 // "yyyy-mm-dd" ist ok (Server parst robust)
          kickoffTime: kickoffFlexible ? null : kickoffTime,
          kickoffFlexible,
          strength: strength || null,
          playForm: playForm || null,
          durationText: durationText || null,
          homeAway,
          fieldType,
          notes: notes || null,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const created = await res.json()
      setMsg(`Angebot erstellt (ID: ${created.id})`)
      // optional felder zurücksetzen
      setNotes('')
    } catch (err: any) {
      setMsg(`Fehler: ${err?.message ?? 'unbekannt'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh bg-white text-gray-900 p-4">
      <h1 className="text-lg font-semibold mb-3">Neues Angebot</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Team (nur Vereinsname) */}
        <div>
          <label className="block text-xs font-medium mb-1">Team</label>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={teamId}
            onChange={e => {
              const id = e.target.value
              setTeamId(id)
              // Standard-Altersklasse vom Team als Vorauswahl (anhängen, wenn leer)
              const t = teams.find(tt => tt.id === id)
              if (t) {
                const ag = t.ageGroup as Age
                if (ALL_AGES.includes(ag) && selectedAges.length === 0) {
                  setSelectedAges([ag])
                }
              }
            }}
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>
                {t.club ?? 'Verein'}
              </option>
            ))}
          </select>
        </div>

        {/* Altersklassen (Mehrfach / Chips) */}
        <div>
          <label className="block text-xs font-medium mb-2">Altersklasse</label>
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
          <p className="text-[11px] text-gray-500 mt-1">Mehrfachauswahl möglich (z. B. U12 & U13).</p>
        </div>

        {/* Datum & Anstoß */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Datum</label>
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2"
              value={offerDate}
              onChange={e => setOfferDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Anstoß</label>
            <input
              type="time"
              className="w-full rounded-xl border px-3 py-2"
              value={kickoffTime}
              onChange={e => setKickoffTime(e.target.value)}
              disabled={kickoffFlexible}
            />
            <label className="mt-1 inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={kickoffFlexible}
                onChange={e => setKickoffFlexible(e.target.checked)}
              />
              flexibel nach Vereinbarung
            </label>
          </div>
        </div>

        {/* Spielstärke (abhängig von gewählten Altersklassen) */}
        <div>
          <label className="block text-xs font-medium mb-1">Spielstärke</label>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={strength}
            onChange={e => setStrength((e.target.value || '') as Strength | '')}
          >
            <option value="">–</option>
            {strengthOptions.map(s => (
              <option key={s} value={s}>{STRENGTH_LABEL[s]}</option>
            ))}
          </select>
        </div>

        {/* Spielort & Spielfeld */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Spielort</label>
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={homeAway}
              onChange={e => setHomeAway(e.target.value as HomeAway)}
            >
              <option value="HOME">Heimspiel</option>
              <option value="AWAY">Auswärtsspiel</option>
              <option value="FLEX">Heim- oder Auswärtsspiel</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Spielfeld</label>
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={fieldType}
              onChange={e => setFieldType(e.target.value as FieldType)}
            >
              {(['FIELD','TURF','HALL'] as FieldType[]).map(ft => (
                <option key={ft} value={ft}>{FIELD_TYPE_LABEL[ft]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Spielform & Spielzeit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Spielform</label>
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={playForm}
              onChange={e => setPlayForm((e.target.value || '') as PlayForm | '')}
            >
              <option value="">–</option>
              {PLAYFORM_OPTIONS.map(p => (
                <option key={p} value={p}>{PLAYFORM_LABEL[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Spielzeit (Freitext)</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="z. B. 2×30 Min"
              value={durationText}
              onChange={e => setDurationText(e.target.value)}
            />
          </div>
        </div>

        {/* Notizen */}
        <div>
          <label className="block text-xs font-medium mb-1">Notizen</label>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-black text-white px-4 py-2">
          {loading ? 'Speichere…' : 'Angebot erstellen'}
        </button>

        {msg && <p className="text-sm mt-2">{msg}</p>}
      </form>
    </main>
  )
}