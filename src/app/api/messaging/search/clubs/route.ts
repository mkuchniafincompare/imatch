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

  if (query.length < 2) {
    return NextResponse.json({ clubs: [] })
  }

  try {
    const clubs = await prisma.club.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        city: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: 10,
    })

    return NextResponse.json({ clubs })
  } catch (error) {
    console.error('Club search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
