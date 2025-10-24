

'use client'

import Image from 'next/image'

export default function SsoSection() {
  return (
    <div className="px-4 pb-6">
      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/40"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 py-0.5 text-sm font-medium text-white/95 bg-black/40 rounded-md backdrop-blur-sm border border-white/20">
            oder SSO
          </span>
        </div>
      </div>

      {/* SSO Buttons (Platzhalter) */}
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
  )
}