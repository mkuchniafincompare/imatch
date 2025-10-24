// src/app/api/club/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { geocode } from '@/lib/geocode'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, city, street, zip, venues, logoUrl, logoMime, logoWidth, logoHeight } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Vereinsname ist erforderlich' }, { status: 400 })
    }

    if (venues && !Array.isArray(venues)) {
      return NextResponse.json({ error: 'venues muss ein Array sein' }, { status: 400 })
    }

    // Optional: Logo-Felder prüfen (nur wenn übergeben)
    let _logoUrl: string | null = null
    let _logoMime: 'image/png' | 'image/jpeg' | null = null
    let _logoWidth: number | null = null
    let _logoHeight: number | null = null
    let _logoUpdatedAt: Date | null = null

    if (typeof logoUrl === 'string' && logoUrl.trim()) {
      _logoUrl = logoUrl.trim()
      _logoUpdatedAt = new Date()
      if (logoMime === 'image/png' || logoMime === 'image/jpeg') {
        _logoMime = logoMime
      }
      if (Number.isFinite(logoWidth)) _logoWidth = Number(logoWidth)
      if (Number.isFinite(logoHeight)) _logoHeight = Number(logoHeight)
    }

    // Prüfen, ob bereits ähnlich benanntes Club existiert
    const existing = await prisma.club.findFirst({
      where: { name: { equals: name.trim() } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Ein Verein mit diesem Namen existiert bereits' }, { status: 409 })
    }

    // --- Geocode club address (persist later when Club.lat/lng fields exist)
    let clubGeo: { lat: number, lng: number } | null = null
    try {
      const g = await geocode({ zip, city, street })
      if (g) clubGeo = { lat: g.lat, lng: g.lng }
    } catch {}

    const geocodedVenues = Array.isArray(venues) && venues.length > 0
      ? await Promise.all(
          venues
            .filter((v: any) => typeof v?.name === 'string' && v.name.trim().length > 0)
            .map(async (v: any) => {
              const vn = {
                name: v.name.trim(),
                street: v.street?.trim() || null,
                city: v.city?.trim() || null,
                zip: v.zip?.trim() || null,
                lat: null as number | null,
                lng: null as number | null,
              }
              try {
                const gg = await geocode({ zip: vn.zip, city: vn.city, street: vn.street })
                if (gg) {
                  vn.lat = gg.lat
                  vn.lng = gg.lng
                }
              } catch {}
              return vn
            })
        )
      : null

    // Club anlegen
    const club = await prisma.club.create({
      data: {
        name: name.trim(),
        city: city?.trim() || null,
        street: street?.trim() || null,
        zip: zip?.trim() || null,
        lat: clubGeo?.lat ?? null,
        lng: clubGeo?.lng ?? null,
        logoUrl: _logoUrl,
        logoMime: _logoMime,
        logoWidth: _logoWidth,
        logoHeight: _logoHeight,
        logoUpdatedAt: _logoUpdatedAt,
        venues: geocodedVenues
          ? {
              create: geocodedVenues.map(v => ({
                name: v.name,
                street: v.street,
                city: v.city,
                zip: v.zip,
                lat: v.lat,
                lng: v.lng,
              })),
            }
          : undefined,
      },
      include: { venues: true },
    })

    return NextResponse.json({ message: 'Verein erfolgreich angelegt', club }, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}