import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie, generateToken } from '@/lib/auth'
import { errorResponse, successResponse } from '@/lib/http'

export async function POST() {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) return errorResponse('Nicht eingeloggt', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return errorResponse('User nicht gefunden', 404)

    const token = generateToken()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: token, emailVerifyTokenExpires: expires },
    })

    // TODO: Implement email sending service for verification link

    return successResponse('Verification-Mail versendet')
  } catch (err: any) {
    return errorResponse('Fehler beim Versand', 500)
  }
}