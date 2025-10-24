import { NextResponse } from 'next/server'

export async function parseJsonBody<T = any>(req: Request): Promise<T | null> {
  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return null
  }
  try {
    return await req.json()
  } catch {
    return null
  }
}

export function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(error: string, status = 400, details?: any) {
  const body: any = { error }
  if (details) body.details = details
  return NextResponse.json(body, { status })
}

export function successResponse(message: string, data?: any) {
  const body: any = { message }
  if (data) Object.assign(body, data)
  return NextResponse.json(body)
}

export function setCookie(res: NextResponse, name: string, value: string, maxAge: number) {
  res.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
  return res
}

export function clearCookie(res: NextResponse, name: string) {
  res.cookies.set(name, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}

export function notEmpty(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}
