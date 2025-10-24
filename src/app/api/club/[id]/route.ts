import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }   // ← params ist ein Promise
) {
  try {
    const { id } = await ctx.params           // ← await erforderlich
    if (!id) return NextResponse.json({ error: 'clubId fehlt' }, { status: 400 })

    const club = await prisma.club.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        city: true,
        street: true,
        zip: true,
        logoUrl: true,
        logoMime: true,
        teams: {
          select: { id: true, name: true, ageGroup: true, year: true, preferredForm: true, contactUserId: true },
          orderBy: [{ year: 'desc' }],
        },
      },
    })
    if (!club) return NextResponse.json({ error: 'Verein nicht gefunden' }, { status: 404 })
    return NextResponse.json({ club })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}