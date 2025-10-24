'use client'

import React from 'react'

type State = {
  editing: boolean
  sending: boolean
  info: string | null
  error: string | null
}

const PW_RULES = {
  minLen: 8,
  hasDigit: /\d/,
  hasSpecial: /[^A-Za-z0-9]/,
}

function validatePassword(pw: string) {
  const issues: string[] = []
  if (pw.length < PW_RULES.minLen) issues.push(`Mindestens ${PW_RULES.minLen} Zeichen`)
  if (!PW_RULES.hasDigit.test(pw)) issues.push('Mindestens 1 Zahl')
  if (!PW_RULES.hasSpecial.test(pw)) issues.push('Mindestens 1 Sonderzeichen')
  return issues
}

export default function PasswordChange() {
  const [state, setState] = React.useState<State>({
    editing: false,
    sending: false,
    info: null,
    error: null,
  })

  const [currentPw, setCurrentPw] = React.useState('')
  const [newPw, setNewPw] = React.useState('')
  const [newPw2, setNewPw2] = React.useState('')

  const [touched, setTouched] = React.useState<{cur?:boolean; n1?:boolean; n2?:boolean}>({})

  const newIssues = React.useMemo(() => validatePassword(newPw), [newPw])
  const repeatMismatch = React.useMemo(() => newPw2.length > 0 && newPw2 !== newPw, [newPw, newPw2])

  function resetForm() {
    setCurrentPw('')
    setNewPw('')
    setNewPw2('')
    setTouched({})
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState(s => ({ ...s, error: null, info: null }))

    // Validate
    if (!currentPw) {
      setTouched(t => ({ ...t, cur: true }))
      return setState(s => ({ ...s, error: 'Bitte aktuelles Passwort eingeben.' }))
    }
    if (newIssues.length > 0) {
      setTouched(t => ({ ...t, n1: true }))
      return setState(s => ({ ...s, error: 'Neues Passwort erfüllt nicht alle Kriterien.' }))
    }
    if (repeatMismatch || !newPw2) {
      setTouched(t => ({ ...t, n2: true }))
      return setState(s => ({ ...s, error: 'Bitte Wiederholung prüfen.' }))
    }

    try {
      setState(s => ({ ...s, sending: true }))
      const res = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      resetForm()
      setState({ editing: false, sending: false, error: null, info: 'Passwort wurde geändert.' })
    } catch (err: any) {
      setState(s => ({ ...s, sending: false, error: err?.message || 'Änderung fehlgeschlagen' }))
    }
  }

  if (!state.editing) {
    return (
      <section className="rounded-xl border border-white/25 bg-white/10 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Passwort</h2>
          <button
            type="button"
            onClick={() => setState(s => ({ ...s, editing: true, info: null, error: null }))}
            className="text-sm underline underline-offset-2 decoration-white/50 hover:decoration-white"
          >
            Passwort ändern
          </button>
        </div>
        <p className="text-sm text-white/80 mt-2">Aktuelles Passwort: ******</p>
        {state.info && (
          <div className="mt-3 rounded-xl border border-emerald-400/60 bg-emerald-500/15 text-emerald-50 px-3 py-2 text-sm flex items-start gap-2" role="status" aria-live="polite">
            <span className="text-emerald-300">✔</span>
            <span>{state.info}</span>
          </div>
        )}
        {state.error && (
          <div className="mt-3 rounded-xl border border-red-400/60 bg-red-500/15 text-red-50 px-3 py-2 text-sm flex items-start gap-2" role="alert" aria-live="assertive">
            <span className="text-red-300">⚠</span>
            <span>{state.error}</span>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-white/25 bg-white/10 backdrop-blur-sm p-4">
      <h2 className="text-base font-semibold text-white mb-2">Passwort ändern</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-white/85 mb-1">Aktuelles Passwort</label>
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, cur: true }))}
            className={`w-full rounded-xl border px-3 py-2 backdrop-blur-sm bg-white/15 text-white placeholder-white/60 ${
              touched.cur && !currentPw ? 'border-red-400/70 animate-shake' : 'border-white/30'
            }`}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          {touched.cur && !currentPw && (
            <div className="mt-2 rounded-xl border border-red-400/60 bg-red-500/15 text-red-50 px-3 py-2 text-xs" role="alert" aria-live="assertive">
              <div className="flex items-start gap-2">
                <span className="text-red-300">⚠</span>
                <span>Bitte aktuelles Passwort eingeben.</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-white/85 mb-1">Neues Passwort</label>
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, n1: true }))}
            className={`w-full rounded-xl border px-3 py-2 backdrop-blur-sm bg-white/15 text-white placeholder-white/60 ${
              touched.n1 && newIssues.length > 0 ? 'border-red-400/70 animate-shake' : 'border-white/30'
            }`}
            placeholder="Mind. 8 Zeichen, 1 Zahl, 1 Sonderzeichen"
            autoComplete="new-password"
          />
          {touched.n1 && newIssues.length > 0 && (
            <div className="mt-2 rounded-xl border border-red-400/60 bg-red-500/15 text-red-50 px-3 py-2 text-xs" role="alert" aria-live="assertive">
              <div className="flex items-start gap-2">
                <span className="text-red-300">⚠</span>
                <div>
                  <div className="mb-1 font-medium">Das neue Passwort erfüllt nicht alle Kriterien:</div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {newIssues.map((msg, i) => <li key={i}>{msg}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-white/85 mb-1">Neues Passwort (wiederholen)</label>
          <input
            type="password"
            value={newPw2}
            onChange={(e) => setNewPw2(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, n2: true }))}
            className={`w-full rounded-xl border px-3 py-2 backdrop-blur-sm bg-white/15 text-white placeholder-white/60 ${
              touched.n2 && (repeatMismatch || !newPw2) ? 'border-red-400/70 animate-shake' : 'border-white/30'
            }`}
            placeholder="Bitte wiederholen"
            autoComplete="new-password"
          />
          {touched.n2 && repeatMismatch && (
            <div className="mt-2 rounded-xl border border-red-400/60 bg-red-500/15 text-red-50 px-3 py-2 text-xs" role="alert" aria-live="assertive">
              <div className="flex items-start gap-2">
                <span className="text-red-300">⚠</span>
                <span>Die beiden Passwörter stimmen nicht überein.</span>
              </div>
            </div>
          )}
          {touched.n2 && !newPw2 && (
            <div className="mt-2 rounded-xl border border-red-400/60 bg-red-500/15 text-red-50 px-3 py-2 text-xs" role="alert" aria-live="assertive">
              <div className="flex items-start gap-2">
                <span className="text-red-300">⚠</span>
                <span>Bitte gib die Wiederholung ein.</span>
              </div>
            </div>
          )}
        </div>

        {state.error && (
          <div className="rounded-xl border border-red-400/60 bg-red-500/15 text-red-50 px-3 py-2 text-sm flex items-start gap-2" role="alert" aria-live="assertive">
            <span className="text-red-300">⚠</span>
            <span>{state.error}</span>
          </div>
        )}
        {state.info && (
          <div className="rounded-xl border border-emerald-400/60 bg-emerald-500/15 text-emerald-50 px-3 py-2 text-sm flex items-start gap-2" role="status" aria-live="polite">
            <span className="text-emerald-300">✔</span>
            <span>{state.info}</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={state.sending}
            className="rounded-xl bg-[#D04D2E] text-white px-4 py-2 shadow-lg shadow-black/10 text-sm disabled:opacity-60"
          >
            {state.sending ? 'Ändere…' : 'Speichern'}
          </button>
          <button
            type="button"
            onClick={() => { setState({ editing: false, sending: false, info: null, error: null }); resetForm() }}
            className="rounded-xl border border-white/40 text-white px-4 py-2 bg-white/10 hover:bg-white/15 transition text-sm"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </section>
  )
}