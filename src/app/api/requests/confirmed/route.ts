// src/app/api/requests/confirmed/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'

// GET /api/requests/confirmed - Alle akzeptierten Spiele (sowohl als Ersteller als auch als Anfragender)
export async function GET() {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    // Find all accepted requests where:
    // 1) User is the requester (requested and got accepted)
    // 2) User is the offer owner (someone requested their offer and they accepted)
    
    const [requestedByMe, requestedFromMe] = await Promise.all([
      // Requests I made that were accepted
      prisma.offerRequest.findMany({
        where: {
          requesterUserId: userId,
          status: 'ACCEPTED',
        },
        select: { offerId: true },
      }),
      // Requests to my offers that I accepted
      prisma.offerRequest.findMany({
        where: {
          status: 'ACCEPTED',
          offer: {
            team: {
              contactUserId: userId,
            },
          },
        },
        select: { offerId: true },
      }),
    ])

    const allOfferIds = [
      ...requestedByMe.map(r => r.offerId),
      ...requestedFromMe.map(r => r.offerId),
    ]

    // Remove duplicates
    const uniqueOfferIds = [...new Set(allOfferIds)]

    if (uniqueOfferIds.length === 0) {
      return NextResponse.json({ items: [], count: 0 })
    }

    // Fetch offer details
    const offers = await prisma.gameOffer.findMany({
      where: { id: { in: uniqueOfferIds } },
      include: {
        team: { include: { club: true } },
        ages: true,
      },
    })

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
        date: o.offerDate ? new Date(o.offerDate).toISOString().slice(0,10) : null,
        kickoffTime: o.kickoffTime ?? null,
        kickoffFlexible: !!o.kickoffFlexible,
        homeAway: o.homeAway as 'HOME' | 'AWAY' | 'FLEX',
        notes: o.notes ?? null,
        playTime: o.durationText ?? null,
        strengthLabel,
        address,
        logoUrl: club?.logoUrl ?? null,
      }
    })

    return NextResponse.json({ items, count: items.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}
