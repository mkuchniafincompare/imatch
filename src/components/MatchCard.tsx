'use client'

import React from 'react'
import Image from 'next/image'

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-white/25 bg-white/10 text-white/90 text-[11px] px-2 py-[2px] backdrop-blur-[1px]">
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
}

export default function MatchCard({
  clubName, ageLabel, year,
  date, kickoffTime, kickoffFlexible,
  homeAway, notes, playTime, strengthLabel, address, logoUrl,
}: Props) {
  const dateFmt = date
    ? new Date(date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
    : '—'
  const timeFmt = kickoffTime || '—'

  const [imgErr, setImgErr] = React.useState(false)

  return (
    // Kein fester Hintergrund hier, damit der "Glass"-Wrapper der Seite wirkt
    <div className="relative overflow-hidden rounded-2xl px-3 py-3">
      {/* Rechts: Logo */}
      <div className="absolute right-3 top-3 w-12 h-12 rounded-md overflow-hidden border border-white/25 bg-white/15 backdrop-blur-[1px] grid place-items-center">
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

      {/* Kopf */}
      <div className="pr-16">
        <div className="flex items-center gap-2">
          <div className="font-medium text-sm text-white">{clubName}</div>
          <Badge>{ageLabel}</Badge>
          {year ? <Badge>{year}</Badge> : null}
        </div>
      </div>

      {/* Infozeile: Datum • Uhrzeit (+ flexibel) • Spielzeit • Heim/Auswärts */}
      <div className="mt-2 text-[12px] text-white/90 flex flex-wrap items-center gap-2">
        <span aria-hidden>📅</span>
        <span>{dateFmt}</span>

        <span aria-hidden>⏰</span>
        <span>{timeFmt}</span>
        {kickoffFlexible && <Badge>flexibel</Badge>}

        {playTime && (
          <>
            <span aria-hidden>•</span>
            <span aria-label="Spielzeit">⏱️ {playTime}</span>
          </>
        )}

        <span aria-hidden>•</span>
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
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] text-white/90">
          {strengthLabel ? <Badge>{strengthLabel}</Badge> : null}
        </div>
        <div className="flex items-center gap-1 text-[12px] text-white/80 max-w-[60%] text-right">
          <span aria-hidden>📍</span>
          <span className="truncate">{address || '—'}</span>
        </div>
      </div>
    </div>
  )
}