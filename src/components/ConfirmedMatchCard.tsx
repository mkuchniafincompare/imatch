'use client'

import React from 'react'
import Image from 'next/image'

type Props = {
  // Team 1 (own team)
  clubName: string
  ageLabel: string | null
  year?: number | null
  logoUrl?: string | null
  // Team 2 (opponent)
  opponentClubName: string
  opponentAgeLabel: string | null
  opponentYear?: number | null
  opponentLogoUrl?: string | null
  // Match details
  date?: string | null
  kickoffTime?: string | null
  kickoffFlexible?: boolean
  homeAway: 'HOME' | 'AWAY' | 'FLEX'
  notes?: string | null
  playTime?: string | null
  strengthLabel?: string | null
  address?: string | null
  pendingRequestCount?: number
  isOwner?: boolean
}

export default function ConfirmedMatchCard({
  clubName, ageLabel, year, logoUrl,
  opponentClubName, opponentAgeLabel, opponentYear, opponentLogoUrl,
  date, kickoffTime, kickoffFlexible,
  homeAway, notes, playTime, strengthLabel, address,
  pendingRequestCount, isOwner,
}: Props) {
  const dateFmt = date
    ? new Date(date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
    : '—'
  const timeFmt = kickoffTime || '—'

  const [imgErr1, setImgErr1] = React.useState(false)
  const [imgErr2, setImgErr2] = React.useState(false)

  return (
    <div className="relative overflow-hidden rounded-2xl px-4 py-4">
      {/* VS Darstellung */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Team 1 (Own Team) */}
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-md overflow-hidden border border-white/25 bg-white/15 backdrop-blur-[1px] grid place-items-center mb-2">
            {logoUrl && !imgErr1 ? (
              <Image
                src={logoUrl}
                alt={clubName}
                width={64}
                height={64}
                className="object-cover w-full h-full"
                onError={() => setImgErr1(true)}
                priority={false}
              />
            ) : (
              <span className="text-[10px] text-white/70">Logo</span>
            )}
          </div>
          <div className="font-semibold text-sm text-white">{clubName}</div>
          <div className="text-xs text-white/80">
            {ageLabel} {year && `(${year})`}
          </div>
        </div>

        {/* VS */}
        <div className="flex-shrink-0 px-3">
          <div className="text-2xl font-bold text-white/90">VS</div>
        </div>

        {/* Team 2 (Opponent) */}
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-md overflow-hidden border border-white/25 bg-white/15 backdrop-blur-[1px] grid place-items-center mb-2">
            {opponentLogoUrl && !imgErr2 ? (
              <Image
                src={opponentLogoUrl}
                alt={opponentClubName}
                width={64}
                height={64}
                className="object-cover w-full h-full"
                onError={() => setImgErr2(true)}
                priority={false}
              />
            ) : (
              <span className="text-[10px] text-white/70">Logo</span>
            )}
          </div>
          <div className="font-semibold text-sm text-white">{opponentClubName}</div>
          <div className="text-xs text-white/80">
            {opponentAgeLabel} {opponentYear && `(${opponentYear})`}
          </div>
        </div>
      </div>

      {/* Match Info */}
      <div className="mt-3 text-[12px] text-white/90 flex flex-wrap items-center gap-2 justify-center">
        <span aria-hidden>📅</span>
        <span>{dateFmt}</span>

        <span aria-hidden>⏰</span>
        <span>{timeFmt}</span>

        {playTime && (
          <>
            <span aria-hidden>•</span>
            <span aria-label="Spielzeit">⏱️ {playTime}</span>
          </>
        )}
      </div>

      {/* Location */}
      {address && (
        <div className="mt-3 flex items-start gap-2 text-[12px] text-white/90">
          <span aria-hidden className="flex-shrink-0">📍</span>
          <span className="leading-snug">{address}</span>
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="mt-3 text-[12px] text-white">
          <div className="flex items-start gap-2">
            <span aria-hidden>📝</span>
            <p className="leading-snug">{notes}</p>
          </div>
        </div>
      )}

      {/* Pending Requests Badge */}
      {pendingRequestCount !== undefined && pendingRequestCount > 0 && (
        <div className="mt-3 pt-3 border-t border-white/15">
          <div className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-yellow-500/20 text-yellow-200">
            <span>⏳</span>
            <span className="font-medium">
              {pendingRequestCount} {pendingRequestCount === 1 ? 'Anfrage offen' : 'Anfragen offen'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
