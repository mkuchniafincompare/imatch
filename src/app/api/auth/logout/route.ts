import { NextResponse } from 'next/server'

export async function POST() {
  // löscht das mm_session Cookie
  const res = NextResponse.json({ message: 'Logout erfolgreich' })
  res.cookies.set('mm_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
