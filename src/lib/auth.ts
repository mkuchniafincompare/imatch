import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export async function getUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('mm_session')?.value || ''
  if (!raw) return null
  const val = raw.includes('%3A') ? decodeURIComponent(raw) : raw
  if (!val.startsWith('uid:')) return null
  return val.slice(4)
}

export async function requireAuth(): Promise<string> {
  const userId = await getUserIdFromCookie()
  if (!userId) {
    throw new Error('Nicht eingeloggt')
  }
  return userId
}

const PW_RULES = {
  minLen: 8,
  hasDigit: /\d/,
  hasSpecial: /[^A-Za-z0-9]/,
}

export function validatePassword(pw: string): string[] {
  const issues: string[] = []
  if (pw.length < PW_RULES.minLen) issues.push(`Mindestens ${PW_RULES.minLen} Zeichen`)
  if (!PW_RULES.hasDigit.test(pw)) issues.push('Mindestens 1 Zahl')
  if (!PW_RULES.hasSpecial.test(pw)) issues.push('Mindestens 1 Sonderzeichen')
  return issues
}

export function isPasswordValid(pw: string): boolean {
  return /^(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(pw)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function generateToken(): string {
  return require('crypto').randomBytes(24).toString('hex')
}
