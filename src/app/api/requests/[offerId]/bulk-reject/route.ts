// src/app/api/requests/[offerId]/bulk-reject/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(
  req: Request,
  context: { params: Promise<{ offerId: string }> }
) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const { offerId } = await context.params
    const { message } = await req.json()

    // Verify ownership
    const offer = await prisma.gameOffer.findUnique({
      where: { id: offerId },
      include: { 
        team: { 
          include: { 
            club: true 
          } 
        } 
      },
    })

    if (!offer || offer.team?.contactUserId !== userId) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Get all PENDING requests for this offer
    const pendingRequests = await prisma.offerRequest.findMany({
      where: { 
        offerId,
        status: 'PENDING',
      },
      include: {
        requesterUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (pendingRequests.length === 0) {
      return NextResponse.json({ message: 'Keine offenen Anfragen vorhanden' })
    }

    // Update all PENDING requests to REJECTED
    await prisma.offerRequest.updateMany({
      where: {
        offerId,
        status: 'PENDING',
      },
      data: {
        status: 'REJECTED',
        responseMessage: message || null,
        respondedAt: new Date(),
      },
    })

    // Create notifications and send emails for each rejected request
    const ownerClubName = offer.team.club.name
    
    for (const request of pendingRequests) {
      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: request.requesterUserId,
          type: 'REQUEST_REJECTED',
          title: 'Anfrage abgelehnt',
          message: message 
            ? `Deine Anfrage an ${ownerClubName} wurde abgelehnt: ${message}`
            : `Deine Anfrage an ${ownerClubName} wurde abgelehnt.`,
          relatedOfferId: offerId,
        },
      })

      // Send email notification
      const emailSubject = 'Anfrage abgelehnt - iMatch'
      const emailBody = message
        ? `Hallo ${request.requesterUser.firstName},\n\nDeine Anfrage an ${ownerClubName} wurde abgelehnt.\n\nNachricht: ${message}\n\nViele Grüße,\nDein iMatch Team`
        : `Hallo ${request.requesterUser.firstName},\n\nDeine Anfrage an ${ownerClubName} wurde abgelehnt.\n\nViele Grüße,\nDein iMatch Team`

      try {
        await sendEmail({
          to: request.requesterUser.email,
          subject: emailSubject,
          text: emailBody,
        })
      } catch (emailError) {
        console.error('Failed to send email to', request.requesterUser.email, emailError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      rejectedCount: pendingRequests.length,
    })
  } catch (e: any) {
    console.error('Bulk reject error:', e)
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}
