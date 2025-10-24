'use client'

import Link from 'next/link'
import Image from 'next/image'
import BackgroundImage from '@/components/BackgroundImage'
import { Poppins } from 'next/font/google'

const poppins = Poppins({ weight: '600', subsets: ['latin'] })

export default function HomePage() {
  return (
    <main className="relative min-h-dvh text-white">
      {/* Hintergrund */}
      <BackgroundImage />

      {/* Seiten-Layout: Oben (Icon+Logo) • Mitte (Login/Registrieren) • Unten (SSO) */}
      <div className={`relative z-10 mx-auto max-w-sm min-h-dvh flex flex-col ${poppins.className}`}>

        {/* TOP: Icon + Logo mit mehr Abstand zum oberen Rand */}
        <div className="pt-12 pb-4 text-center">
          {/* App-Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl border border-white/60 bg-white/10 backdrop-blur-sm">
            <Image
              src="/icon.png"
              alt="App Icon"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </div>

          {/* Wortmarke */}
          <div className="mt-4 flex justify-center">
            <Image
              src="/iMatchLogoTrans.png"
              alt="iMatch Logo"
              width={600}
              height={160}
              className="h-[128px] w-auto object-contain drop-shadow"
              priority
            />
          </div>

          {/* Claim */}
          <p className="mt-2 text-lg sm:text-xl tracking-wide bg-black/40 rounded-md px-2 py-1 backdrop-blur-sm text-white/90">Einfach. Schneller. Spielen.</p>
        </div>

        {/* MIDDLE: Login / Registrieren zentral in der Mitte */}
        <div className="flex-1 grid place-items-center">
          <div className="w-full px-4">
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full rounded-xl bg-[#D04D2E] text-white px-4 py-3 text-center font-medium shadow-sm"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block w-full rounded-xl border border-white/60 px-4 py-3 text-center bg-white/10 backdrop-blur-sm"
              >
                Registrieren
              </Link>
            </div>
          </div>
        </div>

        {/* BOTTOM: SSO-Sektion näher an den unteren Rand */}
        <div className="px-4 pb-6">
          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/40"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="text-sm font-medium bg-black/40 text-white/95 px-3 py-0.5 rounded-md backdrop-blur-sm border border-white/20">
                oder SSO
              </span>
            </div>
          </div>

          {/* SSO-Buttons (Platzhalter) */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => alert('Google SSO (MVP-Platzhalter)')}
              className="rounded-xl border border-white/60 px-3 py-2 text-sm bg-white/10 backdrop-blur-sm flex items-center justify-center gap-2"
              aria-label="Mit Google anmelden"
            >
              <Image src="/google.png" alt="" width={16} height={16} className="object-contain" />
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => alert('Apple SSO (MVP-Platzhalter)')}
              className="rounded-xl border border-white/60 px-3 py-2 text-sm bg-white/10 backdrop-blur-sm flex items-center justify-center gap-2"
              aria-label="Mit Apple anmelden"
            >
              <Image src="/apple.png" alt="" width={16} height={16} className="object-contain" />
              <span>Apple</span>
            </button>
            <button
              type="button"
              onClick={() => alert('Facebook SSO (MVP-Platzhalter)')}
              className="rounded-xl border border-white/60 px-3 py-2 text-sm bg-white/10 backdrop-blur-sm flex items-center justify-center gap-2"
              aria-label="Mit Facebook anmelden"
            >
              <Image src="/facebook.png" alt="" width={16} height={16} className="object-contain" />
              <span>Facebook</span>
            </button>
          </div>

          <p className="text-[11px] text-white/80 mt-4 text-center">
            Hinweis: SSO ist aktuell als Platzhalter aktiv.
          </p>
        </div>
      </div>
    </main>
  )
}