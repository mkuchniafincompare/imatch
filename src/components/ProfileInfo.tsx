'use client'

import React, { useEffect, useState } from 'react'

type User = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  nickname: string | null
  phone: string | null
}

export default function ProfileInfo() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveInfo, setSaveInfo] = useState<string | null>(null)

  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store', credentials: 'same-origin' })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Fehler beim Laden')
        setUser(data.user)
        setFirstName(data.user.firstName ?? '')
        setLastName(data.user.lastName ?? '')
        setNickname(data.user.nickname ?? '')
        setPhone(data.user.phone ?? '')
      } catch (e: any) {
        setLoadError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)
    setSaveInfo(null)
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ firstName, lastName, nickname, phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Fehler beim Speichern')
      setSaveInfo('Profil gespeichert.')
      setUser(u => u ? ({ ...u, firstName, lastName, nickname, phone }) : u)
      setEditing(false)
    } catch (e: any) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-gray-200">Lade Profil…</p>
  if (loadError) return <p className="text-sm text-red-400">{loadError}</p>
  if (!user) return <p className="text-sm text-red-400">Kein Profil gefunden.</p>

  // Read-only view
  if (!editing) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold text-white">{fullName}</div>
        <div className="text-sm text-white/80">
          <div><span className="text-white/70">E‑Mail:</span> {user.email}</div>
          {user.nickname && <div><span className="text-white/70">Nickname:</span> {user.nickname}</div>}
          {user.phone && <div><span className="text-white/70">Telefon:</span> {user.phone}</div>}
        </div>

        <button
          type="button"
          onClick={() => { setEditing(true); setSaveError(null); setSaveInfo(null) }}
          className="text-sm underline underline-offset-2 decoration-white/50 hover:decoration-white"
        >
          Daten ändern
        </button>
      </div>
    )
  }

  // Edit form
  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/85 mb-1">Vorname</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full rounded-xl border border-white/30 bg-white/15 text-white placeholder-white/60 px-3 py-2 backdrop-blur-sm"
            placeholder="Max"
          />
        </div>
        <div>
          <label className="block text-xs text-white/85 mb-1">Nachname</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full rounded-xl border border-white/30 bg-white/15 text-white placeholder-white/60 px-3 py-2 backdrop-blur-sm"
            placeholder="Mustermann"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-white/85 mb-1">Nickname (optional)</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full rounded-xl border border-white/30 bg-white/15 text-white placeholder-white/60 px-3 py-2 backdrop-blur-sm"
          placeholder="z. B. CoachM"
        />
      </div>

      <div>
        <label className="block text-xs text-white/85 mb-1">Telefonnummer (optional)</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border border-white/30 bg-white/15 text-white placeholder-white/60 px-3 py-2 backdrop-blur-sm"
          placeholder="+491701234567"
          inputMode="tel"
        />
      </div>

      {saveError && <p className="text-sm text-red-200">{saveError}</p>}
      {saveInfo && <p className="text-sm text-emerald-200">{saveInfo}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#D04D2E] text-white px-4 py-2 shadow-lg shadow-black/10 text-sm disabled:opacity-60"
        >
          {saving ? 'Speichere…' : 'Speichern'}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setSaveError(null); setSaveInfo(null) }}
          className="rounded-xl border border-white/40 text-white px-4 py-2 bg-white/10 hover:bg-white/15 transition text-sm"
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}