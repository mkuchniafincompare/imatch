// src/app/api/profile/password/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Password rules: at least 8 chars, one digit, one special
const PW_RULES = {
  minLen: 8,
  hasDigit: /\d/,
  hasSpecial: /[^A-Za-z0-9]/,
}

function validatePassword(pw: string) {
  const issues: string[] = []
  if (pw.length < PW_RULES.minLen) issues.push(`Mindestens ${PW_RULES.minLen} Zeichen`)
  if (!PW_RULES.hasDigit.test(pw)) issues.push('Mindestens 1 Zahl')
  if (!PW_RULES.hasSpecial.test(pw)) issues.push('Mindestens 1 Sonderzeichen')
  return issues
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

    if (!(req.headers.get('content-type') || '').includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type muss application/json sein' }, { status: 415 })
    }

    const body = await req.json().catch(() => null) as {
      currentPassword?: string
      newPassword?: string
    } | null

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
    }

    const currentPassword = String(body.currentPassword || '')
    const newPassword = String(body.newPassword || '')

    if (!currentPassword) {
      return NextResponse.json({ error: 'Aktuelles Passwort fehlt' }, { status: 400 })
    }

    const pwIssues = validatePassword(newPassword)
    if (pwIssues.length > 0) {
      return NextResponse.json({ error: 'Neues Passwort erfüllt nicht alle Kriterien', details: pwIssues }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash ?? '')
    if (!ok) {
      // Do not reveal which field failed beyond a generic error
      return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 400 })
    }

    const newHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unbekannter Fehler' }, { status: 500 })
  }
}

// Explicitly reject other methods
export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
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