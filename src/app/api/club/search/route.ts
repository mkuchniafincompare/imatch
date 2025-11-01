import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function tokenize(q: string) {
  return q.normalize('NFKC').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
}

function buildWhere(tokens: string[]) {
  if (tokens.length === 0) return {} as any
  
  // Each token must match in at least one field (name or city)
  // Case-insensitive fuzzy search
  return {
    AND: tokens.map((t) => ({
      OR: [
        { name: { contains: t, mode: 'insensitive' } },
        { city: { contains: t, mode: 'insensitive' } },
      ],
    })),
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()

    if (!q) {
      return NextResponse.json({ query: q, count: 0, items: [] })
    }

    const tokens = tokenize(q)
    const where = buildWhere(tokens)

    const clubs = await prisma.club.findMany({
      where,
      select: {
        id: true,
        name: true,
        city: true,
        street: true,
        zip: true,
        _count: { select: { teams: true, venues: true } },
      },
      orderBy: [{ name: 'asc' }],
      take: 20,
    })

    const items = clubs.map((c) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      street: c.street ?? null,
      zip: c.zip ?? null,
      teamsCount: c._count.teams,
      venuesCount: c._count.venues,
      hasTeams: c._count.teams > 0,
      hasVenues: c._count.venues > 0,
    }))

    return NextResponse.json({ query: q, count: items.length, items })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}