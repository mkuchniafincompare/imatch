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

    // Return all saved offer ids for this user
    const rows = await prisma.savedOffer.findMany({
      where: { userId },
      select: { offerId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({
      savedIds: rows.map(r => r.offerId),
      count: rows.length,
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
