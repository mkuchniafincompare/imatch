// src/app/api/offer/my-offers/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const STRENGTH_LABEL: Record<string, string> = {
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

export async function GET() {
  try {
    const userId = await requireAuth()

    // Find all offers where the team's contactUserId is the current user
    const offers = await prisma.gameOffer.findMany({
      where: {
        team: {
          contactUserId: userId,
        },
      },
      include: {
        team: {
          include: {
            club: true,
          },
        },
        ages: true,
        _count: {
          select: {
            savedBy: true,
            requests: true,
          },
        },
      },
      orderBy: [{ offerDate: 'desc' }, { createdAt: 'desc' }],
    })

    const items = offers.map(o => {
      const club = o.team?.club
      const address = club
        ? [club.street, club.zip, club.city].filter(Boolean).join(', ')
        : null

      const ageLabel = o.ages[0]?.ageGroup ?? (o as any).team?.ageGroup ?? null
      const strengthLabel = o.strength ? (STRENGTH_LABEL[o.strength] ?? o.strength) : null

      return {
        id: o.id,
        clubName: club?.name ?? '—',
        ageLabel,
        year: (o as any).team?.year ?? null,
        date: o.offerDate ? new Date(o.offerDate).toISOString().slice(0, 10) : null,
        kickoffTime: o.kickoffTime ?? null,
        kickoffFlexible: !!o.kickoffFlexible,
        homeAway: o.homeAway as 'HOME' | 'AWAY' | 'FLEX',
        notes: o.notes ?? null,
        playTime: o.durationText ?? null,
        strengthLabel,
        address,
        logoUrl: club?.logoUrl ?? null,
        savedCount: o._count.savedBy,
        requestCount: o._count.requests,
      }
    })

    return NextResponse.json({ count: items.length, items })
  } catch (e: any) {
    if (e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'nicht eingeloggt' }, { status: 401 })
    }
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}
