import { prisma } from '@/lib/prisma'
import { getUserIdFromCookie } from '@/lib/auth'
import { parseJsonBody, errorResponse, jsonResponse, notEmpty } from '@/lib/http'

const PHONE_E164 = /^\+[1-9]\d{6,14}$/

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
        email: true,
        firstName: true,
        lastName: true,
        nickname: true,
        phone: true,
        emailVerifiedAt: true,
      },
    })

    if (!user) {
      return errorResponse('User nicht gefunden', 404)
    }

    return jsonResponse({ user })
  } catch (e: any) {
    return errorResponse(e?.message || 'Unbekannter Fehler', 500)
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return errorResponse('Nicht eingeloggt', 401)
    }

    const body = await parseJsonBody<{
      firstName?: string | null
      lastName?: string | null
      nickname?: string | null
      phone?: string | null
    }>(req)

    if (!body) {
      return errorResponse('Ungültiger Body')
    }

    const firstName = body.firstName ?? null
    const lastName = body.lastName ?? null
    const nickname = body.nickname ?? null
    const phone = body.phone ?? null

    if (!notEmpty(firstName) || !notEmpty(lastName)) {
      return errorResponse('Vorname und Nachname sind erforderlich')
    }
    if (phone != null && phone !== '' && !PHONE_E164.test(phone)) {
      return errorResponse('Telefonnummer muss im Format +491701234567 (E.164) vorliegen')
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname ? nickname.trim() : null,
        phone: phone ? phone.trim() : null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nickname: true,
        phone: true,
        email: true,
        emailVerifiedAt: true,
      },
    })

    return jsonResponse({ user: updated })
  } catch (e: any) {
    return errorResponse(e?.message || 'Unbekannter Fehler', 500)
  }
}
