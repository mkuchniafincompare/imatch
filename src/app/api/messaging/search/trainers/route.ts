import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromCookie()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const clubId = searchParams.get('clubId') || null

  if (query.length < 2 && !clubId) {
    return NextResponse.json({ trainers: [] })
  }

  try {
    // Build the where clause
    const whereClause: any = {
      id: {
        not: userId, // Exclude current user from search
      },
    }

    // If searching by name
    if (query.length >= 2) {
      whereClause.OR = [
        {
          firstName: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ]
    }

    // If filtering by club, find users who have teams in that club
    if (clubId) {
      whereClause.teams = {
        some: {
          clubId,
        },
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
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
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
      take: 10,
    })

    const trainers = users.map((user) => {
      const team = user.teams[0]
      const clubName = team?.club?.name || 'Kein Verein'
      const ageGroup = team?.ageGroup || null

      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        clubName,
        ageGroup,
        displayText: `${user.firstName} ${user.lastName} (${clubName})${ageGroup ? ' ' + ageGroup : ''}`,
      }
    })

    return NextResponse.json({ trainers })
  } catch (error) {
    console.error('Trainer search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
