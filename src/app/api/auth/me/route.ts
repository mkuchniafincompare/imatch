import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // Robust Cookie-Read via next/headers
    const raw = cookies().get('mm_session')?.value || ''
    // handle plain ("uid:...") and encoded ("uid%3A...")
    const val = raw.includes('%3A') ? decodeURIComponent(raw) : raw

    if (!val.startsWith('uid:')) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }
    const userId = val.slice(4)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nickname: true,
        email: true,
        emailVerifiedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler beim Laden' }, { status: 500 })
  }
}
