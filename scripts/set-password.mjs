// scripts/set-password.mjs
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [ , , email, plain ] = process.argv
  if (!email || !plain) {
    console.error('Usage: node scripts/set-password.mjs <email> <newPassword>')
    process.exit(2)
  }

  const hashed = await bcrypt.hash(plain, 10)
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash: hashed },
  })

  console.log('Updated user:', user.id, user.email)
}

main()
  .catch((e) => {
    console.error('Error:', e?.message ?? e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })