import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
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

    const team = await prisma.team.findFirst({
      where: { contactUserId: userId },
      include: { club: true },
    })

    if (!team) {
      return NextResponse.json({ defaults: null }, { status: 200 })
    }

    const defaults = {
      ageGroup: team.ageGroup ?? null,
      preferredForm: team.preferredForm ?? null,
      city: team.club?.city ?? null,
      zip: team.club?.zip ?? null,
    }

    return NextResponse.json({ defaults }, { status: 200 })
  } catch (e: any) {
    console.error('Defaults-API Fehler:', e)
    return NextResponse.json({ error: e?.message ?? 'Serverfehler' }, { status: 500 })
  }
}