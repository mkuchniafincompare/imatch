import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000)) // 6-stellig
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'E-Mail erforderlich' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // kein User: gleiche Antwort (nicht verraten, ob Email existiert)
      return NextResponse.json({ message: 'Falls ein Konto vorhanden ist, wurde ein Code versandt.' })
    }

    const code = genCode()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 Min

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: code, otpExpiresAt: expires },
    })

    // DEV: Code ins Server-Log. (Prod: hier E-Mail-Versand integrieren)
    console.log(`[OTP] ${email} -> Code: ${code} (gültig bis ${expires.toISOString()})`)

    return NextResponse.json({ message: 'Falls ein Konto vorhanden ist, wurde ein Code versandt.' })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
