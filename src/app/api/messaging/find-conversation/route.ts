import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromCookie()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const otherUserId = searchParams.get('userId')

  if (!otherUserId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
  }

  try {
    // Normalize user IDs (smaller ID first)
    const [user1Id, user2Id] = [userId, otherUserId].sort()

    // Try to find existing conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id,
          user2Id,
        },
      },
      select: {
        id: true,
      },
    })

    if (conversation) {
      return NextResponse.json({ 
        exists: true, 
        conversationId: conversation.id 
      })
    } else {
      return NextResponse.json({ 
        exists: false, 
        otherUserId 
      })
    }
  } catch (error) {
    console.error('Find conversation error:', error)
    return NextResponse.json({ error: 'Failed to find conversation' }, { status: 500 })
  }
}
