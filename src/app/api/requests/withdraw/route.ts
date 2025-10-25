import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/replitmail'

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { offerId } = await req.json()
    if (!offerId) {
      return NextResponse.json({ error: 'offerId required' }, { status: 400 })
    }

    // Find the request
    const request = await prisma.offerRequest.findUnique({
      where: {
        requesterUserId_offerId: {
          requesterUserId: userId,
          offerId,
        },
      },
      include: {
        offer: {
          include: {
            team: {
              include: {
                club: true,
                contactUser: true,
              },
            },
          },
        },
        requesterUser: true,
      },
    })

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const offer = request.offer
    const offerOwner = offer.team?.contactUser
    const requester = request.requesterUser

    // Delete the request
    await prisma.offerRequest.delete({
      where: {
        requesterUserId_offerId: {
          requesterUserId: userId,
          offerId,
        },
      },
    })

    // Send notification to offer owner
    if (offerOwner) {
      await prisma.notification.create({
        data: {
          userId: offerOwner.id,
          type: 'OFFER_UPDATED',
          title: 'Anfrage zurückgezogen',
          message: `${requester.firstName} ${requester.lastName} hat die Anfrage für dein Spielangebot zurückgezogen.`,
          relatedOfferId: offerId,
          relatedRequesterId: userId,
        },
      })

      // Send inbox message
      await prisma.inboxMessage.create({
        data: {
          fromUserId: userId,
          toUserId: offerOwner.id,
          subject: 'Anfrage zurückgezogen',
          message: `${requester.firstName} ${requester.lastName} hat die Anfrage für dein Spielangebot zurückgezogen.`,
          relatedOfferId: offerId,
        },
      })

      // Send email
      const offerDate = offer.offerDate
        ? new Date(offer.offerDate).toLocaleDateString('de-DE', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : 'Datum unbekannt'

      await sendEmail({
        to: offerOwner.email,
        subject: 'iMatch: Anfrage zurückgezogen',
        text: `Hallo ${offerOwner.firstName},

${requester.firstName} ${requester.lastName} hat die Anfrage für dein Spielangebot zurückgezogen.

Spieltermin: ${offerDate}
${offer.kickoffTime ? `Anstoß: ${offer.kickoffTime}` : ''}

Du kannst deine Angebote in der App einsehen.

Viele Grüße
Dein iMatch Team`,
        html: `<p>Hallo ${offerOwner.firstName},</p>
<p><strong>${requester.firstName} ${requester.lastName}</strong> hat die Anfrage für dein Spielangebot zurückgezogen.</p>
<p><strong>Spieltermin:</strong> ${offerDate}<br>
${offer.kickoffTime ? `<strong>Anstoß:</strong> ${offer.kickoffTime}` : ''}</p>
<p>Du kannst deine Angebote in der App einsehen.</p>
<p>Viele Grüße<br>Dein iMatch Team</p>`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Error withdrawing request:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
