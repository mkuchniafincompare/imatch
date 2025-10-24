import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

function capitalize(s) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function inferNamesFromEmail(email) {
  // "vor.nach@domain" → Vor/Nach; fallback: alles vor @ als firstName
  const local = email.split('@')[0] || ''
  const parts = local.split(/[.\-_]+/).filter(Boolean)
  if (parts.length >= 2) {
    const first = capitalize(parts[0])
    const last = capitalize(parts.slice(1).join(' '))
    return { firstName: first, lastName: last }
  }
  return { firstName: capitalize(local), lastName: 'User' }
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, username: true, firstName: true, lastName: true }
  })

  for (const u of users) {
    const updates = {}

    if (!u.username) {
      updates.username = u.email // redundant identisch zur E-Mail
    }
    if (!u.firstName || !u.lastName) {
      const { firstName, lastName } = inferNamesFromEmail(u.email)
      if (!u.firstName) updates.firstName = firstName
      if (!u.lastName)  updates.lastName = lastName
    }

    if (Object.keys(updates).length) {
      await prisma.user.update({ where: { id: u.id }, data: updates })
      console.log(`Backfilled user ${u.email}:`, updates)
    }
  }
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
