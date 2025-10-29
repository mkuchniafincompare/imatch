'use client'

import React from 'react'
import Image from 'next/image'

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-white/90 text-gray-800 text-[11px] px-2 py-[2px] font-medium shadow-sm">
      {children}
    </span>
  )
}

type Props = {
  clubName: string
  ageLabel: string
  year?: number | null
  date?: string | null
  kickoffTime?: string | null
  kickoffFlexible?: boolean
  homeAway: 'HOME' | 'AWAY' | 'FLEX'
  notes?: string | null
  playTime?: string | null
  strengthLabel?: string | null
  address?: string | null
  logoUrl?: string | null
  isOwner?: boolean
  onEdit?: () => void
  isReserved?: boolean
  requestCount?: number
}

export default function MatchCard({
  clubName, ageLabel, year,
  date, kickoffTime, kickoffFlexible,
  homeAway, notes, playTime, strengthLabel, address, logoUrl,
  isOwner, onEdit, isReserved, requestCount,
}: Props) {
  const dateFmt = date
    ? new Date(date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
    : '—'
  const timeFmt = kickoffTime || '—'

  const [imgErr, setImgErr] = React.useState(false)

  const hasLabels = isReserved || (requestCount && requestCount > 0)

  return (
    // Kein fester Hintergrund hier, damit der "Glass"-Wrapper der Seite wirkt
    <div className="relative overflow-hidden rounded-2xl px-3 py-3">
      
      {/* Labels-Zeile: Reserviert (links) und Anfragen (rechts) */}
      {hasLabels && (
        <div className="mb-2 flex items-center justify-between gap-2">
          {isReserved && (
            <span className="inline-block bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded shadow-md">
              Reserviert
            </span>
          )}
          {requestCount && requestCount > 0 && (
            <span className="inline-block bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md ml-auto">
              {requestCount === 1 ? '1 Anfrage' : `${requestCount} Anfragen`}
            </span>
          )}
        </div>
      )}

      {/* Kopf: Clubname + Badges + Logo */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="font-medium text-sm text-white">{clubName}</div>
          <Badge>{ageLabel}</Badge>
          {year ? <Badge>{year}</Badge> : null}
        </div>
        
        {/* Logo auf Höhe des Clubnamens */}
        <div className="w-12 h-12 rounded-md overflow-hidden bg-white/15 backdrop-blur-[1px] grid place-items-center flex-shrink-0">
          {logoUrl && !imgErr ? (
            <Image
              src={logoUrl}
              alt={clubName ? `Logo ${clubName}` : 'Vereinslogo'}
              width={48}
              height={48}
              className="object-cover w-full h-full"
              onError={() => setImgErr(true)}
              priority={false}
            />
          ) : (
            <span className="text-[10px] text-white/70">Logo</span>
          )}
        </div>
      </div>

      {/* Erste Zeile: Datum • Uhrzeit (+ flexibel) */}
      <div className="mt-2 text-[12px] text-white/90 flex flex-wrap items-center gap-2">
        <span aria-hidden>📅</span>
        <span>{dateFmt}</span>

        <span aria-hidden>⏰</span>
        <span>{timeFmt}</span>
        {kickoffFlexible && <Badge>flexibel</Badge>}
      </div>

      {/* Zweite Zeile: Spielzeit • Heim/Auswärts */}
      <div className="mt-1 text-[12px] text-white/90 flex flex-wrap items-center gap-2">
        {playTime && (
          <>
            <span aria-label="Spielzeit">⏱️ {playTime}</span>
            <span aria-hidden>•</span>
          </>
        )}
        
        {homeAway === 'HOME' && <Badge>Heim</Badge>}
        {homeAway === 'AWAY' && <Badge>Auswärts</Badge>}
        {homeAway === 'FLEX' && <Badge>Heim / Auswärts</Badge>}
      </div>

      {/* Notizen */}
      {notes && (
        <div className="mt-2 text-[12px] text-white">
          <div className="flex items-start gap-2">
            <span aria-hidden>📝</span>
            <p className="leading-snug">{notes}</p>
          </div>
        </div>
      )}

      {/* Fuß */}
      <div className="mt-3 space-y-2 pb-2">
        {/* Stärke-Badge */}
        {strengthLabel && (
          <div className="flex items-center gap-2 text-[12px] text-white/90">
            <Badge>{strengthLabel}</Badge>
          </div>
        )}
        
        {/* Adresse in eigener Zeile */}
        <div className="flex items-center gap-1 text-[12px] text-white/80 pr-10">
          <span aria-hidden>📍</span>
          <span className="truncate">{address || '—'}</span>
        </div>
      </div>
    </div>
  )
}