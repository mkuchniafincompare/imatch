import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'

export async function GET() {
  const userId = await getUserIdFromCookie()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            teams: {
              select: {
                club: {
                  select: {
                    name: true,
                  },
                },
                ageGroup: true,
              },
              take: 1,
            },
          },
        },
        user2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            teams: {
              select: {
                club: {
                  select: {
                    name: true,
                  },
                },
                ageGroup: true,
              },
              take: 1,
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: {
                  not: userId,
                },
                read: false,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const items = conversations.map((conv) => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1
      const lastMessage = conv.messages[0]
      const team = otherUser.teams[0]
      
      return {
        id: conv.id,
        otherUser: {
          id: otherUser.id,
          name: `${otherUser.firstName} ${otherUser.lastName}`,
          clubName: team?.club?.name || 'Kein Verein',
          ageGroup: team?.ageGroup || null,
        },
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              createdAt: lastMessage.createdAt,
              isOwn: lastMessage.senderId === userId,
            }
          : null,
        unreadCount: conv._count.messages,
        updatedAt: conv.updatedAt,
      }
    })

    return NextResponse.json({ conversations: items })
  } catch (error) {
    console.error('Fetch conversations error:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}
