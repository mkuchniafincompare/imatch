export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// src/app/api/requests/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/replitmail'
import { getUserIdFromCookie } from '@/lib/auth'

// GET /api/requests
// - optional: ?ids=offer1,offer2 -> returns which of these are already requested by the user
// - otherwise: returns all requested offerIds for the user
export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'nicht eingeloggt' }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const idsParam = searchParams.get('ids')

    if (idsParam) {
      const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean)
      if (ids.length === 0) return NextResponse.json({ requestedIds: [] })
      const rows = await prisma.offerRequest.findMany({
        where: { requesterUserId: userId, offerId: { in: ids } },
        select: { offerId: true },
      })
      return NextResponse.json({ requestedIds: rows.map(r => r.offerId) })
    }

    const rows = await prisma.offerRequest.findMany({
      where: { requesterUserId: userId },
      select: { offerId: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({
      requestedIds: rows.map(r => r.offerId),
      count: rows.length,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}

// POST /api/requests
// body: { offerId: string, message?: string }
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'nicht eingeloggt' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const offerId = String(body?.offerId || '').trim()
    const message = typeof body?.message === 'string' ? body.message.trim() : null
    if (!offerId) return NextResponse.json({ error: 'offerId fehlt' }, { status: 400 })

    // Get full offer details with team, club, and requester info
    const offer = await prisma.gameOffer.findUnique({
      where: { id: offerId },
      include: {
        team: {
          include: {
            club: true,
            contactUser: { select: { id: true, email: true, firstName: true, lastName: true } }
          }
        },
        ages: true,
      },
    })
    
    if (!offer) return NextResponse.json({ error: 'offerId unbekannt' }, { status: 404 })
    if (offer.team?.contactUserId === userId) {
      return NextResponse.json({ error: 'eigene Angebote können nicht angefragt werden' }, { status: 400 })
    }

    const targetUserId = offer.team?.contactUserId
    if (!targetUserId) return NextResponse.json({ error: 'Kein Ansprechpartner gefunden' }, { status: 400 })

    // Get requester info
    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    })
    if (!requester) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })

    // Create or update request
    await prisma.offerRequest.upsert({
      where: { requesterUserId_offerId: { requesterUserId: userId, offerId } },
      update: { message: message ?? undefined },
      create: {
        requesterUserId: userId,
        offerId,
        message: message,
        status: 'PENDING',
      },
    })
    
    // Always send notifications (even for re-requests)
    {
      const clubName = offer.team?.club?.name || 'Unbekannter Verein'
      const ageLabel = offer.ages[0]?.ageGroup || '—'
      const offerDate = offer.offerDate ? new Date(offer.offerDate).toLocaleDateString('de-DE') : '—'
      
      // 1) Notification
      await prisma.Notification.create({
        data: {
          userId: targetUserId,
          type: 'REQUEST_RECEIVED',
          title: 'Neue Spielanfrage',
          message: `${requester.firstName} ${requester.lastName} hat dein ${ageLabel}-Angebot vom ${offerDate} angefragt.`,
          relatedOfferId: offerId,
          relatedRequesterId: userId,
        },
      }).catch(() => null)

      // 2) InboxMessage
      await prisma.InboxMessage.create({
        data: {
          fromUserId: userId,
          toUserId: targetUserId,
          subject: `Spielanfrage für ${clubName} ${ageLabel}`,
          message: message || `Ich interessiere mich für dein Spielangebot vom ${offerDate}.`,
          relatedOfferId: offerId,
          relatedRequestId: `${userId}_${offerId}`,
        },
      }).catch(() => null)

      // 3) Email - silently fail if email not configured
      const targetEmail = offer.team?.contactUser?.email
      if (targetEmail) {
        sendEmail({
          to: targetEmail,
          subject: `iMatch: Neue Anfrage für ${clubName} ${ageLabel}`,
          text: `Hallo ${offer.team?.contactUser?.firstName},\n\n${requester.firstName} ${requester.lastName} (${requester.email}) hat dein Spielangebot angefragt:\n\nVerein: ${clubName}\nAltersklasse: ${ageLabel}\nDatum: ${offerDate}\n\n${message ? `Nachricht: ${message}\n\n` : ''}Melde dich in iMatch an, um die Anfrage zu bearbeiten.\n\nViele Grüße,\niMatch Team`,
        }).catch((err) => {
          console.log('Email not sent (mail not configured):', err.message)
        })
      }
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/requests error:', e)
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}

// DELETE /api/requests
// body: { offerId: string }
export async function DELETE(req: Request) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'nicht eingeloggt' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const offerId = String(body?.offerId || '').trim()
    if (!offerId) return NextResponse.json({ error: 'offerId fehlt' }, { status: 400 })

    await prisma.offerRequest.delete({
      where: { requesterUserId_offerId: { requesterUserId: userId, offerId } },
    }).catch(() => null)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}

// OPTIONS (for safety / dev tooling)
export async function OPTIONS() {
  return NextResponse.json({ ok: true })
}
