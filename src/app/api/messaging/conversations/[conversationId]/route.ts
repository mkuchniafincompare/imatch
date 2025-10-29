import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const userId = await getUserIdFromCookie()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { conversationId } = await params

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        user2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Verify user is part of conversation
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mark all messages from the other user as read
    await prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        read: false,
      },
      data: {
        read: true,
      },
    })

    const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser: {
          id: otherUser.id,
          name: `${otherUser.firstName} ${otherUser.lastName}`,
        },
        messages: conversation.messages.map((msg) => ({
          id: msg.id,
          text: msg.text,
          senderId: msg.senderId,
          isOwn: msg.senderId === userId,
          createdAt: msg.createdAt,
          read: msg.read,
        })),
      },
    })
  } catch (error) {
    console.error('Fetch conversation messages error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}
