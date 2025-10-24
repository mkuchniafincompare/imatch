import { NextResponse } from 'next/server'
import { clearCookie } from '@/lib/http'

export async function POST() {
  const res = NextResponse.json({ message: 'Logout erfolgreich' })
  clearCookie(res, 'mm_session')
  return res
}
