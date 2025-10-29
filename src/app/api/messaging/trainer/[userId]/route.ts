import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const currentUserId = await getUserIdFromCookie()
  if (!currentUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await params

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        teams: {
          select: {
            id: true,
            ageGroup: true,
            club: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 1,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const team = user.teams[0]
    const clubName = team?.club?.name || 'Kein Verein'
    const ageGroup = team?.ageGroup || null

    const trainer = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      clubName,
      ageGroup,
      displayText: `${user.firstName} ${user.lastName} (${clubName})${ageGroup ? ' ' + ageGroup : ''}`,
    }

    return NextResponse.json({ trainer })
  } catch (error) {
    console.error('Get trainer error:', error)
    return NextResponse.json({ error: 'Failed to get trainer' }, { status: 500 })
  }
}
