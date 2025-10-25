// src/app/api/requests/[offerId]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'

// GET /api/requests/[offerId] - Liste aller Anfragen für ein bestimmtes Angebot
export async function GET(
  req: Request,
  context: { params: Promise<{ offerId: string }> }
) {
  try {
    const { offerId } = await context.params
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    // Verify offer belongs to current user
    const offer = await prisma.gameOffer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        team: { select: { contactUserId: true } },
      },
    })

    if (!offer) {
      return NextResponse.json({ error: 'Angebot nicht gefunden' }, { status: 404 })
    }

    if (offer.team?.contactUserId !== userId) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Get all requests for this offer
    const requests = await prisma.offerRequest.findMany({
      where: { offerId },
      include: {
        requesterUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get teams and clubs for each requester
    const enrichedRequests = await Promise.all(
      requests.map(async (req) => {
        const teams = await prisma.team.findMany({
          where: { contactUserId: req.requesterUserId },
          include: { club: true },
          take: 1,
        })

        const team = teams[0]
        return {
          requesterId: req.requesterUserId,
          requesterName: `${req.requesterUser.firstName} ${req.requesterUser.lastName}`,
          requesterEmail: req.requesterUser.email,
          clubName: team?.club?.name || '—',
          teamAgeGroup: team?.ageGroup || null,
          message: req.message,
          status: req.status,
          createdAt: req.createdAt.toISOString(),
        }
      })
    )

    return NextResponse.json({
      requests: enrichedRequests,
      count: enrichedRequests.length,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}
