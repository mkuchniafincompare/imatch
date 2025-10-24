import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

export async function POST() {
  try {
    const cookieVal = cookies().get('mm_session')?.value
    const decoded = cookieVal ? decodeURIComponent(cookieVal) : ''
    const userId = decoded.startsWith('uid:') ? decoded.slice(4) : null
    if (!userId) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })

    // neuen Token erzeugen
    const token = crypto.randomBytes(24).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: token, emailVerifyTokenExpires: expires },
    })

    // Mail-Versand (hier Dummy über console)
    const verifyLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`
    console.log(`Verification-Link für ${user.email}: ${verifyLink}`)

    // Beispiel mit nodemailer (optional real versenden)
    // const transporter = nodemailer.createTransport({ sendmail: true })
    // await transporter.sendMail({
    //   from: 'no-reply@matchmaker.app',
    //   to: user.email,
    //   subject: 'Bitte bestätige deine E-Mail-Adresse',
    //   text: `Hallo ${user.firstName},\n\nbitte bestätige deine Adresse:\n${verifyLink}\n\nViele Grüße,\nDein Matchmaker-Team`,
    // })

    return NextResponse.json({ message: 'Verification-Mail versendet' })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Fehler beim Versand' }, { status: 500 })
  }
}