import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const teams = await prisma.team.findMany({
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

function getUserIdFromReq(req: Request) {
  const raw = req.headers.get('cookie') || ''
  const m = raw.match(/(?:^|;\s*)mm_session=([^;]+)/)
  if (!m) return null
  const decoded = decodeURIComponent(m[1]) // wichtig: %3A -> :
  return decoded.startsWith('uid:') ? decoded.slice(4) : null
}

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromReq(req)
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const { clubId, name, ageGroup, year, preferredForm } = await req.json()

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
        ageGroup,
        level: 'MITTEL',
        name: name?.trim() || null,
        year: yearNum,
        preferredForm: preferredForm || null,
      },
      select: { id: true, clubId: true, name: true, ageGroup: true, year: true, preferredForm: true },
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
