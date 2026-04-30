'use client'

import Image from 'next/image'

interface TopBarClientProps {
  rightSlot?: React.ReactNode
}

export default function TopBarClient({ rightSlot }: TopBarClientProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-md mx-auto h-14 px-4 flex items-center justify-between">
        <Image
          src="/izou-logo.svg"
          alt="Izou"
          width={84}
          height={20}
          priority
        />
        {rightSlot ?? <span aria-hidden className="w-10 h-10" />}
      </div>
    </header>
  )
}
