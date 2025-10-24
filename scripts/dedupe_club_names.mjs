import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

function short(id) { return id.slice(0, 6) }

async function main() {
  // Clubs nach Name gruppieren
  const clubs = await prisma.club.findMany({ orderBy: { id: 'asc' } })
  const byName = new Map()
  for (const c of clubs) {
    const k = (c.name || '').trim()
    if (!byName.has(k)) byName.set(k, [])
    byName.get(k).push(c)
  }

  let changed = 0
  for (const [name, arr] of byName) {
    if (!name) continue
    if (arr.length <= 1) continue

    // ältesten Datensatz behalten, alle weiteren umbenennen
    const [keep, ...dups] = arr
    for (const d of dups) {
      const newName = `${name} [dup-${short(d.id)}]`
      await prisma.club.update({ where: { id: d.id }, data: { name: newName } })
      console.log(`Umbenannt: "${name}" -> "${newName}" (id=${d.id})`)
      changed++
    }
  }

  console.log(changed ? `✅ ${changed} Duplikate umbenannt.` : '✅ Keine Duplikate gefunden.')
}
main().finally(() => prisma.$disconnect())
