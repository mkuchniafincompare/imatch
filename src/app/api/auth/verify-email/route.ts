import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Kein Token' }, { status: 400 })

  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyTokenExpires: { gt: new Date() },
    },
  })
  if (!user) return NextResponse.json({ error: 'Ungültiger oder abgelaufener Token' }, { status: 400 })

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date(), status: 'ACTIVE', emailVerifyToken: null },
  })

  return NextResponse.json({ success: true })
}