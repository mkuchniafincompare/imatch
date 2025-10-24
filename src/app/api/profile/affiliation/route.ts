

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    // --- Session prüfen
    const cookie = req.headers.get('cookie') || ''
    const match = cookie.match(/mm_session=([^;]+)/)
    if (!match) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }
    const val = decodeURIComponent(match[1])
    if (!val.startsWith('uid:')) {
      return NextResponse.json({ error: 'Ungültige Session' }, { status: 400 })
    }
    const userId = val.slice(4)

    // --- Teams laden, für die der User als Kontakt eingetragen ist
    const teams = await prisma.team.findMany({
      where: { contactUserId: userId },
      include: { club: true },
    })

    if (!teams || teams.length === 0) {
      return NextResponse.json({ club: null, teams: [] }, { status: 200 })
    }

    // Falls mehrere Clubs (edge case), nehmen wir den vom ersten Team als "primary"
    const primaryClub = teams[0].club || null

    const club = primaryClub
      ? {
          id: primaryClub.id,
          name: primaryClub.name,
          city: primaryClub.city ?? null,
          zip: primaryClub.zip ?? null,
          street: primaryClub.street ?? null,
          logoUrl: (primaryClub as any).logoUrl ?? null,
        }
      : null

    const teamItems = teams.map((t) => ({
      id: t.id,
      name: t.name ?? null,
      ageGroup: t.ageGroup ?? null,
      year: t.year ?? null,
      preferredForm: t.preferredForm ?? null,
      clubId: t.clubId,
    }))

    return NextResponse.json({ club, teams: teamItems }, { status: 200 })
  } catch (e: any) {
    console.error('Affiliation-API Fehler:', e)
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}