'use client'

import Image from 'next/image'

export default function RegisterHeaderBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-white/25 backdrop-blur-lg border-b border-white/40 shadow-md px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl border border-white/70 bg-white/20">
          <Image src="/icon.png" alt="App Icon" width={28} height={28} className="object-contain" />
        </div>
        <Image
          src="/iMatchLogoTrans.png"
          alt="iMatch Logo"
          width={200}
          height={70}
          className="h-[40px] w-auto object-contain drop-shadow"
          priority
        />
      </div>
    </header>
  )
}