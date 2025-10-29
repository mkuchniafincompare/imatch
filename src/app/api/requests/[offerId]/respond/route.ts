// src/app/api/requests/[offerId]/respond/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'
import { sendEmail } from '@/lib/replitmail'

// POST /api/requests/[offerId]/respond
// body: { requesterId: string, action: 'accept' | 'reject', message?: string }
export async function POST(
  req: Request,
  context: { params: Promise<{ offerId: string }> }
) {
  try {
    const { offerId } = await context.params
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const body = await req.json()
    const { requesterId, action, message } = body

    if (!requesterId || !action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'requesterId und action (accept/reject) erforderlich' }, { status: 400 })
    }
    
    const optionalMessage = message && typeof message === 'string' ? message.trim() : null

    // Verify offer belongs to current user
    const offer = await prisma.gameOffer.findUnique({
      where: { id: offerId },
      include: {
        team: {
          include: {
            club: true,
            contactUser: { select: { firstName: true, lastName: true } },
          },
        },
        ages: true,
      },
    })

    if (!offer) {
      return NextResponse.json({ error: 'Angebot nicht gefunden' }, { status: 404 })
    }

    if (offer.team?.contactUserId !== userId) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Get request details
    const request = await prisma.offerRequest.findUnique({
      where: {
        requesterUserId_offerId: {
          requesterUserId: requesterId,
          offerId,
        },
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

    if (!request) {
      return NextResponse.json({ error: 'Anfrage nicht gefunden' }, { status: 404 })
    }

    // Update request status
    const newStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED'
    
    // For ACCEPT: Check if another request was already accepted
    if (action === 'accept') {
      const existingAccepted = await prisma.offerRequest.findFirst({
        where: {
          offerId,
          status: 'ACCEPTED',
        },
      })

      if (existingAccepted && existingAccepted.requesterUserId !== requesterId) {
        return NextResponse.json({ error: 'Es wurde bereits eine andere Anfrage akzeptiert' }, { status: 400 })
      }
    }

    await prisma.offerRequest.update({
      where: {
        requesterUserId_offerId: {
          requesterUserId: requesterId,
          offerId,
        },
      },
      data: { status: newStatus },
    })

    // Prepare notification details
    const clubName = offer.team?.club?.name || 'Unbekannter Verein'
    const ageLabel = offer.ages[0]?.ageGroup || '—'
    const offerDate = offer.offerDate ? new Date(offer.offerDate).toLocaleDateString('de-DE') : '—'
    const ownerName = `${offer.team?.contactUser?.firstName} ${offer.team?.contactUser?.lastName}`

    if (action === 'accept') {
      // 1) Notification
      const acceptNotificationMessage = optionalMessage
        ? `${ownerName} hat deine Anfrage für ${clubName} ${ageLabel} (${offerDate}) akzeptiert. Nachricht: ${optionalMessage}`
        : `${ownerName} hat deine Anfrage für ${clubName} ${ageLabel} (${offerDate}) akzeptiert.`
      
      await prisma.notification.create({
        data: {
          userId: requesterId,
          type: 'REQUEST_ACCEPTED',
          title: 'Anfrage akzeptiert! 🎉',
          message: acceptNotificationMessage,
          relatedOfferId: offerId,
          relatedRequesterId: userId,
        },
      }).catch(() => null)

      // 2) InboxMessage
      const acceptMessage = optionalMessage 
        ? `Deine Anfrage wurde akzeptiert! Das Spiel gegen ${clubName} am ${offerDate} ist vereinbart.\n\nNachricht von ${ownerName}: ${optionalMessage}`
        : `Deine Anfrage wurde akzeptiert! Das Spiel gegen ${clubName} am ${offerDate} ist vereinbart.`
      
      await prisma.inboxMessage.create({
        data: {
          fromUserId: userId,
          toUserId: requesterId,
          subject: `Spielanfrage akzeptiert: ${clubName} ${ageLabel}`,
          message: acceptMessage,
          relatedOfferId: offerId,
          relatedRequestId: `${requesterId}_${offerId}`,
        },
      }).catch(() => null)

      // 3) Email
      if (request.requesterUser.email) {
        try {
          const acceptEmailText = optionalMessage
            ? `Hallo ${request.requesterUser.firstName},\n\ntolle Neuigkeiten! ${ownerName} hat deine Anfrage akzeptiert.\n\nSpieldetails:\nVerein: ${clubName}\nAltersklasse: ${ageLabel}\nDatum: ${offerDate}\n\nNachricht von ${ownerName}:\n${optionalMessage}\n\nMelde dich in iMatch an, um weitere Details zu klären.\n\nViel Erfolg beim Spiel!\niMatch Team`
            : `Hallo ${request.requesterUser.firstName},\n\ntolle Neuigkeiten! ${ownerName} hat deine Anfrage akzeptiert.\n\nSpieldetails:\nVerein: ${clubName}\nAltersklasse: ${ageLabel}\nDatum: ${offerDate}\n\nMelde dich in iMatch an, um weitere Details zu klären.\n\nViel Erfolg beim Spiel!\niMatch Team`
          
          await sendEmail({
            to: request.requesterUser.email,
            subject: `iMatch: Anfrage akzeptiert - ${clubName} ${ageLabel}`,
            text: acceptEmailText,
          })
        } catch (e) {
          console.error('Email failed:', e)
        }
      }
    } else {
      // REJECT
      // 1) Notification
      const rejectNotificationMessage = optionalMessage
        ? `${ownerName} hat deine Anfrage für ${clubName} ${ageLabel} (${offerDate}) abgelehnt. Nachricht: ${optionalMessage}`
        : `${ownerName} hat deine Anfrage für ${clubName} ${ageLabel} (${offerDate}) abgelehnt.`
      
      await prisma.notification.create({
        data: {
          userId: requesterId,
          type: 'REQUEST_REJECTED',
          title: 'Anfrage abgelehnt',
          message: rejectNotificationMessage,
          relatedOfferId: offerId,
          relatedRequesterId: userId,
        },
      }).catch(() => null)

      // 2) InboxMessage
      const rejectMessage = optionalMessage 
        ? `Leider wurde deine Anfrage für das Spiel gegen ${clubName} am ${offerDate} abgelehnt.\n\nNachricht von ${ownerName}: ${optionalMessage}`
        : `Leider wurde deine Anfrage für das Spiel gegen ${clubName} am ${offerDate} abgelehnt.`
      
      await prisma.inboxMessage.create({
        data: {
          fromUserId: userId,
          toUserId: requesterId,
          subject: `Spielanfrage abgelehnt: ${clubName} ${ageLabel}`,
          message: rejectMessage,
          relatedOfferId: offerId,
          relatedRequestId: `${requesterId}_${offerId}`,
        },
      }).catch(() => null)

      // 3) Email
      if (request.requesterUser.email) {
        try {
          const rejectEmailText = optionalMessage
            ? `Hallo ${request.requesterUser.firstName},\n\nleider wurde deine Anfrage für das Spiel gegen ${clubName} (${ageLabel}) am ${offerDate} abgelehnt.\n\nNachricht von ${ownerName}:\n${optionalMessage}\n\nDu findest viele weitere Spielangebote auf iMatch.\n\nViel Erfolg bei der Suche!\niMatch Team`
            : `Hallo ${request.requesterUser.firstName},\n\nleider wurde deine Anfrage für das Spiel gegen ${clubName} (${ageLabel}) am ${offerDate} abgelehnt.\n\nDu findest viele weitere Spielangebote auf iMatch.\n\nViel Erfolg bei der Suche!\niMatch Team`
          
          await sendEmail({
            to: request.requesterUser.email,
            subject: `iMatch: Anfrage abgelehnt - ${clubName} ${ageLabel}`,
            text: rejectEmailText,
          })
        } catch (e) {
          console.error('Email failed:', e)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: action === 'accept' ? 'Anfrage akzeptiert' : 'Anfrage abgelehnt',
      status: newStatus,
    })
  } catch (e: any) {
    console.error('Respond error:', e)
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}
