import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const { teamId } = await req.json()

    if (!teamId) {
      return NextResponse.json({ error: 'teamId ist erforderlich' }, { status: 400 })
    }

    // ATOMIC OPERATION: Nur Teams die noch frei sind (contactUserId === null)
    // ODER bereits dem User gehören können zugeordnet werden
    // updateMany mit WHERE-Bedingung macht die Operation atomar und verhindert Race Conditions
    const result = await prisma.team.updateMany({
      where: {
        id: teamId,
        OR: [
          { contactUserId: null },
          { contactUserId: userId }
        ]
      },
      data: { contactUserId: userId as string },
    })

    // Wenn count === 0, dann war das Team bereits assigned oder existiert nicht
    if (result.count === 0) {
      const team = await prisma.team.findUnique({ where: { id: teamId } })
      if (!team) {
        return NextResponse.json({ error: 'Team nicht gefunden' }, { status: 404 })
      }
      return NextResponse.json({ 
        error: 'Dieses Team ist bereits einem anderen Benutzer zugeordnet und kann nicht übernommen werden.' 
      }, { status: 403 })
    }

    // Team erfolgreich zugeordnet - lade Details
    const updatedTeam = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, clubId: true, name: true, ageGroup: true, year: true },
    })

    return NextResponse.json({
      message: 'Team zugeordnet',
      team: updatedTeam,
    }, { status: 200 })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
