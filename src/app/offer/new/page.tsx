'use client'

import { useEffect, useMemo, useState } from 'react'
import BackgroundImage from '@/components/BackgroundImage'

type Team = {
  id: string
  ageGroup: string
  level: string
  club: string | null
  city: string | null
}

const ALL_AGES = ['U6','U7','U8','U9','U10','U11','U12','U13','U14','U15','U16','U17','U18','U19'] as const
type Age = typeof ALL_AGES[number]

type HomeAway = 'HOME' | 'AWAY' | 'FLEX'
type FieldType = 'FIELD' | 'TURF' | 'HALL'
type Strength =
  | 'SEHR_SCHWACH' | 'SCHWACH' | 'NORMAL' | 'STARK' | 'SEHR_STARK'
  | 'GRUPPE' | 'KREISKLASSE' | 'KREISLIGA' | 'BEZIRKSOBERLIGA' | 'FOERDERLIGA' | 'NLZ_LIGA'
  | 'BAYERNLIGA' | 'REGIONALLIGA'
type PlayForm = 'FUNINO' | 'FUSSBALL_4' | 'FUSSBALL_5' | 'FUSSBALL_7' | 'NEUN_GEGEN_NEUN' | 'ELF_GEGEN_ELF'

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
  const [selectedAges, setSelectedAges] = useState<Age[]>([])
  const [offerDate, setOfferDate] = useState('')
  const [kickoffTime, setKickoffTime] = useState('')
  const [kickoffFlexible, setKickoffFlexible] = useState(false)
  const [homeAway, setHomeAway] = useState<HomeAway>('FLEX')
  const [fieldType, setFieldType] = useState<FieldType>('FIELD')
  const [playForm, setPlayForm] = useState<PlayForm | ''>('')
  const [strength, setStrength] = useState<Strength | ''>('')
  const [durationText, setDurationText] = useState('')
  const [notes, setNotes] = useState('')

  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      if (!kickoffFlexible && !kickoffTime) throw new Error('Bitte Anstoßzeit setzen oder „flexibel" wählen')

      const res = await fetch('/api/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          ages: selectedAges,
          offerDate,
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
      setMsg(`✓ Angebot erstellt (ID: ${created.id})`)
      setNotes('')
    } catch (err: any) {
      setMsg(`✗ Fehler: ${err?.message ?? 'unbekannt'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-dvh text-white pt-12">
      <BackgroundImage src="/back2.jpg" />

      {/* Fixed Top-Bar */}
      <div className="fixed top-12 left-0 right-0 z-20 px-3 pt-2 pb-2 bg-[#D04D2E]/90 backdrop-blur-md shadow-md">
        <div className="mx-auto max-w-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold leading-none">Neues Angebot</h1>
          </div>
          <div className="mt-1 text-[11px] text-white/85">
            Erstelle ein Match-Angebot für dein Team
          </div>
        </div>
      </div>
      <div className="h-16" />

      <div className="mx-auto max-w-sm px-3 pt-3 pb-20">
        <form onSubmit={onSubmit} className="glass-card p-4 space-y-4">
          {/* Team */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/90">Team</label>
            <select
              className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              value={teamId}
              onChange={e => {
                const id = e.target.value
                setTeamId(id)
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
                <option key={t.id} value={t.id} className="bg-gray-800 text-white">
                  {t.club ?? 'Verein'}
                </option>
              ))}
            </select>
          </div>

          {/* Altersklassen */}
          <div>
            <label className="block text-xs font-medium mb-2 text-white/90">Altersklasse</label>
            <div className="flex flex-wrap gap-2">
              {ALL_AGES.map(age => (
                <button
                  key={age}
                  type="button"
                  onClick={() => toggleAge(age)}
                  className={cls(
                    'px-3 py-1.5 rounded-full border text-sm font-medium transition',
                    selectedAges.includes(age) 
                      ? 'bg-white text-[#D04D2E] border-white' 
                      : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                  )}
                >
                  {age}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/60 mt-1.5">Mehrfachauswahl möglich (z. B. U12 & U13).</p>
          </div>

          {/* Datum & Anstoß */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/90">Datum</label>
              <input
                type="date"
                className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                value={offerDate}
                onChange={e => setOfferDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/90">Anstoß</label>
              <input
                type="time"
                className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50"
                value={kickoffTime}
                onChange={e => setKickoffTime(e.target.value)}
                disabled={kickoffFlexible}
              />
              <label className="mt-1.5 inline-flex items-center gap-2 text-xs text-white/80">
                <input
                  type="checkbox"
                  checked={kickoffFlexible}
                  onChange={e => setKickoffFlexible(e.target.checked)}
                  className="rounded"
                />
                flexibel nach Vereinbarung
              </label>
            </div>
          </div>

          {/* Spielstärke */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/90">Spielstärke</label>
            <select
              className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              value={strength}
              onChange={e => setStrength((e.target.value || '') as Strength | '')}
            >
              <option value="" className="bg-gray-800 text-white">–</option>
              {strengthOptions.map(s => (
                <option key={s} value={s} className="bg-gray-800 text-white">{STRENGTH_LABEL[s]}</option>
              ))}
            </select>
          </div>

          {/* Spielort & Spielfeld */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/90">Spielort</label>
              <select
                className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                value={homeAway}
                onChange={e => setHomeAway(e.target.value as HomeAway)}
              >
                <option value="HOME" className="bg-gray-800 text-white">Heimspiel</option>
                <option value="AWAY" className="bg-gray-800 text-white">Auswärtsspiel</option>
                <option value="FLEX" className="bg-gray-800 text-white">Heim- oder Auswärtsspiel</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/90">Spielfeld</label>
              <select
                className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                value={fieldType}
                onChange={e => setFieldType(e.target.value as FieldType)}
              >
                {(['FIELD','TURF','HALL'] as FieldType[]).map(ft => (
                  <option key={ft} value={ft} className="bg-gray-800 text-white">{FIELD_TYPE_LABEL[ft]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Spielform & Spielzeit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/90">Spielform</label>
              <select
                className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                value={playForm}
                onChange={e => setPlayForm((e.target.value || '') as PlayForm | '')}
              >
                <option value="" className="bg-gray-800 text-white">–</option>
                {PLAYFORM_OPTIONS.map(p => (
                  <option key={p} value={p} className="bg-gray-800 text-white">{PLAYFORM_LABEL[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/90">Spielzeit (Freitext)</label>
              <input
                className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="z. B. 2×30 Min"
                value={durationText}
                onChange={e => setDurationText(e.target.value)}
              />
            </div>
          </div>

          {/* Notizen */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/90">Notizen</label>
            <textarea
              className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Zusätzliche Informationen..."
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full rounded-lg bg-[#D04D2E] hover:brightness-110 text-white font-medium px-4 py-3 transition disabled:opacity-50"
          >
            {loading ? 'Speichere…' : 'Angebot erstellen'}
          </button>

          {msg && (
            <div className={cls(
              'text-sm px-3 py-2 rounded-lg border',
              msg.startsWith('✓') 
                ? 'bg-green-500/20 border-green-400/60 text-green-50'
                : 'bg-red-500/20 border-red-400/60 text-red-50'
            )}>
              {msg}
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
