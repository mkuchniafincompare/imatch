import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) {
      return NextResponse.json({ error: 'E-Mail und Code erforderlich' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      return NextResponse.json({ error: 'Ungültiger oder abgelaufener Code' }, { status: 401 })
    }

    const now = new Date()
    if (user.otpCode !== String(code) || user.otpExpiresAt < now) {
      return NextResponse.json({ error: 'Ungültiger oder abgelaufener Code' }, { status: 401 })
    }

    // Code verbrauchen (löschen)
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiresAt: null },
    })

    const res = NextResponse.json({
      message: 'Login erfolgreich (OTP)',
      user: { id: user.id, email: user.email, name: user.name ?? null },
    })

    res.cookies.set('mm_session', `uid:${user.id}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 Tage
    })

    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
