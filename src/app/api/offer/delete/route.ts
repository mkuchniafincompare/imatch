import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const body = await req.json()
    const { offerId } = body

    if (!offerId) {
      return NextResponse.json({ error: 'Fehlende Angabe: offerId' }, { status: 400 })
    }

    // Verify ownership
    const offer = await prisma.gameOffer.findUnique({
      where: { id: offerId },
      include: {
        team: {
          include: {
            contactUser: true,
          },
        },
      },
    })

    if (!offer) {
      return NextResponse.json({ error: 'Angebot nicht gefunden' }, { status: 404 })
    }

    if (!offer.team.contactUserId) {
      return NextResponse.json({ error: 'Team has no contact user' }, { status: 400 })
    }

    if (offer.team.contactUserId !== userId) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Delete related records first (cascade)
    // 1. Get all matches for this offer
    const matches = await prisma.match.findMany({
      where: { offerId },
      select: { id: true },
    })
    const matchIds = matches.map(m => m.id)

    // 2. Delete all records in transaction
    await prisma.$transaction([
      // Delete match chat messages first
      ...(matchIds.length > 0 ? [prisma.message.deleteMany({ where: { matchId: { in: matchIds } } })] : []),
      // Delete matches
      ...(matchIds.length > 0 ? [prisma.match.deleteMany({ where: { offerId } })] : []),
      // Delete offer requests
      prisma.offerRequest.deleteMany({ where: { offerId } }),
      // Delete saved offers
      prisma.savedOffer.deleteMany({ where: { offerId } }),
      // Delete notifications
      prisma.notification.deleteMany({ where: { relatedOfferId: offerId } }),
      // Delete inbox messages
      prisma.inboxMessage.deleteMany({ where: { relatedOfferId: offerId } }),
      // Delete offer age groups
      prisma.offerAge.deleteMany({ where: { offerId } }),
      // Finally delete the offer itself
      prisma.gameOffer.delete({ where: { id: offerId } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete offer error:', error)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
