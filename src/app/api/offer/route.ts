// src/app/api/offer/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { geocode } from '@/lib/geocode'
import type { Prisma } from '@prisma/client'

// Session aus Cookie lesen (mm_session = "uid:<userId>")
function getCookie(req: Request, name: string): string | null {
  const raw = req.headers.get('cookie') || ''
  const hit = raw.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))
  if (!hit) return null
  const v = hit.slice(name.length + 1)
  try {
    return decodeURIComponent(v)
  } catch {
    return v
  }
}
function getSessionUserId(req: Request): string | null {
  const v = getCookie(req, 'mm_session') || ''
  return v.startsWith('uid:') ? v.slice(4) : null
}

/** Helper: sichere Zahl */
function toNum(v: string | null, fallback?: number) {
  if (v == null) return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** Distanzberechnung (km) */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/** Menschliche Labels für Spielstärke */
const STRENGTH_LABEL: Record<string, string> = {
  SEHR_SCHWACH: 'sehr schwach',
  SCHWACH: 'schwach',
  NORMAL: 'normal',
  STARK: 'stark',
  SEHR_STARK: 'sehr stark',
  GRUPPE: 'Gruppe',
  KREISKLASSE: 'Kreisklasse',
  KREISLIGA: 'Kreisliga',
  BEZIRKSOBERLIGA: 'Bezirksoberliga',
  FOERDERLIGA: 'Förderliga',
  NLZ_LIGA: 'NLZ-Liga',
  BAYERNLIGA: 'Bayernliga',
  REGIONALLIGA: 'Regionalliga',
}

/** ===== GET: mit Filtern + Aufbereitung für MatchCard =====
 * Query-Parameter (alle optional):
 * - level (BREITE|MITTEL|LEISTUNG)
 * - ages="U12,U13"
 * - homeAway=HOME|AWAY|FLEX
 * - playForms="FUNINO,FUSSBALL_7,..."
 * - strengthMin/strengthMax (Enum-Name wie oben)
 * - zipcode, city, radiusKm
 * - dateFrom, dateTo (ISO yyyy-mm-dd)
 * - timeFrom, timeTo ("HH:mm")
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const currentUserId = getSessionUserId(req)

  // Check if specific IDs are requested
  const idsParam = searchParams.get('ids')
  if (idsParam) {
    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean)
    if (ids.length === 0) {
      return NextResponse.json({ count: 0, items: [] })
    }

    const offers = await prisma.gameOffer.findMany({
      where: { id: { in: ids } },
      include: { team: { include: { club: true } }, ages: true },
      orderBy: [{ offerDate: 'asc' }, { dateStart: 'asc' }],
    })

    const items = offers.map(o => {
      const club = o.team?.club
      const address = club
        ? [club.street, club.zip, club.city].filter(Boolean).join(', ')
        : null

      const ageLabel = o.ages[0]?.ageGroup ?? (o as any).team?.ageGroup ?? null
      const strengthLabel = o.strength ? (STRENGTH_LABEL[o.strength] ?? o.strength) : null

      return {
        id: o.id,
        clubName: club?.name ?? '—',
        ageLabel,
        year: (o as any).team?.year ?? null,
        date: o.offerDate ? new Date(o.offerDate).toISOString().slice(0,10) : null,
        kickoffTime: o.kickoffTime ?? null,
        kickoffFlexible: !!o.kickoffFlexible,
        homeAway: o.homeAway as 'HOME' | 'AWAY' | 'FLEX',
        notes: o.notes ?? null,
        playTime: o.durationText ?? null,
        strengthLabel,
        address,
        logoUrl: club?.logoUrl ?? null,
      }
    })

    return NextResponse.json({ count: items.length, items })
  }

  // — Eingehende Filter —
  const level = searchParams.get('level') as Prisma.EnumLevelFilter['equals'] | null
  const agesQ = searchParams.get('ages')
  const agesArr = agesQ ? agesQ.split(',').map(s => s.trim()).filter(Boolean) : null

  const homeAway = searchParams.get('homeAway') as 'HOME'|'AWAY'|'FLEX'|null
  const playFormsQ = searchParams.get('playForms')
  const playForms = playFormsQ ? playFormsQ.split(',').map(s => s.trim()).filter(Boolean) : null

  const strengthMin = searchParams.get('strengthMin')
  const strengthMax = searchParams.get('strengthMax')

  const zipcode = searchParams.get('zipcode')?.trim() || null
  const city = searchParams.get('city')?.trim() || null
  const radiusKm = toNum(searchParams.get('radiusKm'), undefined)

  const dateFromQ = searchParams.get('dateFrom')
  const dateToQ   = searchParams.get('dateTo')
  const dateFrom  = dateFromQ ? new Date(dateFromQ) : undefined
  const dateTo    = dateToQ   ? new Date(dateToQ)   : undefined

  const timeFrom = searchParams.get('timeFrom') // "HH:mm"
  const timeTo   = searchParams.get('timeTo')   // "HH:mm"

  // Geocode user's location using real geocoding service
  let geo: { lat: number; lng: number } | null = null
  if (zipcode || city) {
    try {
      const result = await geocode({ zip: zipcode, city, street: null })
      if (result) {
        geo = { lat: result.lat, lng: result.lng }
      }
    } catch (e) {
      console.error('Geocoding failed for user location:', e)
    }
  }

  // Enum-Order für Stärke-Spanne
  const STRENGTH_ORDER = [
    'SEHR_SCHWACH','SCHWACH','NORMAL','STARK','SEHR_STARK',
    'GRUPPE','KREISKLASSE','KREISLIGA','BEZIRKSOBERLIGA','FOERDERLIGA','NLZ_LIGA',
    'BAYERNLIGA','REGIONALLIGA'
  ] as const
  const sIdx = (s?: string|null) => s ? STRENGTH_ORDER.indexOf(s as any) : -1
  const hasStrengthSpan = (strengthMin || strengthMax) != null

  // DB-Where
  const where: Prisma.GameOfferWhereInput = {
    status: 'OPEN',
    ...(level ? { team: { level } } : {}),
    ...(agesArr ? { ages: { some: { ageGroup: { in: agesArr as any[] } } } } : {}),
    ...(homeAway ? { homeAway } : {}),
    ...(playForms ? { playForm: { in: playForms as any[] } } : {}),
    ...(dateFrom && dateTo
      ? { offerDate: { gte: dateFrom, lte: dateTo } }
      : dateFrom ? { offerDate: { gte: dateFrom } }
      : dateTo   ? { offerDate: { lte: dateTo } }
      : {}),
    // Exclude offers that have been confirmed (ACCEPTED status)
    requests: {
      none: {
        status: 'ACCEPTED',
      },
    },
  }
  // Eigene Angebote (vom eingeloggten User) ausblenden
  if (currentUserId) {
    const existingNot = (where as any).NOT
    const notArray = Array.isArray(existingNot)
      ? existingNot
      : existingNot ? [existingNot] : []
    ;(where as any).NOT = [...notArray, { team: { contactUserId: currentUserId } }]
  }

  // Query
  const offers = await prisma.gameOffer.findMany({
    where,
    include: { team: { include: { club: true } }, ages: true },
    orderBy: [{ offerDate: 'asc' }, { dateStart: 'asc' }],
    take: 100,
  })

  // -- Saved offers of current user (always include, ignore filters)
  let savedIds = new Set<string>()
  let allOffers = offers
  if (currentUserId) {
    const savedRows = await prisma.savedOffer.findMany({
      where: { userId: currentUserId },
      select: { offerId: true },
    })
    savedIds = new Set(savedRows.map(r => r.offerId))

    const existingIds = new Set(offers.map(o => o.id))
    const missingSaved = Array.from(savedIds).filter(id => !existingIds.has(id))
    if (missingSaved.length > 0) {
      const extra = await prisma.gameOffer.findMany({
        where: { id: { in: missingSaved } },
        include: { team: { include: { club: true } }, ages: true },
      })
      // prepend saved extras, so they appear first before sorting fallback
      allOffers = [...extra, ...offers]
    } else {
      allOffers = offers
    }
  }

  // Zusatzfilter Zeitspanne & Stärke & Distanz
  function withinTimeSpan(ko?: string|null) {
    if (!timeFrom && !timeTo) return true
    if (!ko) return false
    if (timeFrom && ko < timeFrom) return false
    if (timeTo && ko > timeTo) return false
    return true
  }

  const minIdx = sIdx(strengthMin)
  const maxIdx = sIdx(strengthMax)
  function withinStrengthSpan(st?: string|null) {
    if (!hasStrengthSpan) return true
    if (!st) return false
    const i = sIdx(st)
    if (minIdx >= 0 && i < minIdx) return false
    if (maxIdx >= 0 && i > maxIdx) return false
    return true
  }

  let enriched = allOffers
    // Saved offers bypass time/strength filters
    .filter(o => savedIds.has(o.id) || withinTimeSpan(o.kickoffTime))
    .filter(o => savedIds.has(o.id) || withinStrengthSpan(o.strength))
    .map(o => {
      let distanceKm: number | null = null
      if (geo) {
        // Prioritize: 1) Offer's own coordinates, 2) Club's coordinates from DB
        let base: { lat: number; lng: number } | null = null
        if (o.lat != null && o.lng != null) {
          base = { lat: o.lat, lng: o.lng }
        } else if (o.team?.club?.lat != null && o.team?.club?.lng != null) {
          // Use club's real geocoded coordinates from database
          base = { lat: o.team.club.lat, lng: o.team.club.lng }
        }
        if (base) {
          distanceKm = haversineKm(geo.lat, geo.lng, base.lat, base.lng)
        }
      }
      return { ...o, distanceKm }
    })

  if (geo && typeof radiusKm === 'number') {
    enriched = enriched
      // Saved offers bypass radius; others must be within radius
      .filter(o => savedIds.has(o.id) || (o.distanceKm != null && o.distanceKm <= radiusKm))
      .sort((a, b) => {
        const aSaved = savedIds.has(a.id) ? 0 : 1
        const bSaved = savedIds.has(b.id) ? 0 : 1
        if (aSaved !== bSaved) return aSaved - bSaved
        // within saved/non-saved groups, sort by distance if available
        const ad = a.distanceKm ?? Number.POSITIVE_INFINITY
        const bd = b.distanceKm ?? Number.POSITIVE_INFINITY
        return ad - bd
      })
  }

  // Always prefer saved offers first when no radius sorting applied
  enriched = enriched.sort((a, b) => {
    const aSaved = savedIds.has(a.id) ? 0 : 1
    const bSaved = savedIds.has(b.id) ? 0 : 1
    if (aSaved !== bSaved) return aSaved - bSaved
    // fallback: by offerDate then dateStart
    const aKey = (a.offerDate?.valueOf?.() ?? 0) + (a.dateStart?.valueOf?.() ?? 0)
    const bKey = (b.offerDate?.valueOf?.() ?? 0) + (b.dateStart?.valueOf?.() ?? 0)
    return aKey - bKey
  })

  // Antwort für MatchCard
  const items = enriched.map(o => {
    const club = o.team?.club
    const address = club
      ? [club.street, club.zip, club.city].filter(Boolean).join(', ')
      : null

    // Alterslabel: nimm die 1. aus Offer.ages, sonst Team.ageGroup
    const ageLabel = o.ages[0]?.ageGroup ?? (o as any).team?.ageGroup ?? null
    const strengthLabel = o.strength ? (STRENGTH_LABEL[o.strength] ?? o.strength) : null

    return {
      id: o.id,
      clubName: club?.name ?? '—',
      ageLabel,
      year: (o as any).team?.year ?? null,
      date: o.offerDate ? new Date(o.offerDate).toISOString().slice(0,10) : null,
      kickoffTime: o.kickoffTime ?? null,
      kickoffFlexible: !!o.kickoffFlexible,
      homeAway: o.homeAway as 'HOME' | 'AWAY' | 'FLEX',
      notes: o.notes ?? null,
      playTime: o.durationText ?? null,
      strengthLabel,
      address,
      logoUrl: club?.logoUrl ?? null,
    }
  })

  return NextResponse.json({ count: items.length, items })
}

/** ===== POST: legt Angebot mit neuen Feldern an =====
 * Erwarteter Body (JSON):
 * {
 *   teamId: string,
 *   ages: string[],                 // z.B. ["U12","U13"]
 *   offerDate: string,              // ISO oder "yyyy-mm-dd"
 *   kickoffTime?: string,           // "HH:mm"
 *   kickoffFlexible?: boolean,
 *   strength?: "SEHR_SCHWACH"|...|"REGIONALLIGA"
 *   playForm?: "FUNINO"|"FUSSBALL_4"|...|"ELF_GEGEN_ELF"
 *   durationText?: string,
 *   homeAway?: "HOME"|"AWAY"|"FLEX",
 *   fieldType?: "FIELD"|"TURF"|"HALL",
 *   lat?: number, lng?: number, radiusKm?: number,
 *   notes?: string
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      teamId,
      ages, // string[]
      offerDate,
      kickoffTime,
      kickoffFlexible = false,
      strength,
      playForm,
      durationText,
      homeAway = 'FLEX',
      fieldType = 'FIELD',
      lat = null,
      lng = null,
      radiusKm = 30,
      notes = null,
    } = body ?? {}

    // 1) Validierung: Team existiert?
    if (!teamId) {
      return NextResponse.json({ error: 'teamId ist erforderlich' }, { status: 400 })
    }
    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return NextResponse.json({ error: 'teamId nicht gefunden' }, { status: 400 })
    }

    // 2) Validierung: offerDate zwingend; HH:mm optional
    if (!offerDate) {
      return NextResponse.json({ error: 'offerDate (Datum) ist erforderlich' }, { status: 400 })
    }
    let od = new Date(offerDate)
    if (isNaN(od.getTime())) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(offerDate))
      if (m) {
        od = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
      }
    }
    if (isNaN(od.getTime())) {
      return NextResponse.json({ error: 'offerDate ist ungültig' }, { status: 400 })
    }
    if (kickoffTime && !/^\d{2}:\d{2}$/.test(kickoffTime)) {
      return NextResponse.json({ error: 'kickoffTime muss "HH:mm" sein' }, { status: 400 })
    }

    // 3) Enums grob prüfen
    const strengthOk =
      strength == null ||
      [
        'SEHR_SCHWACH','SCHWACH','NORMAL','STARK','SEHR_STARK',
        'GRUPPE','KREISKLASSE','KREISLIGA','BEZIRKSOBERLIGA','FOERDERLIGA','NLZ_LIGA',
        'BAYERNLIGA','REGIONALLIGA'
      ].includes(strength)
    if (!strengthOk) return NextResponse.json({ error: 'strength ungültig' }, { status: 400 })

    const playOk =
      playForm == null ||
      ['FUNINO','FUSSBALL_4','FUSSBALL_5','FUSSBALL_7','NEUN_GEGEN_NEUN','ELF_GEGEN_ELF'].includes(playForm)
    if (!playOk) return NextResponse.json({ error: 'playForm ungültig' }, { status: 400 })

    // 4) Erlaubte Altersklassen (U6–U19)
    const allowedAges = new Set([
      'U6','U7','U8','U9','U10','U11','U12','U13','U14','U15','U16','U17','U18','U19'
    ])
    const agesArr: string[] = Array.isArray(ages) ? ages : []
    if (agesArr.length === 0) {
      return NextResponse.json({ error: 'ages (mind. eine Altersklasse) ist erforderlich' }, { status: 400 })
    }
    for (const ag of agesArr) {
      if (!allowedAges.has(String(ag))) {
        return NextResponse.json({ error: `Altersklasse ${ag} aktuell nicht erlaubt` }, { status: 400 })
      }
    }

    // 5) ALT-Felder kompatibel setzen (gleiches Datum)
    const dateStart = od
    const dateEnd = od
    const fixedKickoff =
      kickoffFlexible || !kickoffTime ? null : new Date(`${od.toISOString().slice(0,10)}T${kickoffTime}:00.000Z`)

    // 6) Zwei Schritte: Offer → Ages
    const createdOffer = await prisma.gameOffer.create({
      data: {
        teamId,
        offerDate: od,
        kickoffTime: kickoffTime ?? null,
        kickoffFlexible: Boolean(kickoffFlexible),
        strength: strength ?? null,
        playForm: playForm ?? null,
        durationText: durationText ?? null,
        dateStart,
        dateEnd,
        fixedKickoff,
        homeAway,
        fieldType,
        lat,
        lng,
        radiusKm: Number(radiusKm) || 30,
        notes: notes ?? null,
      },
      include: {
        team: { include: { club: true } },
      },
    })

    await prisma.offerAge.createMany({
      data: agesArr.map((ag) => ({
        offerId: createdOffer.id,
        ageGroup: ag as any,
      })),
    })

    const full = await prisma.gameOffer.findUnique({
      where: { id: createdOffer.id },
      include: { team: { include: { club: true } }, ages: true },
    })

    return NextResponse.json(
      {
        id: full!.id,
        club: full!.team.club?.name ?? null,
        city: full!.team.club?.city ?? null,
        teamLevel: full!.team.level,
        ages: full!.ages.map(a => a.ageGroup),
        offerDate: full!.offerDate,
        kickoffTime: full!.kickoffTime,
        kickoffFlexible: full!.kickoffFlexible,
        strength: full!.strength,
        playForm: full!.playForm,
        durationText: full!.durationText,
        homeAway: full!.homeAway,
        fieldType: full!.fieldType,
        notes: full!.notes,
        dateStart: full!.dateStart,
        dateEnd: full!.dateEnd,
        fixedKickoff: full!.fixedKickoff,
      },
      { status: 201 }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}