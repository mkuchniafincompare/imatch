import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isPasswordValid, hashPassword, generateToken } from '@/lib/auth'
import { parseJsonBody, errorResponse, setCookie } from '@/lib/http'

export async function POST(req: Request) {
  try {
    const body = await parseJsonBody<{
      email: string
      password: string
      firstName: string
      lastName: string
      nickname?: string
      phone?: string
      privacyOk: boolean
      marketingOk?: boolean
    }>(req)

    if (!body || !body.email || !body.password || !body.firstName || !body.lastName) {
      return errorResponse('E-Mail, Passwort, Vorname und Nachname sind erforderlich')
    }
    
    if (!isPasswordValid(body.password)) {
      return errorResponse('Passwort muss mind. 8 Zeichen, 1 Zahl und 1 Sonderzeichen enthalten')
    }
    
    if (!body.privacyOk) {
      return errorResponse('Bitte der Datenschutzklausel zustimmen')
    }

    const exists = await prisma.user.findUnique({ where: { email: body.email } })
    if (exists) {
      return errorResponse('E-Mail ist bereits registriert', 409)
    }

    const hash = await hashPassword(body.password)
    const token = generateToken()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const now = new Date()

    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        nickname: body.nickname ?? null,
        phone: body.phone ?? null,
        passwordHash: hash,
        emailVerifyToken: token,
        emailVerifyTokenExpires: expires,
        status: 'UNVERIFIED',
        privacyAcceptedAt: body.privacyOk ? now : null,
        privacyPolicyVersion: body.privacyOk ? 'v1.0' : null,
        marketingOptInAt: body.marketingOk ? now : null,
      },
      select: { id: true, email: true, firstName: true, lastName: true, status: true },
    })

    // TODO: Implement email sending service for DOI link

    const res = NextResponse.json(
      {
        message: 'Registrierung erfolgreich. Bitte E-Mail in den nächsten 24h bestätigen.',
        user,
      },
      { status: 201 }
    )
    
    setCookie(res, 'mm_session', `uid:${user.id}`, 60 * 60 * 24 * 7)

    return res
  } catch (e: any) {
    return errorResponse(e?.message ?? 'Unknown error', 500)
  }
}
