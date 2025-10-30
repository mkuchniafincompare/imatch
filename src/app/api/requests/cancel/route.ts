import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/replitmail'
import { getUserIdFromCookie } from '@/lib/auth'
import { sendSystemMessage } from '@/lib/messaging'

// POST /api/requests/cancel
// body: { offerId: string, reason?: string }
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'nicht eingeloggt' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const offerId = String(body?.offerId || '').trim()
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : null

    if (!offerId) {
      return NextResponse.json({ error: 'offerId fehlt' }, { status: 400 })
    }

    // Find the accepted request for this offer
    const request = await prisma.offerRequest.findFirst({
      where: {
        offerId,
        status: 'ACCEPTED',
        OR: [
          { requesterUserId: userId },
          { offer: { team: { contactUserId: userId } } },
        ],
      },
      include: {
        offer: {
          include: {
            team: {
              include: {
                club: true,
                contactUser: {
                  select: { id: true, email: true, firstName: true, lastName: true },
                },
              },
            },
            ages: true,
          },
        },
      },
    })

    if (!request) {
      return NextResponse.json({ error: 'Kein vereinbartes Spiel gefunden' }, { status: 404 })
    }

    // Get requester info separately
    const requester = await prisma.user.findUnique({
      where: { id: request.requesterUserId },
      select: { id: true, email: true, firstName: true, lastName: true },
    })

    // Verify user is either the requester or the offer owner
    const isRequester = request.requesterUserId === userId
    const isOwner = request.offer.team?.contactUserId === userId

    if (!isRequester && !isOwner) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Set request status to CANCELED
    await prisma.offerRequest.update({
      where: {
        requesterUserId_offerId: {
          requesterUserId: request.requesterUserId,
          offerId: request.offerId,
        },
      },
      data: {
        status: 'CANCELED',
      },
    })

    // Remove SavedOffer from requester (they no longer need it saved since match is cancelled)
    await prisma.savedOffer.delete({
      where: {
        userId_offerId: {
          userId: request.requesterUserId,
          offerId: request.offerId,
        },
      },
    }).catch(() => null) // ignore if doesn't exist

    // Find all other users who have this offer saved
    const otherSavedOffers = await prisma.savedOffer.findMany({
      where: {
        offerId: request.offerId,
        userId: { not: request.requesterUserId },
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    })

    // Determine who cancelled and who should be notified
    const canceller = isRequester ? requester : request.offer.team?.contactUser
    const recipient = isRequester ? request.offer.team?.contactUser : requester

    if (!canceller || !recipient) {
      return NextResponse.json({ error: 'User-Daten nicht gefunden' }, { status: 500 })
    }

    const clubName = request.offer.team?.club?.name || 'Unbekannter Verein'
    const ageLabel = request.offer.ages[0]?.ageGroup || '—'
    const offerDate = request.offer.offerDate
      ? new Date(request.offer.offerDate).toLocaleDateString('de-DE')
      : '—'

    const cancellerName = `${canceller.firstName} ${canceller.lastName}`
    const reasonText = reason ? `\n\nBegründung: ${reason}` : ''

    // 1) Notification
    await prisma.notification.create({
      data: {
        userId: recipient.id,
        type: 'REQUEST_CANCELED',
        title: 'Spiel abgesagt',
        message: `${cancellerName} hat das ${ageLabel}-Spiel vom ${offerDate} abgesagt.${reasonText}`,
        relatedOfferId: offerId,
        relatedRequesterId: canceller.id,
      },
    }).catch(() => null)

    // 2) Chat-Nachricht
    const cancelMessage = `Hallo,\n\nich muss leider das vereinbarte Spiel (${clubName} ${ageLabel} am ${offerDate}) absagen.${reasonText}\n\nTut mir leid für die Unannehmlichkeiten.`
    await sendSystemMessage({
      fromUserId: canceller.id,
      toUserId: recipient.id,
      text: cancelMessage,
    }).catch(() => null)

    // 3) Email
    if (recipient.email) {
      sendEmail({
        to: recipient.email,
        subject: `iMatch: Spielabsage ${clubName} ${ageLabel}`,
        text: `Hallo ${recipient.firstName},\n\n${cancellerName} hat das Spiel abgesagt:\n\nVerein: ${clubName}\nAltersklasse: ${ageLabel}\nDatum: ${offerDate}${reasonText}\n\nMelde dich in iMatch an, um weitere Details zu sehen.\n\nViele Grüße,\niMatch Team`,
      }).catch((err) => {
        console.log('Email not sent (mail not configured):', err.message)
      })
    }

    // 4) Notify all other users who have this offer saved that it's available again
    for (const savedOffer of otherSavedOffers) {
      const savedUser = savedOffer.user

      // Notification
      await prisma.notification.create({
        data: {
          userId: savedUser.id,
          type: 'OFFER_AVAILABLE_AGAIN',
          title: 'Gemerktes Spiel wieder verfügbar',
          message: `Das ${ageLabel}-Spiel von ${clubName} vom ${offerDate} wurde abgesagt und ist wieder verfügbar. Du kannst jetzt eine Anfrage senden!`,
          relatedOfferId: offerId,
        },
      }).catch(() => null)

      // Chat-Nachricht (nur wenn contactUserId verfügbar)
      if (request.offer.team?.contactUserId) {
        const availableMessage = `Ein von dir gemerktes Spielangebot ist wieder verfügbar!\n\nVerein: ${clubName}\nAltersklasse: ${ageLabel}\nDatum: ${offerDate}\n\nDu kannst jetzt eine Anfrage senden.`
        await sendSystemMessage({
          fromUserId: request.offer.team.contactUserId,
          toUserId: savedUser.id,
          text: availableMessage,
        }).catch(() => null)
      }

      // Email
      if (savedUser.email) {
        sendEmail({
          to: savedUser.email,
          subject: `iMatch: Gemerktes Spiel wieder verfügbar`,
          text: `Hallo ${savedUser.firstName},\n\nein von dir gemerktes Spiel ist wieder verfügbar:\n\nVerein: ${clubName}\nAltersklasse: ${ageLabel}\nDatum: ${offerDate}\n\nDas Spiel wurde abgesagt und du kannst jetzt eine Anfrage senden!\n\nMelde dich in iMatch an, um das Angebot zu sehen.\n\nViele Grüße,\niMatch Team`,
        }).catch((err) => {
          console.log('Email not sent (mail not configured):', err.message)
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('POST /api/requests/cancel error:', e)
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}
