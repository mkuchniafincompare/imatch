export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// src/app/api/requests/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getUserIdFromCookie(req: Request): string | null {
  try {
    const cookie = req.headers.get('cookie') || ''
    const m = /(?:^|;\s*)mm_session=([^;]+)/.exec(cookie)
    if (!m) return null
    const val = decodeURIComponent(m[1])
    if (!val.startsWith('uid:')) return null
    return val.slice(4)
  } catch {
    return null
  }
}

// GET /api/requests
// - optional: ?ids=offer1,offer2 -> returns which of these are already requested by the user
// - otherwise: returns all requested offerIds for the user
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromCookie(req)
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
    const userId = getUserIdFromCookie(req)
    if (!userId) {
      return NextResponse.json({ error: 'nicht eingeloggt' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const offerId = String(body?.offerId || '').trim()
    const message = typeof body?.message === 'string' ? body.message.trim() : null
    if (!offerId) return NextResponse.json({ error: 'offerId fehlt' }, { status: 400 })

    // ensure offer exists and is not user's own offer
    const offer = await prisma.gameOffer.findUnique({
      where: { id: offerId },
      select: { id: true, team: { select: { contactUserId: true } } },
    })
    if (!offer) return NextResponse.json({ error: 'offerId unbekannt' }, { status: 404 })
    if (offer.team?.contactUserId === userId) {
      return NextResponse.json({ error: 'eigene Angebote können nicht angefragt werden' }, { status: 400 })
    }

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
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}

// DELETE /api/requests
// body: { offerId: string }
export async function DELETE(req: Request) {
  try {
    const userId = getUserIdFromCookie(req)
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
