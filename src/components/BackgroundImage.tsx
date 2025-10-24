'use client'

type BackgroundImageProps = {
  src?: string
}

export default function BackgroundImage({ src = '/background.jpg' }: BackgroundImageProps) {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {/* 0) Fallback: dunkler Verlauf */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700" />

      {/* 1) Farbiges Original (etwas gedämpfter) */}
      <div
        className="absolute inset-0 z-10 bg-cover bg-center filter brightness-90 contrast-85 saturate-70 blur-[1px] opacity-85"
        style={{ backgroundImage: `url(${src})` }}
      />

      {/* 2) Graustufen-Overlay mit vertikaler Maskierung */}
      <div
        className="absolute inset-0 z-20 bg-cover bg-center filter grayscale opacity-85
          [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,.65)_50%,rgba(0,0,0,.3)_75%,rgba(0,0,0,0)_100%)]
          [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,.65)_50%,rgba(0,0,0,.3)_75%,rgba(0,0,0,0)_100%)]"
        style={{ backgroundImage: `url(${src})` }}
      />

      {/* 3) Subtile Abdunklung */}
      <div className="absolute inset-0 z-30 bg-black/25" />
    </div>
  )
}