import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseJsonBody, errorResponse, setCookie } from '@/lib/http'

export async function POST(req: Request) {
  try {
    const body = await parseJsonBody<{ email: string; code: string }>(req)
    
    if (!body || !body.email || !body.code) {
      return errorResponse('E-Mail und Code erforderlich')
    }

    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      return errorResponse('Ungültiger oder abgelaufener Code', 401)
    }

    const now = new Date()
    if (user.otpCode !== String(body.code) || user.otpExpiresAt < now) {
      return errorResponse('Ungültiger oder abgelaufener Code', 401)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiresAt: null },
    })

    const res = NextResponse.json({
      message: 'Login erfolgreich (OTP)',
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    })

    setCookie(res, 'mm_session', `uid:${user.id}`, 60 * 60 * 24 * 7)

    return res
  } catch (e: any) {
    return errorResponse(e?.message ?? 'Unknown error', 500)
  }
}
