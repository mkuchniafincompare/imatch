import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie, validatePassword, verifyPassword, hashPassword } from '@/lib/auth'
import { parseJsonBody, errorResponse, jsonResponse } from '@/lib/http'

export async function PATCH(req: Request) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return errorResponse('Nicht eingeloggt', 401)
    }

    const body = await parseJsonBody<{
      currentPassword?: string
      newPassword?: string
    }>(req)

    if (!body) {
      return errorResponse('Ungültiger Body')
    }

    const currentPassword = String(body.currentPassword || '')
    const newPassword = String(body.newPassword || '')

    if (!currentPassword) {
      return errorResponse('Aktuelles Passwort fehlt')
    }

    const pwIssues = validatePassword(newPassword)
    if (pwIssues.length > 0) {
      return errorResponse('Neues Passwort erfüllt nicht alle Kriterien', 400, pwIssues)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    })
    
    if (!user || !user.passwordHash) {
      return errorResponse('Aktuelles Passwort ist falsch')
    }

    const ok = await verifyPassword(currentPassword, user.passwordHash)
    if (!ok) {
      return errorResponse('Aktuelles Passwort ist falsch')
    }

    const newHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    })

    return jsonResponse({ ok: true })
  } catch (e: any) {
    return errorResponse(e?.message || 'Unbekannter Fehler', 500)
  }
}
