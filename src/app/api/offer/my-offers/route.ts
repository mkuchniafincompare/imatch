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
    // We load all requests to filter based on matchType and numberOfOpponents
    const allOffers = await prisma.gameOffer.findMany({
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
        requests: {
          where: {
            status: 'ACCEPTED',
          },
        },
        _count: {
          select: {
            savedBy: true,
            requests: {
              where: {
                status: 'PENDING',
              },
            },
          },
        },
      },
      orderBy: [{ offerDate: 'asc' }, { createdAt: 'asc' }],
    })

    // Filter based on matchType:
    // - TESTSPIEL: Hide if any request is accepted
    // - LEISTUNGSVERGLEICH: Hide only if acceptedCount >= numberOfOpponents
    const offers = allOffers.filter((offer) => {
      const acceptedCount = offer.requests.length
      
      if (acceptedCount === 0) {
        // No accepted requests, always show
        return true
      }

      const matchType = (offer as any).matchType ?? 'TESTSPIEL'
      
      if (matchType === 'TESTSPIEL') {
        // Testspiel: Hide if any accepted request exists
        return false
      } else {
        // Leistungsvergleich: Hide only if max opponents reached
        const numberOfOpponents = (offer as any).numberOfOpponents ?? 1
        return acceptedCount < numberOfOpponents
      }
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
        isReserved: !!(o as any).isReserved,
        matchType: (o as any).matchType ?? 'TESTSPIEL',
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
