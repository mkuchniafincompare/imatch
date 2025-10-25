import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      offerId,
      offerDate,
      kickoffTime,
      kickoffFlexible,
      strength,
      playForm,
      durationText,
      homeAway,
      fieldType,
      notes,
      isReserved,
    } = body

    if (!offerId) {
      return NextResponse.json({ error: 'offerId required' }, { status: 400 })
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
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Security: Reject if team has no contact user or if user is not the owner
    if (!offer.team.contactUserId) {
      return NextResponse.json({ error: 'Team has no contact user' }, { status: 400 })
    }

    if (offer.team.contactUserId !== userId) {
      return NextResponse.json({ error: 'Not authorized to edit this offer' }, { status: 403 })
    }

    // Update the offer
    const updated = await prisma.gameOffer.update({
      where: { id: offerId },
      data: {
        offerDate: offerDate ? new Date(offerDate) : undefined,
        kickoffTime: kickoffTime || null,
        kickoffFlexible: kickoffFlexible !== undefined ? kickoffFlexible : undefined,
        strength: strength || null,
        playForm: playForm || null,
        durationText: durationText || null,
        homeAway: homeAway || undefined,
        fieldType: fieldType || undefined,
        notes: notes || null,
        isReserved: isReserved !== undefined ? isReserved : undefined,
      },
    })

    return NextResponse.json({ success: true, offer: updated })
  } catch (e: any) {
    console.error('Error updating offer:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
