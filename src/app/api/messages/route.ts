// src/app/api/messages/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'

// GET /api/messages - Liste aller Nachrichten des Users + unread count
export async function GET() {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const messages = await prisma.InboxMessage.findMany({
      where: { toUserId: userId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = await prisma.InboxMessage.count({
      where: { toUserId: userId, read: false },
    })

    return NextResponse.json({
      items: messages,
      unreadCount,
      count: messages.length,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}

// POST /api/messages - Neue Nachricht senden
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const body = await req.json()
    const { toUserId, subject, message, relatedOfferId, relatedRequestId } = body

    if (!toUserId || !subject || !message) {
      return NextResponse.json({ error: 'toUserId, subject und message sind erforderlich' }, { status: 400 })
    }

    const newMessage = await prisma.InboxMessage.create({
      data: {
        fromUserId: userId,
        toUserId,
        subject,
        message,
        relatedOfferId: relatedOfferId || null,
        relatedRequestId: relatedRequestId || null,
      },
    })

    return NextResponse.json(newMessage, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}

// PATCH /api/messages - Markiere Nachricht(en) als gelesen
export async function PATCH(req: Request) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { messageId, markAllAsRead } = body

    if (markAllAsRead) {
      await prisma.InboxMessage.updateMany({
        where: { toUserId: userId, read: false },
        data: { read: true },
      })
      return NextResponse.json({ ok: true, message: 'Alle Nachrichten als gelesen markiert' })
    }

    if (messageId) {
      await prisma.InboxMessage.updateMany({
        where: { id: messageId, toUserId: userId },
        data: { read: true },
      })
      return NextResponse.json({ ok: true, message: 'Nachricht als gelesen markiert' })
    }

    return NextResponse.json({ error: 'messageId oder markAllAsRead erforderlich' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}
