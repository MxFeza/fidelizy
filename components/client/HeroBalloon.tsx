'use client'

import Image from 'next/image'
import { ArrowUp } from '@untitledui/icons'
import { PUBLIC_ASSETS } from '@/lib/assets'

interface HeroBalloonProps {
  /** Texte affiché dans le badge en overlay (ex "30 pts"). */
  pointsBadge?: string
}

export default function HeroBalloon({ pointsBadge = '30 pts' }: HeroBalloonProps) {
  return (
    <div className="relative w-full h-32 bg-[#E8F0FE] overflow-hidden">
      <Image
        src={PUBLIC_ASSETS.branding.onboardingBalloon}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 640px"
        className="object-cover object-center"
        priority
      />

      {/* Badge "30 pts ↑" — overlay en haut à droite du ballon */}
      <div className="absolute top-1/2 right-1/3 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-900 text-white text-xs font-semibold shadow-lg">
        {pointsBadge}
        <span className="inline-flex size-4 items-center justify-center rounded-full bg-brand-solid">
          <ArrowUp className="size-2.5 text-white" aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}
