// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

function validPassword(pw: string) {
  // mind. 8 Zeichen, 1 Zahl, 1 Sonderzeichen
  return /^(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(pw)
}

export async function POST(req: Request) {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      nickname,
      phone,
      privacyOk,     // 👈 hier korrekt destrukturieren
      marketingOk,   // 👈 und hier
    } = await req.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'E-Mail, Passwort, Vorname und Nachname sind erforderlich' },
        { status: 400 }
      )
    }
    if (!validPassword(password)) {
      return NextResponse.json(
        { error: 'Passwort muss mind. 8 Zeichen, 1 Zahl und 1 Sonderzeichen enthalten' },
        { status: 400 }
      )
    }
    if (!privacyOk) {
      return NextResponse.json(
        { error: 'Bitte der Datenschutzklausel zustimmen' },
        { status: 400 }
      )
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'E-Mail ist bereits registriert' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 10)
    const token = crypto.randomBytes(24).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    const now = new Date()

    const user = await prisma.user.create({
      data: {
        email,
        username: email, // redundanter Benutzername = E-Mail
        firstName,
        lastName,
        nickname: nickname ?? null,
        phone: phone ?? null,
        passwordHash: hash,
        emailVerifyToken: token,
        emailVerifyTokenExpires: expires,
        status: 'UNVERIFIED',
        // Einwilligungen speichern
        privacyAcceptedAt: privacyOk ? now : null,
        privacyPolicyVersion: privacyOk ? 'v1.0' : null,
        marketingOptInAt: marketingOk ? now : null,
      },
      select: { id: true, email: true, firstName: true, lastName: true, status: true },
    })

    // (DEV) DOI-Link ins Log (später echten Mailversand)
    const origin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const verifyUrl = `${origin}/verify-email?token=${token}&email=${encodeURIComponent(email)}`
    console.log(`[DOI] ${email} -> ${verifyUrl} (gültig bis ${expires.toISOString()})`)

    // Auto-Login
    const res = NextResponse.json(
      {
        message: 'Registrierung erfolgreich. Bitte E-Mail in den nächsten 24h bestätigen.',
        user,
      },
      { status: 201 }
    )
    res.cookies.set('mm_session', `uid:${user.id}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}