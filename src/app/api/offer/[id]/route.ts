import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()
    const { id: offerId } = await params

    const offer = await prisma.gameOffer.findUnique({
      where: { id: offerId },
      include: {
        team: {
          include: {
            club: true,
          },
        },
        ages: true,
      },
    })

    if (!offer) {
      return NextResponse.json({ error: 'Angebot nicht gefunden' }, { status: 404 })
    }

    // Verify ownership
    if (offer.team.contactUserId !== userId) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Return all fields needed for editing
    return NextResponse.json({
      id: offer.id,
      teamId: offer.teamId,
      ages: offer.ages.map(a => a.ageGroup),
      offerDate: offer.offerDate,
      kickoffTime: offer.kickoffTime,
      kickoffFlexible: offer.kickoffFlexible,
      homeAway: offer.homeAway,
      fieldType: offer.fieldType,
      playForm: offer.playForm,
      strength: offer.strength,
      durationText: offer.durationText,
      notes: offer.notes,
      isReserved: offer.isReserved,
    })
  } catch (e: any) {
    if (e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'nicht eingeloggt' }, { status: 401 })
    }
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}
