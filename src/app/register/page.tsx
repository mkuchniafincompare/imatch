'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BackgroundImage from '@/components/BackgroundImage'

import RegisterHeaderBar from '@/components/RegisterHeaderBar'
import RegisterProgress from '@/components/RegisterProgress'

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 text-[12px] text-white bg-red-700/90 border border-red-400/70 rounded-md px-2 py-1 flex items-start gap-1 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
    >
      <svg aria-hidden="true" className="mt-[1px]" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v2h2v-2zm0-8h-2v6h2V10z"/>
      </svg>
      <span>{children}</span>
    </p>
  )
}

function pwValid(pw: string) {
  // mind. 8 Zeichen, 1 Zahl, 1 Sonderzeichen
  return /^(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(pw)
}

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [touchedEmail, setTouchedEmail] = useState(false)
  const [password, setPassword] = useState('')
  const [touchedPw, setTouchedPw] = useState(false)
  const [password2, setPassword2] = useState('')
  const [touchedPw2, setTouchedPw2] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [touchedPhone, setTouchedPhone] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [shakeEmail, setShakeEmail] = useState(false)
  const [shakePw, setShakePw] = useState(false)
  const [shakePw2, setShakePw2] = useState(false)
  const [shakeFirst, setShakeFirst] = useState(false)
  const [shakeLast, setShakeLast] = useState(false)

  // Einwilligungen
  const [privacyOk, setPrivacyOk] = useState(false)
  const [marketingOk, setMarketingOk] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const pwError = touchedPw && password.length > 0 && !pwValid(password)
  const pw2Error = touchedPw2 && password2.length > 0 && password2 !== password
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  const emailError = touchedEmail && email.trim().length > 0 && !emailPattern.test(email)
  const phonePattern = /^\+\d{6,15}$/
  const phoneError = touchedPhone && phone.trim().length > 0 && !phonePattern.test(phone.trim())

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    setSubmitted(true)

    // helper to trigger shake on empty fields
    const shakeIfEmpty = (val: string, shaker: (v: boolean) => void) => {
      if (!val || val.trim() === '') {
        shaker(true)
        setTimeout(() => shaker(false), 450)
        return true
      }
      return false
    }

    const emptyEmail = shakeIfEmpty(email, setShakeEmail)
    const emptyPw = shakeIfEmpty(password, setShakePw)
    const emptyPw2 = shakeIfEmpty(password2, setShakePw2)
    const emptyFirst = shakeIfEmpty(firstName, setShakeFirst)
    const emptyLast = shakeIfEmpty(lastName, setShakeLast)
    if (emptyEmail || emptyPw || emptyPw2 || emptyFirst || emptyLast) {
      return
    }

    // Force validation display on submit
    setTouchedEmail(true)
    setTouchedPw(true)
    setTouchedPw2(true)
    setTouchedPhone(true)

    // Client-seitige Validierung (nur prüfen, wenn Inhalt vorhanden)
    if (email.trim().length > 0 && !emailPattern.test(email)) return
    if (password.length > 0 && !pwValid(password)) return
    if (password2.length > 0 && password !== password2) return
    if (phone.trim() && !phonePattern.test(phone.trim())) return
    if (!privacyOk) {
      setError('Bitte der Datenschutzklausel zustimmen.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          nickname: nickname || null,
          phone: phone || null,
          privacyOk,
          marketingOk,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)

      router.replace(`/register/team?fn=${encodeURIComponent(firstName || '')}`)
    } catch (err: any) {
      setError(err?.message ?? 'Registrierung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-dvh text-white">
      {/* Hintergrund */}
      <BackgroundImage />

      <div className="relative z-10 mx-auto max-w-sm min-h-dvh flex flex-col px-4 pt-20">
        <RegisterHeaderBar />

        <RegisterProgress active={1} />

        <form onSubmit={onSubmit} noValidate className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">E-Mail (auch Benutzername)</label>
            <input
              type="email"
              className={
                `w-full rounded-xl border px-3 py-2 bg-white/95 text-black placeholder:text-gray-500 ${(submitted && email.trim()==='') ? 'border-red-400 ring-1 ring-red-400/60 animate-shake' : ''} ${emailError ? 'border-red-400 ring-1 ring-red-400/60' : ''} ${shakeEmail ? 'animate-shake' : ''}`
              }
              value={email}
              onChange={e=>setEmail(e.target.value)}
              onBlur={() => setTouchedEmail(true)}
              required
              autoComplete="email"
              aria-invalid={emailError || undefined}
              aria-describedby={emailError ? 'email-error' : undefined}
              placeholder="name@verein.de"
            />
            {emailError && (
              <FieldError id="email-error">
                Bitte eine gültige E-Mail-Adresse im Format <em>name@domain.tld</em> eingeben.
              </FieldError>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Passwort</label>
            <input
              type="password"
              className={
                `w-full rounded-xl border px-3 py-2 bg-white/95 text-black placeholder:text-gray-500 ${(submitted && password==='') ? 'border-red-400 ring-1 ring-red-400/60 animate-shake' : ''} ${pwError ? 'border-red-400 ring-1 ring-red-400/60' : ''} ${shakePw ? 'animate-shake' : ''}`
              }
              value={password}
              onChange={e => { setPassword(e.target.value); if (touchedPw) {/* trigger re-render */} }}
              onBlur={() => setTouchedPw(true)}
              required
              placeholder="mind. 8 Zeichen, 1 Zahl, 1 Sonderzeichen"
              autoComplete="new-password"
              aria-invalid={pwError || undefined}
              aria-describedby={pwError ? 'pw-error' : undefined}
            />
            {pwError && (
              <FieldError id="pw-error">
                Passwort zu schwach: mind. 8 Zeichen, mindestens 1 Zahl und 1 Sonderzeichen.
              </FieldError>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Passwort wiederholen</label>
            <input
              type="password"
              className={
                `w-full rounded-xl border px-3 py-2 bg-white/95 text-black placeholder:text-gray-500 ${(submitted && password2==='') ? 'border-red-400 ring-1 ring-red-400/60 animate-shake' : ''} ${pw2Error ? 'border-red-400 ring-1 ring-red-400/60' : ''} ${shakePw2 ? 'animate-shake' : ''}`
              }
              value={password2}
              onChange={e => { setPassword2(e.target.value); if (touchedPw2) {/* trigger re-render */} }}
              onBlur={() => setTouchedPw2(true)}
              required
              autoComplete="new-password"
              aria-invalid={pw2Error || undefined}
              aria-describedby={pw2Error ? 'pw2-error' : undefined}
            />
            {pw2Error && (
              <FieldError id="pw2-error">
                Passwörter stimmen nicht überein.
              </FieldError>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Vorname</label>
              <input
                className={`w-full rounded-xl border px-3 py-2 bg-white/95 text-black ${(submitted && firstName.trim()==='') ? 'border-red-400 ring-1 ring-red-400/60 animate-shake' : ''} ${shakeFirst ? 'animate-shake' : ''}`}
                value={firstName}
                onChange={e=>setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Nachname</label>
              <input
                className={`w-full rounded-xl border px-3 py-2 bg-white/95 text-black ${(submitted && lastName.trim()==='') ? 'border-red-400 ring-1 ring-red-400/60 animate-shake' : ''} ${shakeLast ? 'animate-shake' : ''}`}
                value={lastName}
                onChange={e=>setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Nickname (optional)</label>
              <input className="w-full rounded-xl border px-3 py-2 bg-white/95 text-black"
                     value={nickname} onChange={e=>setNickname(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Handy (optional)</label>
              <input
                className={`w-full rounded-xl border px-3 py-2 bg-white/95 text-black placeholder:text-gray-500 ${phoneError ? 'border-red-400 ring-1 ring-red-400/60' : ''}`}
                value={phone}
                onChange={e=>setPhone(e.target.value)}
                onBlur={() => setTouchedPhone(true)}
                placeholder="+491751234567"
              />
              {phoneError && (
                <FieldError id="phone-error">
                  Bitte eine gültige internationale Nummer im Format <em>+LändervorwahlVorwahlNummer</em> eingeben,
                  z. B. <strong>+491751234567</strong>.
                </FieldError>
              )}
            </div>
          </div>

          {/* — Einwilligungen — */}
          <div className="mt-4 space-y-2 text-xs text-white/85">
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={privacyOk}
                     onChange={e=>setPrivacyOk(e.target.checked)} required />
              <span>
                Ich willige in die <strong>Datenschutzklausel</strong> ein und bestätige,
                dass ich die Hinweise zum Datenschutz gelesen habe. Meine Angaben
                werden zur Erstellung und Verwaltung meines Matchmaker-Kontos sowie
                zur Durchführung der angebotenen Dienste verarbeitet. Die Einwilligung
                kann ich jederzeit mit Wirkung für die Zukunft widerrufen. Weitere
                Informationen entnehme ich der{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="underline underline-offset-2 decoration-white/80 hover:decoration-white focus:outline-none focus:ring-2 focus:ring-white/60 rounded-sm"
                >
                  Datenschutzerklärung
                </button>.
              </span>
            </label>

            <label className="flex items-start gap-2">
              <input type="checkbox" checked={marketingOk}
                     onChange={e=>setMarketingOk(e.target.checked)} />
              <span>
                Ich möchte per E-Mail über neue Funktionen, Turniere und Angebote
                von Matchmaker informiert werden. Hinweise zum Widerruf und zu
                Statistiken finde ich in der{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="underline underline-offset-2 decoration-white/80 hover:decoration-white focus:outline-none focus:ring-2 focus:ring-white/60 rounded-sm"
                >
                  Datenschutzerklärung
                </button>.
              </span>
            </label>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-400/70 bg-red-700/90 text-white px-3 py-2 text-sm flex items-start gap-2 shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-[2px]">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v2h2v-2zm0-8h-2v6h2V10z"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-[#D04D2E] text-white px-4 py-2">
            {loading ? 'Erstelle Konto…' : 'Weiter zu Verein wählen'}
          </button>
        </form>

        <p className="text-xs text-white/85 mt-4">
          Du hast bereits ein Konto? <Link href="/login" className="underline">Zum Login</Link>
        </p>
        {showPrivacy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPrivacy(false)}
              aria-hidden="true"
            />
            {/* Dialog */}
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="privacy-title"
              className="relative w-[92%] max-w-md rounded-2xl bg-white text-gray-900 shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 id="privacy-title" className="text-base font-semibold">Datenschutzerklärung</h2>
                <button
                  type="button"
                  onClick={() => setShowPrivacy(false)}
                  className="p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D04D2E]/60"
                  aria-label="Schließen"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.3 5.71 12 12.01l-6.3-6.3-1.4 1.41 6.3 6.29-6.3 6.3 1.4 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.29z"/>
                  </svg>
                </button>
              </div>
              {/* Body */}
              <div className="px-4 py-3 text-sm leading-6 text-gray-800">
                <p className="mb-2">
                  <strong>Datenschutzerklärung (Preview):</strong> Hier steht später der vollständige Text deiner Datenschutzerklärung.
                </p>
                <p className="mb-2">
                  Dies ist Blindtext für das MVP. Inhalte zu Verantwortlichem, Verarbeitungszwecken, Rechtsgrundlagen,
                  Speicherdauer, Empfängern, Drittlandtransfer, Betroffenenrechten (Auskunft, Berichtigung, Löschung,
                  Einschränkung, Widerspruch, Datenübertragbarkeit) und Beschwerderecht bei einer Aufsichtsbehörde
                  werden hier später ergänzt.
                </p>
                <p className="text-gray-700">
                  Mit einem Klick auf „Schließen“ kehrst du zur Registrierung zurück.
                </p>
              </div>
              {/* Footer */}
              <div className="px-4 py-3 border-t flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPrivacy(false)}
                  className="rounded-xl bg-[#D04D2E] text-white px-4 py-2"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}