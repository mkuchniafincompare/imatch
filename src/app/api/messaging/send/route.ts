import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromCookie()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { receiverId, text } = body

    if (!receiverId || !text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Normalize user IDs to ensure consistent ordering
    const [user1Id, user2Id] = [userId, receiverId].sort()

    // Find or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id,
          user2Id,
        },
      },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id,
          user2Id,
        },
      })
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        text: text.trim(),
      },
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
