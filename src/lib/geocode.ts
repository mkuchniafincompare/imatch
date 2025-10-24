

// src/lib/geocode.ts
import { prisma } from '@/lib/prisma'

type GeocodeInput = {
  zip?: string | null
  city?: string | null
  street?: string | null
}

type GeocodeOptions = {
  forceRefresh?: boolean
}

export type GeocodeResult = {
  lat: number
  lng: number
  provider: string
  fromCache: boolean
}

// --- Normalizer: trim, lowercase, simple umlaut folding, collapse spaces
function normalize(s?: string | null): string | null {
  if (!s) return null
  const t = s
    .trim()
    .toLowerCase()
    .normalize('NFKD') // decompose accents
    .replace(/[\u0300-\u036f]/g, '') // strip combining marks
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/\s+/g, ' ')
  return t || null
}

function buildQuery({ zip, city, street }: { zip?: string | null; city?: string | null; street?: string | null }) {
  const parts: string[] = []
  if (street) parts.push(street)
  if (zip) parts.push(zip)
  if (city) parts.push(city)
  return parts.join(', ')
}

async function geocodeNominatim(input: { zip?: string | null; city?: string | null; street?: string | null }) {
  const base = process.env.GEOCODER_NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search'
  const q = buildQuery(input)
  const url = `${base}?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=0`
  const ua = process.env.GEOCODER_USER_AGENT || 'imatch.dev-geocoder (+contact@imatch.local)'
  const res = await fetch(url, {
    headers: {
      'User-Agent': ua,
      'Accept': 'application/json',
    },
    // avoid edge caching
    cache: 'no-store' as any,
  })
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`)
  const arr = await res.json() as any[]
  if (!Array.isArray(arr) || arr.length === 0) return null
  const first = arr[0]
  const lat = Number(first.lat)
  const lon = Number(first.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { lat, lng: lon, provider: 'nominatim' as const }
}

async function geocodeMapbox(input: { zip?: string | null; city?: string | null; street?: string | null }) {
  const token = process.env.MAPBOX_TOKEN
  if (!token) return null
  const q = buildQuery(input)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?limit=1&autocomplete=false&access_token=${encodeURIComponent(token)}`
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    cache: 'no-store' as any,
  })
  if (!res.ok) throw new Error(`Mapbox HTTP ${res.status}`)
  const data = await res.json() as any
  const feat = data?.features?.[0]
  if (!feat) return null
  const [lng, lat] = feat.center || []
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat: Number(lat), lng: Number(lng), provider: 'mapbox' as const }
}

export async function geocode(input: GeocodeInput, opts: GeocodeOptions = {}): Promise<GeocodeResult | null> {
  const zip = normalize(input.zip)
  const city = normalize(input.city)
  const street = normalize(input.street)

  // If we have nothing meaningful, bail quickly
  if (!zip && !city && !street) return null

  // 1) Cache hit (unless forceRefresh)
  if (!opts.forceRefresh) {
    try {
      const cached = await prisma.geoCache.findUnique({
        where: { zip_city_street: { zip, city, street } },
      })
      if (cached) {
        return {
          lat: cached.lat,
          lng: cached.lng,
          provider: cached.provider,
          fromCache: true,
        }
      }
    } catch {
      // ignore cache errors, continue to provider
    }
  }

  // 2) Provider selection
  const providerPref = (process.env.GEOCODER_PROVIDER || 'nominatim').toLowerCase()
  const providers = providerPref === 'mapbox' ? ['mapbox', 'nominatim'] : ['nominatim', 'mapbox']

  let out: { lat: number; lng: number; provider: string } | null = null
  for (const p of providers) {
    try {
      if (p === 'mapbox') {
        out = await geocodeMapbox({ zip, city, street })
      } else {
        out = await geocodeNominatim({ zip, city, street })
      }
      if (out) break
    } catch {
      // try next
    }
  }

  if (!out) return null

  // 3) Cache write (upsert on unique [zip, city, street])
  try {
    await prisma.geoCache.upsert({
      where: { zip_city_street: { zip, city, street } },
      update: {
        lat: out.lat,
        lng: out.lng,
        provider: out.provider,
      },
      create: {
        zip,
        city,
        street,
        lat: out.lat,
        lng: out.lng,
        provider: out.provider,
      },
    })
  } catch {
    // ignore cache write errors
  }

  return { ...out, fromCache: false }
}