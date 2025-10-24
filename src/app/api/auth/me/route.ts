import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'
import { errorResponse, jsonResponse } from '@/lib/http'

export async function GET() {
  try {
    const userId = await getUserIdFromCookie()
    
    if (!userId) {
      return errorResponse('Nicht eingeloggt', 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nickname: true,
        email: true,
        emailVerifiedAt: true,
      },
    })

    if (!user) {
      return errorResponse('User nicht gefunden', 404)
    }

    return jsonResponse({ user })
  } catch (e: any) {
    return errorResponse(e?.message || 'Fehler beim Laden', 500)
  }
}
