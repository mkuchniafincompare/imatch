

// src/app/api/profile/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

// very light email/phone validation helpers (phone in E.164, optional)
const PHONE_E164 = /^\+[1-9]\d{6,14}$/

function notEmpty(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function readUserIdFromCookie(): string | null {
  const raw = cookies().get('mm_session')?.value || ''
  if (!raw) return null
  const val = raw.includes('%3A') ? decodeURIComponent(raw) : raw
  if (!val.startsWith('uid:')) return null
  return val.slice(4)
}

export async function PATCH(req: Request) {
  try {
    const userId = readUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const ct = req.headers.get('content-type') || ''
    if (!ct.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type muss application/json sein' }, { status: 415 })
    }

    const body = await req.json().catch(() => null) as {
      firstName?: string | null
      lastName?: string | null
      nickname?: string | null
      phone?: string | null
    } | null

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
    }

    // Normalize input
    const firstName = body.firstName ?? null
    const lastName  = body.lastName ?? null
    const nickname  = body.nickname ?? null
    const phone     = body.phone ?? null

    // Minimal validation
    if (!notEmpty(firstName) || !notEmpty(lastName)) {
      return NextResponse.json({ error: 'Vorname und Nachname sind erforderlich' }, { status: 400 })
    }
    if (phone != null && phone !== '' && !PHONE_E164.test(phone)) {
      return NextResponse.json({ error: 'Telefonnummer muss im Format +491701234567 (E.164) vorliegen' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname ? nickname.trim() : null,
        phone: phone ? phone.trim() : null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nickname: true,
        phone: true,
        email: true,
        emailVerifiedAt: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unbekannter Fehler' }, { status: 500 })
  }
}

// Optional: reject other methods explicitly
export async function GET() {
  try {
    const raw = cookies().get('mm_session')?.value || ''
    const val = raw.includes('%3A') ? decodeURIComponent(raw) : raw
    if (!val.startsWith('uid:')) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }
    const userId = val.slice(4)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nickname: true,
        phone: true,
        emailVerifiedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unbekannter Fehler' }, { status: 500 })
  }
}
export async function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}
export async function PUT() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}
export async function DELETE() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}