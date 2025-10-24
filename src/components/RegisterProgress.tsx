'use client'

type RegisterProgressProps = {
  active: 1 | 2 | 3
}

export default function RegisterProgress({ active }: RegisterProgressProps) {
  const stepStyle = (step: number) =>
    step === active
      ? 'bg-[#D04D2E] text-white shadow-[0_0_8px_rgba(208,77,46,0.8)]'
      : step < active
      ? 'bg-white/60 text-white'
      : 'bg-white/20 text-white/60'

  return (
    <div className="mb-4">
      <div className="flex items-center text-xs text-white/85">
        {/* Step 1 */}
        <div className="flex items-center">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${stepStyle(1)}`}>
            1
          </div>
          <span className="ml-2">Benutzer</span>
        </div>
        <div className="flex-1 h-[2px] mx-2 bg-white/30" />

        {/* Step 2 */}
        <div className="flex items-center">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${stepStyle(2)}`}>
            2
          </div>
          <span className="ml-2">Verein</span>
        </div>
        <div className="flex-1 h-[2px] mx-2 bg-white/30" />

        {/* Step 3 */}
        <div className="flex items-center">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${stepStyle(3)}`}>
            3
          </div>
          <span className="ml-2">Team</span>
        </div>
      </div>
    </div>
  )
}