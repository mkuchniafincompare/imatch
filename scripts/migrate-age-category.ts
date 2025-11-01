import { prisma } from '../src/lib/prisma'

// Map AgeGroup to AgeCategory
function deriveAgeCategory(ageGroup: string): string {
  if (ageGroup.match(/^U(6|7|8|9|10|11|12|13|14|15|16|17|18|19)$/)) {
    return 'JUNIOREN'
  }
  return 'JUNIOREN' // Default fallback
}

async function main() {
  console.log('Starting ageCategory migration...')

  // 1. Update Teams
  const teams = await prisma.team.findMany({
    where: { ageCategory: null },
    select: { id: true, ageGroup: true },
  })

  console.log(`Found ${teams.length} teams without ageCategory`)

  for (const team of teams) {
    const ageCategory = deriveAgeCategory(team.ageGroup)
    await prisma.team.update({
      where: { id: team.id },
      data: { ageCategory },
    })
  }

  console.log(`Updated ${teams.length} teams`)

  // 2. Update GameOffers
  const offers = await prisma.gameOffer.findMany({
    where: { ageCategory: null },
    include: { ages: true },
  })

  console.log(`Found ${offers.length} offers without ageCategory`)

  for (const offer of offers) {
    // Derive from first age group
    const firstAge = offer.ages[0]?.ageGroup
    const ageCategory = firstAge ? deriveAgeCategory(firstAge) : 'JUNIOREN'
    await prisma.gameOffer.update({
      where: { id: offer.id },
      data: { ageCategory },
    })
  }

  console.log(`Updated ${offers.length} offers`)
  console.log('Migration complete!')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
