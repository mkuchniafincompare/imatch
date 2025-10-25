// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'

// GET /api/notifications - Liste aller Benachrichtigungen des Users + unread count
export async function GET() {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    })

    return NextResponse.json({
      notifications,
      unreadCount,
      count: notifications.length,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}

// POST /api/notifications - Neue Benachrichtigung erstellen (intern)
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const body = await req.json()
    const { targetUserId, type, title, message, relatedOfferId, relatedRequesterId } = body

    if (!targetUserId || !type || !title) {
      return NextResponse.json({ error: 'Fehlende Parameter' }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        type,
        title,
        message: message || null,
        relatedOfferId: relatedOfferId || null,
        relatedRequesterId: relatedRequesterId || null,
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}

// PATCH /api/notifications - Markiere alle als gelesen
export async function PATCH(req: Request) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { notificationId, markAllAsRead } = body

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      })
      return NextResponse.json({ ok: true, message: 'Alle als gelesen markiert' })
    }

    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { read: true },
      })
      return NextResponse.json({ ok: true, message: 'Benachrichtigung als gelesen markiert' })
    }

    return NextResponse.json({ error: 'notificationId oder markAllAsRead erforderlich' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}
