import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const now = new Date()
const inDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000)

async function main() {
  // Dummy-Login-User
  const demoEmail = 'markus.kuchnia@gmail.com'
  const demoPwHash = await bcrypt.hash('demo123', 10)
  await prisma.user.upsert({
    where: { email: demoEmail },
    update: { passwordHash: demoPwHash, name: 'Markus (Demo)' },
    create: { email: demoEmail, name: 'Markus (Demo)', passwordHash: demoPwHash },
  })

  // Coaches
  const u1 = await prisma.user.upsert({
    where: { email: 'coach.berlin@example.com' },
    update: {},
    create: { email: 'coach.berlin@example.com', name: 'Coach Berlin' },
  })
  const u2 = await prisma.user.upsert({
    where: { email: 'coach.potsdam@example.com' },
    update: {},
    create: { email: 'coach.potsdam@example.com', name: 'Coach Potsdam' },
  })

  // Clubs
  const c1 = await prisma.club.upsert({
    where: { id: 'club-berlin-west' },
    update: {},
    create: { id: 'club-berlin-west', name: 'SC Berlin West', city: 'Berlin', lat: 52.52, lng: 13.405 },
  })
  const c2 = await prisma.club.upsert({
    where: { id: 'club-potsdam-nord' },
    update: {},
    create: { id: 'club-potsdam-nord', name: 'SV Potsdam Nord', city: 'Potsdam', lat: 52.4, lng: 13.05 },
  })

  // Teams
  const t1 = await prisma.team.upsert({
    where: { id: 'team-berlin-u13' },
    update: {},
    create: { id: 'team-berlin-u13', clubId: c1.id, contactUserId: u1.id, ageGroup: 'U13', level: 'MITTEL', lat: 52.52, lng: 13.405 },
  })
  await prisma.team.upsert({
    where: { id: 'team-potsdam-u13' },
    update: {},
    create: { id: 'team-potsdam-u13', clubId: c2.id, contactUserId: u2.id, ageGroup: 'U13', level: 'MITTEL', lat: 52.4, lng: 13.05 },
  })

  // Offers via upsert (kein createMany/skipDuplicates)
  const offers = [
    {
      id: 'offer-berlin-1',
      teamId: t1.id,
      dateStart: inDays(3),
      dateEnd: inDays(3),
      fixedKickoff: inDays(3),
      homeAway: 'HOME',
      fieldType: 'FIELD',
      lat: 52.52,
      lng: 13.405,
      radiusKm: 40,
      notes: 'Testspiel unter der Woche, 2x30min',
      status: 'OPEN',
      offerDate: inDays(3),
      kickoffTime: '18:00',
      kickoffFlexible: false,
    },
    {
      id: 'offer-berlin-2',
      teamId: t1.id,
      dateStart: inDays(7),
      dateEnd: inDays(10),
      fixedKickoff: null,
      homeAway: 'FLEX',
      fieldType: 'FIELD',
      lat: 52.52,
      lng: 13.405,
      radiusKm: 60,
      notes: 'Wochenende bevorzugt',
      status: 'OPEN',
      offerDate: inDays(8),
      kickoffTime: '11:00',
      kickoffFlexible: true,
    },
  ]

  for (const o of offers) {
    await prisma.gameOffer.upsert({
      where: { id: o.id },
      update: {
        offerDate: o.offerDate,
        kickoffTime: o.kickoffTime,
        kickoffFlexible: o.kickoffFlexible,
        notes: o.notes,
        status: o.status,
      },
      create: o,
    })
  }

  // OfferAge Relation (Duplikate vermeiden)
  const off1 = await prisma.gameOffer.findUnique({ where: { id: 'offer-berlin-1' } })
  const off2 = await prisma.gameOffer.findUnique({ where: { id: 'offer-berlin-2' } })
  if (off1) {
    await prisma.offerAge.deleteMany({ where: { offerId: off1.id } })
    await prisma.offerAge.create({ data: { offerId: off1.id, ageGroup: 'U13' } })
  }
  if (off2) {
    await prisma.offerAge.deleteMany({ where: { offerId: off2.id } })
    await prisma.offerAge.create({ data: { offerId: off2.id, ageGroup: 'U12' } })
    await prisma.offerAge.create({ data: { offerId: off2.id, ageGroup: 'U13' } })
  }
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
