import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { parseJsonBody, errorResponse, setCookie } from '@/lib/http'

export async function POST(req: Request) {
  try {
    const body = await parseJsonBody<{ email: string; password: string }>(req)
    
    if (!body || !body.email || !body.password) {
      return errorResponse('E-Mail und Passwort erforderlich')
    }

    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user || !user.passwordHash) {
      return errorResponse('Ungültige Zugangsdaten', 401)
    }

    const ok = await verifyPassword(body.password, user.passwordHash)
    if (!ok) {
      return errorResponse('Ungültige Zugangsdaten', 401)
    }

    const res = NextResponse.json({
      message: 'Login erfolgreich',
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    })

    setCookie(res, 'mm_session', `uid:${user.id}`, 60 * 60 * 24 * 7)

    return res
  } catch (e: any) {
    return errorResponse(e?.message ?? 'Unknown error', 500)
  }
}
