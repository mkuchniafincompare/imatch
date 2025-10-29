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

    // Update the offer - only update fields that are explicitly provided
    const updateData: any = {}
    
    if (offerDate !== undefined) {
      updateData.offerDate = offerDate ? new Date(offerDate) : null
    }
    if (kickoffTime !== undefined) {
      updateData.kickoffTime = kickoffTime || null
    }
    if (kickoffFlexible !== undefined) {
      updateData.kickoffFlexible = kickoffFlexible
    }
    if (strength !== undefined) {
      updateData.strength = strength || null
    }
    if (playForm !== undefined) {
      updateData.playForm = playForm || null
    }
    if (durationText !== undefined) {
      updateData.durationText = durationText || null
    }
    if (homeAway !== undefined) {
      updateData.homeAway = homeAway
    }
    if (fieldType !== undefined) {
      updateData.fieldType = fieldType
    }
    if (notes !== undefined) {
      updateData.notes = notes || null
    }
    if (isReserved !== undefined) {
      updateData.isReserved = isReserved
    }

    const updated = await prisma.gameOffer.update({
      where: { id: offerId },
      data: updateData,
    })

    return NextResponse.json({ success: true, offer: updated })
  } catch (e: any) {
    console.error('Error updating offer:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
