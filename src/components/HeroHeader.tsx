

'use client'

import Image from 'next/image'

export default function HeroHeader({ showClaim = false, claim = 'Einfach. Schneller. Spielen.' }: { showClaim?: boolean; claim?: string }) {
  return (
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

      {showClaim && (
        <p className="mt-2 text-lg sm:text-xl tracking-wide bg-black/40 rounded-md px-2 py-1 backdrop-blur-sm">
          {claim}
        </p>
      )}
    </div>
  )
}