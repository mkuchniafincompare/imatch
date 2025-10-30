import { NextResponse } from 'next/server'
import { getUserIdFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const unreadCount = await prisma.chatMessage.count({
      where: {
        conversation: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        },
        senderId: {
          not: userId
        },
        read: false
      }
    })

    return NextResponse.json({ unreadCount })
  } catch (e: any) {
    console.error('GET /api/messaging/unread-count error:', e)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
