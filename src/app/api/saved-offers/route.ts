// src/app/api/saved-offers/route.ts
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

export async function GET(req: Request) {
  try {
    const userId = getUserIdFromCookie(req)
    if (!userId) {
      return NextResponse.json({ error: 'nicht eingeloggt' }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const idsParam = searchParams.get('ids')

    if (idsParam) {
      // Return only the subset that is saved (useful for Matches-Page)
      const ids = idsParam
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      if (ids.length === 0) {
        return NextResponse.json({ savedIds: [] })
      }
      const rows = await prisma.savedOffer.findMany({
        where: { userId, offerId: { in: ids } },
        select: { offerId: true },
      })
      return NextResponse.json({ savedIds: rows.map(r => r.offerId) })
    }

    // Return all saved offer ids for this user, excluding offers with accepted requests
    const rows = await prisma.savedOffer.findMany({
      where: { 
        userId,
        // Exclude offers where user has an accepted request
        offer: {
          requests: {
            none: {
              requesterUserId: userId,
              status: 'ACCEPTED',
            },
          },
        },
      },
      select: { offerId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    
    // Auto-cleanup: Remove saved offers that are more than 24 hours past their match time
    const now = new Date()
    const gracePeriodMs = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    
    // Fetch all offer details in one query for better performance
    const offerIds = rows.map(r => r.offerId)
    const offers = await prisma.gameOffer.findMany({
      where: { id: { in: offerIds } },
      select: { id: true, offerDate: true, kickoffTime: true },
    })
    
    // Determine which offers are expired (more than 24h past kickoff)
    const expiredIds: string[] = []
    for (const offer of offers) {
      if (offer.offerDate && offer.kickoffTime) {
        const [hours, minutes] = offer.kickoffTime.split(':').map(Number)
        const offerDateTime = new Date(offer.offerDate)
        offerDateTime.setHours(hours, minutes, 0, 0)
        
        // Only remove if match was more than 24 hours ago
        if (now.getTime() - offerDateTime.getTime() > gracePeriodMs) {
          expiredIds.push(offer.id)
        }
      }
    }
    
    // Delete expired saved offers
    if (expiredIds.length > 0) {
      await prisma.savedOffer.deleteMany({
        where: {
          userId,
          offerId: { in: expiredIds },
        },
      }).catch(() => null)
    }
    
    // Filter out expired offers from results
    const validRows = rows.filter(r => !expiredIds.includes(r.offerId))
    
    return NextResponse.json({
      savedIds: validRows.map(r => r.offerId),
      count: validRows.length,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromCookie(req)
    if (!userId) {
      return NextResponse.json({ error: 'nicht eingeloggt' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const offerId = String(body?.offerId || '').trim()
    if (!offerId) {
      return NextResponse.json({ error: 'offerId fehlt' }, { status: 400 })
    }

    // ensure offer exists (optional but safer)
    const offer = await prisma.gameOffer.findUnique({ where: { id: offerId }, select: { id: true } })
    if (!offer) {
      return NextResponse.json({ error: 'offerId unbekannt' }, { status: 404 })
    }

    await prisma.savedOffer.upsert({
      where: { userId_offerId: { userId, offerId } },
      update: {},
      create: { userId, offerId },
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = getUserIdFromCookie(req)
    if (!userId) {
      return NextResponse.json({ error: 'nicht eingeloggt' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const offerId = String(body?.offerId || '').trim()
    if (!offerId) {
      return NextResponse.json({ error: 'offerId fehlt' }, { status: 400 })
    }
    await prisma.savedOffer.delete({
      where: { userId_offerId: { userId, offerId } },
    }).catch(() => null)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}
