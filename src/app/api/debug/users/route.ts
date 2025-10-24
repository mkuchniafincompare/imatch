import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      otpCode: true,
      otpExpiresAt: true,
    }
  })
  // Nichts Sensibles ausgeben: nur Hash-Länge anzeigen
  const safe = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    passwordHashLen: u.passwordHash ? u.passwordHash.length : 0,
    hasOtp: Boolean(u.otpCode),
    otpExpiresAt: u.otpExpiresAt ?? null,
  }))
  return NextResponse.json({ count: safe.length, items: safe })
}
