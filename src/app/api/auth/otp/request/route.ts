import { prisma } from '@/lib/prisma'
import { generateOtpCode } from '@/lib/auth'
import { parseJsonBody, errorResponse, successResponse } from '@/lib/http'

export async function POST(req: Request) {
  try {
    const body = await parseJsonBody<{ email: string }>(req)
    
    if (!body || !body.email) {
      return errorResponse('E-Mail erforderlich')
    }

    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user) {
      return successResponse('Falls ein Konto vorhanden ist, wurde ein Code versandt.')
    }

    const code = generateOtpCode()
    const expires = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: code, otpExpiresAt: expires },
    })

    // TODO: Implement email sending service for OTP code

    return successResponse('Falls ein Konto vorhanden ist, wurde ein Code versandt.')
  } catch (e: any) {
    return errorResponse(e?.message ?? 'Unknown error', 500)
  }
}
