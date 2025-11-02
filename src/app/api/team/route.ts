import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'

export async function GET() {
  // SECURITY: Nur Teams des aktuellen Users zurückgeben
  const userId = await getUserIdFromCookie()
  if (!userId) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  const teams = await prisma.team.findMany({
    where: { contactUserId: userId },
    include: { club: true },
    orderBy: [{ id: 'asc' }],
    take: 50,
  })

  return NextResponse.json({
    count: teams.length,
    items: teams.map(t => ({
      id: t.id,
      ageGroup: t.ageGroup,
      level: t.level,
      club: t.club?.name ?? null,
      city: t.club?.city ?? null,
    })),
  })
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const { clubId, name, ageCategory, ageGroup, year, preferredForm } = await req.json()

    if (!clubId || !ageGroup) {
      return NextResponse.json({ error: 'clubId und ageGroup sind erforderlich' }, { status: 400 })
    }
    const yearNum = year ? Number(year) : null
    if (yearNum && (Number.isNaN(yearNum) || yearNum < 2000 || yearNum > 2100)) {
      return NextResponse.json({ error: 'Ungültiger Jahrgang' }, { status: 400 })
    }

    const club = await prisma.club.findUnique({ where: { id: clubId } })
    if (!club) return NextResponse.json({ error: 'Verein nicht gefunden' }, { status: 404 })

    const team = await prisma.team.create({
      data: {
        clubId,
        contactUserId: userId,
        ageCategory: ageCategory || null,
        ageGroup,
        level: 'MITTEL',
        name: name?.trim() || null,
        year: yearNum,
        preferredForm: preferredForm || null,
      },
      select: { id: true, clubId: true, name: true, ageCategory: true, ageGroup: true, year: true, preferredForm: true },
    })

    return NextResponse.json({
      message: 'Team angelegt',
      team,
      next: '/register/done'
    },
    { status: 201 })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
