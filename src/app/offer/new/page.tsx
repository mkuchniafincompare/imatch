'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import BackgroundImage from '@/components/BackgroundImage'
import SuccessModal from '@/components/SuccessModal'
import {
  type AgeCategory,
  type Strength,
  type SubAge,
  AGE_CATEGORY_LABEL,
  SUB_AGE_LABEL,
  STRENGTH_LABEL,
  getSubAgesByCategory,
  getAvailableStrengths
} from '@/config/ageStrength'

type Team = {
  id: string
  ageGroup: string
  level: string
  club: string | null
  city: string | null
}

type HomeAway = 'HOME' | 'AWAY' | 'FLEX'
type FieldType = 'FIELD' | 'TURF' | 'HALL'
type MatchType = 'TESTSPIEL' | 'LEISTUNGSVERGLEICH'
type PlayForm = 'FUNINO' | 'FUSSBALL_4' | 'FUSSBALL_5' | 'FUSSBALL_7' | 'NEUN_GEGEN_NEUN' | 'ELF_GEGEN_ELF'

const FIELD_TYPE_LABEL: Record<FieldType, string> = { FIELD: 'Rasen', TURF: 'Kunstrasen', HALL: 'Halle' }
const MATCH_TYPE_LABEL: Record<MatchType, string> = { TESTSPIEL: 'Testspiel', LEISTUNGSVERGLEICH: 'Leistungsvergleich' }
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

function cls(...xs: (string | false | undefined)[]) { return xs.filter(Boolean).join(' ') }

export default function NewOfferPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [teamId, setTeamId] = useState('')
  
  // Zwei-stufige Altersklassen
  const [ageCategory, setAgeCategory] = useState<AgeCategory | ''>('')
  const [selectedSubAges, setSelectedSubAges] = useState<SubAge[]>([])
  
  const [offerDate, setOfferDate] = useState('')
  const [kickoffTime, setKickoffTime] = useState('')
  const [kickoffFlexible, setKickoffFlexible] = useState(false)
  const [homeAway, setHomeAway] = useState<HomeAway>('FLEX')
  const [fieldType, setFieldType] = useState<FieldType>('FIELD')
  
  // Spielart
  const [matchType, setMatchType] = useState<MatchType>('TESTSPIEL')
  const [numberOfOpponents, setNumberOfOpponents] = useState('')
  
  const [playForm, setPlayForm] = useState<PlayForm | ''>('')
  const [strength, setStrength] = useState<Strength | ''>('')
  const [durationText, setDurationText] = useState('')
  const [notes, setNotes] = useState('')

  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    fetch('/api/team').then(r => r.json()).then(d => {
      const items: Team[] = d.items ?? []
      setTeams(items)
      if (items.length > 0) {
        setTeamId(items[0].id)
      }
    })
  }, [])

  const strengthOptions = useMemo(() => 
    getAvailableStrengths(ageCategory || null, selectedSubAges), 
    [ageCategory, selectedSubAges]
  )

  // Sub-Ages abhängig von AgeCategory
  const availableSubAges: SubAge[] = useMemo(() => 
    getSubAgesByCategory(ageCategory || null), 
    [ageCategory]
  )

  function toggleSubAge(age: SubAge) {
    setSelectedSubAges(prev => prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age])
  }

  // Reset Sub-Ages wenn Category wechselt
  useEffect(() => {
    setSelectedSubAges([])
  }, [ageCategory])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setLoading(true)
    try {
      if (!teamId) throw new Error('Kein Team gewählt')
      if (!ageCategory) throw new Error('Bitte Altersklasse wählen')
      
      // Validierung: Sub-Ages immer erforderlich (auch für DAMEN/FREIZEITLIGA)
      if (selectedSubAges.length === 0) {
        throw new Error('Bitte mindestens eine Altersstufe wählen')
      }
      
      if (!offerDate) throw new Error('Bitte Datum wählen')
      if (!kickoffFlexible && !kickoffTime) throw new Error('Bitte Anstoßzeit setzen oder „flexibel" wählen')
      
      if (matchType === 'LEISTUNGSVERGLEICH' && !numberOfOpponents) {
        throw new Error('Bitte Anzahl Gegner angeben')
      }

      const res = await fetch('/api/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          ageCategory,
          ages: selectedSubAges,
          offerDate,
          kickoffTime: kickoffFlexible ? null : kickoffTime,
          kickoffFlexible,
          matchType,
          numberOfOpponents: matchType === 'LEISTUNGSVERGLEICH' ? Number(numberOfOpponents) : null,
          strength: strength || null,
          playForm: playForm || null,
          durationText: durationText || null,
          homeAway,
          fieldType,
          notes: notes || null,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await res.json()
      setShowSuccessModal(true)
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
              className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30 [&>option]:bg-gray-800 [&>option]:text-white"
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.club ?? 'Verein'}
                </option>
              ))}
            </select>
          </div>

          {/* Altersklasse (Level 1) */}
          <div>
            <label className="block text-xs font-medium mb-2 text-white/90">Altersklasse</label>
            <div className="flex flex-wrap gap-2">
              {(['JUNIOREN', 'JUNIORINNEN', 'HERREN', 'DAMEN', 'FREIZEITLIGA'] as AgeCategory[]).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAgeCategory(ageCategory === cat ? '' : cat)}
                  className={cls(
                    'px-3 py-1.5 rounded-full border text-sm font-medium transition',
                    ageCategory === cat 
                      ? 'bg-white text-[#D04D2E] border-white' 
                      : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                  )}
                >
                  {AGE_CATEGORY_LABEL[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Altersstufe (Level 2) - immer anzeigen wenn Kategorie gewählt */}
          {ageCategory && (
            <div>
              <label className="block text-xs font-medium mb-2 text-white/90">Altersstufe</label>
              <div className="flex flex-wrap gap-2">
                {availableSubAges.map(age => (
                  <button
                    key={age}
                    type="button"
                    onClick={() => toggleSubAge(age)}
                    className={cls(
                      'px-3 py-1.5 rounded-full border text-sm font-medium transition',
                      selectedSubAges.includes(age) 
                        ? 'bg-white text-[#D04D2E] border-white' 
                        : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                    )}
                  >
                    {SUB_AGE_LABEL[age] || age}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-white/60 mt-1.5">Mehrfachauswahl möglich.</p>
            </div>
          )}

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

          {/* Spielart */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/90">Spielart</label>
            <select
              className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30 [&>option]:bg-gray-800 [&>option]:text-white"
              value={matchType}
              onChange={e => setMatchType(e.target.value as MatchType)}
            >
              {(['TESTSPIEL', 'LEISTUNGSVERGLEICH'] as MatchType[]).map(mt => (
                <option key={mt} value={mt}>{MATCH_TYPE_LABEL[mt]}</option>
              ))}
            </select>
          </div>

          {/* Anzahl Gegner (nur bei Leistungsvergleich) */}
          {matchType === 'LEISTUNGSVERGLEICH' && (
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/90">Anzahl Gegner</label>
              <input
                type="number"
                min="1"
                className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="z. B. 3"
                value={numberOfOpponents}
                onChange={e => setNumberOfOpponents(e.target.value)}
                required
              />
            </div>
          )}

          {/* Spielstärke */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/90">Spielstärke</label>
            <select
              className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30 [&>option]:bg-gray-800 [&>option]:text-white"
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
              <label className="block text-xs font-medium mb-1.5 text-white/90">Spielort</label>
              <select
                className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30 [&>option]:bg-gray-800 [&>option]:text-white"
                value={homeAway}
                onChange={e => setHomeAway(e.target.value as HomeAway)}
              >
                <option value="HOME">Heimspiel</option>
                <option value="AWAY">Auswärtsspiel</option>
                <option value="FLEX">Heim- oder Auswärtsspiel</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/90">Spielfeld</label>
              <select
                className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30 [&>option]:bg-gray-800 [&>option]:text-white"
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
              <label className="block text-xs font-medium mb-1.5 text-white/90">Spielform</label>
              <select
                className="w-full rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30 [&>option]:bg-gray-800 [&>option]:text-white"
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
            <div className="text-sm px-3 py-2 rounded-lg border bg-red-500/20 border-red-400/60 text-red-50">
              {msg}
            </div>
          )}
        </form>
      </div>

      <SuccessModal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          router.push('/my-offers')
        }}
        message="Spielangebot erfolgreich angelegt"
      />
    </main>
  )
}
